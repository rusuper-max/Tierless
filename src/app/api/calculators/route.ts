import { NextResponse } from "next/server";
import path from "path";
import { getUserIdFromRequest } from "@/lib/auth";
import * as mini from "@/lib/data/calcs";
import * as trash from "@/lib/data/trash";
import * as fullStore from "@/lib/fullStore";
import { ENTITLEMENTS, type PlanId } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeUserId(userId: string) {
  return (userId || "anon")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "anon";
}
function debugFile(userId: string) {
  const uid = safeUserId(userId);
  return path.join(process.cwd(), "data", "users", uid, "calculators.json");
}
function jsonNoCache(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  return res;
}

// ——— Plan helper (bez cookies().get)
function getPlanFromReq(req: Request): PlanId {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)tl_plan=([^;]+)/);
  const raw = decodeURIComponent(m?.[1] || "").toLowerCase();
  const ok: PlanId[] = ["free","starter","growth","pro","tierless"];
  return (ok.includes(raw as PlanId) ? (raw as PlanId) : "free");
}
function pagesLimit(plan: PlanId): number | "unlimited" {
  const lim = ENTITLEMENTS?.[plan]?.limits?.pages;
  return typeof lim === "number" ? lim : "unlimited";
}

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  try {
    const plan = getPlanFromReq(req);
    const limit = pagesLimit(plan);

    // 1) Active rows
    let rows = await mini.list(userId);

    // (OPCIONO) sort po meta.order DESC — veći order = veći prioritet
    rows = [...rows].sort((a: any, b: any) => {
      const ao = Number(a?.meta?.order ?? 0);
      const bo = Number(b?.meta?.order ?? 0);
      // veći order gore
      if (bo !== ao) return bo - ao;
      return 0;
    });

    // 2) GC starih iz Trash + broj
    await trash.gc(userId).catch(() => {});

    // 3) Ako je preko limita — zadržavamo PRVIH `limit`, OSTATAK šaljemo u Trash
    let autoTrashed = 0;
    if (typeof limit === "number" && rows.length > limit) {
      const toMove = rows.slice(limit);
      for (const r of toMove) {
        await trash.push(userId, r);
        await fullStore.deleteFull(userId, r.meta.slug).catch(() => {});
        await mini.remove(userId, r.meta.slug).catch(() => {});
        autoTrashed++;
      }
      rows = await mini.list(userId);
      // i ponovo sortiramo (da ostane isti red)
      rows = [...rows].sort((a: any, b: any) => {
        const ao = Number(a?.meta?.order ?? 0);
        const bo = Number(b?.meta?.order ?? 0);
        if (bo !== ao) return bo - ao;
        return 0;
      });
    }

    // 4) Trash count
    let trashedCount = 0;
    try { trashedCount = await trash.count(userId); } catch { trashedCount = 0; }

    const notice =
      autoTrashed > 0 && typeof limit === "number"
        ? `Your plan allows ${limit} page(s). ${autoTrashed} page(s) were moved to Trash and will be permanently deleted after 30 days. Consider upgrading to keep them.`
        : undefined;

    return jsonNoCache({
      rows,
      trashedCount,
      plan,
      limit,
      autoTrashed,
      notice,
      __debug: { userId, file: debugFile(userId) },
    });
  } catch (e: any) {
    console.error("LIST /api/calculators failed:", e);
    return jsonNoCache({ error: "list_failed", detail: e?.stack ?? String(e) }, 500);
  }
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return jsonNoCache({ error: "unauthorized" }, 401);

  try {
    const plan = getPlanFromReq(req);
    const limit = pagesLimit(plan);
    const act = await mini.list(userId);

    if (typeof limit === "number" && act.length >= limit) {
      return jsonNoCache({ error: "limit_reached", limit }, 403);
    }

    const body = await req.json().catch(() => ({} as any));

    if (body?.from && body?.name) {
      const slug = await mini.duplicate(userId, body.from, body.name);
      if (!slug) return jsonNoCache({ error: "not_found" }, 404);
      return jsonNoCache({ slug, __debug: { userId, file: debugFile(userId) } });
    }

    const name = (body?.name ?? "Untitled Page") as string;
    const row = await mini.create(userId, name);
    return jsonNoCache({ slug: row.meta.slug, __debug: { userId, file: debugFile(userId) } });
  } catch (e: any) {
    console.error("CREATE /api/calculators failed:", e);
    return jsonNoCache({ error: "create_failed", detail: e?.stack ?? String(e) }, 500);
  }
}