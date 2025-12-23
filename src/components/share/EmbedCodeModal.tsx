// src/components/share/EmbedCodeModal.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useT } from "@/i18n";
import { Code, Copy, Check, X, ExternalLink, AlertCircle } from "lucide-react";

type EmbedType = "iframe" | "widget";
type Theme = "auto" | "light" | "dark";
type Radius = "0" | "sm" | "md" | "lg" | "xl";

type Props = {
  open: boolean;
  onClose: () => void;
  pageId: string;
  slug?: string;
  canEmbed: boolean;
  onUpgrade?: () => void;
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tierless.net";

export default function EmbedCodeModal({
  open,
  onClose,
  pageId,
  slug,
  canEmbed,
  onUpgrade,
}: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<EmbedType>("iframe");

  // Options
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("600");
  const [theme, setTheme] = useState<Theme>("auto");
  const [showBadge, setShowBadge] = useState(true);
  const [transparent, setTransparent] = useState(false);
  const [radius, setRadius] = useState<Radius>("md");

  // Reset copied state when modal closes
  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const idOrSlug = slug || pageId;
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
    const widthAttr = width.includes("%") ? `width="${width}"` : `width="${width}"`;
    const heightAttr = height === "auto" ? `height="600"` : `height="${height}"`;
    return `<iframe
  src="${embedUrl}"
  ${widthAttr}
  ${heightAttr}
  frameborder="0"
  style="border:none;border-radius:${radius === "0" ? "0" : radius === "sm" ? "8px" : radius === "md" ? "12px" : radius === "lg" ? "16px" : "24px"};"
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

  const code = embedType === "iframe" ? iframeCode : widgetCode;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!open) return null;

  // Upsell for non-Growth+ users
  if (!canEmbed) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-[121] w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-[var(--muted)] hover:bg-[var(--surface)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
              <Code className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text)] mb-2">
              {t("Code Embed")}
            </h2>
            <p className="text-sm text-[var(--muted)] mb-5">
              {t("Embed your price list on any website. Available on Growth plan and above.")}
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 transition-all cursor-pointer"
            >
              {t("Upgrade to Growth")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[121] w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
              <Code className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">
                {t("Embed Code")}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {t("Add your price list to any website")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--muted)] hover:bg-[var(--surface)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
          {/* Width */}
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

          {/* Height */}
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

          {/* Theme */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
              {t("Theme")}
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className="w-full px-2.5 py-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] cursor-pointer"
            >
              <option value="auto">{t("Auto (use page setting)")}</option>
              <option value="light">{t("Light")}</option>
              <option value="dark">{t("Dark")}</option>
            </select>
          </div>

          {/* Radius */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
              {t("Border Radius")}
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
              <option value="xl">{t("Extra Large")}</option>
            </select>
          </div>

          {/* Transparent BG */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
              />
              <span className="text-xs text-[var(--text)]">
                {t("Transparent BG")}
              </span>
            </label>
          </div>

          {/* Show Badge */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={showBadge}
                onChange={(e) => setShowBadge(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
              />
              <span className="text-xs text-[var(--text)]">
                {t("Show badge")}
              </span>
            </label>
          </div>
        </div>

        {/* Code Preview */}
        <div className="relative">
          <label className="block text-[10px] uppercase tracking-wide text-[var(--muted)] mb-1.5">
            {t("Code")}
          </label>
          <div className="relative">
            <pre className="p-3 sm:p-4 rounded-lg bg-slate-900 border border-slate-700 text-[11px] sm:text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {code}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-medium rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-600"
            >
              {copied ? (
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

        {/* Info */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
          <AlertCircle className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {embedType === "iframe"
              ? t("Paste this code in your website's HTML where you want the embed to appear. The iframe will auto-resize to fit the content.")
              : t("The JavaScript widget loads asynchronously and auto-resizes. It's recommended for most use cases.")}
          </p>
        </div>

        {/* Preview Link */}
        <div className="mt-3 flex justify-end">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {t("Preview embed")}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
