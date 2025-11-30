// src/app/api/calculators/[slug]/publish/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { coercePlan, type Plan } from "@/lib/auth";
import { getPublishedCap, type PlanId } from "@/lib/entitlements";
import * as calcsStore from "@/lib/calcsStore";
import * as fullStore from "@/lib/fullStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeWhatsapp(input?: string | null) {
  if (!input) return "";
  return String(input).trim().replace(/[^\d]/g, "");
}

function normalizeTelegram(input?: string | null) {
  if (!input) return "";
  return String(input).trim().replace(/^@/, "");
}

function normalizeEmail(input?: string | null) {
  if (!input) return "";
  return String(input).trim();
}

type ContactOverride = {
  type?: string;
  value?: string;
  whatsapp?: string;
  telegram?: string;
  email?: string;
};

function resolveContact(override: ContactOverride | undefined, fallbackEmail: string) {
  const normalizedType = (override?.type || "").toLowerCase();
  const value = normalizeEmail(override?.value);
  const whatsappValue = normalizeWhatsapp(override?.whatsapp || (normalizedType === "whatsapp" ? value : ""));
  const telegramValue = normalizeTelegram(override?.telegram || (normalizedType === "telegram" ? value : ""));
  const emailValue = normalizeEmail(override?.email || (normalizedType === "email" ? value : ""));

  if (normalizedType === "whatsapp" && whatsappValue) {
    return { type: "whatsapp" as const, whatsapp: whatsappValue };
  }
  if (normalizedType === "telegram" && telegramValue) {
    return { type: "telegram" as const, telegram: telegramValue };
  }
  if (normalizedType === "email" && emailValue) {
    return { type: "email" as const, email: emailValue };
  }

  if (whatsappValue) {
    return { type: "whatsapp" as const, whatsapp: whatsappValue };
  }
  if (telegramValue) {
    return { type: "telegram" as const, telegram: telegramValue };
  }
  if (emailValue) {
    return { type: "email" as const, email: emailValue };
  }

  return { type: "email" as const, email: fallbackEmail };
}

async function injectContactInfo(userId: string, slug: string) {
  try {
    const fullCalc = await fullStore.getFull(userId, slug);
    if (!fullCalc) {
      console.warn("[PUBLISH] Missing full calc for contact injection:", slug);
      return;
    }

    const override = (fullCalc.meta?.contactOverride || {}) as ContactOverride;
    const finalContact = resolveContact(override, userId);

    const updated = {
      ...fullCalc,
      meta: {
        ...(fullCalc.meta || {}),
        contact: finalContact,
        published: true,
      },
    };

    await fullStore.putFull(userId, slug, updated);
  } catch (error) {
    console.error("[PUBLISH] Failed to inject contact info:", error);
  }
}

async function resolveSlug(
  req: Request,
  ctx?:
    | { params?: { slug?: string } }
    | { params?: Promise<{ slug?: string }> }
): Promise<string> {
  try {
    const raw = (ctx as any)?.params;
    const params = typeof raw?.then === "function" ? await raw : raw;
    if (params?.slug && params.slug !== "undefined" && params.slug !== "null") {
      return decodeURIComponent(String(params.slug));
    }
  } catch {}
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("calculators");
    const candidate = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
    if (candidate) return decodeURIComponent(candidate);
  } catch {}
  return "";
}

async function getUserPlan(userId: string): Promise<PlanId> {
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
  return coercePlan(rows[0]?.plan as Plan | undefined) as PlanId;
}

export async function POST(
  req: Request,
  context: { params?: { slug?: string } }
) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const slug = await resolveSlug(req, context);
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const nextPublish: boolean = !!body.publish;

  const current = await calcsStore.get(userId, slug);
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isCurrentlyPublished = !!current.meta?.published;

  if (nextPublish && !isCurrentlyPublished) {
    const plan = await getUserPlan(userId);
    const cap = getPublishedCap(plan);
    if (cap !== "unlimited") {
      const already = await calcsStore.countPublished(userId);
      if (already + 1 > cap) {
        return NextResponse.json(
          {
            error: "PLAN_LIMIT",
            key: "maxPublicPages",
            need: already + 1,
            allow: cap,
            plan,
          },
          { status: 409 }
        );
      }
    }
  }

  const ok = await calcsStore.setPublished(userId, slug, nextPublish);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (nextPublish) {
    await injectContactInfo(userId, slug);
    
    // Revalidate all possible URL formats
    try {
      const calc = await fullStore.getFull(userId, slug);
      const calcId = calc?.meta?.id;
      
      revalidatePath(`/p/${slug}`);
      if (calcId) {
        revalidatePath(`/p/${calcId}-${slug}`); // Canonical format
        revalidatePath(`/p/${calcId}`);         // ID-only format
      }
      revalidatePath(`/api/public/${slug}`);
      if (calcId) {
        revalidatePath(`/api/public/${calcId}-${slug}`);
      }
      
      console.log(`[PUBLISH] Revalidated paths for slug=${slug}, id=${calcId}`);
    } catch (error) {
      console.error("[PUBLISH] Revalidate failed:", error);
    }
  } else {
    // Unpublish - also revalidate to show 404
    try {
      const calc = await fullStore.getFull(userId, slug);
      const calcId = calc?.meta?.id;
      
      revalidatePath(`/p/${slug}`);
      if (calcId) {
        revalidatePath(`/p/${calcId}-${slug}`);
        revalidatePath(`/p/${calcId}`);
      }
    } catch (error) {
      console.error("[UNPUBLISH] Revalidate failed:", error);
    }
  }

  return NextResponse.json(
    { ok: true, slug, published: nextPublish, updatedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
