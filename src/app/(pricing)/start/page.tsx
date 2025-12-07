"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n";
import StartHeader from "@/components/StartHeader";

// --- TYPES & CONFIG ---
type Interval = "monthly" | "yearly";
type PlanId = "free" | "starter" | "growth" | "pro" | "agency";

// ============================================
// 🍋 LEMON SQUEEZY VARIANT IDS
// ============================================
const LEMON_VARIANTS: Record<string, { monthly?: string; yearly?: string }> = {
  starter: { monthly: "1122011", yearly: "1123106" },
  growth: { monthly: "1123104", yearly: "1123107" },
  pro: { monthly: "1123105", yearly: "1123108" },
  agency: { monthly: "1133562", yearly: "1133564" },
};

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
  theme: {
    text: string;
    borderHover: string;
    bgHover: string;
    button: string;
    buttonHover: string;
    shadow: string;
    focusRing?: string;
    glowColor?: string;
  };
};

const PLAN_BLUEPRINTS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthly: 0,
    description: "Perfect for testing the editor.",
    theme: {
      text: "text-slate-500 dark:text-slate-400",
      borderHover: "group-hover:border-slate-300 dark:group-hover:border-slate-600",
      bgHover: "group-hover:bg-slate-50 dark:group-hover:bg-slate-900",
      button: "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700",
      buttonHover: "hover:bg-slate-200 dark:hover:bg-slate-700",
      shadow: "group-hover:shadow-slate-500/10",
      focusRing: "focus-visible:ring-slate-400",
      glowColor: "gray",
    },
    chips: [],
    perks: [
      "1 Published Page",
      "15 Items limit",
      "Tierless badge (Required)"
    ],
    caps: ["Standard themes only", "2MB image limit", "No analytics"],
  },
  {
    id: "starter",
    name: "Starter",
    monthly: 9.99,
    description: "Perfect for freelancers and side projects.",
    theme: {
      text: "text-teal-600 dark:text-teal-400",
      borderHover: "group-hover:border-teal-400 dark:group-hover:border-teal-500",
      bgHover: "group-hover:bg-teal-50/50 dark:group-hover:bg-teal-950/20",
      button: "bg-teal-600 text-white shadow-lg shadow-teal-500/20",
      buttonHover: "hover:bg-teal-500 hover:shadow-teal-500/30",
      shadow: "group-hover:shadow-teal-500/10",
      focusRing: "focus-visible:ring-teal-500",
      glowColor: "teal",
    },
    chips: [
      {
        id: "ocr-import",
        label: "AI Scan",
        description: "Scan your existing menu photo instantly.",
        href: "/faq#ai-scan",
      },
    ],
    perks: [
      "AI Menu Scan (OCR)",
      "Premium Fonts & Colors",
      "Analytics Dashboard",
      "50 Items limit",
    ],
    caps: ["3 Published Pages", "5MB image limit", "Badge visible"],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 19.99,
    badge: "Best Value",
    description: "For small businesses and professionals.",
    theme: {
      text: "text-rose-600 dark:text-rose-400",
      borderHover: "group-hover:border-rose-400 dark:group-hover:border-rose-500",
      bgHover: "group-hover:bg-rose-50/50 dark:group-hover:bg-rose-950/20",
      button: "bg-rose-600 text-white shadow-lg shadow-rose-500/25",
      buttonHover: "hover:bg-rose-500 hover:shadow-rose-500/40",
      shadow: "group-hover:shadow-rose-500/20",
      focusRing: "focus-visible:ring-rose-500",
      glowColor: "rose",
    },
    chips: [
      {
        id: "embed",
        label: "Website Embed",
        description: "Display your menu directly on your restaurant website.",
        href: "/faq#embed",
      },
    ],
    perks: [
      "Website Integration (Embed)",
      "Remove Tierless badge",
      "All Premium Themes",
      "Background Video",
      "100 Items limit",
    ],
    caps: ["5 Published Pages", "8MB image limit", "Priority Support"],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 39.99,
    description: "For serious businesses.",
    theme: {
      text: "text-purple-600 dark:text-purple-400",
      borderHover: "group-hover:border-purple-400 dark:group-hover:border-purple-500",
      bgHover: "group-hover:bg-purple-50/50 dark:group-hover:bg-purple-950/20",
      button: "bg-purple-600 text-white shadow-lg shadow-purple-500/25",
      buttonHover: "hover:bg-purple-500 hover:shadow-purple-500/40",
      shadow: "group-hover:shadow-purple-500/20",
      focusRing: "focus-visible:ring-purple-500",
      glowColor: "purple",
    },
    chips: [
      {
        id: "domain",
        label: "Custom Domain",
        description: "Use menu.your-restaurant.com",
        href: "/faq#custom-domain",
      },
    ],
    perks: [
      "3 Custom Domains (SSL)",
      "Unlimited Items",
      "10 Published Pages",
      "Team Collaboration (15 seats)",
      "Webhooks & API",
    ],
    caps: ["50 Total Pages", "15MB image limit", "Dedicated Support"],
  },
  {
    id: "agency",
    name: "Agency",
    monthly: 99.99,
    description: "For agencies managing multiple clients.",
    theme: {
      text: "text-indigo-600 dark:text-indigo-400",
      borderHover: "group-hover:border-indigo-400 dark:group-hover:border-indigo-500",
      bgHover: "group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-950/20",
      button: "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25",
      buttonHover: "hover:bg-indigo-500 hover:shadow-indigo-500/40",
      shadow: "group-hover:shadow-indigo-500/20",
      focusRing: "focus-visible:ring-indigo-500",
      glowColor: "indigo",
    },
    chips: [
      {
        id: "client-workspaces",
        label: "Client Workspaces",
        description: "Create up to 25 separate client workspaces with their own teams.",
        href: "/faq#client-workspaces",
      },
    ],
    perks: [
      "10 Custom Domains (SSL)",
      "50 Published Pages",
      "25 Client Workspaces",
      "50 Team Seats",
      "Priority Support",
    ],
    caps: ["200 Total Pages", "25MB image limit", "White Label"],
  },
];

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

