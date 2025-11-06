// src/app/(marketing)/start/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { t } from "@/i18n";

type Interval = "monthly" | "yearly";
type PlanId = "free" | "starter" | "growth" | "pro" | "tierless";

type SpecialItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
};

type Plan = {
  id: PlanId;
  name: string;
  monthly: number;      // USD
  color: string;        // accent
  outline?: "brand" | "color";
  badge?: string;       // e.g. "Most popular"
  chips?: SpecialItem[]; // SPECIAL ITEMS
  perks: string[];      // key features
  caps: string[];       // limits
  description?: string; // short explanation
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    color: "#6b7280",
    description: t("Get started with a single page and basic styling."),
    chips: [
      {
        id: "basic-colors",
        label: t("Included: Basic colors"),
        description: t("Preset neutral palette with one accent. Good for simple launch pages."),
        href: "/docs/special-items/basic-colors",
      },
    ],
    perks: [t("Tierless badge")],
    caps: [t("1 page"), t("2 tiers per page"), t("20 items")],
  },
  {
    id: "starter",
    name: "Starter",
    monthly: 9.99,
    color: "#14b8a6",
    description: t("Customize look and remove branding on a single page."),
    chips: [
      {
        id: "remove-badge",
        label: t("Included: Remove badge"),
        description: t("Hide the Tierless badge from public pages for a cleaner brand feel."),
        href: "/docs/special-items/remove-badge",
      },
    ],
    perks: [t("Custom colors"), t("Simple formulas"), t("Basic analytics")],
    caps: [t("1 page"), t("3 tiers per page"), t("40 items")],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 19.99,
    color: "#3b82f6",
    description: t("Add motion and content templates for faster builds."),
    chips: [
      {
        id: "templates",
        label: t("Included: Templates"),
        description: t("Starter layouts, blocks, and presets to assemble pages quickly."),
        href: "/docs/special-items/templates",
      },
    ],
    perks: [t("Backgrounds (image/video)"), t("Events analytics")],
    caps: [t("2 pages"), t("5 tiers per page"), t("80 items")],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 39.99,
    color: "#ef4444",
    badge: t("Most popular"),
    description: t("Automate with webhooks and collaborate with a small team."),
    chips: [
      {
        id: "webhooks",
        label: t("Included: Webhooks"),
        description: t("Send structured events (e.g. new order) to your endpoints in real time."),
        href: "/docs/special-items/webhooks",
      },
    ],
    perks: [t("Advanced formulas"), t("Team up to 3 seats")],
    caps: [t("5 pages"), t("5 tiers per page"), t("130 items")],
  },
  {
    id: "tierless",
    name: "Tierless",
    monthly: 59.99,
    color: "#6366f1",
    outline: "brand",
    description: t("Everything unlocked with AI assistance and full brand control."),
    chips: [
      {
        id: "ai-agent",
        label: t("Exclusive: AI agent"),
        description: t("Ask in plain language to build or modify pricing pages and rules."),
        href: "/docs/special-items/ai-agent",
      },
      {
        id: "white-label",
        label: t("Exclusive: White-label"),
        description: t("Replace all Tierless branding and host under your domain."),
        href: "/docs/special-items/white-label",
      },
    ],
    perks: [t("Custom domains (3 included)"), t("Team 10 seats")],
    caps: [t("Unlimited pages"), t("Unlimited tiers per page"), t("300 items")],
  },
];

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  tierless: 4,
};

// Yearly = 20% off
function getYearlyPricing(monthly: number) {
  const effMonthly = Math.round(monthly * 0.8 * 100) / 100;
  const perYear = Math.round(monthly * 12 * 0.8);
  return {
    effMonthlyLabel: `$${effMonthly.toFixed(2)}/mo`,
    perYearLabel: `$${perYear}/yr`,
  };
}

type InfoModalState = {
  open: boolean;
  title: string;
  body: string;
  href?: string;
};

