"use client";
import React from "react";
import { ExtrasBlock } from "@/types/blocks";

export default function ExtrasBlockPublic({ block }: { block: ExtrasBlock }) {
  const d = block.data || {};
  if (!d.title && !d.note) return null;

  return (
    <section className="mt-6">
      {d.title ? <h2 className="text-lg font-medium">{d.title}</h2> : null}
      {d.note ? <p className="mt-2 text-sm opacity-80" style={{ whiteSpace: "pre-line" }}>{d.note}</p> : null}
    </section>
  );
}