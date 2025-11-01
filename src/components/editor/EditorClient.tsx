// src/components/editor/EditorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import EditorToolbarPublish from "@/components/editor/EditorToolbar.Publish";
import Toaster from "@/components/toast/Toaster";
import Link from "next/link";

type Props = { slug: string; guest?: boolean };

// Minimalni model – zameni realnim editor state-om/fetch-om
type DraftDoc = {
  items: number;
  tiers: number;
  pages: number;
  publicPages: number;
};

export default function EditorClient({ slug, guest = false }: Props) {
  const [doc, setDoc] = useState<DraftDoc | null>(null);

  useEffect(() => {
    // TODO: zameni realnim izvorom (fetch/store)
    const mock: DraftDoc = { items: 24, tiers: 3, pages: 1, publicPages: 0 };
    setDoc(mock);
  }, [slug]);

  const itemCount = doc?.items ?? 0;
  const tiersPerPage = doc?.tiers ?? 0;
  const pageCount = doc?.pages ?? 1;
  const maxPublicPages = doc?.publicPages ?? 0;

  const title = useMemo(() => `Editor — ${slug}`, [slug]);

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1 className="text-sm sm:text-base font-semibold tracking-tight flex items-center gap-2">
            {title}
            {guest && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-slate-700"
                    style={{ background: "#f8fafc", borderColor: "rgba(15,23,42,0.08)" }}>
                Guest mode
              </span>
            )}
          </h1>

          <div className="flex items-center gap-3">
            <EditorToolbarPublish
              itemCount={itemCount}
              pageCount={pageCount}
              tiersPerPage={tiersPerPage}
              maxPublicPages={maxPublicPages}
              deeplinkInterval="yearly"
            />
          </div>
        </div>
      </header>

      {/* Informativni bar u guest modu */}
      {guest && (
        <div className="border-b bg-slate-50/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-700">
              You are editing as a guest. Some options are locked and will prompt an upgrade.
            </p>
            <Link
              href="/signup"
              className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:-translate-y-[1px]"
              style={{
                background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                border: "2px solid transparent",
                color: "#0f172a",
              }}
            >
              Create account
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="rounded-2xl border p-4">
          <p className="text-sm text-slate-700"><span className="font-medium">Slug:</span> {slug}</p>
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-medium">Items:</span> {itemCount} ·{" "}
            <span className="font-medium">Tiers:</span> {tiersPerPage} ·{" "}
            <span className="font-medium">Pages:</span> {pageCount} ·{" "}
            <span className="font-medium">Public pages:</span> {maxPublicPages}
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Ove brojke su mock za wiring. Zameni realnim selektorima/računom iz editora.
          </p>
        </div>
      </main>

      {/* Jedan Toaster za ceo editor */}
      <Toaster />
    </div>
  );
}