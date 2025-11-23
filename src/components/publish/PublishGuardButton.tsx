"use client";

import { useState } from "react";
import { t } from "@/i18n";
import { useEntitlement } from "@/hooks/useEntitlement";
import type { UsageNeeds, PlanId } from "@/lib/entitlements";
import { PLAN_ORDER } from "@/lib/entitlements";
import { useToast } from "@/hooks/useToast";
import { track } from "@/lib/track";
import { Button } from "@/components/ui/Button";

type Props = {
  needs: UsageNeeds;
  onPublish: () => Promise<void> | void;
  className?: string;
  label?: string;
  disabled?: boolean;
  planOverride?: PlanId | null;
  deeplinkInterval?: "monthly" | "yearly";
};

function rankOf(p: PlanId | null | undefined) {
  return p ? PLAN_ORDER.indexOf(p) : -1;
}

export default function PublishGuardButton({
  needs,
  onPublish,
  className,
  label = "Publish",
  disabled,
  planOverride = null,
  deeplinkInterval = "yearly",
}: Props) {
  const [open, setOpen] = useState(false);
  const { success, info, error } = useToast();

  const { loading, plan, limits: limitsResult, suggestPlan, openUpsell } = useEntitlement({
    feature: undefined,
    needs,
    planOverride,
  });
  const limitsOk = limitsResult?.ok ?? true;

  const handleClick = async () => {
    if (disabled || loading) return;
    track("publish_clicked", { needs, plan: plan ?? null, ok: limitsOk });

    if (!limitsOk) {
      setOpen(true);
      info(t("Upgrade required"), t("You have reached your current plan limits."));
      track("publish_blocked", { needs, plan: plan ?? null, suggestPlan: suggestPlan ?? "tierless" });
      return;
    }

    try {
      await onPublish();
      success(t("Published successfully"));
      track("publish_success", { plan: plan ?? null, needs });
    } catch (e: any) {
      error(t("Publish failed"), e?.message || t("Please try again."));
      track("publish_failed", { message: String(e?.message || e) });
    }
  };

  const target = suggestPlan ?? "tierless";
  const isUpgrade = rankOf(target) > rankOf(plan);

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || loading}
        variant="brand"
        size="sm"
        className={className}
      >
        {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="relative z-[86] w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t("You can't publish yet")}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("Your current plan doesn't meet the limits required to publish this page.")}
            </p>

            <pre className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-[11px] text-slate-700 dark:text-slate-200 overflow-auto">
              {JSON.stringify(needs, null, 2)}
            </pre>

            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                onClick={() => setOpen(false)}
                variant="neutral"
                size="xs"
              >
                {t("Close")}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  href={`/start?highlight=${target}&interval=${deeplinkInterval}`}
                  onClick={() => track("see_plans_clicked", { target, interval: deeplinkInterval })}
                  variant="brand"
                  size="xs"
                >
                  {t("See plans")}
                </Button>
                <Button
                  onClick={() => {
                    openUpsell({ requiredPlan: target, needs, entrypoint: "limits" } as any);
                    setOpen(false);
                    info(t("Opening upgrade…"));
                    track("upsell_opened", { requiredPlan: target, entrypoint: "limits", interval: deeplinkInterval });
                  }}
                  variant="brand"
                  size="xs"
                >
                  {isUpgrade ? t("Upgrade") : t("View plans")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}