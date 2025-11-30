// src/app/api/publish/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPool, ensureUserProfilesTable } from "@/lib/db";
import { getUserIdFromRequest, coercePlan as coercePlanAuth } from "@/lib/auth";
import * as calcsStore from "@/lib/calcsStore";
import { withinLimits, type PlanId } from "@/lib/entitlements";
import * as fullStore from "@/lib/fullStore";
import { calcFromMetaConfig } from "@/lib/calc-init";
import { PublishRequestSchema, validateBody, validationErrorResponse } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getPlanForUser(userId: string): Promise<PlanId> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL
    )
  `);
  const { rows } = await pool.query(
    "SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return coercePlanAuth(rows[0]?.plan) as PlanId;
}

type ProfileRow = {
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  order_destination?: string | null;
  inquiry_email?: string | null;
};

async function fetchUserProfile(userId: string): Promise<ProfileRow> {
  await ensureUserProfilesTable();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT whatsapp_number, telegram_username, order_destination, inquiry_email 
     FROM user_profiles WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  return rows[0] || {};
}

function normalizeWhatsapp(input?: string | null): string {
  if (!input) return "";
  return String(input).trim().replace(/[^\d]/g, "");
}

function normalizeTelegram(input?: string | null): string {
  if (!input) return "";
  return String(input).trim().replace(/^@/, "").toLowerCase();
}

/**
 * CONTACT RESOLUTION WATERFALL
 * 
 * Priority 1: Editor Override (contactOverride in page meta)
 * Priority 2: Account Profile (user_profiles table)
 * Priority 3: Fallback to user's login email
 */
async function injectContactInfo(
  userId: string,
  slug: string,
  calcSummary: calcsStore.Calc | undefined
) {
  try {
    // ============ STEP 1: GET RAW DATA ============
    const profile = await fetchUserProfile(userId);
    
    let fullCalc = await fullStore.getFull(userId, slug);
    
    console.log("[PUBLISH DEBUG] fullStore.getFull result:", fullCalc ? "FOUND" : "NULL");
    
    if (!fullCalc && calcSummary) {
      console.warn("[PUBLISH] No fullCalc in store, creating from calcSummary. This may lose meta fields!");
      // Create a basic calc but PRESERVE all meta fields from calcSummary
      const basicCalc = calcFromMetaConfig({
        meta: calcSummary.meta,
        config: calcSummary.config,
      });
      // CRITICAL: Merge ALL meta fields from calcSummary, not just name/slug
      fullCalc = {
        ...basicCalc,
        meta: {
          ...(basicCalc.meta || {}),
          ...(calcSummary.meta || {}), // This preserves simpleAddCheckout, simpleSections, etc.
        },
      };
    }
    
    if (!fullCalc) {
      console.error("[PUBLISH] No fullCalc found for", slug);
      return;
    }
    
    console.log("[PUBLISH DEBUG] fullCalc.meta keys:", Object.keys(fullCalc.meta || {}));
    console.log("[PUBLISH DEBUG] simpleAddCheckout:", fullCalc.meta?.simpleAddCheckout);

    const override = (fullCalc.meta?.contactOverride || {}) as {
      type?: string;
      value?: string;
      whatsapp?: string;
      telegram?: string;
      email?: string;
    };

    console.log("[PUBLISH DEBUG] Slug:", slug);
    console.log("[PUBLISH DEBUG] Override:", JSON.stringify(override));
    console.log("[PUBLISH DEBUG] Profile:", JSON.stringify(profile));

    // ============ STEP 2: DETERMINE DESTINATION (STRICT WATERFALL) ============
    let finalContact: { 
      type: "email" | "whatsapp" | "telegram"; 
      whatsapp?: string; 
      telegram?: string; 
      email?: string;
    } = { 
      type: "email", 
      email: userId // Default fallback = login email
    };

    // PRIORITY 1: Editor Override (page-specific settings)
    const overrideType = (override.type || "").toLowerCase();
    if (overrideType && overrideType !== "default" && overrideType !== "profile") {
      console.log("[PUBLISH DEBUG] Using Editor Override ->", overrideType);
      
      if (overrideType === "whatsapp") {
        const value = normalizeWhatsapp(override.value || override.whatsapp);
        if (value) {
          finalContact = { type: "whatsapp", whatsapp: value };
        } else {
          console.warn("[PUBLISH] WhatsApp override has no valid number, falling back");
        }
      } 
      else if (overrideType === "telegram") {
        const value = normalizeTelegram(override.value || override.telegram);
        if (value) {
          finalContact = { type: "telegram", telegram: value };
        } else {
          console.warn("[PUBLISH] Telegram override has no valid username, falling back");
        }
      }
      else if (overrideType === "email") {
        const value = override.value || override.email;
        if (value) {
          finalContact = { type: "email", email: value };
        }
      }
    }
    // PRIORITY 2: Account Profile (global user settings)
    else {
      const profileDest = (profile.order_destination || "").toLowerCase();
      console.log("[PUBLISH DEBUG] Using Profile Default. Destination:", profileDest);

      if (profileDest === "whatsapp" && profile.whatsapp_number) {
        const normalized = normalizeWhatsapp(profile.whatsapp_number);
        if (normalized) {
          finalContact = { type: "whatsapp", whatsapp: normalized };
        } else {
          console.warn("[PUBLISH] Profile WhatsApp number invalid, falling back to email");
          finalContact = { type: "email", email: profile.inquiry_email || userId };
        }
      }
      else if (profileDest === "telegram" && profile.telegram_username) {
        const normalized = normalizeTelegram(profile.telegram_username);
        if (normalized) {
          finalContact = { type: "telegram", telegram: normalized };
        } else {
          console.warn("[PUBLISH] Profile Telegram username invalid, falling back to email");
          finalContact = { type: "email", email: profile.inquiry_email || userId };
        }
      }
      else {
        // Fallback to inquiry email or login email
        finalContact = { type: "email", email: profile.inquiry_email || userId };
      }
    }

    // ============ STEP 3: INJECT INTO JSON ============
    console.log("[PUBLISH INJECTED]", JSON.stringify(finalContact));

    const updated = {
      ...fullCalc,
      meta: {
        ...(fullCalc.meta || {}),
        contact: finalContact,
      },
    };
    
    await fullStore.putFull(userId, slug, updated);
    console.log("[PUBLISH] Contact info saved for", slug);

  } catch (err) {
    console.error("[PUBLISH] Failed to inject contact info:", err);
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let rawBody: unknown = {};
  try { rawBody = await req.json(); } catch { }

  // ========== ZOD VALIDATION ==========
  const validation = validateBody(rawBody, PublishRequestSchema);
  if (!validation.success) {
    console.warn("[PUBLISH] Validation failed:", validation.error);
    return NextResponse.json(validationErrorResponse(validation), { status: 422 });
  }
  const { slug, publish } = validation.data;
  // =====================================
  
  console.log("[PUBLISH] Request:", { userId, slug, publish });

  const plan = await getPlanForUser(userId);
  const current = await calcsStore.get(userId, slug);
  
  console.log("[PUBLISH] calcsStore.get result:", current ? "FOUND" : "NULL");
  
  if (!current) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  const alreadyPublished = !!current.meta?.published;

  if (publish === true && !alreadyPublished) {
    const publishedNow = await calcsStore.countPublished(userId);
    const needs = { maxPublicPages: publishedNow + 1 };
    const limit = withinLimits(needs, plan);
    if (!limit.ok) {
      const fail = limit.failures[0];
      return NextResponse.json(
        { error: "PLAN_LIMIT", key: fail.key, need: fail.need, allow: fail.allow, plan },
        { status: 409 }
      );
    }
  }

  if (publish) {
    await injectContactInfo(userId, slug, current);
  }

  // 2) Upis u calcsStore (zaista postavlja config.published)
  const ok = await calcsStore.setPublished(userId, slug, !!publish);
  if (!ok) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // 3) Revalidate public paths (ISR)
  if (publish) {
    try {
      revalidatePath(`/p/${slug}`);
      revalidatePath(`/api/public/${slug}`);
    } catch (e) {
      console.error("Revalidate failed for", slug, e);
    }
  }

  return NextResponse.json({ ok: true, slug, publish: !!publish }, { headers: { "Cache-Control": "no-store" } });
}
