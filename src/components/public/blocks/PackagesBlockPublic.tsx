"use client";
import React from "react";
import { PackagesBlock } from "@/types/blocks";

export default function PackagesBlockPublic({ block }: { block: PackagesBlock }) {
  const data = block.data || { packages: [] };
  const pkgs = Array.isArray(data.packages) ? data.packages : [];
  if (pkgs.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-lg font-medium">{block.title || "Packages"}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pkgs.map(p => (
          <div key={p.id} className="rounded-xl border border-[color:var(--border,#e5e7eb)] bg-[color:var(--card,white)] p-4">
            <div className="flex items-baseline justify-between gap-4">
              <div className="font-medium">{p.label || p.id}</div>
              <div className="text-sm opacity-70">
                {p.basePrice === null ? "Custom" : `€${p.basePrice}`}
              </div>
            </div>
            {p.description ? (
              <p className="mt-1 text-sm opacity-70" style={{ whiteSpace: "pre-line" }}>{p.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}