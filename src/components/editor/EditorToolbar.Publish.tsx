// src/components/editor/EditorToolbar.Publish.tsx
"use client";

import { useMemo } from "react";
import type { UsageNeeds } from "@/lib/entitlements";
import PublishGuardButton from "@/components/publish/PublishGuardButton";

type Props = {
  itemCount: number;
  pageCount?: number;
  tiersPerPage?: number;
  maxPublicPages?: number;
  deeplinkInterval?: "monthly" | "yearly";
};

export default function EditorToolbarPublish({
  itemCount,
  pageCount = 1,
  tiersPerPage = 3,
  maxPublicPages = 0,
  deeplinkInterval = "yearly",
}: Props) {
  const needs: UsageNeeds = useMemo(
    () => ({
      items: itemCount,
      pages: pageCount,
      tiersPerPage,
      maxPublicPages,
    }),
    [itemCount, pageCount, tiersPerPage, maxPublicPages]
  );

  async function doPublish() {
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ needs }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Publish blocked");
    }
    // TODO: ovde ide tvoj stvarni publish (DB render, cache bust, webhooks...)
  }

  return (
    <div className="flex items-center gap-3">
      <PublishGuardButton
        needs={needs}
        onPublish={doPublish}
        deeplinkInterval={deeplinkInterval}
        label="Publish"
      />
    </div>
  );
}