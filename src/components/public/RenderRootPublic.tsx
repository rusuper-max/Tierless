"use client";
import React from "react";
import { CalcJson, AnyBlock } from "@/types/blocks";
import PackagesBlockPublic from "./blocks/PackagesBlockPublic";
import ItemsBlockPublic from "./blocks/ItemsBlockPublic";
import OptionsBlockPublic from "./blocks/OptionsBlockPublic";
import ExtrasBlockPublic from "./blocks/ExtrasBlockPublic";

function renderBlock(b: AnyBlock) {
  switch (b.type) {
    case "packages": return <PackagesBlockPublic key={b.id} block={b} />;
    case "items":    return <ItemsBlockPublic    key={b.id} block={b} />;
    case "options":  return <OptionsBlockPublic  key={b.id} block={b} />;
    case "extras":   return <ExtrasBlockPublic   key={b.id} block={b} />;
    default:         return null;
  }
}

export default function RenderRootPublic({ calc }: { calc: CalcJson }) {
  const blocks = Array.isArray(calc?.blocks) ? (calc.blocks as AnyBlock[]) : [];

  // Fallback: ako nema blocks, pokušaj da sintetizuješ Packages blok iz root fields
  const effective = blocks.length
    ? blocks
    : (Array.isArray(calc?.packages) && calc!.packages!.length > 0
        ? [{
            id: "b_pkgs_fallback",
            type: "packages",
            title: "Packages",
            data: { packages: calc!.packages! }
          } as AnyBlock]
        : []);

  return <>{effective.map(renderBlock)}</>;
}