// src/app/(pricing)/start/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { t } from "@/i18n";
import StartHeader from "@/components/StartHeader";

type Interval = "monthly" | "yearly";
type PlanId = "free" | "starter" | "growth" | "pro" | "tierless";

type SpecialItem = { id: string; label: string; description: string; href?: string };
type Plan = {
  id: PlanId; name: string; monthly: number; color: string;
  outline?: "brand" | "color"; badge?: string; chips?: SpecialItem[];
  perks: string[]; caps: string[]; description?: string;
};

const PLANS: Plan[] = [
  { id:"free", name:"Free", monthly:0, color:"#6b7280",
    description:t("Get started with a single page and basic styling."),
    chips:[{ id:"basic-colors", label:t("Included: Basic colors"),
      description:t("Preset neutral palette with one accent. Good for simple launch pages."),
      href:"/docs/special-items/basic-colors" }],
    perks:[t("Tierless badge")],
    caps:[t("1 page"), t("2 tiers per page"), t("20 items")] },
  { id:"starter", name:"Starter", monthly:9.99, color:"#14b8a6",
    description:t("Customize look and remove branding on a single page."),
    chips:[{ id:"remove-badge", label:t("Included: Remove badge"),
      description:t("Hide the Tierless badge from public pages for a cleaner brand feel."),
      href:"/docs/special-items/remove-badge" }],
    perks:[t("Custom colors"), t("Simple formulas"), t("Basic analytics")],
    caps:[t("1 page"), t("3 tiers per page"), t("40 items")] },
  { id:"growth", name:"Growth", monthly:19.99, color:"#3b82f6",
    description:t("Add motion and content templates for faster builds."),
    chips:[{ id:"templates", label:t("Included: Templates"),
      description:t("Starter layouts, blocks, and presets to assemble pages quickly."),
      href:"/docs/special-items/templates" }],
    perks:[t("Backgrounds (image/video)"), t("Events analytics")],
    caps:[t("2 pages"), t("5 tiers per page"), t("80 items")] },
  { id:"pro", name:"Pro", monthly:39.99, color:"#ef4444", badge:t("Most popular"),
    description:t("Automate with webhooks and collaborate with a small team."),
    chips:[{ id:"webhooks", label:t("Included: Webhooks"),
      description:t("Send structured events (e.g. new order) to your endpoints in real time."),
      href:"/docs/special-items/webhooks" }],
    perks:[t("Advanced formulas"), t("Team up to 3 seats")],
    caps:[t("5 pages"), t("5 tiers per page"), t("130 items")] },
  { id:"tierless", name:"Tierless", monthly:59.99, color:"#6366f1", outline:"brand",
    description:t("Everything unlocked with AI assistance and full brand control."),
    chips:[
      { id:"ai-agent", label:t("Exclusive: AI agent"),
        description:t("Ask in plain language to build or modify pricing pages and rules."),
        href:"/docs/special-items/ai-agent" },
      { id:"white-label", label:t("Exclusive: White-label"),
        description:t("Replace all Tierless branding and host under your domain."),
        href:"/docs/special-items/white-label" }],
    perks:[t("Custom domains (3 included)"), t("Team 10 seats")],
    caps:[t("Unlimited pages"), t("Unlimited tiers per page"), t("300 items")] },
];

const PLAN_RANK: Record<PlanId, number> = { free:0, starter:1, growth:2, pro:3, tierless:4 };

function getYearlyPricing(monthly: number) {
  const effMonthly = Math.round(monthly * 0.8 * 100) / 100;
  const perYear = Math.round(monthly * 12 * 0.8);
  return { effMonthlyLabel: `$${effMonthly.toFixed(2)}/mo`, perYearLabel: `$${perYear}/yr` };
}

type InfoModalState = { open: boolean; title: string; body: string; href?: string };

