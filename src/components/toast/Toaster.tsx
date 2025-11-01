// src/components/toast/Toaster.tsx
"use client";

import { useEffect, useState } from "react";
import { useToastState, dismissToast, type ToastItem } from "@/hooks/useToast";

export default function Toaster() {
  const toasts = useToastState();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
      role="status"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const border =
    item.variant === "success" ? "border-emerald-500/40" :
    item.variant === "error" ? "border-red-500/40" :
    "border-sky-500/40";

  const dot =
    item.variant === "success" ? "bg-emerald-500" :
    item.variant === "error" ? "bg-red-500" :
    "bg-sky-500";

  return (
    <div
      className={[
        "pointer-events-auto rounded-xl border bg-white p-3 shadow-lg",
        "backdrop-blur-[2px] transition-all duration-200",
        "data-[enter=true]:translate-y-0 data-[enter=true]:opacity-100",
        "data-[enter=false]:translate-y-2 data-[enter=false]:opacity-0",
        border,
      ].join(" ")}
      data-enter
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1 inline-block size-2 rounded-full ${dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{item.title}</p>
          {item.description ? (
            <p className="mt-0.5 text-xs text-slate-600">{item.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => dismissToast(item.id)}
          className="ml-1 inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}