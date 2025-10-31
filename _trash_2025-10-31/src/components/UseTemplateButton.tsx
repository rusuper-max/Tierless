"use client";

import { useState } from "react";

type Props = {
  slug: string;       // template slug
  name?: string;      // opcionalno ime novog kalkulatora
  className?: string;
  children?: React.ReactNode;
};

export default function UseTemplateButton({ slug, name, className, children }: Props) {
  const [loading, setLoading] = useState(false);

  async function useTemplate(tplSlug: string, name?: string) {
    const res = await fetch("/api/calculators", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ template: tplSlug, name }), // ili { templateSlug: tplSlug }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`create_failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as { ok: boolean; slug: string };
    if (!data?.slug) throw new Error("no_slug");
    window.location.href = `/editor/${data.slug}`;
  }

  return (
    <button
      onClick={async () => {
        try {
          setLoading(true);
          await useTemplate(slug, name);
        } catch (e) {
          console.error(e);
          alert("Create from template failed.");
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className={className ?? "rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"}
    >
      {loading ? "Creating…" : (children ?? "Use this template")}
    </button>
  );
}