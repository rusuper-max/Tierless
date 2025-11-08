// src/app/api/calculators/[slug]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

import * as fullStore from "@/lib/fullStore";
import * as mini from "@/lib/data/calcs";
import * as trash from "@/lib/data/trash";
import { putPublic /* , deletePublic */ } from "@/lib/publicStore";

function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

function extractSlug(req: Request, params?: { slug?: string }) {
  let s = params?.slug ?? "";
  if (!s) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    s = parts[parts.length - 1] ?? "";
  }
  return decodeURIComponent(s || "");
}

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */
function autoBlocksFrom(calc: any) {
  const hasPackages = Array.isArray(calc?.packages) && calc.packages.length > 0;
  const hasItems    = Array.isArray(calc?.items) && calc.items.length > 0;
  const hasFields   = Array.isArray(calc?.fields) && calc.fields.length > 0;
  const hasAddons   = Array.isArray(calc?.addons) && calc.addons.length > 0;

  const blocks: any[] = [];
  const mode = calc?.pricingMode ?? (hasItems ? "list" : "packages");

  if (mode === "packages" && hasPackages) {
    blocks.push({ id: "b_pkgs", type: "packages", title: "Plans", layout: "cards" });
  } else if (mode === "list") {
    blocks.push({ id: "b_items", type: "items", title: "Price list", showTotals: true });
  }
  if (hasFields) blocks.push({ id: "b_opts", type: "options", title: "Options" });
  if (hasAddons) blocks.push({ id: "b_extras", type: "extras", title: "Extras" });

  return blocks;
}

/* ------------------------------------------------------------------ */
/* GET                                                                 */
/* ------------------------------------------------------------------ */
export async function GET(req: Request, ctx: { params: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    const full = await fullStore.getFull(userId, slug);
    if (full) return jsonNoCache({ ...full, meta: { ...full.meta, slug } });

    const miniRow = typeof (mini as any).get === "function"
      ? await (mini as any).get(userId, slug)
      : (await (mini as any).list(userId)).find((r: any) => r?.meta?.slug === slug);

    if (miniRow) {
      const { calcFromMetaConfig } = await import("@/lib/calc-init");
      const seeded = calcFromMetaConfig(miniRow);
      const normalized = { ...seeded, blocks: autoBlocksFrom(seeded), meta: { ...seeded.meta, slug } };
      await fullStore.putFull(userId, slug, normalized);
      return jsonNoCache(normalized);
    }

    return jsonNoCache({ error: "not_found", slug }, 404);
  } catch (e: any) {
    console.error("GET /api/calculators/[slug] failed:", e);
    return jsonNoCache({ error: "get_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

/* ------------------------------------------------------------------ */
/* PUT                                                                 */
/* ------------------------------------------------------------------ */
export async function PUT(req: Request, ctx: { params: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    const body = await req.json();

    if (!body?.meta?.slug || body.meta.slug !== slug) {
      return jsonNoCache({ error: "slug_mismatch" }, 400);
    }

    const normalized = { ...body, blocks: autoBlocksFrom(body), meta: { ...body.meta, slug } };
    await fullStore.putFull(userId, slug, normalized);

    const newName = String(body?.meta?.name ?? "").trim();
    if (newName && typeof (mini as any).updateName === "function") {
      await (mini as any).updateName(userId, slug, newName);
    }

    await putPublic(slug, normalized);
    return jsonNoCache({ ok: true, slug });
  } catch (e: any) {
    console.error("PUT /api/calculators/[slug] failed:", e);
    return jsonNoCache({ error: "invalid_payload", detail: e?.stack ?? String(e) }, 400);
  }
}

/* ------------------------------------------------------------------ */
/* DELETE  — move to Trash (robustno)                                  */
/* ------------------------------------------------------------------ */
export async function DELETE(req: Request, ctx: { params: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    // 1) Pronađi mini zapis, i dalje nastavljamo ako ga nema (očistićemo full store).
    let miniRow: any | undefined;
    if (typeof (mini as any).get === "function") {
      miniRow = await (mini as any).get(userId, slug);
    } else if (typeof (mini as any).list === "function") {
      const all = await (mini as any).list(userId);
      miniRow = all.find((r: any) => r?.meta?.slug === slug);
    }

    // 2) Pokušaj da ga prebaciš u trash (ako trash modul to podržava).
    let trashed = false;
    if (miniRow) {
      if (typeof (trash as any).move === "function") {
        trashed = !!(await (trash as any).move(userId, slug));
      } else if (typeof (trash as any).push === "function") {
        await (trash as any).push(userId, miniRow);
        trashed = true;
      } else if (typeof (trash as any).add === "function") {
        await (trash as any).add(userId, miniRow);
        trashed = true;
      } else if (typeof (trash as any).put === "function") {
        await (trash as any).put(userId, miniRow);
        trashed = true;
      }
    }

    // 3) Očisti full + mini (idempotentno).
    await fullStore.deleteFull(userId, slug).catch(() => {});
    let removedMini = false;
    if (typeof (mini as any).remove === "function") {
      removedMini = !!(await (mini as any).remove(userId, slug).catch(() => false));
    }

    // 4) Odgovor prema UI-ju
    return jsonNoCache({ ok: true, slug, trashed, removedMini });
  } catch (e: any) {
    console.error("DELETE /api/calculators/[slug] failed:", e);
    return jsonNoCache({ error: "delete_failed", detail: e?.stack ?? String(e) }, 500);
  }
}