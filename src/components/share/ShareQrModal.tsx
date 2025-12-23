// src/components/share/ShareQrModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useT } from "@/i18n";
import { QrCode, Code, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";

type EmbedType = "iframe" | "widget";
type Theme = "auto" | "light" | "dark";
type Radius = "0" | "sm" | "md" | "lg" | "xl";
type Tab = "share" | "embed";

type Props = {
  open: boolean;
  url: string;
  onClose: () => void;
  loading?: boolean;
  // Embed props (optional - if not provided, embed tab won't show)
  pageId?: string;
  slug?: string;
  canEmbed?: boolean;
  onUpgrade?: () => void;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tierless.net";

export default function ShareQrModal({
  open,
  url,
  onClose,
  loading,
  pageId,
  slug,
  canEmbed = false,
  onUpgrade,
}: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("share");

  // Embed state
  const [embedCopied, setEmbedCopied] = useState(false);
  const [embedType, setEmbedType] = useState<EmbedType>("iframe");
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("600");
  const [theme, setTheme] = useState<Theme>("auto");
  const [showBadge, setShowBadge] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [radius, setRadius] = useState<Radius>("md");

  const showEmbedTab = !!pageId;

  const qrUrl = useMemo(() => {
    if (!url) return "";
    const encoded = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encoded}`;
  }, [url]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setEmbedCopied(false);
      setTab("share");
    }
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

  // Embed code generation
  const idOrSlug = slug || pageId || "";
  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (theme !== "auto") params.set("theme", theme);
    if (!showBadge) params.set("badge", "0");
    if (transparent) params.set("bg", "transparent");
    if (radius !== "md") params.set("radius", radius);
    const query = params.toString();
    return `${BASE_URL}/p/${idOrSlug}/embed${query ? `?${query}` : ""}`;
  }, [idOrSlug, theme, showBadge, transparent, radius]);

  const iframeCode = useMemo(() => {
    const radiusPx = radius === "0" ? "0" : radius === "sm" ? "8px" : radius === "md" ? "12px" : radius === "lg" ? "16px" : "24px";
    return `<iframe
  src="${embedUrl}"
  width="${width}"
  height="${height}"
  frameborder="0"
  style="border:none;border-radius:${radiusPx};"
  loading="lazy"
></iframe>`;
  }, [embedUrl, width, height, radius]);

  const widgetCode = useMemo(() => {
    return `<div id="tierless-${idOrSlug}"></div>
<script
  src="${BASE_URL}/embed.js"
  data-tierless-page="${idOrSlug}"
  data-tierless-container="tierless-${idOrSlug}"
  data-tierless-theme="${theme}"
  data-tierless-badge="${showBadge ? "1" : "0"}"
  data-tierless-bg="${transparent ? "transparent" : "inherit"}"
  data-tierless-radius="${radius}"
  async
></script>`;
  }, [idOrSlug, theme, showBadge, transparent, radius]);

  const embedCode = embedType === "iframe" ? iframeCode : widgetCode;

  const handleCopyEmbed = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(embedCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = embedCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      setEmbedCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative z-[121] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 shadow-2xl ${tab === "embed" ? "max-w-2xl" : "max-w-sm"}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
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

        {/* Tabs */}
        {showEmbedTab && (
          <div className="flex gap-1 p-1 mb-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setTab("share")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                tab === "share"
                  ? "bg-[var(--card)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              {t("Share & QR")}
            </button>
            <button
              type="button"
              onClick={() => setTab("embed")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                tab === "embed"
                  ? "bg-[var(--card)] text-[var(--text)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              {t("Embed")}
              {!canEmbed && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-400 font-medium">
                  Growth+
                </span>
              )}
            </button>
          </div>
        )}

        {/* Share Tab Content */}
        {tab === "share" && (
          <>
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
          </>
        )}

        {/* Embed Tab Content */}
        {tab === "embed" && (
          <>
            {!canEmbed ? (
              /* Upsell for non-Growth+ users */
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                  <Code className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  {t("Code Embed")}
                </h3>
                <p className="text-sm text-[var(--muted)] mb-5 max-w-xs">
                  {t("Embed your price list on any website. Available on Growth plan and above.")}
                </p>
                <button
                  type="button"
                  onClick={onUpgrade}
                  className="px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 transition-all cursor-pointer"
                >
                  {t("Upgrade to Growth")}
                </button>
              </div>
            ) : (
              <>
                {/* Embed Type Tabs */}
                <div className="flex gap-1 p-1 mb-4 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
                  {(["iframe", "widget"] as EmbedType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEmbedType(type)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        embedType === type
                          ? "bg-[var(--card)] text-[var(--text)] shadow-sm"
                          : "text-[var(--muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {type === "iframe" ? "iframe" : t("JavaScript Widget")}
                    </button>
                  ))}
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
                      {t("Width")}
                    </label>
                    <input
                      type="text"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="100% or 600px"
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--muted)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
                      {t("Height")}
                    </label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="600 or auto"
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] placeholder-[var(--muted)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
                      {t("Theme")}
                    </label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as Theme)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] cursor-pointer"
                    >
                      <option value="auto">{t("Auto")}</option>
                      <option value="light">{t("Light")}</option>
                      <option value="dark">{t("Dark")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
                      {t("Radius")}
                    </label>
                    <select
                      value={radius}
                      onChange={(e) => setRadius(e.target.value as Radius)}
                      className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] cursor-pointer"
                    >
                      <option value="0">{t("None")}</option>
                      <option value="sm">{t("Small")}</option>
                      <option value="md">{t("Medium")}</option>
                      <option value="lg">{t("Large")}</option>
                      <option value="xl">{t("XL")}</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={transparent}
                        onChange={(e) => setTransparent(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] text-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text)]">{t("Transparent")}</span>
                    </label>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={showBadge}
                        onChange={(e) => setShowBadge(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] text-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs text-[var(--text)]">{t("Show badge")}</span>
                    </label>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="relative">
                  <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
                    {t("Code")}
                  </label>
                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-40">
                      {embedCode}
                    </pre>
                    <button
                      type="button"
                      onClick={handleCopyEmbed}
                      className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600"
                    >
                      {embedCopied ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          {t("Copied!")}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          {t("Copy")}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview Link */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-[var(--muted)]">
                    {embedType === "iframe"
                      ? t("Paste in your HTML where you want the embed.")
                      : t("Auto-resizes to fit content.")}
                  </p>
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {t("Preview")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
