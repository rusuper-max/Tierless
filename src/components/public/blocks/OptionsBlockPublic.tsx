"use client";
import React from "react";
import { OptionsBlock } from "@/types/blocks";

export default function OptionsBlockPublic({ block }: { block: OptionsBlock }) {
  const data = block.data || { rows: [] };
  const rows = Array.isArray(data.rows) ? data.rows : [];
  if (rows.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">{block.title || "Options"}</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {rows.map(row => (
          <li key={row.id} className="flex items-center justify-between rounded border p-2">
            <span>{row.label}</span>
            {data.showPriceDelta && (
              <span className="opacity-70">
                {typeof row.delta === "number" && row.delta >= 0 ? `+€${row.delta}` :
                 typeof row.delta === "number" ? `-€${Math.abs(row.delta)}` : "—"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}