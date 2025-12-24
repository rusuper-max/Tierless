// src/app/api/calculators/[slug]/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserIdFromRequest } from "@/lib/auth";
import * as fullStore from "@/lib/fullStore";
import * as calcsStore from "@/lib/calcsStore";
import { randomBytes } from "crypto";
import * as trash from "@/lib/data/trash";
import { CalcJsonSchema, validateBody, validationErrorResponse } from "@/lib/validators";
import { VersionConflictError } from "@/lib/fullStore";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set(
    "cache-control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  return res;
}

/**
 * Next 16: ctx.params može biti i Promise. Takođe, slug može doći i iz URL-a.
 */
async function extractSlug(
  req: Request,
  ctx: { params?: { slug?: string } } | undefined
): Promise<string> {
  // 1) pokušaj iz ctx.params (uz await ako je Promise)
  try {
    const anyParams: any = (ctx as any)?.params;
    const p = typeof anyParams?.then === "function" ? await anyParams : anyParams;
    if (p?.slug && p.slug !== "undefined" && p.slug !== "null") return String(p.slug);
  } catch { }

  // 2) query param ?slug=
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("slug");
    if (q && q !== "undefined" && q !== "null") return q;
  } catch { }

  // 3) poslednji segment posle /calculators/
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const i = parts.lastIndexOf("calculators");
    const candidate = i >= 0 ? parts[i + 1] : parts[parts.length - 1];
    if (candidate && candidate !== "undefined" && candidate !== "null") return candidate;
  } catch { }

  return "";
}

/** YouTube-ish ID (URL safe) */
function genId(): string {
  return randomBytes(9).toString("base64url"); // ~12 chars
}

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

  if (whatsappValue) return { type: "whatsapp" as const, whatsapp: whatsappValue };
  if (telegramValue) return { type: "telegram" as const, telegram: telegramValue };
  if (emailValue) return { type: "email" as const, email: emailValue };

  return { type: "email" as const, email: fallbackEmail };
}

/** Ako payload ima blocks -> zadrži; ako nema -> infer iz root polja. */
function normalizeBlocks(input: any) {
  if (Array.isArray(input?.blocks) && input.blocks.length > 0) {
    return input.blocks;
  }
  const hasPackages = Array.isArray(input?.packages) && input.packages.length > 0;
  const hasItems = Array.isArray(input?.items) && input.items.length > 0;
  const hasFields = Array.isArray(input?.fields) && input.fields.length > 0;
  const hasAddons = Array.isArray(input?.addons) && input.addons.length > 0;

  const blocks: any[] = [];
  const mode = input?.pricingMode ?? (hasItems ? "list" : "packages");

  if (mode === "packages" && hasPackages) {
    blocks.push({
      id: "b_pkgs",
      type: "packages",
      title: "Plans",
      data: { packages: input.packages },
    });
  } else if (mode === "list") {
    blocks.push({
      id: "b_items",
      type: "items",
      title: "Price list",
      data: { rows: input.items ?? [] },
    });
  }
  if (hasFields) {
    blocks.push({
      id: "b_opts",
      type: "options",
      title: "Options",
      data: { rows: input.fields },
    });
  }
  if (hasAddons) {
    blocks.push({
      id: "b_extras",
      type: "extras",
      title: "Extras",
      data: { note: "" },
    });
  }

  return blocks;
}

