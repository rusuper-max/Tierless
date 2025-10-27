"use client";
import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import PublicRenderer from "@/components/PublicRenderer";

type PublicOk = { ok: true; data: any; attempts?: string[] };
type PublicErr = { ok: false; error: string; slug?: string; attempts?: string[] };
type PublicResponse = PublicOk | PublicErr;

export default function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const sp = useSearchParams();
  const owner = sp.get("u") || "";

  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<PublicErr | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(null); setData(null);
    const url = `/api/public/${encodeURIComponent(slug)}${owner ? `?u=${encodeURIComponent(owner)}` : ""}`;
    fetch(url, { cache: "no-store", credentials: "same-origin" })
      .then(r => r.json() as Promise<PublicResponse>)
      .then(j => { if (!alive) return; j.ok ? setData(j.data) : setErr(j as PublicErr); })
      .catch(() => { if (alive) setErr({ ok:false, error:"network_or_json" }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, owner]);

  if (loading) return <main className="container-page"><div className="text-sm text-neutral-500">Loading…</div></main>;
  if (err) return (
    <main className="container-page space-y-3">
      <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
        Failed to load public page: <b>{err.error}</b>{err.slug ? ` (slug: ${err.slug})` : null}
      </div>
      {Array.isArray(err.attempts) && <pre className="text-xs whitespace-pre-wrap">{err.attempts.join("\n")}</pre>}
    </main>
  );
  if (!data) return <main className="container-page"><div className="text-sm text-neutral-500">No data.</div></main>;

  return <main data-theme="tierless"><PublicRenderer data={data} /></main>;
}