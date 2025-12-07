// src/components/share/ShareQrModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n";

type Props = {
  open: boolean;
  url: string;
  onClose: () => void;
  loading?: boolean;
};

export default function ShareQrModal({ open, url, onClose, loading }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const qrUrl = useMemo(() => {
    if (!url) return "";
    const encoded = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}`;
  }, [url]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    if (!url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "tierless-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!qrUrl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR code</title>
  <style>
    body { margin: 0; padding: 24px; display:flex; align-items:center; justify-content:center; }
    img { max-width:100%; height:auto; }
  </style>
</head>
<body>
  <img id="qr-print-image" src="${qrUrl}" alt="QR code" />
</body>
</html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
    const triggerPrint = () => {
      try {
        w.focus();
        w.print();
      } catch {
        // ignored
      }
    };
    const img = w.document.getElementById("qr-print-image") as HTMLImageElement | null;
    if (img) {
      if (img.complete) {
        triggerPrint();
      } else {
        const onReady = () => {
          img.removeEventListener("load", onReady);
          img.removeEventListener("error", onReady);
          triggerPrint();
        };
        img.addEventListener("load", onReady);
        img.addEventListener("error", onReady);
      }
    } else {
      triggerPrint();
    }
    w.onafterprint = () => {
      try {
        w.close();
      } catch {}
    };
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[121] w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-2xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm sm:text-base font-semibold text-[var(--text)]">
            {t("Share this page")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-[var(--muted)] hover:bg-[var(--surface)] cursor-pointer"
          >
            {t("Close")}
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {t("Public link")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={url}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1.5 text-xs sm:text-[13px] text-[var(--text)]"
                placeholder={loading ? t("Generating…") : ""}
              />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!url}
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copied ? t("Copied") : t("Copy")}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
              {t("QR code")}
            </label>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
              {loading ? (
                <div className="h-40 w-40 sm:h-44 sm:w-44 rounded-lg bg-[var(--surface)] animate-pulse" />
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt={t("QR code for this page")}
                  className="h-40 w-40 sm:h-44 sm:w-44 rounded-lg bg-white"
                />
              ) : (
                <div className="text-xs text-[var(--muted)]">
                  {t("Unable to generate QR code.")}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!qrUrl || loading}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Download QR")}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!qrUrl || loading}
                  className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] sm:text-xs text-[var(--text)] hover:bg-[var(--surface)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Print")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {t(
            "You can put this QR code on tables, windows or cards. When customers scan it, they will open this public page."
          )}
        </p>
      </div>
    </div>
  );
}
