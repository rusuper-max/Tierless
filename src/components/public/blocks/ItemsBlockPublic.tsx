"use client";
import React from "react";
import { ItemsBlock } from "@/types/blocks";

export default function ItemsBlockPublic({ block }: { block: ItemsBlock }) {
  const data = block.data || { rows: [] };
  const rows = Array.isArray(data.rows) ? data.rows : [];
  if (rows.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">{block.title || "Items"}</h2>
      <div className="mt-3 space-y-2">
        {rows.map(r => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="font-medium">{r.label}</div>
            <div className="text-sm opacity-70">{r.price === null ? "Custom" : `€${r.price}`}</div>
          </div>
        ))}
      </div>
    </section>
  );
}