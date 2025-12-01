import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getPool } from "@/lib/db";
import { LEMON_WEBHOOK_SECRET } from "@/lib/env";
import { type PlanId } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================
// 🍋 LEMON SQUEEZY VARIANT → PLAN MAPPING
// ============================================
// Add your LemonSqueezy variant IDs here
// Find them in: LemonSqueezy Dashboard → Products → [Product] → Variants → ID
const VARIANT_TO_PLAN: Record<string, PlanId> = {
  // Example mappings (REPLACE WITH YOUR ACTUAL VARIANT IDs):
  // "123456": "starter",
  // "234567": "growth",
  // "345678": "pro",
  // "456789": "tierless",
};

// Fallback plan when variant is not mapped
const DEFAULT_PAID_PLAN: PlanId = "pro";

function getPlainFromVariant(variantId: string | null): PlanId {
  if (!variantId) return DEFAULT_PAID_PLAN;
  return VARIANT_TO_PLAN[variantId] || DEFAULT_PAID_PLAN;
}

const RELEVANT_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_payment_success",
  "subscription_payment_failed",
]);

// Processed webhook IDs (in-memory cache for idempotency)
// In production with multiple instances, use Redis instead
const processedWebhooks = new Set<string>();
const MAX_PROCESSED_CACHE = 1000;

function verifySignature(raw: string, signature: string | null): boolean {
  // SECURITY: Require webhook secret in production
  if (!LEMON_WEBHOOK_SECRET) {
    console.error("❌ LEMON_WEBHOOK_SECRET not set - rejecting webhook");
    return false;
  }
  
  if (!signature) {
    console.warn("⚠️ Webhook received without signature");
    return false;
  }
  
  // Compute expected signature
  const expected = createHmac("sha256", LEMON_WEBHOOK_SECRET)
    .update(raw)
    .digest("hex");
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  
  // 1. Verify signature
  if (!verifySignature(rawBody, signature)) {
    console.error("❌ Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. Parse payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("❌ Webhook invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Extract event info
  const eventName: string =
    payload?.meta?.event_name ||
    payload?.event_name ||
    payload?.type ||
    "";
  
  const webhookId = payload?.meta?.webhook_id || payload?.data?.id || null;
  
  console.log(`📥 Webhook received: ${eventName} (ID: ${webhookId})`);

  // 4. Idempotency check - skip if already processed
  if (webhookId && processedWebhooks.has(webhookId)) {
    console.log(`⏭️ Webhook ${webhookId} already processed, skipping`);
    return NextResponse.json({ ok: true, skipped: true });
  }

  // 5. Filter relevant events
  if (!RELEVANT_EVENTS.has(eventName)) {
    console.log(`⏭️ Ignoring event: ${eventName}`);
    return NextResponse.json({ ok: true });
  }

  // 6. Extract user and subscription data
  const customData =
    payload?.data?.attributes?.checkout_data?.custom ||
    payload?.meta?.custom_data ||
    payload?.meta?.custom ||
    {};

  const userId = customData?.user_id || customData?.userId;
  if (!userId) {
    console.warn("⚠️ Webhook missing user_id in custom_data");
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const attributes = payload?.data?.attributes || {};
  const customerId =
    attributes.customer_id ||
    payload?.data?.relationships?.customer?.data?.id ||
    null;
  const subscriptionId = payload?.data?.id || null;
  const status = attributes.status || attributes.state || eventName;
  
  // Extract variant ID for plan mapping
  const variantId = 
    attributes.variant_id?.toString() ||
    payload?.data?.relationships?.variant?.data?.id ||
    null;
  
  // Determine plan based on variant and subscription status
  const isActiveSubscription = [
    "subscription_created",
    "subscription_updated",
    "subscription_resumed",
    "subscription_payment_success",
  ].includes(eventName) && ["active", "on_trial", "paused"].includes(status);
  
  const isCancelledSubscription = [
    "subscription_cancelled",
    "subscription_expired",
  ].includes(eventName) || status === "cancelled" || status === "expired";
  
  // Get plan from variant mapping
  const mappedPlan = getPlainFromVariant(variantId);
  const finalPlan: PlanId = isCancelledSubscription ? "free" : (isActiveSubscription ? mappedPlan : "free");
  
  console.log(`📊 Plan resolution: variant=${variantId}, status=${status}, event=${eventName} → plan=${finalPlan}`);

  // 7. Update database
  try {
    const pool = getPool();
    
    // Update user_profiles with Lemon data
    await pool.query(
      `
      INSERT INTO user_profiles (user_id, lemon_customer_id, lemon_subscription_id, lemon_status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        lemon_customer_id = COALESCE(EXCLUDED.lemon_customer_id, user_profiles.lemon_customer_id),
        lemon_subscription_id = COALESCE(EXCLUDED.lemon_subscription_id, user_profiles.lemon_subscription_id),
        lemon_status = EXCLUDED.lemon_status
      `,
      [userId, customerId, subscriptionId, status]
    );
    
    // Update user_plans with the resolved plan
    await pool.query(
      `
      INSERT INTO user_plans (user_id, plan, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        updated_at = NOW()
      `,
      [userId, finalPlan]
    );
    
    console.log(`✅ Webhook processed: ${eventName} for user ${userId} → plan: ${finalPlan}`);
    
    // 8. Mark as processed (for idempotency)
    if (webhookId) {
      processedWebhooks.add(webhookId);
      // Cleanup old entries to prevent memory leak
      if (processedWebhooks.size > MAX_PROCESSED_CACHE) {
        const toDelete = Array.from(processedWebhooks).slice(0, 100);
        toDelete.forEach(id => processedWebhooks.delete(id));
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Webhook database error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
