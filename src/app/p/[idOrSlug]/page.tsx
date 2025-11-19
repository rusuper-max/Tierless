// src/app/p/[idOrSlug]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { CalcJson } from "@/hooks/useEditorStore";
import PublicPageClient from "./PublicPageClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */

function parseKey(key: string) {
  const ix = key.indexOf("-");
  if (ix > 0) return { id: key.slice(0, ix), slug: key.slice(ix + 1) };
  return { id: "", slug: key };
}

function baseUrl() {
  const env =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (env) return env.replace(/\/$/, "");

  try {
    const hdrs = headers();
    const host =
      hdrs.get("x-forwarded-host") ||
      hdrs.get("host") ||
      "localhost:3000";
    const proto =
      hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`.replace(/\/$/, "");
  } catch {
    return "http://localhost:3000";
  }
}
function apiUrl(segment: string) {
  return new URL(segment, baseUrl()).toString();
}

async function loadPublic(id: string, slug: string) {
  // 1) canonical by id
  if (id) {
    const key = `${id}${slug ? "-" + encodeURIComponent(slug) : ""}`;
    const r = await fetch(apiUrl(`/api/public/${key}?v=${Date.now()}`), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      return j?.data ?? j ?? null;
    }
  }
  // 2) fallback by slug
  if (slug) {
    const r = await fetch(apiUrl(`/api/public/${encodeURIComponent(slug)}?v=${Date.now()}`), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      return j?.data ?? j ?? null;
    }
  }
  return null;
}

/* ---------------- page ---------------- */

export default async function PublicPage(
  props: { params: { idOrSlug: string } } | { params: Promise<{ idOrSlug: string }> }
) {
  const p: any = (props as any).params;
  const { idOrSlug } =
    typeof p?.then === "function" ? await (p as Promise<{ idOrSlug: string }>) : (p as { idOrSlug: string });

  if (!idOrSlug || typeof idOrSlug !== "string") notFound();

  const { id, slug } = parseKey(idOrSlug);
  const calc = await loadPublic(id, slug || idOrSlug);
  if (!calc) notFound();

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#020617] dark:bg-[#05010d] dark:text-white">
      <div className="mx-auto w-full max-w-5xl px-0 py-6 sm:px-6 lg:px-8">
        <div className="rounded-none border-0 bg-transparent p-0 shadow-none sm:rounded-3xl sm:border sm:border-[color:var(--border,#e5e7eb)] sm:bg-[color:var(--card,#ffffff)] sm:p-4 sm:shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <PublicPageClient calc={calc as CalcJson} />
        </div>
      </div>
    </main>
  );
}
