// src/app/editor/[id]/ClientBoundary.tsx
"use client";

import { useEffect, useState } from "react";
import EditorShell from "./EditorShell";
import type { CalcJson } from "@/hooks/useEditorStore";

type TeamRole = "owner" | "admin" | "editor" | "viewer" | null;

export default function ClientBoundary({
  slug,
  initialCalc,
  initialError,
}: {
  slug: string;
  initialCalc: CalcJson | null;
  initialError?: { status: number; error: string } | null;
}) {
  const [calc, setCalc] = useState<CalcJson | null>(initialCalc);
  const [teamRole, setTeamRole] = useState<TeamRole>(null);
  const [err, setErr] = useState<{ status: number; error: string } | null>(initialError ?? null);
  const [loading, setLoading] = useState<boolean>(!initialCalc && !initialError);

  useEffect(() => {
    if (initialCalc || initialError) return;
    let aborted = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          let msg = "error";
          try { const j = await res.json(); msg = j?.error || msg; } catch {}
          if (!aborted) {
            setErr({ status: res.status, error: msg });
            setLoading(false);
          }
          return;
        }
        const raw = await res.json();
        const got = (raw && (raw.calc || raw)) as CalcJson;
        const role = raw?._teamRole as TeamRole;
        if (!aborted) {
          setCalc(got);
          setTeamRole(role);
          setLoading(false);
        }
      } catch (e: any) {
        if (!aborted) {
          setErr({ status: 0, error: e?.message || "network" });
          setLoading(false);
        }
      }
    })();
    return () => { aborted = true; };
  }, [slug, initialCalc, initialError]);

  if (loading) {
    return <div className="tl-dashboard px-6 py-8 text-sm text-[var(--muted,#9aa0a6)]">Loading…</div>;
  }

  if (!calc) {
    return (
      <div className="tl-dashboard px-6 py-8 text-sm">
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--border,#2B2D31)_60%,transparent)] p-4">
          <div className="text-base font-medium">Couldn’t load this page</div>
          <div className="mt-1 text-[var(--muted,#9aa0a6)]">
            HTTP {err?.status ?? "?"} · {err?.error ?? "unknown"}
          </div>
          <div className="mt-4">
            <a href="/dashboard" className="inline-flex items-center rounded-xl px-3 py-2 text-sm outline outline-1 outline-[var(--brand-1,#4F46E5)]">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Viewer role = read-only mode
  const isReadOnly = teamRole === "viewer";

  return <EditorShell slug={calc.meta?.slug || slug} initialCalc={calc} readOnly={isReadOnly} teamRole={teamRole} />;
}