/* ------------------------------- GET -------------------------------- */
export async function GET(req: Request, ctx: { params?: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = await extractSlug(req, ctx);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    // First try personal ownership
    let miniRow = await calcsStore.get(userId, slug);
    let effectiveOwner = userId;
    let teamRole: string | null = null; // Track user's role if team calc

    // If not found, check if it's a team calculator the user has access to
    if (!miniRow) {
      const { findCalcBySlug, requireTeamMember } = await import("@/lib/permissions");
      const ownership = await findCalcBySlug(slug);

      if (ownership?.teamId) {
        // It's a team calculator - check if user has access
        const perm = await requireTeamMember(userId, ownership.teamId, "viewer");
        if (perm.allowed) {
          // User has team access - get the calc using owner's userId
          miniRow = await calcsStore.get(ownership.userId, slug);
          effectiveOwner = ownership.userId;
          teamRole = perm.role || "viewer"; // Store the user's role
        }
      }
    }

    // 1) FULL iz storage-a (with version for optimistic locking)
    const fullRecord = await fullStore.getFullWithVersion(effectiveOwner, slug);
    if (fullRecord) {
      const full = fullRecord.calc;
      const version = fullRecord.version;
      const id = full?.meta?.id || genId();

      // Merge meta: uzmi sve iz FULL, ali ime pregazi vrednošću iz mini reda, ako postoji
      const mergedMeta = {
        ...(full.meta || {}),
        ...(miniRow?.meta?.name ? { name: miniRow.meta.name } : {}),
        slug,
        id,
      };

      const ready = { ...full, meta: mergedMeta, _version: version, _teamRole: teamRole };

      // Ako ranije nije imao id ili je ime promenjeno – upiši nazad u fullStore
      if (!full?.meta?.id || full?.meta?.name !== mergedMeta.name) {
        await fullStore.putFull(effectiveOwner, slug, ready);
      }

      // Return with ETag header for version tracking
      const res = NextResponse.json(ready);
      res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.headers.set("ETag", String(version));
      return res;
    }

    // 2) Nema FULL – seed iz mini reda (ako postoji)
    if (miniRow) {
      const { calcFromMetaConfig } = await import("@/lib/calc-init");
      const seeded = calcFromMetaConfig(miniRow);
      const normalized = {
        ...seeded,
        blocks: normalizeBlocks(seeded),
        meta: { ...seeded.meta, slug, id: genId() },
        _version: 1, // New record starts at version 1
        _teamRole: teamRole,
      };
      await fullStore.putFull(effectiveOwner, slug, normalized);

      const res = NextResponse.json(normalized);
      res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
      res.headers.set("ETag", "1");
      return res;
    }

    // 3) Ni full ni mini – 404
    return jsonNoCache({ error: "not_found", slug }, 404);
  } catch (e: any) {
    console.error("GET full error:", e);
    return jsonNoCache({ error: "get_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

/* ------------------------------- PUT -------------------------------- */
export async function PUT(req: Request, ctx: { params?: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = await extractSlug(req, ctx);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  // Check ownership - FIRST check if current user owns this slug directly
  let effectiveOwner = userId;
  const { findCalcBySlug, requireTeamMember } = await import("@/lib/permissions");

  // 1. First check if current user personally owns this slug
  const personalCalc = await calcsStore.get(userId, slug);

  if (personalCalc) {
    // User owns this personally - use their userId as owner
    effectiveOwner = userId;
  } else {
    // 2. Fallback: Check if it's a team calculator they have access to
    const ownership = await findCalcBySlug(slug);

    if (!ownership) {
      return jsonNoCache({ error: "not_found" }, 404);
    }

    if (ownership.teamId) {
      // It's a team calculator - verify edit permission
      const perm = await requireTeamMember(userId, ownership.teamId, "editor");
      if (!perm.allowed) {
        return jsonNoCache({ error: "forbidden", reason: perm.reason }, 403);
      }
      effectiveOwner = ownership.userId;
    } else {
      // Not a team calc and user doesn't own it personally - forbidden
      console.error("[EDITOR PUT] FORBIDDEN - user doesn't own this slug:", {
        requestUserId: userId,
        ownerUserId: ownership.userId,
        slug,
      });
      return jsonNoCache({ error: "forbidden" }, 403);
    }
  }

  // ========== OPTIMISTIC LOCKING ==========
  // Client can send If-Match header with version number
  const ifMatch = req.headers.get("If-Match");
  const expectedVersion = ifMatch ? parseInt(ifMatch, 10) : undefined;
  // =========================================

  console.log("[EDITOR PUT] userId:", userId, "effectiveOwner:", effectiveOwner, "slug:", slug, "expectedVersion:", expectedVersion);

  try {
    const rawBody = await req.json();

    // ========== ZOD VALIDATION ==========
    const validation = validateBody(rawBody, CalcJsonSchema);
    if (!validation.success) {
      console.warn("[EDITOR PUT] Validation failed:", validation.error);
      return jsonNoCache(validationErrorResponse(validation), 422);
    }
    const body = validation.data;
    // =====================================

    if (!body?.meta?.slug || body.meta.slug !== slug) {
      return jsonNoCache({ error: "slug_mismatch" }, 400);
    }

    // --- Respect client-provided blocks; infer only when not provided ---
    const hasBlocksProp = Object.prototype.hasOwnProperty.call(body, "blocks");
    const blocks = hasBlocksProp
      ? (Array.isArray(body.blocks) ? body.blocks : [])
      : normalizeBlocks(body);

    // Root arrays — sanitize to arrays
    let packages = Array.isArray(body.packages) ? body.packages : [];
    let items = Array.isArray(body.items) ? body.items : [];
    let fields = Array.isArray(body.fields) ? body.fields : [];
    let addons = Array.isArray(body.addons) ? body.addons : [];

    const id = body?.meta?.id || genId();

    const normalized = {
      ...body,
      // overwrite with sanitized roots + final blocks
      packages,
      items,
      fields,
      addons,
      blocks,
      meta: { ...body.meta, slug, id },
    };

    const override = normalized.meta?.contactOverride as ContactOverride | undefined;
    normalized.meta.contact = resolveContact(override, userId);

    // DEBUG: Log what we're saving
    console.log("[EDITOR SAVE DEBUG]", {
      slug,
      simpleAddCheckout: normalized.meta?.simpleAddCheckout,
      hasContact: !!normalized.meta?.contact,
      hasSections: !!(normalized.meta?.simpleSections?.length),
    });

    // ========== ATOMIC SAVE (Meta + Full in transaction) ==========
    const newName = String(body?.meta?.name ?? "").trim();
    const saveResult = await calcsStore.saveAtomic(
      effectiveOwner,
      slug,
      normalized,
      newName ? { name: newName } : undefined,
      expectedVersion
    );

    if (!saveResult.success) {
      if (saveResult.error === "VERSION_CONFLICT") {
        return jsonNoCache({
          error: "VERSION_CONFLICT",
          message: "Another save occurred. Please refresh and try again.",
          expectedVersion: expectedVersion,
          currentVersion: saveResult.currentVersion,
        }, 409);
      }
      return jsonNoCache({ error: saveResult.error }, 404);
    }
    // ===============================================================

    // Add version to response
    const responseWithVersion = {
      ...normalized,
      _version: saveResult.version,
    };

    // Revalidate public pages if published
    try {
      const mini = await calcsStore.get(effectiveOwner, slug);
      const isPublished = !!mini?.meta?.published;
      if (isPublished) {
        const calcId = normalized.meta?.id as string | undefined;

        // Sync is_example flag from meta.listInExamples
        const listInExamples = normalized.meta?.listInExamples === true;
        await calcsStore.setIsExample(effectiveOwner, slug, listInExamples);
        console.log(`[EDITOR PUT] Synced is_example: ${listInExamples} for slug=${slug}`);

        // Revalidate all possible URL formats
        revalidatePath(`/p/${slug}`);
        if (calcId) {
          revalidatePath(`/p/${calcId}-${slug}`); // Canonical format
          revalidatePath(`/p/${calcId}`);         // ID-only format
        }

        // Also revalidate the API routes (for any external consumers)
        revalidatePath(`/api/public/${slug}`);
        if (calcId) {
          revalidatePath(`/api/public/${calcId}-${slug}`);
        }

        // Revalidate examples page when is_example changes
        revalidatePath(`/examples`);
        revalidatePath(`/api/examples`);

        console.log(`[EDITOR PUT] Revalidated paths for slug=${slug}, id=${calcId}`);
      }
    } catch (err) {
      console.warn("[EDITOR PUT] revalidate failed:", err);
    }

    // Return with ETag header for version tracking
    const res = NextResponse.json(responseWithVersion);
    res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.headers.set("ETag", String(saveResult.version));
    return res;
  } catch (e: any) {
    // Handle version conflict errors from fullStore
    if (e instanceof VersionConflictError) {
      return jsonNoCache({
        error: "VERSION_CONFLICT",
        message: "Another save occurred. Please refresh and try again.",
        expectedVersion: e.expectedVersion,
        currentVersion: e.currentVersion,
      }, 409);
    }

    console.error("PUT full error:", e);
    return jsonNoCache({ error: "invalid_payload", detail: e?.stack ?? String(e) }, 400);
  }
}

/* ------------------------------ DELETE ------------------------------- */
export async function DELETE(req: Request, ctx: { params?: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = await extractSlug(req, ctx);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    // 1) Učitaj mini red – treba nam za Trash
    const row = await calcsStore.get(userId, slug);

    // 2) Obriši iz calculators
    const ok = await calcsStore.remove(userId, slug);
    if (!ok) {
      return jsonNoCache({ error: "not_found" }, 404);
    }

    // 3) Gurni u Trash ako imamo podatke
    if (row) {
      try {
        await trash.push(userId, row);
      } catch (e) {
        console.error("trash.push failed for", slug, e);
      }
    }

    // 4) Obrisi full config iz storage-a (best effort)
    try {
      await fullStore.deleteFull(userId, slug);
    } catch {
      // ignorišemo grešku – bitno je da je active red otišao i da je u Trashu
    }

    return jsonNoCache({ ok: true, slug });
  } catch (e: any) {
    console.error("DELETE full error:", e);
    return jsonNoCache(
      { error: "delete_failed", detail: e?.stack ?? String(e) },
      500
    );
  }
}