function localizePlans(base: Plan[], translate: TranslateFn): Plan[] {
  return base.map((plan) => ({
    ...plan,
    name: translate(plan.name),
    description: plan.description ? translate(plan.description) : plan.description,
    perks: plan.perks.map((perk) => translate(perk)),
    caps: plan.caps.map((cap) => translate(cap)),
    chips: plan.chips?.map((chip) => ({
      ...chip,
      label: translate(chip.label),
      description: translate(chip.description),
    })),
  }));
}

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  agency: 4,
};

function getYearlyPricing(monthly: number) {
  const effMonthly = Math.round(monthly * 0.7 * 100) / 100;
  const perYear = Math.round(monthly * 12 * 0.7);
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
  const t = useT();
  const [interval, setInterval] = useState<Interval>("monthly");
  const [authed, setAuthed] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);
  const [info, setInfo] = useState<InfoModalState>({
    open: false,
    title: "",
    body: "",
  });
  const plans = useMemo(() => localizePlans(PLAN_BLUEPRINTS, t), [t]);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const st = await fetch("/api/auth/status?ts=" + Date.now()).then((r) => r.json());
        setAuthed(!!st?.authenticated);
      } catch { }
      try {
        const mp = await fetch("/api/me/plan").then((r) => (r.ok ? r.json() : null));
        const p = mp?.plan;
        setCurrentPlan(p && ["free", "starter", "growth", "pro", "agency"].includes(p) ? p : null);
      } catch {
        setCurrentPlan(null);
      }
    };
    fetchAuth();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.addEventListener("TL_AUTH_CHANGED", fetchAuth as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => window.removeEventListener("TL_AUTH_CHANGED", fetchAuth as any);
  }, []);

  const openInfo = (item: SpecialItem) =>
    setInfo({
      open: true,
      title: item.label,
      body: item.description,
      href: item.href,
    });

  const handlePlanChange = async (planId: PlanId): Promise<boolean | "redirect"> => {
    if (!authed) return false;

    if (planId === "free") {
      try {
        const res = await fetch("/api/me/plan", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planId, renewsOn: null }),
        });
        if (!res.ok) return false;
        setCurrentPlan(planId);
        window.dispatchEvent(new Event("TL_AUTH_CHANGED"));
        return true;
      } catch {
        return false;
      }
    }

    const variantConfig = LEMON_VARIANTS[planId];
    const variantId = interval === "yearly" ? variantConfig?.yearly : variantConfig?.monthly;

    if (!variantId) {
      alert(t("Payment not configured. Please contact support."));
      return false;
    }

    try {
      const res = await fetch("/api/integrations/lemon/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/start`,
        }),
      });

      if (!res.ok) {
        alert(t("Failed to start checkout. Please try again."));
        return false;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return "redirect";
      }
      return false;
    } catch (err) {
      alert(t("Failed to start checkout. Please try again."));
      return false;
    }
  };

  return (
    <>
      <StartHeader />

      <div className="min-h-screen bg-slate-50/50 dark:bg-black text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/20">
        
        {/* Ambient Background Glows */}
        <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/10 pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed top-20 left-0 w-[400px] h-[400px] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

        <main className="relative mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">

          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
              {t("Simple pricing")}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {t("Choose a plan. Switch anytime.")} <br className="hidden sm:block" />
              <span className="opacity-70">Start small and scale as you grow.</span>
            </p>

            {/* Gradient Toggle Switch (Restored) */}
            <div className="mt-10 flex justify-center">
              <div className="relative flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-full border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setInterval("monthly")}
                  className={`
                    relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-all duration-200
                    ${interval === "monthly"
                      ? "text-slate-900 dark:text-white shadow-sm [background:linear-gradient(#ffffff,#ffffff)_padding-box,var(--brand-gradient,linear-gradient(to_right,#4f46e5,#9333ea))_border-box] dark:[background:linear-gradient(#000000,#000000)_padding-box,var(--brand-gradient,linear-gradient(to_right,#4f46e5,#9333ea))_border-box] border border-transparent"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }
                  `}
                >
                  {t("Monthly")}
                </button>

                <button
                  onClick={() => setInterval("yearly")}
                  className={`
                    relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2
                    ${interval === "yearly"
                      ? "text-slate-900 dark:text-white shadow-sm [background:linear-gradient(#ffffff,#ffffff)_padding-box,var(--brand-gradient,linear-gradient(to_right,#4f46e5,#9333ea))_border-box] dark:[background:linear-gradient(#000000,#000000)_padding-box,var(--brand-gradient,linear-gradient(to_right,#4f46e5,#9333ea))_border-box] border border-transparent"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent"
                    }
                  `}
                >
                  {t("Yearly")}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                    interval === 'yearly'
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    -30%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Plans Grid - items-stretch ensures equal height */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-4 items-stretch relative z-10">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={interval}
                authed={authed}
                currentPlan={currentPlan}
                onOpenInfo={openInfo}
                onPlanChange={handlePlanChange}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
             <p className="text-sm text-slate-500 dark:text-slate-500">
               Need a custom enterprise solution? <a href="mailto:contact@tierless.net" className="text-slate-900 dark:text-white underline underline-offset-4 hover:text-indigo-500">Contact us</a>
             </p>
          </div>

          <InfoModal state={info} onClose={() => setInfo({ ...info, open: false })} />
        </main>
      </div>
    </>
  );
}

