// src/app/api/calculators/[slug]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as fullStore from "@/lib/fullStore";
import * as calcsStore from "@/lib/calcsStore";
import { randomBytes } from "crypto";
import { putPublic } from "@/lib/publicStore";

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
  } catch {}

  // 2) query param ?slug=
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("slug");
    if (q && q !== "undefined" && q !== "null") return q;
  } catch {}

  // 3) poslednji segment posle /calculators/
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const i = parts.lastIndexOf("calculators");
    const candidate = i >= 0 ? parts[i + 1] : parts[parts.length - 1];
    if (candidate && candidate !== "undefined" && candidate !== "null") return candidate;
  } catch {}

  return "";
}

/** YouTube-ish ID (URL safe) */
function genId(): string {
  return randomBytes(9).toString("base64url"); // ~12 chars
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
    // Uvek prvo mini red – zbog imena, published itd.
    const miniRow = await calcsStore.get(userId, slug);

    // 1) FULL iz storage-a
    const full = await fullStore.getFull(userId, slug);
    if (full) {
      const id = full?.meta?.id || genId();

      // Merge meta: uzmi sve iz FULL, ali ime pregazi vrednošću iz mini reda, ako postoji
      const mergedMeta = {
        ...(full.meta || {}),
        ...(miniRow?.meta?.name ? { name: miniRow.meta.name } : {}),
        slug,
        id,
      };

      const ready = { ...full, meta: mergedMeta };

      // Ako ranije nije imao id ili je ime promenjeno – upiši nazad u fullStore
      if (!full?.meta?.id || full?.meta?.name !== mergedMeta.name) {
        await fullStore.putFull(userId, slug, ready);
      }

      return jsonNoCache(ready);
    }

    // 2) Nema FULL – seed iz mini reda (ako postoji)
    if (miniRow) {
      const { calcFromMetaConfig } = await import("@/lib/calc-init");
      const seeded = calcFromMetaConfig(miniRow);
      const normalized = {
        ...seeded,
        blocks: normalizeBlocks(seeded),
        meta: { ...seeded.meta, slug, id: genId() },
      };
      await fullStore.putFull(userId, slug, normalized);
      return jsonNoCache(normalized);
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

  try {
    const body = await req.json();
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

    // FULL persist
    await fullStore.putFull(userId, slug, normalized);

    // mini ime (dashboard)
    const newName = String(body?.meta?.name ?? "").trim();
    if (newName) {
      await calcsStore.updateName(userId, slug, newName).catch(() => {});
    }

    // PUBLIC sync (slug + id)
    try {
      await putPublic(slug, normalized);
      await putPublic(id, normalized);
    } catch {}

    return jsonNoCache(normalized);
  } catch (e: any) {
    console.error("PUT full error:", e);
    return jsonNoCache({ error: "invalid_payload", detail: e?.stack ?? String(e) }, 400);
  }
}