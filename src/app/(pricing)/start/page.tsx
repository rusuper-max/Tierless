// src/app/(pricing)/start/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { t } from "@/i18n";
import StartHeader from "@/components/StartHeader";

// --- TYPES & CONFIG ---
type Interval = "monthly" | "yearly";
type PlanId = "free" | "starter" | "growth" | "pro";

// Definišemo gradient ovde da bude konzistentan (ili koristi var(--brand-gradient) iz CSS-a)
const BRAND_GRADIENT = "var(--brand-gradient, linear-gradient(135deg, #6366f1 0%, #ec4899 100%))";

type SpecialItem = {
  id: string;
  label: string;
  description: string;
  href?: string;
};

type Plan = {
  id: PlanId;
  name: string;
  monthly: number;
  badge?: string;
  chips?: SpecialItem[];
  perks: string[];
  caps: string[];
  description?: string;
  isPro?: boolean; // Flag za special tretman Pro tiera
  theme: {
    text: string;        // Boja teksta za naslov/ikone
    borderHover: string; // Tailwind klasa za boju bordera na hover (za non-pro)
    bgHover: string;     // Pozadina na hover
    button: string;      // Boja dugmeta
    buttonHover: string; // Boja dugmeta na hover
    shadow: string;      // Senka na hover
  };
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    description: t("Perfect for testing the editor."),
    theme: {
      text: "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300",
      borderHover: "hover:border-gray-400 dark:hover:border-gray-500",
      bgHover: "group-hover:bg-gray-50 dark:group-hover:bg-gray-900",
      button: "bg-gray-900 dark:bg-white text-white dark:text-black",
      buttonHover: "hover:bg-gray-700 dark:hover:bg-gray-200",
      shadow: "group-hover:shadow-gray-500/10",
    },
    chips: [],
    perks: [
      t("1 Published Page"),
      t("15 Items limit"),
      t("Tierless badge (Required)")
    ],
    caps: [t("Standard themes only"), t("2MB image limit"), t("No analytics")],
  },
  {
    id: "starter",
    name: "Starter",
    monthly: 6.99,
    description: t("For cafes, bars, and small menus."),
    theme: {
      text: "text-teal-500 group-hover:text-teal-600 dark:group-hover:text-teal-400",
      borderHover: "hover:border-teal-400 dark:hover:border-teal-500",
      bgHover: "group-hover:bg-teal-50 dark:group-hover:bg-teal-950/20",
      button: "bg-teal-600 text-white",
      buttonHover: "hover:bg-teal-700",
      shadow: "group-hover:shadow-teal-500/10",
    },
    chips: [
      {
        id: "ocr-import",
        label: t("AI Scan"),
        description: t("Scan your existing menu photo instantly."),
        href: "#",
      },
    ],
    perks: [
      t("AI Menu Scan (OCR)"),
      t("Premium Fonts & Colors"),
      t("50 Items limit"),
    ],
    caps: [t("3 Published Pages"), t("5MB image limit"), t("Badge visible")],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 14.99,
    badge: t("Best Value"),
    description: t("For serious restaurants & integration."),
    theme: {
      text: "text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400",
      borderHover: "hover:border-red-400 dark:hover:border-red-500",
      bgHover: "group-hover:bg-red-50 dark:group-hover:bg-red-950/20",
      button: "bg-red-600 text-white",
      buttonHover: "hover:bg-red-700",
      shadow: "group-hover:shadow-red-500/10",
    },
    chips: [
      {
        id: "embed",
        label: t("Website Embed"),
        description: t("Display your menu directly on your restaurant website."),
        href: "#",
      },
    ],
    perks: [
      t("Website Integration (Embed)"),
      t("Remove Tierless badge"),
      t("All Premium Themes"),
      t("100 Items limit"),
    ],
    caps: [t("5 Published Pages"), t("8MB image limit"), t("Priority Support")],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 29.99,
    isPro: true,
    description: t("For franchises & power users."),
    theme: {
      text: "text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-300",
      borderHover: "",
      bgHover: "group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/20",
      button: "text-white",
      buttonHover: "opacity-90 hover:opacity-100",
      shadow: "group-hover:shadow-indigo-500/10",
    },
    chips: [
      {
        id: "domain",
        label: t("Custom Domain"),
        description: t("Use menu.your-restaurant.com"),
        href: "#",
      },
    ],
    perks: [
      t("3 Custom Domains (SSL)"),
      t("Unlimited Items"),
      t("10 Published Pages"),
    ],
    caps: [t("No reselling allowed"), t("15MB image limit"), t("Dedicated Support")],
  },
];

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
};

