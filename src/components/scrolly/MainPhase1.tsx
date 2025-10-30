// src/components/scrolly/MainPhase1.tsx
"use client";

import CTAButton from "@/components/marketing/CTAButton";
import { t } from "@/i18n/t";
import HeroPrism from "@/components/scrolly/HeroPrism";

/**
 * MainPhase1 — BEZ praznog hoda
 * - Track = 100svh → čim krene skrol, odmah ulaziš u sledeću sekciju.
 * - Ako želiš da prizma i dalje rotira, neka ima idle animaciju ili je veži za global scroll,
 *   ali NE za “track” duži od 100svh.
 */
const PIN_HEIGHT_SVH = 100; // <<< KLJUČNO — nema travel-a, nema “praznog hoda”

export default function MainPhase1() {
  // ref ako ti negde treba (ostaje, ali više ne pravi hod)
  const wrapRef = (globalThis as any)._p1ref ??= { current: null as HTMLElement | null };

  return (
    <section
      id="phase1"
      data-phase="1"
      aria-label={t("Hero Phase")}
      className="relative bg-white"
    >
      {/* wrapper visina = 100svh */}
      <div ref={wrapRef} className="relative" style={{ height: `${PIN_HEIGHT_SVH}svh` }}>
        {/* sticky viewport */}
        <div className="sticky top-0 h-[100svh] overflow-hidden relative">
          {/* Lokalna aurora (po želji) */}
          <div className="fx-aurora pointer-events-none z-0" aria-hidden="true" />

          {/* PRISM 3D — sakrij na mobilnom */}
          <div className="hidden md:block">
            <HeroPrism trackRef={wrapRef} offsetX="66%" offsetY="6%" />
          </div>

          {/* HERO CONTENT */}
          <div className="relative z-10 min-h-[100svh] px-4 sm:px-6 grid place-items-center">
            <div className="mx-auto max-w-6xl grid lg:grid-cols-2 items-center gap-10 pt-24">
              <div className="space-y-6 pl-3 sm:pl-0">
                <h1 className="font-semibold tracking-tight text-neutral-900 leading-tight text-[clamp(34px,9.5vw,46px)] sm:text-7xl">
                  {t("hero.title")}
                </h1>
                <p className="text-lg text-neutral-600 max-w-[52ch]">
                  {t("hero.subtitle")}
                </p>
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