export default function StartPage() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [authed, setAuthed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [info, setInfo] = useState<InfoModalState>({ open: false, title: "", body: "" });
  const [isDark, setIsDark] = useState(false);

  // Page samo posmatra temu (ne menja je)
  useEffect(() => {
    try {
      const html = document.documentElement;
      const update = () => setIsDark(html.classList.contains("dark"));
      update();
      const obs = new MutationObserver(update);
      obs.observe(html, { attributes: true, attributeFilter: ["class"] });
      const onToggle = () => update();
      window.addEventListener("TL_THEME_TOGGLED", onToggle as any);
      return () => { obs.disconnect(); window.removeEventListener("TL_THEME_TOGGLED", onToggle as any); };
    } catch {}
  }, []);

  // Auth + plan
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const st = await fetch("/api/auth/status?ts=" + Date.now(), { credentials: "include", cache: "no-store" }).then(r => r.json());
        setAuthed(!!st?.authenticated);
      } catch {}
      try {
        const mp = await fetch("/api/me/plan", { credentials: "same-origin", cache: "no-store" }).then(r => r.ok ? r.json() : null);
        const p = mp?.plan;
        setCurrentPlan(p && ["free","starter","growth","pro","tierless"].includes(p) ? p : null);
      } catch { setCurrentPlan(null); }
    };
    fetchAuth();
    const onChanged = () => fetchAuth();
    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    return () => window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
  }, []);

  // Minimalna telemetrija
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      const highlight = usp.get("highlight") as PlanId | null;
      const qsInterval = (usp.get("interval") as Interval) || null;
      if (qsInterval === "monthly" || qsInterval === "yearly") setInterval(qsInterval);
      fetch("/api/events", {
        method: "POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify([{ name:"pricing_viewed", ts: Date.now(), props: { highlight: highlight || undefined, interval } }]),
      }).catch(()=>{});
    } catch {}
  }, []);

  const cards = useMemo(() => PLANS, []);
  const openInfo = (item: SpecialItem) => setInfo({ open: true, title: item.label, body: item.description, href: item.href });
  const closeInfo = () => setInfo(s => ({ ...s, open: false }));

  return (
    <>
      <StartHeader />

      {/* fiksni layer ispod svega — garantuje crnu u dark */}
      <div id="tl-pricing-root" className="relative min-h-screen" style={{ isolation: "isolate" as any }}>
        <div aria-hidden className="fixed inset-0 -z-10" style={{ backgroundColor: isDark ? "#000000" : "#ffffff" }} />

        <main className="min-h-screen" style={{ backgroundColor: "transparent", color: isDark ? "#f1f5f9" : "#0f172a" }}>
          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
            {/* Title + toggle */}
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">{t("Simple pricing")}</h1>
              <p className="mt-3" style={{ color: isDark ? "#e5e7eb" : "#475569" }}>{t("Choose a plan. Switch anytime.")}</p>

              {/* Interval switcher */}
              <div
                className="relative mt-6 inline-flex items-center rounded-full px-1 py-1 gap-2"
                role="tablist"
                aria-label={t("Billing interval")}
                style={{
                  background: isDark ? "rgba(15,23,42,.65)" : "#ffffff",
                  border: isDark ? "1px solid rgba(148,163,184,.25)" : "1px solid rgba(15,23,42,.12)",
                  boxShadow: "none",
                }}
              >
                {(["monthly","yearly"] as Interval[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setInterval(key)}
                    className="relative z-10 px-5 sm:px-6 py-1.5 text-sm sm:text-base rounded-full focus-visible:outline-none"
                    role="tab"
                    aria-selected={interval === key}
                    style={interval === key
                      ? {
                          background: "var(--brand-gradient)",
                          color: "#ffffff",
                          border: "1px solid transparent",
                          boxShadow: "0 6px 24px rgba(79,70,229,.25)",
                        }
                      : {
                          border: `1px solid ${isDark ? "rgba(148,163,184,.28)" : "rgba(15,23,42,.16)"}`,
                          color: isDark ? "#cbd5e1" : "#334155",
                          background: "transparent",
                        }}
                  >
                    {key === "monthly" ? t("Monthly") : t("Yearly · 20% off")}
                  </button>
                ))}
              </div>
            </div>

            {/* GRID — kartice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
              {cards.map((p) => (
                <PlanCard
                  key={p.id}
                  plan={p}
                  interval={interval}
                  authed={authed}
                  currentPlan={currentPlan}
                  onOpenInfo={openInfo}
                  onPlanChange={async (planId) => {
                    if (!authed) return false;
                    try {
                      const res = await fetch("/api/me/plan", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        credentials: "same-origin",
                        body: JSON.stringify({ plan: planId }),
                      });
                      if (!res.ok) return false;
                      setCurrentPlan(planId);
                      try { window.dispatchEvent(new Event("TL_AUTH_CHANGED")); } catch {}
                      return true;
                    } catch {
                      return false;
                    }
                  }}
                  isDark={isDark}
                />
              ))}
            </div>

            {/* QUICK COMPARE */}
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm border-separate border-spacing-x-2">
                <thead>
                  <tr>
                    <th className="text-left font-semibold" style={{ color: isDark ? "#f8fafc" : "#1f2937" }}>{t("Feature")}</th>
                    {cards.map((p) => (
                      <th key={p.id} className="text-center font-semibold" style={{ color: isDark ? "#f8fafc" : "#1f2937" }}>{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "remove-badge", label: t("Remove badge"), plans: ["starter","growth","pro","tierless"] },
                    { key: "templates", label: t("Templates"), plans: ["growth","pro","tierless"] },
                    { key: "webhooks", label: t("Webhooks"), plans: ["pro","tierless"] },
                    { key: "ai", label: t("AI + White-label"), plans: ["tierless"] },
                  ].map(row => (
                    <tr key={row.key}>
                      <td className="py-1" style={{ color: isDark ? "#f1f5f9" : "#334155" }}>{row.label}</td>
                      {cards.map((p) => (
                        <td key={p.id} className="py-1 text-center">
                          {row.plans.includes(p.id) ? (
                            <svg className="inline-block size-4" viewBox="0 0 20 20" fill="none" stroke={p.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <path d="M5 10.5l3 3L15 7" />
                            </svg>
                          ) : (
                            <span className="inline-block size-1.5 rounded-full bg-slate-300 dark:bg-slate-700 align-middle" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <InfoModal state={info} onClose={closeInfo} isDark={isDark} />
        </main>
      </div>
    </>
  );
}

function PlanCard({
  plan, interval, authed, currentPlan, onOpenInfo, onPlanChange, isDark,
}: {
  plan: Plan; interval: Interval; authed: boolean; currentPlan: PlanId | null;
  onOpenInfo: (item: SpecialItem) => void; onPlanChange: (planId: PlanId) => Promise<boolean>; isDark: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const isMost = !!plan.badge;
  const isTierless = plan.id === "tierless";
  const isCurrent = authed && currentPlan === plan.id;
  const hasPlan = authed && !!currentPlan;

  let ctaLabel = t("Pick this tier");
  if (hasPlan) {
    if (isCurrent) ctaLabel = t("You are on this tier");
    else if (PLAN_RANK[plan.id] > PLAN_RANK[currentPlan!]) ctaLabel = t("Upgrade");
    else ctaLabel = t("Downgrade");
  }
  const ctaHref = isCurrent ? "#" : `/signup?plan=${plan.id}&interval=${interval}`;

  const borderColor = isDark ? "#1f2937" : "#e2e8f0";
  const baseStyle: React.CSSProperties =
    isTierless && plan.outline === "brand"
      ? {
          border: "3px solid transparent",
          background: `linear-gradient(${isDark ? "#0e0f12" : "#ffffff"}, ${isDark ? "#0e0f12" : "#ffffff"}) padding-box, var(--brand-gradient) border-box`,
        }
      : { border: `1.5px solid ${borderColor}`, background: "none" };

  const { effMonthlyLabel, perYearLabel } = getYearlyPricing(plan.monthly);

  return (
    <div
      className={[
        "group relative rounded-3xl isolate",
        "min-h-[520px] grid grid-rows-[auto_auto_auto_1fr_auto] overflow-hidden",
        "transition-[box-shadow] duration-200",
        "bg-white dark:bg-slate-900",
        "shadow-sm hover:shadow-lg dark:shadow-[0_0_0_1px_rgba(148,163,184,0.15)]",
        "text-slate-900 dark:text-slate-100",
      ].join(" ")}
      style={baseStyle}
    >
      {!isTierless && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            boxShadow: `inset 0 0 0 ${isDark ? 3 : 2}px ${hexToRgb(plan.color, isDark ? 0.85 : 0.55)}`
          }}
          aria-hidden
        />
      )}

      {isTierless ? (
        <div
          className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-[8px]"
          style={{ background: "var(--brand-gradient)" }}
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-[28px] opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur-[8px]"
          style={{ background: `radial-gradient(80% 60% at 50% 0%, ${hexToRgb(plan.color, 0.20)} 0%, transparent 70%)` }}
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(180deg, ${hexToRgb(plan.color, 0.05)} 0%, ${hexToRgb(plan.color, 0.025)} 100%)` }}
        aria-hidden
      />

      <div className="relative z-10 px-5 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2" style={{ color: isDark ? "#ffffff" : undefined }}>
            <span className="inline-block size-2 rounded-full" style={{ background: plan.color }} aria-hidden />
            {plan.name}
          </h3>
          {isMost && (
            <span className="ml-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: "#ef4444" }}>
              {plan.badge}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 px-5 mt-1" style={{ fontVariantNumeric: "tabular-nums" as any }}>
        <span className="text-2xl sm:text-3xl font-semibold leading-none" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>
          <span className="relative -top-[2px] text-base align-top mr-0.5" style={{ color: isDark ? "#e5e7eb" : "#475569" }}>$</span>
          {interval === "monthly" ? plan.monthly.toFixed(2) : effMonthlyLabel.replace("$", "").replace("/mo", "")}
          <span className="ml-1 text-sm font-medium" style={{ color: isDark ? "#e5e7eb" : "#334155" }}>/mo</span>
        </span>
        {interval === "yearly" && (
          <span
            className="ml-2 shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium align-middle"
            style={{
              background: isDark ? "rgba(15,23,42,0.35)" : "#f8fafc",
              borderColor: isDark ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.08)",
              color: isDark ? "#e5e7eb" : "#334155",
            }}
            aria-label={t("Billed yearly (20% off)")}
          >
            {perYearLabel}
          </span>
        )}
      </div>

      <div className="relative z-10 px-5 pt-2">
        {plan.description && (
          <p className="text-sm" style={{ color: isDark ? "#e7e7ea" : "#334155" }}>
            {plan.description}
          </p>
        )}
        {plan.chips && plan.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.chips.map((chip) => (
              <span
                key={chip.id}
                className="relative group/item inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-default border"
                style={
                  isTierless
                    ? {
                        background: `linear-gradient(${isDark ? "#0e0f12" : "#ffffff"}, ${isDark ? "#0e0f12" : "#ffffff"}) padding-box, var(--brand-gradient) border-box`,
                        border: "2px solid transparent",
                        color: isDark ? "#e5e7eb" : "#0f172a",
                        boxShadow: "0 3px 10px " + hexToRgb(plan.color, 0.08),
                      }
                    : {
                        background: isDark ? "#0e0f12" : "#ffffff",
                        color: isDark ? "#e5e7eb" : "#0f172a",
                        borderColor: isDark ? "rgba(148,163,184,0.28)" : "rgba(15,23,42,0.14)",
                        boxShadow: "0 3px 10px " + hexToRgb(plan.color, 0.08),
                      }
                }
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                  style={
                    isTierless
                      ? { boxShadow: "none" }
                      : { boxShadow: `inset 0 0 0 1.5px ${hexToRgb(plan.color, 0.5)}` }
                  }
                  aria-hidden
                />
                <span className="relative z-10">{chip.label}</span>
                <button
                  type="button"
                  onClick={() => onOpenInfo(chip)}
                  className="relative z-10 ml-2 inline-flex items-center justify-center size-5 rounded-full border text-[11px] font-semibold transition"
                  style={
                    isTierless
                      ? {
                          border: "2px solid transparent",
                          background: `linear-gradient(${isDark ? "#111113" : "#ffffff"}, ${isDark ? "#111113" : "#ffffff"}) padding-box, var(--brand-gradient) border-box`,
                          color: isDark ? "#e5e7eb" : "#334155",
                        }
                      : {
                          borderColor: isDark ? "rgba(148,163,184,0.35)" : "rgba(15,23,42,0.18)",
                          background: isDark ? "#111113" : "#ffffff",
                          color: isDark ? "#e5e7eb" : "#334155",
                        }
                  }
                  aria-label={t("Explain: {label}", { label: chip.label })}
                >
                  i
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative z-10 px-5">
        <ul className="space-y-1.5">
          {plan.caps.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm" style={{ color: isDark ? "#f1f5f9" : "#334155" }}>
              <span className="inline-block size-1.5 rounded-full translate-y-[1px]" style={{ background: plan.color }} />
              {c}
            </li>
          ))}
        </ul>

        <div className="my-4 h-px" style={{ background: isDark ? "#1f2937" : "#e5e7eb" }} />

        <ul className="space-y-1.5">
          {plan.perks.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm" style={{ color: isDark ? "#f1f5f9" : "#334155" }}>
              <svg className="size-4 opacity-80" viewBox="0 0 20 20" fill="none" stroke={plan.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 10.5l3 3L15 7" />
              </svg>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 px-5 pb-5 pt-3">
        <Link
          href={ctaHref}
          prefetch={false}
          className={[
            "block w-full rounded-xl px-4 py-2.5 text-center text-sm font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            (!isCurrent && !busy) ? "hover:-translate-y-[2px]" : "",
            (isCurrent || busy) ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
          style={
            isTierless
              ? {
                  border: "2px solid transparent",
                  background: `linear-gradient(${isDark ? "#0e0f12" : "#ffffff"}, ${isDark ? "#0e0f12" : "#ffffff"}) padding-box, var(--brand-gradient) border-box`,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                }
              : {
                  border: `2px solid ${hexToRgb(plan.color, isDark ? 0.55 : 0.45)}`,
                  color: isDark ? "#f1f5f9" : "#0f172a",
                  background: "none",
                }
          }
          aria-disabled={isCurrent || busy}
          aria-label={
            isCurrent ? t("You are on this tier")
            : hasPlan ? (PLAN_RANK[plan.id] > PLAN_RANK[currentPlan!]
                ? t("Upgrade to {name}", { name: plan.name })
                : t("Downgrade to {name}", { name: plan.name }))
            : t("Pick {name}", { name: plan.name })
          }
          onClick={async (e) => {
            if (isCurrent || busy) { e.preventDefault(); return; }
            if (authed) {
              e.preventDefault();
              try { setBusy(true); const ok = await onPlanChange(plan.id); if (!ok) window.location.href = ctaHref; }
              finally { setBusy(false); }
              return;
            }
          }}
        >
          {busy ? t("Changing…") : hasPlan ? (isCurrent ? t("You are on this tier") : ctaLabel) : t("Pick this tier")}
        </Link>
        <p className="mt-2 text-[11px] text-center" style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
          {plan.id === "free" ? t("No credit card required") : t("Cancel anytime")}
        </p>
      </div>
    </div>
  );
}

function InfoModal({ state, onClose, isDark }: { state: InfoModalState; onClose: () => void; isDark?: boolean }) {
  const { open, title, body, href } = state;
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="tl-info-title" aria-describedby="tl-info-desc">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        className="relative z-[61] w-full max-w-md rounded-2xl p-5 shadow-xl border"
        style={{
          background: isDark ? "#0e0f12" : "#ffffff",
          borderColor: isDark ? "#1f2937" : "#e5e7eb",
        }}
      >
        <h2 id="tl-info-title" className="text-lg font-semibold" style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}>{title}</h2>
        <p id="tl-info-desc" className="mt-2 text-sm" style={{ color: isDark ? "#e5e7eb" : "#475569" }}>{body}</p>

        <div className="mt-4 flex items-center justify-between">
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition"
              style={{
                background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
                border: "2px solid transparent",
                color: isDark ? "#f1f5f9" : "#0f172a",
              }}
              aria-label={t("Open documentation")}
            >
              {t("Open docs")}
            </Link>
          ) : <span />}

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium transition"
            style={{ color: isDark ? "#e5e7eb" : "#334155" }}
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}