function getNextRenewalISO(interval: Interval, plan: PlanId) {
  if (plan === "free") return null;
  const date = new Date();
  if (interval === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString();
}

function getYearlyPricing(monthly: number) {
  const effMonthly = Math.round(monthly * 0.8 * 100) / 100;
  const perYear = Math.round(monthly * 12 * 0.8);
  return {
    effMonthlyLabel: `$${effMonthly.toFixed(2)}`,
    perYearLabel: `$${perYear}/yr`,
  };
}

type InfoModalState = {
  open: boolean;
  title: string;
  body: string;
  href?: string;
};

// --- MAIN PAGE ---
export default function StartPage() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [authed, setAuthed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [info, setInfo] = useState<InfoModalState>({
    open: false,
    title: "",
    body: "",
  });
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Auth & Plan Fetch (zadržano iz originala)
  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const st = await fetch("/api/auth/status?ts=" + Date.now()).then((r) => r.json());
        setAuthed(!!st?.authenticated);
      } catch { }
      try {
        const mp = await fetch("/api/me/plan").then((r) => (r.ok ? r.json() : null));
        const p = mp?.plan;
        setCurrentPlan(p && ["free", "starter", "growth", "pro"].includes(p) ? p : null);
      } catch {
        setCurrentPlan(null);
      }
    };
    fetchAuth();
    window.addEventListener("TL_AUTH_CHANGED", fetchAuth as any);
    return () => window.removeEventListener("TL_AUTH_CHANGED", fetchAuth as any);
  }, []);

  const openInfo = (item: SpecialItem) =>
    setInfo({
      open: true,
      title: item.label,
      body: item.description,
      href: item.href,
    });

  const handlePlanChange = async (planId: PlanId) => {
    if (!authed) return false;
    try {
      const renewsOn = getNextRenewalISO(interval, planId);
      const res = await fetch("/api/me/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, renewsOn }),
      });
      if (!res.ok) return false;
      setCurrentPlan(planId);
      window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
      return true;
    } catch {
      return false;
    }
  };

  // Stil za gradient outline na Toggle dugmetu
  // Koristimo trik: background-clip + transparent border
  const bgCol = isDark ? "#000000" : "#ffffff"; // Mora se poklapati sa pozadinom strane
  const activeToggleStyle = {
    background: `linear-gradient(${bgCol},${bgCol}) padding-box, ${BRAND_GRADIENT} border-box`,
    border: "1px solid transparent",
  };

  return (
    <>
      <StartHeader />

      <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-slate-100">
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:py-24">

          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {t("Simple pricing")}
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
              {t("Choose a plan. Switch anytime.")}
            </p>

            {/* Gradient Toggle Switch */}
            <div className="mt-6 sm:mt-8 flex justify-center">
              <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setInterval("monthly")}
                  className={`
                    relative z-10 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200
                    ${interval === "monthly"
                      ? "text-slate-900 dark:text-white shadow-sm [background:linear-gradient(#ffffff,#ffffff)_padding-box,var(--brand-gradient)_border-box] dark:[background:linear-gradient(#000000,#000000)_padding-box,var(--brand-gradient)_border-box] border border-transparent"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }
                  `}
                >
                  {t("Monthly")}
                </button>

                <button
                  onClick={() => setInterval("yearly")}
                  className={`
                    relative z-10 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 sm:gap-2
                    ${interval === "yearly"
                      ? "text-slate-900 dark:text-white shadow-sm [background:linear-gradient(#ffffff,#ffffff)_padding-box,var(--brand-gradient)_border-box] dark:[background:linear-gradient(#000000,#000000)_padding-box,var(--brand-gradient)_border-box] border border-transparent"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }
                  `}
                >
                  {t("Yearly")}
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1 sm:px-1.5 py-0.5 rounded">
                    -20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid - Responsive: 1 col mobile, 2 col tablet, 4 col desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={interval}
                authed={authed}
                currentPlan={currentPlan}
                onOpenInfo={openInfo}
                onPlanChange={handlePlanChange}
                isDark={isDark}
              />
            ))}
          </div>

          <InfoModal state={info} onClose={() => setInfo({ ...info, open: false })} />
        </main>
      </div>
    </>
  );
}

