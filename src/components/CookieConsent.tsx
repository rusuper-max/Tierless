"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getConsentStatus, setConsent, ConsentStatus } from "@/lib/consent";
import { useT } from "@/i18n/client";

export default function CookieConsent() {
  const t = useT();
  const [status, setStatus] = useState<ConsentStatus>("accepted"); // Default to accepted to prevent flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStatus(getConsentStatus());
  }, []);

  const handleAccept = () => {
    setConsent(true);
    setStatus("accepted");
  };

  const handleDecline = () => {
    setConsent(false);
    setStatus("declined");
  };

  // Don't show if not mounted, or if user already made a choice
  if (!mounted || status !== "pending") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl dark:border-slate-600 dark:bg-slate-800 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {t("cookies.banner.description")}{" "}
              <Link
                href="/cookies"
                className="font-semibold text-indigo-600 underline decoration-indigo-600/30 hover:decoration-indigo-600 dark:text-cyan-400 dark:decoration-cyan-400/30 dark:hover:decoration-cyan-400"
              >
                {t("cookies.banner.learnMore")}
              </Link>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              {t("cookies.banner.decline")}
            </button>
            <button
              onClick={handleAccept}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110"
            >
              {t("cookies.banner.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
