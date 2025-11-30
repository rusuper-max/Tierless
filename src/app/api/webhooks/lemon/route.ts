import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { getPool, ensureUserProfilesTable } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RELEVANT_EVENTS = new Set(["subscription_created", "subscription_updated"]);

function verifySignature(raw: string, signature: string | null) {
  const secret = process.env.LEMON_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  return expected === signature;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName: string =
    payload?.meta?.event_name ||
    payload?.event_name ||
    payload?.type ||
    "";

  if (!RELEVANT_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: true });
  }

  const customData =
    payload?.data?.attributes?.checkout_data?.custom ||
    payload?.meta?.custom_data ||
    payload?.meta?.custom ||
    {};

  const userId = customData?.user_id || customData?.userId;
  if (!userId) {
    console.warn("Lemon webhook missing user_id payload.");
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const attributes = payload?.data?.attributes || {};
  const customerId =
    attributes.customer_id ||
    payload?.data?.relationships?.customer?.data?.id ||
    null;
  const subscriptionId = payload?.data?.id || null;
  const status = attributes.status || attributes.state || eventName;

  await ensureUserProfilesTable();
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO user_profiles (user_id, lemon_customer_id, lemon_subscription_id, lemon_status)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE SET
      lemon_customer_id = COALESCE(EXCLUDED.lemon_customer_id, user_profiles.lemon_customer_id),
      lemon_subscription_id = COALESCE(EXCLUDED.lemon_subscription_id, user_profiles.lemon_subscription_id),
      lemon_status = EXCLUDED.lemon_status
  `,
    [userId, customerId, subscriptionId, status]
  );

  return NextResponse.json({ ok: true });
}
