"use client";

import { useState } from "react";

export default function DuplicateButton({
  slug,
  name,
  className,
  onDone,
}: {
  slug: string;
  name: string;
  className?: string;
  onDone?: (newSlug: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      className={className ?? "rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"}
      disabled={busy}
      onClick={async () => {
        try {
          setBusy(true);
          const res = await fetch("/api/calculators", {
            method: "POST",
            credentials: "same-origin",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ from: slug, name: `Copy of ${name}` }),
          });
          if (!res.ok) throw new Error(`duplicate failed (${res.status})`);
          const json = (await res.json()) as { slug?: string };
          if (!json.slug) throw new Error("no new slug");
          if (onDone) onDone(json.slug);
          else window.location.href = `/editor/${json.slug}`;
        } catch (e) {
          console.error(e);
          alert("Duplicate failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Duplicating…" : "Duplicate"}
    </button>
  );
}