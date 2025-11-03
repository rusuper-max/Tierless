// src/app/api/calculators/[slug]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import * as fullStore from "@/lib/fullStore";
import * as mini from "@/lib/data/calcs";
import * as trash from "@/lib/data/trash";
import { putPublic /*, deletePublic*/ } from "@/lib/publicStore";

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
  return s;
}

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

export async function GET(req: Request, ctx: { params: { slug?: string } }) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    const full = await fullStore.getFull(userId, slug);
    if (full) return jsonNoCache({ ...full, meta: { ...full.meta, slug } });

    const miniRow = await mini.get(userId, slug);
    if (miniRow) {
      const { calcFromMetaConfig } = await import("@/lib/calc-init");
      const seeded = calcFromMetaConfig(miniRow);
      const normalized = { ...seeded, blocks: autoBlocksFrom(seeded), meta: { ...seeded.meta, slug } };
      await fullStore.putFull(userId, slug, normalized);
      return jsonNoCache(normalized);
    }

    return jsonNoCache({ error: "not_found", slug }, 404);
  } catch (e: any) {
    console.error("GET full error:", e);
    return jsonNoCache({ error: "get_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

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
    if (newName) await mini.updateName(userId, slug, newName);

    await putPublic(slug, normalized);
    return jsonNoCache({ ok: true, slug });
  } catch (e: any) {
    console.error("PUT full error:", e);
    return jsonNoCache({ error: "invalid_payload", detail: e?.stack ?? String(e) }, 400);
  }
}

export async function DELETE(req: Request, ctx: { params: { slug?: string } }) {
  // SOFT DELETE → move to Trash
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return jsonNoCache({ error: "bad_slug" }, 400);

  try {
    // uzmi mini zapis (ako postoji) i gurni u trash
    const row = await mini.get(userId, slug);
    if (row) {
      await trash.push(userId, row);
    }

    // očisti full + mini
    await fullStore.deleteFull(userId, slug).catch(() => {});
    const removedMini = await mini.remove(userId, slug).catch(() => false);

    return jsonNoCache({ ok: true, trashed: true, removedMini, slug });
  } catch (e: any) {
    console.error("DELETE full error:", e);
    return jsonNoCache({ error: "delete_failed", detail: e?.stack ?? String(e) }, 500);
  }
}