export default function StartPage() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [authed, setAuthed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [info, setInfo] = useState<InfoModalState>({ open: false, title: "", body: "" });


  // Auth + plan
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const st = await fetch("/api/auth/status?ts=" + Date.now(), { credentials: "include", cache: "no-store" }).then(r => r.json());
        setAuthed(!!st?.authenticated);
      } catch {}
      try {
        const me = await fetch("/api/me", { credentials: "include", cache: "no-store" }).then(r => r.ok ? r.json() : null);
        const p = me?.user?.plan;
        setCurrentPlan(p && ["free","starter","growth","pro","tierless"].includes(p) ? p : null);
      } catch { setCurrentPlan(null); }
    };
    fetchAuth();
    const onChanged = () => fetchAuth();
    window.addEventListener("TL_AUTH_CHANGED", onChanged as any);
    return () => window.removeEventListener("TL_AUTH_CHANGED", onChanged as any);
  }, []);

  // URL highlight & interval telemetrija (minimalno)
  useEffect(() => {
    try {
      const usp = new URLSearchParams(window.location.search);
      const highlight = usp.get("highlight") as PlanId | null;
      const qsInterval = (usp.get("interval") as Interval) || null;
      if (qsInterval === "monthly" || qsInterval === "yearly") setInterval(qsInterval);
      // Šaljemo lightweight event (ako imaš /api/events)
      fetch("/api/events", {
        method: "POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify([{ name:"pricing_viewed", ts: Date.now(), props: { highlight: highlight || undefined, interval } }]),
      }).catch(()=>{});
    } catch {}
  }, []); // init

  const cards = useMemo(() => PLANS, []);
  const openInfo = (item: SpecialItem) => setInfo({ open: true, title: item.label, body: item.description, href: item.href });
  const closeInfo = () => setInfo(s => ({ ...s, open: false }));

  return (
    <main className="bg-white text-slate-900">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        {/* Title + toggle */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">{t("Simple pricing")}</h1>
          <p className="mt-3 text-slate-600">{t("Choose a plan. Switch anytime.")}</p>

          <div
            className="mt-6 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm"
            role="tablist"
            aria-label={t("Billing interval")}
            style={{ boxShadow: "0 6px 24px rgba(2,6,23,0.08)" }}
          >
            <ToggleBtn active={interval === "monthly"} onClick={() => setIntervalWithEvent("monthly")} label={t("Monthly")} />
            <ToggleBtn active={interval === "yearly"} onClick={() => setIntervalWithEvent("yearly")} label={t("Yearly · 20% off")} />
          </div>
        </div>

        {/* Grid — kompaktno, bez scrolla na desktopu */}
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
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ plan: planId }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || data?.ok !== true) return false;
                  setCurrentPlan(planId);
                  window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
                  return true;
                } catch {
                  return false;
                }
              }}
            />
          ))}
        </div>
      </section>

      <InfoModal state={info} onClose={closeInfo} />
    </main>
  );

  function setIntervalWithEvent(next: Interval) {
    setInterval(next);
    try {
      fetch("/api/events", {
        method: "POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify([{ name:"pricing_interval_changed", ts: Date.now(), props: { interval: next } }]),
      }).catch(()=>{});
    } catch {}
  }
}

function ToggleBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative px-4 sm:px-5 py-2 text-sm sm:text-base rounded-full transition focus-visible:outline-none",
        active ? "text-white" : "text-slate-600 hover:text-slate-900",
      ].join(" ")}
      style={
        active
          ? {
              background: "var(--brand-gradient)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.06), 0 1px 0 rgba(15,23,42,0.06)",
            }
          : { }
      }
      aria-pressed={active}
      role="tab"
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.45)" }}
          aria-hidden
        />
      )}
      {label}
    </button>
  );
}

