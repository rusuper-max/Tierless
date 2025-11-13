// src/app/editor/[id]/_ClientLoader.tsx
"use client";

import { useEffect, useState } from "react";

type CalcMeta = {
  name: string;
  slug: string;
  description?: string | null;
};
type CalcJson = { meta: CalcMeta; [k: string]: any };

export default function ClientLoader({ slug }: { slug: string }) {
  const [calc, setCalc] = useState<CalcJson | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/calculators/${encodeURIComponent(slug)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          setErr(`API ${res.status}`);
          return;
        }
        const data = (await res.json()) as CalcJson;
        if (!aborted) setCalc(data);
      } catch (e: any) {
        if (!aborted) setErr(e?.message || "Network error");
      }
    })();
    return () => {
      aborted = true;
    };
  }, [slug]);

  if (err && !calc) {
    return (
      <div className="tl-dashboard px-6 py-8 text-sm text-[var(--muted,#9aa0a6)]">
        Failed to load on client: {String(err)}
      </div>
    );
  }

  if (!calc) {
    return (
      <div className="tl-dashboard px-6 py-8 text-sm text-[var(--muted,#9aa0a6)]">
        Loading…
      </div>
    );
  }

  const EditorShell = require("./EditorShell").default;
  return <EditorShell slug={calc.meta.slug} initialCalc={calc} />;
}