import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";
import { getCalc, deleteCalc, updateCalcName } from "@/lib/calcsStore";
import { getCalculator, putCalculator, deleteCalculator } from "@/lib/store";
import { calcFromMetaConfig, calcBlank } from "@/lib/calc-init";
import { getPlanFromSession, validateAgainstPlan } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractSlug(req: Request, params?: { slug?: string }) {
  let s = params?.slug ?? "";
  if (!s) {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    s = parts[parts.length - 1] ?? "";
  }
  return s;
}

// helper: generiši blocks iz aktuelnog modela
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
  const tmp = NextResponse.json({});
  await getSessionOnRoute(req, tmp).catch(() => null);

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  const full = await getCalculator(slug);
  if (full) return NextResponse.json(full, { status: 200 });

  const mini = await getCalc(slug);
  if (mini) {
    const seeded = calcFromMetaConfig(mini);
    await putCalculator(seeded);
    return NextResponse.json(seeded, { status: 200 });
  }

  return NextResponse.json({ error: "not_found", slug }, { status: 404 });
}

export async function PUT(req: Request, ctx: { params: { slug?: string } }) {
  const tmp = NextResponse.json({});
  const s = await getSessionOnRoute(req, tmp);
  if (!s.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  try {
    const body = await req.json();
    if (!body?.meta?.slug || body.meta.slug !== slug) {
      return NextResponse.json({ error: "slug_mismatch" }, { status: 400 });
    }

    const plan = getPlanFromSession(s);
    const v = validateAgainstPlan(plan, body);
    if (v.ok !== true) {
      return NextResponse.json({ error: v.error, detail: v.detail, limits: v.limits, plan }, { status: 403 });
    }

    // normalizuj blocks prema aktuelnom modelu
    const normalized = { ...body, blocks: autoBlocksFrom(body) };

    await putCalculator(normalized);

    // ⇣⇣⇣ NOVO: sinhronizuj "name" u mini listingu (dashboard)
    try {
      const newName = String(body?.meta?.name ?? "").trim();
      if (newName) await updateCalcName(slug, newName);
    } catch {}

    const res = NextResponse.json({ ok: true, slug }, { status: 200 });
    const sc = tmp.headers.get("set-cookie");
    if (sc) res.headers.set("set-cookie", sc);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "invalid_payload", detail: String(e?.message ?? e) }, { status: 400 });
  }
}

export async function DELETE(req: Request, ctx: { params: { slug?: string } }) {
  const tmp = NextResponse.json({});
  const s = await getSessionOnRoute(req, tmp);
  if (!s.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slug = extractSlug(req, ctx?.params);
  if (!slug) return NextResponse.json({ error: "bad_slug" }, { status: 400 });

  await deleteCalculator(slug).catch(() => {});
  const removedMini = await deleteCalc(slug).catch(() => false);

  const res = NextResponse.json({ ok: true, removed: slug, mini: removedMini }, { status: 200 });
  const sc = tmp.headers.get("set-cookie");
  if (sc) res.headers.set("set-cookie", sc);
  return res;
}