// --- SUBCOMPONENTS ---

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
  onPlanChange: (id: PlanId) => Promise<boolean | "redirect">;
}) {
  const [busy, setBusy] = useState(false);
  const t = useT();
  const isCurrent = authed && currentPlan === plan.id;
  const { effMonthlyLabel, perYearLabel } = getYearlyPricing(plan.monthly);
  
  // Highlight "Best Value" plans (Growth) visually
  const isFeatured = plan.id === 'growth';

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
      const result = await onPlanChange(plan.id);
      if (result === "redirect") return;
      if (!result && !authed) window.location.href = ctaHref;
      setBusy(false);
    }
  };

  // Dynamic glow colors based on theme
  const glowColors: Record<string, string> = {
    teal: "group-hover:shadow-[0_0_30px_-5px_rgba(20,184,166,0.3)] dark:group-hover:shadow-[0_0_30px_-5px_rgba(20,184,166,0.15)]",
    rose: "group-hover:shadow-[0_0_30px_-5px_rgba(225,29,72,0.3)] dark:group-hover:shadow-[0_0_30px_-5px_rgba(225,29,72,0.15)]",
    purple: "group-hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.3)] dark:group-hover:shadow-[0_0_30px_-5px_rgba(147,51,234,0.15)]",
    indigo: "group-hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)] dark:group-hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.15)]",
    gray: "group-hover:shadow-lg",
  };
  const glowClass = plan.theme.glowColor ? glowColors[plan.theme.glowColor] : "group-hover:shadow-lg";

  return (
    <div
      className={`
        group relative flex flex-col h-full
        bg-white dark:bg-[#0A0A0A]
        rounded-2xl transition-all duration-300 ease-out
        border border-slate-200 dark:border-slate-800
        hover:-translate-y-1
        ${plan.theme.borderHover}
        ${glowClass}
        ${isFeatured ? 'z-20 shadow-xl border-slate-300 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10' : ''}
      `}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-0 right-0 flex justify-center z-20">
          <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Hover Background Gradient */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${plan.theme.bgHover}`} />

      <div className="relative p-5 xl:p-4 flex-1 flex flex-col z-10">
        
        {/* Card Header */}
        <div className="mb-6">
          <h3 className={`text-lg font-bold transition-colors ${plan.theme.text} flex items-center gap-2`}>
            {plan.name}
          </h3>

          <div className="mt-3 flex items-baseline gap-1 text-slate-900 dark:text-white">
            <span className="text-4xl font-extrabold tracking-tight">
              {interval === "monthly" ? `$${plan.monthly}` : effMonthlyLabel.replace("/mo", "")}
            </span>
            {plan.monthly > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">/mo</span>
            )}
          </div>

          <div className="h-6 mt-1">
            {interval === "yearly" && plan.monthly > 0 && (
              <p className="text-xs text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/50 inline-block px-1.5 py-0.5 rounded">
                {t("Billed {price} yearly", { price: perYearLabel })}
              </p>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400 min-h-[40px]">
            {plan.description}
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-8">
          <Link
            href={ctaHref}
            onClick={handleCta}
            aria-disabled={isCurrent || undefined}
            className={`
                block w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black
                ${plan.theme.focusRing ?? "focus-visible:ring-slate-400"}
                ${isCurrent
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-transparent"
                : `${plan.theme.button} ${plan.theme.buttonHover}`
              }
            `}
          >
            {busy ? (
               <span className="flex items-center justify-center gap-2">
                 <span className="size-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 {t("Processing...")}
               </span>
            ) : ctaText}
          </Link>
          
          <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-600 font-medium">
             {plan.id === "free" ? "No card needed" : "Cancel anytime"}
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-6 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors" />

        {/* Chips (Special Features) */}
        {plan.chips && plan.chips.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Highlights</p>
            <div className="flex flex-wrap gap-2">
              {plan.chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => onOpenInfo(chip)}
                  className={`
                    w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all
                    border border-slate-100 dark:border-slate-800
                    hover:border-slate-300 dark:hover:border-slate-600
                    bg-slate-50/50 dark:bg-slate-900/50
                    text-slate-700 dark:text-slate-300
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    <StarIcon className={`size-3 ${plan.theme.text}`} />
                    {chip.label}
                  </span>
                  <InfoIcon className="size-3.5 opacity-40 hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Perks List */}
        <div className="flex-1">
          <ul className="space-y-3">
            {plan.perks.map((perk, i) => (
              <li key={i} className="text-[13px] flex items-start gap-3 text-slate-700 dark:text-slate-300 leading-snug">
                <CheckIcon className={`size-4 shrink-0 mt-0.5 ${plan.theme.text}`} />
                <span>{perk}</span>
              </li>
            ))}
             {plan.caps.map((cap, i) => (
              <li key={`cap-${i}`} className="text-[13px] flex items-start gap-3 text-slate-500 dark:text-slate-500 leading-snug">
                <div className="size-4 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="size-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

function InfoModal({ state, onClose }: { state: InfoModalState; onClose: () => void }) {
  const t = useT();
  if (!state.open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 pr-8">{state.title}</h3>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1">
          <CloseIcon className="size-5" />
        </button>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{state.body}</p>
        <div className="mt-6 flex justify-end gap-3">
          {state.href && (
            <Link href={state.href} className="w-full text-center px-4 py-2.5 text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity">
              {t("Learn more")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// --- ICONS ---

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.75 12.75L10 15.25L16.25 8.75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}