function PlanCard({
  plan,
  interval,
  authed,
  currentPlan,
  onOpenInfo,
  onPlanChange,
  isDark,
}: {
  plan: Plan;
  interval: Interval;
  authed: boolean;
  currentPlan: PlanId | null;
  onOpenInfo: (item: SpecialItem) => void;
  onPlanChange: (id: PlanId) => Promise<boolean>;
  isDark: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const isCurrent = authed && currentPlan === plan.id;
  const { effMonthlyLabel, perYearLabel } = getYearlyPricing(plan.monthly);

  // Gradient stilovi za Pro tier
  const bgCol = isDark ? "#0f172a" : "#ffffff"; // bg-slate-900 or white
  const proGradientBorder = {
    background: `linear-gradient(${bgCol},${bgCol}) padding-box, ${BRAND_GRADIENT} border-box`,
    border: "1px solid transparent",
  };

  // Gradient stil za Pro dugme
  const proButtonStyle = {
    background: BRAND_GRADIENT,
    border: "none",
  };

  let ctaText = t("Get Started");
  if (authed) {
    if (isCurrent) ctaText = t("Current Plan");
    else if (currentPlan && PLAN_RANK[plan.id] > PLAN_RANK[currentPlan]) ctaText = t("Upgrade");
    else if (currentPlan) ctaText = t("Downgrade");
  }
  if (plan.id === "free" && !authed) ctaText = t("Start Free");

  const ctaHref = isCurrent ? "#" : `/signup?plan=${plan.id}&interval=${interval}`;

  const handleCta = async (e: React.MouseEvent) => {
    if (isCurrent || busy) { e.preventDefault(); return; }
    if (authed) {
      e.preventDefault();
      setBusy(true);
      const ok = await onPlanChange(plan.id);
      if (!ok) window.location.href = ctaHref;
      setBusy(false);
    }
  };

  // Hover detection state za Pro gradient border switch
  // Pošto ne možemo lako koristiti 'group-hover' u style tagu, koristimo CSS varijablu ili klasu.
  // Ovde je najčistije osloniti se na 'group-hover' Tailwind klase za ne-Pro, 
  // a za Pro ćemo uvek imati gradient border (ili ga dodati na mouse enter, ali estetski je bolje da je tu ili suptilan).
  // Tvoj zahtev: "na hover bar da ima tanak outline".

  // Da bi Pro imao outline SAMO na hover koji je gradient, koristimo mali trik sa pseudo elementom ili onMouseEnter/Leave u Reactu
  // Radi jednostavnosti i performansi, ovde ću koristiti React state za hover samo za Pro karticu ako želimo style prop manipulaciju,
  // ALI "cleaner" način je da Pro uvek ima taj border ali transparentan, pa na hover postane vidljiv.
  // Ipak, s obzirom na ograničenja style prop-a i hovera:
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // --- GLAVNI KONTEJNER KARTICE ---
      // h-full obezbeđuje da sve kartice budu iste visine u gridu
      className={`
        group relative flex flex-col h-full rounded-2xl transition-all duration-300
        bg-white dark:bg-slate-900
        ${plan.theme.shadow}
        ${!plan.isPro ? "border border-slate-200 dark:border-slate-800 " + plan.theme.borderHover : ""}
        hover:-translate-y-1
      `}
      // Za Pro tier primenjujemo gradient border samo na hover (ili uvek ako želiš), ovde na hover:
      style={plan.isPro && isHovered ? proGradientBorder : (plan.isPro ? { border: "1px solid rgba(148,163,184,0.1)" } : {})}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
          <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Background Glow effect on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${plan.theme.bgHover}`} />

      <div className="relative p-4 sm:p-6 flex-1 flex flex-col z-10">
        {/* Header */}
        <div className="mb-4">
          <h3 className={`text-lg font-semibold transition-colors ${plan.theme.text}`}>
            {plan.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-1 text-slate-900 dark:text-white">
            <span className="text-3xl font-bold tracking-tight">
              {interval === "monthly" ? `$${plan.monthly}` : effMonthlyLabel.replace("/mo", "")}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">/mo</span>
          </div>

          {interval === "yearly" && plan.monthly > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {t("Billed {price} yearly", { price: perYearLabel })}
            </p>
          )}

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 min-h-[40px]">
            {plan.description}
          </p>
        </div>

        {/* Info Chips */}
        {plan.chips && plan.chips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {plan.chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onOpenInfo(chip)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-20"
              >
                {chip.label}
                <InfoIcon className="size-3 opacity-60" />
              </button>
            ))}
          </div>
        )}

        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors" />

        {/* Perks List - flex-1 gura dugme na dno */}
        <ul className="space-y-3 mt-4 mb-8 flex-1">
          {plan.caps.map((cap, i) => (
            <li key={i} className="text-sm flex items-start gap-3 text-slate-600 dark:text-slate-400">
              <span className={`mt-1.5 size-1.5 rounded-full shrink-0 bg-slate-400 ${plan.isPro ? "bg-indigo-400" : ""}`} />
              <span>{cap}</span>
            </li>
          ))}
          {plan.perks.map((perk, i) => (
            <li key={i} className="text-sm flex items-start gap-3 text-slate-700 dark:text-slate-300">
              <CheckIcon className={`size-4 shrink-0 mt-0.5 text-slate-400 transition-colors ${plan.theme.text}`} />
              <span className="leading-tight">{perk}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button - mt-auto osigurava da je uvek na dnu */}
        <div className="mt-auto pt-4">
          <Link
            href={ctaHref}
            onClick={handleCta}
            style={plan.isPro && !isCurrent ? proButtonStyle : {}}
            className={`
                block w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition-all shadow-sm
                focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black
                ${isCurrent
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : `${plan.theme.button} ${plan.theme.buttonHover}`
              }
            `}
          >
            {busy ? t("Updating...") : ctaText}
          </Link>

          <p className="mt-3 text-[11px] text-center text-slate-400 dark:text-slate-500">
            {plan.id === "free" ? t("No credit card required") : t("Cancel anytime")}
          </p>
        </div>
      </div>
    </div>
  );
}

// ... (InfoModal, CheckIcon, InfoIcon ostaju isti)

function InfoModal({ state, onClose }: { state: InfoModalState; onClose: () => void }) {
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{state.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">{state.body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            {t("Close")}
          </button>
          {state.href && (
            <Link href={state.href} className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg">
              {t("Learn more")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
