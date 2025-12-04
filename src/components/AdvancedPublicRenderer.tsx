// src/components/AdvancedPublicRenderer.tsx
// Renamed from "Advanced" to "Tier Based Editor" for clarity
"use client";

import React, { useMemo, useState, useEffect, type CSSProperties } from "react";
import { Sparkles, ArrowRight, Check, Star, MessageCircle, Send, Mail } from "lucide-react";
import type { CalcJson } from "@/hooks/useEditorStore";
import { t } from "@/i18n";
import { useTheme } from "@/hooks/useTheme";
import { isTemplateLocked, getLockedStyle, type LockedStyle } from "@/data/calcTemplates";

/* -------------------------------------------------------------------------- */
/* Rating Widget for Tier-Based Pages                                         */
/* -------------------------------------------------------------------------- */
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function RatingWidget({
  pageId,
  initialAvg,
  initialCount,
  initialUserScore,
  allowRating,
  isDark
}: {
  pageId: string;
  initialAvg: number;
  initialCount: number;
  initialUserScore: number;
  allowRating: boolean;
  isDark: boolean;
}) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [userScore, setUserScore] = useState(initialUserScore);
  const [hoverScore, setHoverScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!allowRating) return;
    fetch(`/api/rating/status?pageId=${pageId}`)
      .then(res => res.json())
      .then(data => {
        if (data.avg !== undefined) {
          setAvg(data.avg);
          setCount(data.count);
          setUserScore(data.userScore);
        }
      })
      .catch(console.error);
  }, [pageId, allowRating]);

  if (!allowRating) return null;

  const handleRate = async (score: number) => {
    if (loading) return;

    const prevUserScore = userScore;
    const prevAvg = avg;
    const prevCount = count;

    setUserScore(score);
    let newTotal = prevAvg * prevCount;
    let newCount = prevCount;

    if (prevUserScore > 0) {
      newTotal -= prevUserScore;
    } else {
      newCount += 1;
    }
    newTotal += score;
    const newAvg = newCount > 0 ? newTotal / newCount : 0;

    setAvg(newAvg);
    setCount(newCount);
    setLoading(true);

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, score }),
      });
      const data = await res.json();
      if (data.ok) {
        setAvg(data.avg);
        setCount(data.count);
        setUserScore(data.userScore);
      } else {
        setUserScore(prevUserScore);
        setAvg(prevAvg);
        setCount(prevCount);
      }
    } catch {
      setUserScore(prevUserScore);
      setAvg(prevAvg);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-0.5 px-3 py-1.5 rounded-full border transition-colors"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHoverScore(star)}
            onMouseLeave={() => setHoverScore(0)}
            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
            title={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                "w-4 h-4 transition-colors",
                (hoverScore || userScore) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : isDark ? "text-white/30 fill-transparent" : "text-slate-300 fill-transparent"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-xs font-medium flex flex-col leading-tight" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1">
          <span style={{ color: "var(--text)" }} className="font-bold">{avg.toFixed(1)}</span>
          <span className="opacity-60">({count})</span>
        </span>
        {userScore > 0 && <span className="text-[10px] opacity-70">Your rating: {userScore}</span>}
      </div>
    </div>
  );
}

import {
  BRAND_GRADIENT,
  type AdvancedNode,
  type AdvancedLayoutVariant,
  type AdvancedSummaryPosition,
  type AdvancedPublicMeta,
  type AdvancedTheme,
  type BillingPeriod,
  type SliderColorMode,
} from "@/app/editor/[id]/panels/advanced/types";

import { TierCard, getTierEffectivePrice } from "./scrolly/blocks/TierCard";
import { AddonCard, getAddonEffectivePrice } from "./scrolly/blocks/AddonCard";
import { SliderBlock } from "./scrolly/blocks/SliderBlock";
import ShinyButton from "@/components/marketing/ShinyButton";

type CurrencyPosition = "prefix" | "suffix";

function useCurrencyFormat(calc?: CalcJson) {
  const cur = calc?.i18n?.currency ?? "€";
  const decimalsConf =
    typeof calc?.i18n?.decimals === "number" &&
      Number.isFinite(calc.i18n.decimals)
      ? (calc!.i18n!.decimals as number)
      : 0;

  const position: CurrencyPosition =
    (calc?.i18n as any)?.currencyPosition === "suffix" ? "suffix" : "prefix";

  const space = (calc?.i18n as any)?.currencySpace === false ? "" : " ";

  const formatPrice = (
    val: number | null | undefined,
    opts?: {
      billing?: BillingPeriod | null;
      unitLabel?: string | null;
    }
  ) => {
    if (val === null || typeof val !== "number" || Number.isNaN(val)) {
      return "";
    }

    const abs = Math.abs(val);
    const hasFraction = Math.round(abs) !== abs;

    const usedDecimals =
      decimalsConf && decimalsConf > 0 ? decimalsConf : hasFraction ? 2 : 0;

    const factor = Math.pow(10, usedDecimals);
    const norm = Math.round(val * factor) / factor;
    const numberStr = norm.toFixed(usedDecimals);

    let base =
      position === "prefix"
        ? `${cur}${space}${numberStr}`
        : `${numberStr}${space}${cur}`;

    let suffix = "";
    if (opts?.billing === "month") suffix = "/month";
    else if (opts?.billing === "year") suffix = "/year";

    if (opts?.unitLabel) {
      suffix = suffix ? `${suffix} · ${opts.unitLabel}` : opts.unitLabel;
    }

    return suffix ? `${base} ${suffix}` : base;
  };

  return { formatPrice };
}

