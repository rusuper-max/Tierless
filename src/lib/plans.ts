import type { Calculator } from "@/types/calculator";

export type PlanId = "free" | "starter" | "pro" | "business";

export const PLAN_LIMITS: Record<PlanId, {
  maxPackages: number;   // relevantno kada je pricingMode="packages"
  maxItems: number;      // relevantno kada je pricingMode="list"
  canHideBadge: boolean; // pravo da sakrije "Made with Tierless" bedž
}> = {
  free:     { maxPackages: 2,  maxItems: 50,   canHideBadge: false },
  starter:  { maxPackages: 3,  maxItems: 200,  canHideBadge: true  },
  pro:      { maxPackages: 99, maxItems: 1000, canHideBadge: true  },
  business: { maxPackages: 999,maxItems: 100000, canHideBadge: true },
};

export function getPlanFromSession(s: any): PlanId {
  const p = s?.user?.plan;
  return (p === "starter" || p === "pro" || p === "business") ? p : "free";
}

export function clampForPlan(plan: PlanId, calc: Calculator): Calculator {
  const limits = PLAN_LIMITS[plan];
  const out: Calculator = JSON.parse(JSON.stringify(calc));

  if ((out.pricingMode ?? "packages") === "packages") {
    if (Array.isArray(out.packages)) {
      out.packages = out.packages.slice(0, limits.maxPackages);
    }
  } else {
    if (Array.isArray(out.items)) {
      out.items = out.items.slice(0, limits.maxItems);
    }
  }

  // zabrana skrivanja bedža na free
  const hide = (out as any)?.meta?.branding?.hideBadge;
  if (hide && !limits.canHideBadge) {
    (out as any).meta.branding.hideBadge = false;
  }

  return out;
}

export function validateAgainstPlan(plan: PlanId, calc: Calculator): { ok: true } | {
  ok: false; error: "plan_limit"; detail: string; limits: any;
} {
  const limits = PLAN_LIMITS[plan];
  const mode = calc.pricingMode ?? "packages";

  if (mode === "packages") {
    const n = (calc.packages ?? []).length;
    if (n > limits.maxPackages) {
      return { ok: false, error: "plan_limit", detail: `Too many packages (${n} > ${limits.maxPackages})`, limits };
    }
  } else {
    const n = (calc.items ?? []).length;
    if (n > limits.maxItems) {
      return { ok: false, error: "plan_limit", detail: `Too many items (${n} > ${limits.maxItems})`, limits };
    }
  }

  const hide = (calc as any)?.meta?.branding?.hideBadge;
  if (hide && !limits.canHideBadge) {
    return { ok: false, error: "plan_limit", detail: "Hiding badge is not allowed on current plan.", limits };
  }

  return { ok: true };
}