function PlanCard({
  plan,
  interval,
  authed,
  currentPlan,
  onOpenInfo,
  onPlanChange,
}: {
  plan: Plan;
  interval: Interval;
  authed: boolean;
  currentPlan: PlanId | null;
  onOpenInfo: (item: SpecialItem) => void;
  onPlanChange: (planId: PlanId) => Promise<boolean>; // returns true if plan changed
}) {
  const [busy, setBusy] = useState(false);
  const isMost = !!plan.badge;
  const isTierless = plan.id === "tierless";
  const isCurrent = authed && currentPlan === plan.id;
  const hasPlan = authed && !!currentPlan;

  // CTA label/link
  let ctaLabel = t("Pick this tier");
  if (hasPlan) {
    if (isCurrent) ctaLabel = t("You are on this tier");
    else if (PLAN_RANK[plan.id] > PLAN_RANK[currentPlan!]) ctaLabel = t("Upgrade");
    else ctaLabel = t("Downgrade");
  }
  const ctaHref = isCurrent ? "#" : `/signup?plan=${plan.id}&interval=${interval}`;

  // Neutral base outline; Tierless sa brand gradientom
  const baseStyle: React.CSSProperties =
    isTierless && plan.outline === "brand"
      ? { background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "3px solid transparent" }
      : { border: "1.5px solid #e2e8f0" };

  const { effMonthlyLabel, perYearLabel } = getYearlyPricing(plan.monthly);

  return (
    <div
      className={[
        "group relative rounded-3xl bg-white isolate",
        "min-h-[520px] grid grid-rows-[auto_auto_auto_1fr_auto] overflow-hidden",
        "transition-[box-shadow] duration-200",
        "shadow-sm hover:shadow-lg",
      ].join(" ")}
      style={baseStyle}
    >
      {/* HOVER OUTLINE (ne za Tierless) */}
      {!isTierless && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{ boxShadow: `inset 0 0 0 2px ${hexToRgb(plan.color, 0.55)}` }}
          aria-hidden
        />
      )}

      {/* HOVER GLOW */}
      {isTierless ? (
        <div
          className="pointer-events-none absolute -inset-px rounded-[28px] opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-[8px]"
          style={{ background: "var(--brand-gradient)" }}
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-[28px] opacity-0 group-hover:opacity-25 transition-opacity duration-300 blur-[8px]"
          style={{
            background: `radial-gradient(80% 60% at 50% 0%, ${hexToRgb(plan.color, 0.20)} 0%, transparent 70%)`,
          }}
          aria-hidden
        />
      )}

      {/* Soft hover tint */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(180deg, ${hexToRgb(plan.color, 0.05)} 0%, ${hexToRgb(plan.color, 0.025)} 100%)` }}
        aria-hidden
      />

      {/* HEADER */}
      <div className="relative z-10 px-5 pt-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2">
            <span className="inline-block size-2 rounded-full" style={{ background: plan.color }} aria-hidden />
            {plan.name}
          </h3>
          {isMost && (
            <span
              className="ml-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
              style={{ background: "#ef4444" }}
            >
              {plan.badge}
            </span>
          )}
        </div>
      </div>

      {/* PRICE */}
      <div className="relative z-10 px-5 mt-1" style={{ fontVariantNumeric: "tabular-nums" as any }}>
        <span className="text-2xl sm:text-3xl font-semibold leading-none">
          <span className="relative -top-[2px] text-base align-top mr-0.5">$</span>
          {interval === "monthly" ? plan.monthly.toFixed(2) : effMonthlyLabel.replace("$", "").replace("/mo", "")}
          <span className="ml-1 text-sm font-medium text-slate-700">/mo</span>
        </span>
        {interval === "yearly" && (
          <span
            className="ml-2 shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium align-middle"
            style={{ background: "#f8fafc", borderColor: "rgba(15,23,42,0.08)", color: "#334155" }}
            aria-label={t("Billed yearly (20% off)")}
          >
            {perYearLabel}
          </span>
        )}
      </div>

      {/* DESCRIPTION + SPECIAL ITEMS */}
      <div className="relative z-10 px-5 pt-2">
        {plan.description && <p className="text-sm text-slate-600">{plan.description}</p>}
        {plan.chips && plan.chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.chips.map((chip) => (
              <span
                key={chip.id}
                className="relative group/item inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-default border bg-white"
                style={{ borderColor: "rgba(15,23,42,0.12)", boxShadow: "0 3px 10px " + hexToRgb(plan.color, 0.08) }}
              >
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${hexToRgb(plan.color, 0.5)}` }}
                  aria-hidden
                />
                <span className="relative z-10">{chip.label}</span>
                <button
                  type="button"
                  onClick={() => onOpenInfo(chip)}
                  className="relative z-10 ml-2 inline-flex items-center justify-center size-5 rounded-full border text-[11px] font-medium text-slate-600 hover:text-slate-900 transition"
                  style={{ borderColor: "rgba(15,23,42,0.15)", background: "#fff" }}
                  aria-label={t("Explain: {label}", { label: chip.label })}
                >
                  i
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* LISTS */}
      <div className="relative z-10 px-5">
        {/* Caps */}
        <ul className="space-y-1.5">
          {plan.caps.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-block size-1.5 rounded-full translate-y-[1px]" style={{ background: plan.color }} />
              {c}
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="my-4 h-px bg-slate-200" />

        {/* Perks */}
        <ul className="space-y-1.5">
          {plan.perks.map((p, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <svg
                className="size-4 opacity-80"
                viewBox="0 0 20 20"
                fill="none"
                stroke={plan.color}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 10.5l3 3L15 7" />
              </svg>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA — ista Y koordinata za sve */}
      <div className="relative z-10 px-5 pb-5 pt-3">
        <Link
          href={ctaHref}
          prefetch={false}
          className={[
            "block w-full rounded-xl px-4 py-2.5 text-center text-sm font-medium transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            // lift hover only when interactive
            (!isCurrent && !busy) ? "hover:-translate-y-[2px]" : "",
            (isCurrent || busy) ? "cursor-not-allowed opacity-60" : "",
          ].join(" ")}
          style={
            isTierless
              ? { background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "2px solid transparent", color: "#0f172a" }
              : { border: `2px solid ${hexToRgb(plan.color, 0.45)}`, color: "#0f172a" }
          }
          aria-disabled={isCurrent || busy}
          aria-label={
            isCurrent
              ? t("You are on this tier")
              : hasPlan
              ? PLAN_RANK[plan.id] > PLAN_RANK[currentPlan!]
                ? t("Upgrade to {name}", { name: plan.name })
                : t("Downgrade to {name}", { name: plan.name })
              : t("Pick {name}", { name: plan.name })
          }
          onClick={async (e) => {
            if (isCurrent || busy) {
              e.preventDefault();
              return;
            }
            // If authenticated, change plan via API without leaving /start
            if (authed) {
              e.preventDefault();
              try {
                setBusy(true);
                const ok = await onPlanChange(plan.id);
                if (!ok) {
                  window.location.href = ctaHref; // fallback to classic signup
                }
              } finally {
                setBusy(false);
              }
              return;
            }
            // Not authenticated → let Link navigate to /signup
          }}
        >
          {busy
            ? t("Changing…")
            : hasPlan
              ? (isCurrent ? t("You are on this tier") : ctaLabel)
              : t("Pick this tier")}
        </Link>
        <p className="mt-2 text-[11px] text-slate-500 text-center">
          {plan.id === "free" ? t("No credit card required") : t("Cancel anytime")}
        </p>
      </div>
    </div>
  );
}

/* ===== Modal ===== */
function InfoModal({ state, onClose }: { state: InfoModalState; onClose: () => void }) {
  const { open, title, body, href } = state;

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tl-info-title"
      aria-describedby="tl-info-desc"
    >
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative z-[61] w-full max-w-md rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
        <h2 id="tl-info-title" className="text-lg font-semibold text-slate-900">{title}</h2>
        <p id="tl-info-desc" className="mt-2 text-sm text-slate-600">{body}</p>

        <div className="mt-4 flex items-center justify-between">
          {href ? (
            <Link
              href={href}
              className="inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium text-slate-900 hover:-translate-y-[1px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
              style={{ background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box", border: "2px solid transparent" }}
              aria-label={t("Open documentation")}
            >
              {t("Open docs")}
            </Link>
          ) : <span />}

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}

// helpers
function hexToRgb(hex: string, a = 1) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}