/* -------------------------------------------------------------------------- */
/* Main renderer                                                              */
/* -------------------------------------------------------------------------- */

export default function AdvancedPublicRenderer({ calc }: { calc: CalcJson }) {
  // Get site-wide theme instead of page theme
  // Use mounted to prevent hydration mismatch (server renders light, client might have dark)
  const { theme: siteTheme, mounted } = useTheme();

  const metaRaw = (calc.meta || {}) as AdvancedPublicMeta & {
    advancedNodes?: AdvancedNode[];
    advancedLayoutVariant?: any;
    advancedColumnsDesktop?: number;
    advancedShowSummary?: boolean;
    advancedSummaryPosition?: any;
    advancedShowInquiry?: boolean;
    advancedPublicTitle?: string;
    advancedPublicSubtitle?: string;
    advancedSupportNote?: string;
    publicTheme?: string;
    templateLocked?: boolean;
    templateStyleId?: string;
  };

  // 🔒 Check for locked template style
  const hasLockedTemplate = isTemplateLocked(metaRaw);
  const lockedStyle: LockedStyle | null = hasLockedTemplate ? getLockedStyle(metaRaw) : null;

  const { formatPrice } = useCurrencyFormat(calc);

  const nodes: AdvancedNode[] = Array.isArray(metaRaw.advancedNodes)
    ? (metaRaw.advancedNodes as AdvancedNode[])
    : [];

  const tierNodes = useMemo(
    () => nodes.filter((n) => n.kind === "tier"),
    [nodes]
  );
  const addonNodes = useMemo(
    () => nodes.filter((n) => n.kind === "addon"),
    [nodes]
  );
  const itemNodes = useMemo(
    () => nodes.filter((n) => n.kind === "item"),
    [nodes]
  );
  const sliderNodes = useMemo(
    () => nodes.filter((n) => n.kind === "slider"),
    [nodes]
  );

  const advancedColumnsDesktop: number =
    typeof metaRaw.columnsDesktop === "number"
      ? metaRaw.columnsDesktop
      : typeof metaRaw.advancedColumnsDesktop === "number"
        ? metaRaw.advancedColumnsDesktop
        : 3;

  const advancedShowSummary: boolean =
    (metaRaw.showSummary as boolean | undefined) ??
    (metaRaw.advancedShowSummary as boolean | undefined) ??
    true;

  const advancedShowInquiry: boolean =
    (metaRaw.showInquiry as boolean | undefined) ??
    (metaRaw.advancedShowInquiry as boolean | undefined) ??
    true;

  const title =
    typeof metaRaw.publicTitle === "string"
      ? metaRaw.publicTitle.trim()
      : typeof metaRaw.advancedPublicTitle === "string"
        ? metaRaw.advancedPublicTitle.trim()
        : "";

  const publicName =
    typeof metaRaw.publicName === "string"
      ? metaRaw.publicName.trim()
      : "";

  const description =
    typeof metaRaw.publicDescription === "string"
      ? metaRaw.publicDescription.trim()
      : typeof metaRaw.publicSubtitle === "string"
        ? metaRaw.publicSubtitle.trim()
        : typeof metaRaw.advancedPublicSubtitle === "string"
          ? metaRaw.advancedPublicSubtitle.trim()
          : "";

  const supportNote =
    typeof metaRaw.supportNote === "string"
      ? metaRaw.supportNote.trim()
      : typeof metaRaw.advancedSupportNote === "string"
        ? metaRaw.advancedSupportNote.trim()
        : "";

  // Use Page Theme from editor settings, NOT navbar theme
  // Fall back to navbar theme only if not set in editor
  const editorPublicTheme = metaRaw.publicTheme as string | undefined;
  const publicTheme: AdvancedTheme =
    editorPublicTheme === "dark" ? "dark" :
      editorPublicTheme === "tierless" ? "tierless" :
        editorPublicTheme === "light" ? "light" :
          // Fallback to navbar theme if not set
          (mounted && siteTheme === "dark") ? "dark" : "light";

  // isDark is derived from publicTheme for backwards compatibility
  const isDark = publicTheme === "dark" || publicTheme === "tierless";

  // Font customization
  const publicFont = (metaRaw as any).publicFont || "sans";
  const fontClass = publicFont === "serif" ? "font-serif" : publicFont === "mono" ? "font-mono" : "font-sans";

  const showPoweredBy: boolean =
    (metaRaw as any).showPoweredBy ?? true;

  const allowRating: boolean = (metaRaw as any).allowRating ?? false;
  const pageId: string = (metaRaw as any).slug || calc?.id || "unknown";
  const avgRating: number = (metaRaw as any).avgRating || 0;
  const ratingsCount: number = (metaRaw as any).ratingsCount || 0;

  // Contact info for inquiry (same logic as PublicRenderer)
  const rawContact = ((metaRaw as any)?.contact || (metaRaw as any)?.contactOverride || {}) as any;
  const contact = { ...rawContact };
  if (rawContact.value && rawContact.type) {
    if (rawContact.type === 'whatsapp') contact.whatsapp = rawContact.value;
    if (rawContact.type === 'telegram') contact.telegram = rawContact.value;
    if (rawContact.type === 'email') contact.email = rawContact.value;
  }
  const contactEmail = (contact.email || "").trim();
  const contactWhatsapp = (contact.whatsapp || "").replace(/[^\d]/g, "");
  const contactTelegram = (contact.telegram || "").replace(/^@/, "");

  const resolvedContactType = (() => {
    const normalized = (contact.type || "").toLowerCase();
    if (normalized === "whatsapp" && contactWhatsapp) return "whatsapp";
    if (normalized === "telegram" && contactTelegram) return "telegram";
    if (normalized === "email" && contactEmail) return "email";
    if (contactWhatsapp) return "whatsapp";
    if (contactTelegram) return "telegram";
    if (contactEmail) return "email";
    return "";
  })();

  const enableYearly: boolean = metaRaw.enableYearly ?? false;

  const defaultBillingPeriod: BillingPeriod =
    metaRaw.defaultBillingPeriod ?? "month";

  const yearlyDiscountPercent: number | null =
    typeof metaRaw.yearlyDiscountPercent === "number"
      ? metaRaw.yearlyDiscountPercent
      : null;

  const sliderColorMode: SliderColorMode =
    (metaRaw.sliderColorMode as SliderColorMode) ?? "brand";

  const sliderSolidColor: string | null =
    metaRaw.sliderSolidColor ?? null;

  // Branding & Media
  const logoUrl: string | null = (metaRaw as any).logoUrl ?? null;
  const heroImageUrl: string | null = (metaRaw as any).heroImageUrl ?? null;
  const backgroundImageUrl: string | null = (metaRaw as any).backgroundImageUrl ?? null;
  const portfolioUrl: string | null = (metaRaw as any).portfolioUrl ?? null;

  // 🔥 Custom Animations - Special effects for premium templates
  const customAnimations: string | null = (metaRaw as any).customAnimations ?? lockedStyle?.animations ?? null;
  const isNeonTemplate = customAnimations === "neon";

  const hasAnyBlocks =
    tierNodes.length > 0 ||
    addonNodes.length > 0 ||
    itemNodes.length > 0 ||
    sliderNodes.length > 0;

  const [selectedTierId, setSelectedTierId] = useState<string | null>(() => {
    if (tierNodes.length === 0) return null;
    const featured = tierNodes.find((t) => t.emphasis === "featured");
    return (featured || tierNodes[0]).id;
  });

  useEffect(() => {
    if (!tierNodes.length) {
      setSelectedTierId(null);
      return;
    }
    if (!selectedTierId || !tierNodes.some((t) => t.id === selectedTierId)) {
      const featured = tierNodes.find((t) => t.emphasis === "featured");
      setSelectedTierId((featured || tierNodes[0]).id);
    }
  }, [tierNodes, selectedTierId]);

  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    () => new Set()
  );

  const [billingMode, setBillingMode] = useState<BillingPeriod>(
    enableYearly ? defaultBillingPeriod : "month"
  );

  useEffect(() => {
    if (!enableYearly && billingMode !== "month") {
      setBillingMode("month");
    }
  }, [enableYearly, billingMode]);

  const [sliderValues, setSliderValues] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      sliderNodes.forEach((s) => {
        const min = typeof s.min === "number" ? s.min : 0;
        initial[s.id] = min;
      });
      return initial;
    }
  );

  useEffect(() => {
    setSliderValues((prev) => {
      const next: Record<string, number> = { ...prev };
      sliderNodes.forEach((s) => {
        if (!(s.id in next)) {
          const min = typeof s.min === "number" ? s.min : 0;
          next[s.id] = min;
        }
      });
      return next;
    });
  }, [sliderNodes]);

  const selectedTier =
    tierNodes.find((t) => t.id === selectedTierId) ?? null;

  const toggleAddon = (id: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const total = useMemo(() => {
    let sum = 0;

    if (selectedTier && typeof selectedTier.price === "number") {
      const { price } = getTierEffectivePrice(
        selectedTier,
        billingMode,
        enableYearly,
        yearlyDiscountPercent
      );
      if (typeof price === "number" && selectedTier.includeInTotal !== false) {
        sum += price;
      }
    }

    selectedAddonIds.forEach((id) => {
      const addon = addonNodes.find((a) => a.id === id);
      if (!addon || typeof addon.price !== "number") return;
      if (addon.includeInTotal === false) return;

      const { price } = getAddonEffectivePrice(
        addon,
        billingMode,
        enableYearly,
        yearlyDiscountPercent
      );
      if (typeof price === "number") {
        sum += price;
      }
    });

    sliderNodes.forEach((s) => {
      if (typeof s.pricePerStep !== "number") return;
      if (s.includeInTotal === false) return;
      const val = sliderValues[s.id] ?? (typeof s.min === "number" ? s.min : 0);
      sum += val * s.pricePerStep;
    });

    return sum;
  }, [
    selectedTier,
    addonNodes,
    selectedAddonIds,
    sliderNodes,
    sliderValues,
    billingMode,
    enableYearly,
    yearlyDiscountPercent,
  ]);

  // Build inquiry message
  const buildInquiryMessage = () => {
    const lines: string[] = [];
    lines.push(`📋 *${t("Price Inquiry")}*`);
    if (title) lines.push(`📄 ${title}`);
    lines.push("");

    if (selectedTier) {
      lines.push(`🎯 *${t("Selected Package")}:* ${selectedTier.label || "Package"}`);
      const { price } = getTierEffectivePrice(selectedTier, billingMode, enableYearly, yearlyDiscountPercent);
      if (typeof price === "number") {
        lines.push(`   ${formatPrice(price)}`);
      }
    }

    const selectedAddons = addonNodes.filter(a => selectedAddonIds.has(a.id));
    if (selectedAddons.length > 0) {
      lines.push("");
      lines.push(`➕ *${t("Add-ons")}:*`);
      selectedAddons.forEach(addon => {
        const { price } = getAddonEffectivePrice(addon, billingMode, enableYearly, yearlyDiscountPercent);
        lines.push(`   • ${addon.label || "Addon"}: ${formatPrice(price)}`);
      });
    }

    const activeSliders = sliderNodes.filter(s => (sliderValues[s.id] ?? s.min ?? 0) > 0);
    if (activeSliders.length > 0) {
      lines.push("");
      lines.push(`📊 *${t("Selections")}:*`);
      activeSliders.forEach(s => {
        const val = sliderValues[s.id] ?? s.min ?? 0;
        const price = val * (s.pricePerStep || 0);
        lines.push(`   • ${s.label || "Option"}: ${val} ${s.unit || ""} (${formatPrice(price)})`);
      });
    }

    lines.push("");
    lines.push(`💰 *${t("Total Estimate")}:* ${formatPrice(total)}`);
    lines.push("");
    lines.push(`---`);
    lines.push(t("Sent via Tierless"));

    return lines.join("\n");
  };

  const handleInquiry = () => {
    if (!resolvedContactType) {
      alert(t("Contact method is not configured yet."));
      return;
    }

    const message = buildInquiryMessage();
    const encodedMessage = encodeURIComponent(message);

    switch (resolvedContactType) {
      case "whatsapp":
        window.open(`https://wa.me/${contactWhatsapp}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
        break;
      case "telegram":
        window.open(`https://t.me/${contactTelegram}?text=${encodedMessage}`, "_blank", "noopener,noreferrer");
        break;
      case "email":
        const subject = encodeURIComponent(title || t("Price Inquiry"));
        window.open(`mailto:${contactEmail}?subject=${subject}&body=${encodedMessage}`, "_blank");
        break;
    }
  };

  // Button styling based on contact type
  const getInquiryButtonStyle = () => {
    switch (resolvedContactType) {
      case "whatsapp":
        return {
          background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
          text: t("WhatsApp"),
        };
      case "telegram":
        return {
          background: "linear-gradient(135deg, #0088cc 0%, #005f8f 100%)",
          text: t("Telegram"),
        };
      case "email":
        return {
          background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
          text: t("Email"),
        };
      default:
        return {
          background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
          text: t("Send inquiry"),
        };
    }
  };

  const inquiryButtonStyle = getInquiryButtonStyle();

  if (!nodes.length) {
    return (
      <div className="text-sm text-[var(--muted)]">
        {t("This tier-based page does not have any blocks yet.")}
      </div>
    );
  }

  // Theme variables based on site-wide theme OR locked template style
  const themeVars: CSSProperties = lockedStyle
    ? {
      // 🔒 LOCKED TEMPLATE STYLES - User cannot change these
      ["--bg" as any]: lockedStyle.backgroundColor,
      ["--card" as any]: lockedStyle.cardStyle === "glass"
        ? "rgba(17, 17, 27, 0.85)"
        : lockedStyle.theme === "dark" ? "#18181b" : "#ffffff",
      ["--border" as any]: lockedStyle.theme === "dark"
        ? "rgba(253, 186, 116, 0.15)"
        : "rgba(0, 0, 0, 0.06)",
      ["--text" as any]: lockedStyle.theme === "dark" ? "#f5f5f4" : "#0f172a",
      ["--muted" as any]: lockedStyle.theme === "dark" ? "#a8a29e" : "#64748b",
      ["--surface" as any]: lockedStyle.theme === "dark"
        ? "rgba(253, 186, 116, 0.05)"
        : "rgba(0, 0, 0, 0.02)",
      ["--track" as any]: lockedStyle.theme === "dark"
        ? "rgba(253, 186, 116, 0.1)"
        : "rgba(0, 0, 0, 0.08)",
      ["--brand-1" as any]: lockedStyle.accentColor,
      ["--brand-2" as any]: lockedStyle.accentColor,
      ["--accent" as any]: lockedStyle.accentColor,
    }
    : isDark
      ? {
        ["--bg" as any]: "#0a0a0f",
        ["--card" as any]: "rgba(17, 17, 27, 0.95)",
        ["--border" as any]: "rgba(255, 255, 255, 0.08)",
        ["--text" as any]: "#f1f5f9",
        ["--muted" as any]: "#94a3b8",
        ["--surface" as any]: "rgba(255, 255, 255, 0.04)",
        ["--track" as any]: "rgba(255, 255, 255, 0.1)",
        ["--brand-1" as any]: "#6366f1",
        ["--brand-2" as any]: "#22d3ee",
      }
      : {
        ["--bg" as any]: "#f8fafc",
        ["--card" as any]: "#ffffff",
        ["--border" as any]: "rgba(0, 0, 0, 0.06)",
        ["--text" as any]: "#0f172a",
        ["--muted" as any]: "#64748b",
        ["--surface" as any]: "rgba(0, 0, 0, 0.02)",
        ["--track" as any]: "rgba(0, 0, 0, 0.08)",
        ["--brand-1" as any]: "#4F46E5",
        ["--brand-2" as any]: "#06b6d4",
      };

  const tierGridCols =
    advancedColumnsDesktop === 1
      ? "lg:grid-cols-1"
      : advancedColumnsDesktop === 2
        ? "lg:grid-cols-2"
        : advancedColumnsDesktop === 4
          ? "lg:grid-cols-4"
          : "lg:grid-cols-3";

  const poweredBy = showPoweredBy ? (
    <a
      href="https://tierless.net"
      target="_blank"
      rel="noreferrer"
      className="group/badge relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#4F46E5_100%)] opacity-80" />
      <span
        className="relative inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-xl"
        style={{
          background: isDark ? "rgba(11,12,21,0.9)" : "rgba(255,255,255,0.95)",
        }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
        {t("Powered by Tierless")}
        </span>
      </span>
    </a>
  ) : null;

  // Determine the background based on locked style or default
  const backgroundStyle = lockedStyle?.backgroundGradient
    ? lockedStyle.backgroundGradient
    : isDark
      ? "linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)";

  // Font class - locked style overrides user selection
  const effectiveFontClass = lockedStyle?.fontFamily
    ? "" // We'll use inline style for locked font
    : fontClass;

  // 🔥 Neon Animation CSS - Only inject if neon template
  const neonAnimationStyles = isNeonTemplate ? `
    @keyframes neon-pulse {
      0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px var(--brand-1)) drop-shadow(0 0 20px var(--brand-1)); }
      50% { opacity: 0.95; filter: drop-shadow(0 0 12px var(--brand-1)) drop-shadow(0 0 30px var(--brand-1)); }
    }
    @keyframes neon-glow {
      0%, 100% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.25), inset 0 0 15px rgba(6, 182, 212, 0.15); }
      50% { box-shadow: 0 0 30px rgba(6, 182, 212, 0.7), 0 0 70px rgba(6, 182, 212, 0.4), inset 0 0 25px rgba(6, 182, 212, 0.25); }
    }
    @keyframes neon-border {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes float-up {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
    @keyframes float-diagonal {
      0%, 100% { transform: translate(0, 0) scale(1); }
      25% { transform: translate(20px, -15px) scale(1.05); }
      50% { transform: translate(0, -25px) scale(1.1); }
      75% { transform: translate(-20px, -15px) scale(1.05); }
    }
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes scan-line {
      0% { transform: translateY(-100vh); opacity: 0; }
      5% { opacity: 0.6; }
      95% { opacity: 0.6; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    @keyframes particle-float {
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
      25% { transform: translateY(-30px) translateX(10px); opacity: 0.7; }
      50% { transform: translateY(-50px) translateX(-5px); opacity: 0.5; }
      75% { transform: translateY(-30px) translateX(-10px); opacity: 0.7; }
    }
    @keyframes neon-text-glow {
      0%, 100% { text-shadow: 0 0 15px rgba(6, 182, 212, 0.9), 0 0 30px rgba(139, 92, 246, 0.7), 0 0 50px rgba(236, 72, 153, 0.5); }
      50% { text-shadow: 0 0 30px rgba(6, 182, 212, 1), 0 0 60px rgba(139, 92, 246, 0.9), 0 0 90px rgba(236, 72, 153, 0.7); }
    }
    @keyframes border-travel {
      0% { clip-path: inset(0 100% 0 0); }
      50% { clip-path: inset(0 0 0 0); }
      100% { clip-path: inset(0 0 0 100%); }
    }
    .neon-card { animation: neon-glow 2.5s ease-in-out infinite, float-up 3s ease-in-out infinite; }
    .neon-card:hover { animation: neon-glow 0.8s ease-in-out infinite; transform: translateY(-8px) scale(1.03); }
    .neon-title { animation: neon-text-glow 2s ease-in-out infinite; }
    .neon-border-animated {
      background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4);
      background-size: 300% 100%;
      animation: neon-border 3s ease infinite;
    }
    .neon-shimmer {
      background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.4), transparent);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }
    .neon-featured { 
      animation: neon-pulse 2.5s ease-in-out infinite, float-up 3s ease-in-out infinite;
      box-shadow: 0 0 20px rgba(139, 92, 246, 0.35), 0 0 40px rgba(139, 92, 246, 0.2);
    }
    .neon-scan-line {
      animation: scan-line 4s linear infinite;
    }
    .neon-particle {
      animation: particle-float 4s ease-in-out infinite;
    }
    .neon-orbit {
      animation: orbit 15s linear infinite;
    }
  ` : "";

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${effectiveFontClass} relative`}
      data-public-theme={publicTheme}
      data-template-locked={hasLockedTemplate ? "true" : "false"}
      data-neon-template={isNeonTemplate ? "true" : "false"}
      style={{
        ...themeVars,
        background: backgroundStyle,
        ...(lockedStyle?.fontFamily ? { fontFamily: lockedStyle.fontFamily } : {}),
      }}
    >
      {/* 🔥 Neon Animation Styles */}
      {isNeonTemplate && <style dangerouslySetInnerHTML={{ __html: neonAnimationStyles }} />}

      {/* 🔥 Neon Grid Background Effect */}
      {isNeonTemplate && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Animated grid lines */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />

          {/* Scan line effect */}
          <div
            className="absolute w-full h-[2px] neon-scan-line"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), rgba(139, 92, 246, 0.8), transparent)",
              boxShadow: "0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(139, 92, 246, 0.3)",
            }}
          />
          <div
            className="absolute w-full h-[2px] neon-scan-line"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.6), rgba(139, 92, 246, 0.6), transparent)",
              boxShadow: "0 0 15px rgba(236, 72, 153, 0.4)",
              animationDelay: "2s",
            }}
          />

          {/* Floating orbs with more dramatic animation */}
          <div
            className="absolute w-[600px] h-[600px] rounded-full blur-[150px]"
            style={{
              background: "radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)",
              top: "-15%",
              left: "-15%",
              animation: "float-diagonal 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{
              background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
              top: "30%",
              right: "-10%",
              animation: "float-diagonal 10s ease-in-out infinite reverse",
            }}
          />
          <div
            className="absolute w-[450px] h-[450px] rounded-full blur-[100px]"
            style={{
              background: "radial-gradient(circle, rgba(236, 72, 153, 0.18) 0%, transparent 70%)",
              bottom: "-10%",
              left: "25%",
              animation: "float-diagonal 12s ease-in-out infinite",
              animationDelay: "2s",
            }}
          />

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full neon-particle"
              style={{
                background: i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#ec4899",
                boxShadow: `0 0 8px ${i % 3 === 0 ? "#06b6d4" : i % 3 === 1 ? "#8b5cf6" : "#ec4899"}`,
                left: `${15 + i * 10}%`,
                top: `${20 + (i * 8) % 60}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i % 3}s`,
              }}
            />
          ))}

          {/* Corner accents with glow */}
          <div
            className="absolute w-32 h-32 top-0 left-0"
            style={{
              background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute w-32 h-32 bottom-0 right-0"
            style={{
              background: "linear-gradient(315deg, rgba(236, 72, 153, 0.15) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      {/* Background Image with Overlay */}
      {backgroundImageUrl && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "rgba(10, 10, 15, 0.85)"
                : "rgba(248, 250, 252, 0.88)",
            }}
          />
        </div>
      )}

      {/* Subtle gradient overlay for dark mode */}
      {isDark && (
        <div
          className="fixed inset-0 pointer-events-none z-[1]"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)",
          }}
        />
      )}

      {/* Full-Width Hero Section (outside container) */}
      {heroImageUrl && (
        <div className="relative w-full min-h-[260px] sm:min-h-[300px] lg:min-h-[340px] overflow-hidden z-10">
          {/* Hero Background Image */}
          <img
            src={heroImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient Overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: isDark
                ? "linear-gradient(to top, rgba(10,10,15,0.98) 0%, rgba(10,10,15,0.6) 60%, rgba(10,10,15,0.3) 100%)"
                : "linear-gradient(to top, rgba(248,250,252,0.98) 0%, rgba(248,250,252,0.7) 60%, rgba(248,250,252,0.4) 100%)",
            }}
          />

          {/* Logo in top-left corner */}
          {logoUrl && (
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
              <img
                src={logoUrl}
                alt="Logo"
                className="h-10 sm:h-12 object-contain drop-shadow-lg rounded bg-white/10 backdrop-blur-sm p-1"
              />
            </div>
          )}

          {/* Powered by badge - TOP CENTER, prominent! */}
          {poweredBy && (
            <div className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20">
              {poweredBy}
            </div>
          )}

          {/* Content overlaid on hero - bottom aligned */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
            <div className="max-w-6xl mx-auto text-center">

              {title && (
                <h1
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 drop-shadow-lg"
                  style={{ color: "var(--text)" }}
                >
                  {title}
                </h1>
              )}

              {description && (
                <p
                  className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-3"
                  style={{ color: "var(--muted)" }}
                >
                  {description}
                </p>
              )}

              {/* Rating + Portfolio in row */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                {allowRating && (
                  <RatingWidget
                    pageId={pageId}
                    initialAvg={avgRating}
                    initialCount={ratingsCount}
                    initialUserScore={0}
                    allowRating={allowRating}
                    isDark={isDark}
                  />
                )}

                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all hover:scale-105 backdrop-blur-sm"
                    style={{
                      background: isDark
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.08)",
                      color: "var(--text)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}`,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--brand-1)" }} />
                    {t("Portfolio")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 ${heroImageUrl ? 'pt-6 sm:pt-8' : 'py-8 sm:py-12'}`} style={{ paddingBottom: advancedShowSummary && hasAnyBlocks ? '10rem' : '2rem' }}>

        {/* Header without hero image */}
        {!heroImageUrl && (
          /* Header without hero image */
          <header className="text-center mb-10 sm:mb-14">
            {/* Logo */}
            {logoUrl && (
              <div className="flex justify-center mb-6">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="max-h-16 sm:max-h-20 object-contain"
                />
              </div>
            )}

            {poweredBy && (
              <div className="flex justify-center mb-6">{poweredBy}</div>
            )}

            {publicName && (
              <div
                className="text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-3 font-medium"
                style={{ color: "var(--muted)" }}
              >
                {publicName}
              </div>
            )}

            {title && (
              <h1
                className={cn(
                  "text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4",
                  isNeonTemplate && "neon-title"
                )}
                style={{
                  color: isNeonTemplate ? "transparent" : "var(--text)",
                  ...(isNeonTemplate ? {
                    background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  } : {}),
                }}
              >
                {title}
              </h1>
            )}

            {description && (
              <p
                className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {description}
              </p>
            )}

            {supportNote && (
              <p
                className="text-xs sm:text-sm mt-4 max-w-xl mx-auto"
                style={{ color: "var(--muted)", opacity: 0.7 }}
              >
                {supportNote}
              </p>
            )}

            {/* Portfolio Link */}
            {portfolioUrl && (
              <div className="flex justify-center mt-6">
                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                  style={{
                    background: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    color: "var(--text)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: "var(--brand-1)" }} />
                  {t("View My Portfolio")}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Rating Widget */}
            {allowRating && (
              <div className="flex justify-center mt-6">
                <RatingWidget
                  pageId={pageId}
                  initialAvg={avgRating}
                  initialCount={ratingsCount}
                  initialUserScore={0}
                  allowRating={allowRating}
                  isDark={isDark}
                />
              </div>
            )}
          </header>
        )}

        {/* Tiers Section - Full Width */}
        {tierNodes.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2
                className="text-lg sm:text-xl font-semibold"
                style={{ color: "var(--text)" }}
              >
            {t("Choose a package")}
          </h2>

          {enableYearly && (
                <div
                  className="inline-flex rounded-full p-1 text-xs sm:text-sm"
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
              {(["month", "year"] as BillingPeriod[]).map((mode) => {
                const active = billingMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBillingMode(mode)}
                        className="relative cursor-pointer px-4 py-2 rounded-full transition-all font-medium"
                        style={{
                          background: active
                            ? (isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)")
                            : "transparent",
                          color: active ? "var(--brand-1)" : "var(--muted)",
                          boxShadow: active ? `0 0 0 1px var(--brand-1)` : "none",
                        }}
                      >
                        {mode === "month" ? t("Monthly") : t("Yearly")}
                        {mode === "year" && yearlyDiscountPercent && (
                      <span
                            className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                              background: "linear-gradient(135deg, #22c55e, #10b981)",
                              color: "white",
                            }}
                          >
                            -{yearlyDiscountPercent}%
                    </span>
                        )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

            <div className={`grid gap-4 sm:gap-6 sm:grid-cols-2 ${tierGridCols}`}>
          {tierNodes.map((tier) => {
            const isActive = tier.id === selectedTierId;
            return (
              <TierCard
                key={tier.id}
                node={tier}
                isActive={isActive}
                onSelect={() => setSelectedTierId(tier.id)}
                formatPrice={formatPrice}
                billingMode={billingMode}
                enableYearly={enableYearly}
                yearlyDiscountPercent={yearlyDiscountPercent}
                theme={publicTheme}
                    isNeonTemplate={isNeonTemplate}
              />
            );
          })}
        </div>
      </section>
        )}

        {/* Addons Section */}
        {addonNodes.length > 0 && (
          <section className="mb-10">
            <h3
              className="text-base sm:text-lg font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
          {t("Extras")}
        </h3>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {addonNodes.map((addon) => {
            const checked = selectedAddonIds.has(addon.id);
            return (
              <AddonCard
                key={addon.id}
                node={addon}
                checked={checked}
                onToggle={() => toggleAddon(addon.id)}
                formatPrice={formatPrice}
                billingMode={billingMode}
                enableYearly={enableYearly}
                yearlyDiscountPercent={yearlyDiscountPercent}
              />
            );
          })}
        </div>
      </section>
        )}

        {/* Items Section */}
        {itemNodes.length > 0 && (
          <section className="mb-10">
            <h3
              className="text-base sm:text-lg font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
          {t("Included items")}
        </h3>
            <div
              className="rounded-2xl p-4 sm:p-6"
              style={{
                background: "var(--card)",
                border: `1px solid var(--border)`,
              }}
            >
              <ul className="grid gap-3 sm:grid-cols-2">
          {itemNodes.map((item) => (
            <li
              key={item.id}
                    className="flex items-start gap-3"
            >
                    <span
                      className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                      style={{ background: "var(--surface)" }}
                    >
                {item.iconEmoji ? (
                        <span className="text-xs leading-none">
                    {item.iconEmoji}
                  </span>
                ) : (
                        <Check className="w-3 h-3" style={{ color: "var(--brand-1)" }} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                      <div
                        className="font-medium text-sm"
                        style={{ color: "var(--text)" }}
                      >
                  {item.label || t("Untitled item")}
                </div>
                {item.description && (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--muted)" }}
                        >
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
            </div>
      </section>
        )}

        {/* Sliders Section */}
        {sliderNodes.length > 0 && (
          <section className="mb-10">
            <h3
              className="text-base sm:text-lg font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
          {t("Sliders")}
        </h3>
            <div className="space-y-4">
          {sliderNodes.map((s) => (
            <SliderBlock
              key={s.id}
              node={s}
              value={
                sliderValues[s.id] ??
                (typeof s.min === "number" ? s.min : 0)
              }
              onChange={(v) =>
                setSliderValues((prev) => ({ ...prev, [s.id]: v }))
              }
              formatPrice={formatPrice}
              sliderColorMode={sliderColorMode}
              sliderSolidColor={sliderSolidColor}
            />
          ))}
        </div>
      </section>
        )}

      </div>

      {/* Fixed Bottom Summary Bar */}
      {advancedShowSummary && hasAnyBlocks && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50"
          style={{
            background: isDark
              ? "rgba(10, 10, 15, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            boxShadow: isDark
              ? "0 -10px 40px rgba(0,0,0,0.5)"
              : "0 -10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Price Display */}
              <div className="flex-1">
                <div
                  className="text-[10px] sm:text-xs uppercase tracking-wider font-medium mb-1"
                  style={{ color: "var(--muted)" }}
                >
                  {t("Estimated total")}
        </div>
                <div
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
                  style={{ color: "var(--text)" }}
                >
                  {formatPrice(total)}
      </div>
                <p
                  className="text-[10px] sm:text-xs mt-0.5 hidden sm:block"
                  style={{ color: "var(--muted)", opacity: 0.7 }}
                >
                  {t("This is a rough estimate based on selected packages and extras.")}
                </p>
      </div>

              {/* Send Inquiry Button */}
              {advancedShowInquiry && resolvedContactType && (
                <div className="shrink-0">
                  <button
                    onClick={handleInquiry}
                    className="group relative px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    style={{
                      background: inquiryButtonStyle.background,
                      boxShadow: resolvedContactType === "whatsapp"
                        ? "0 10px 30px rgba(17, 153, 142, 0.3)"
                        : resolvedContactType === "telegram"
                          ? "0 10px 30px rgba(0, 136, 204, 0.3)"
                          : "0 10px 30px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      {resolvedContactType === "whatsapp" && <MessageCircle className="w-4 h-4" />}
                      {resolvedContactType === "telegram" && <Send className="w-4 h-4" />}
                      {resolvedContactType === "email" && <Mail className="w-4 h-4" />}
                      {t("Send inquiry")}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
            </div>
          )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
