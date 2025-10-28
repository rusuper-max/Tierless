"use client";

import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n/t";

/**
 * Phase 1 — Sticky hero sa lokalnom (scoped) aurorom.
 * - Aurora je .fx-aurora.is-local => position: absolute (samo u ovoj sceni).
 * - Sticky visina preko inline style => Tailwind ne mora da parsira dinamičku klasu.
 */

const PIN_HEIGHT_VH = 180;

export default function SceneHeroPhase() {
  return (
    <section aria-label={t("Hero Phase")} className="relative">
      {/* wrapper visina određuje koliko dugo traje sticky */}
      <div className="relative" style={{ height: `${PIN_HEIGHT_VH}vh` }}>
        {/* sticky viewport */}
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Lokalna aurora */}
          <div className="fx-aurora -tight is-local pointer-events-none z-0" aria-hidden="true">
            <span className="spot spot-tl" aria-hidden="true" />
            <span className="l1" />
            <span className="l2" />
            <span className="l3" />
          </div>

          {/* Hero sadržaj (centriran) */}
          <div className="relative z-10 min-h-[100svh] px-4 sm:px-6 grid place-items-center">
            <div className="mx-auto max-w-6xl grid lg:grid-cols-2 items-center gap-10 pt-24">
              {/* Dodatni levi “buffer” samo na mobilu da T ne bude na ivici */}
              <div className="space-y-6 pl-3 sm:pl-0">
                <h1 className="font-semibold tracking-tight text-neutral-900 leading-tight text-[clamp(34px,9.5vw,46px)] sm:text-7xl">
                  {t("hero.title")}
                </h1>

                <p className="text-lg text-neutral-600 max-w-[52ch]">
                  {t("hero.subtitle")}
                </p>

                {/* CTA — sada je u sticky sceni, ne upada u Phase 2 */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <CTAButton
                    fx="swap-up"
                    variant="brand"
                    size="lg"
                    pill
                    href="/signup"
                    label={t("hero.ctaPrimary")}
                  />
                  <CTAButton
                    fx="swap-up"
                    variant="outline"
                    size="lg"
                    pill
                    href="/templates"
                    className="ml-3"
                    label={t("hero.ctaSecondary")}
                  />
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}