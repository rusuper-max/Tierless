// src/components/hero/BackgroundFX.tsx
"use client";

import { useState } from "react";
import { t } from "@/i18n/t";

type Props = {
  /** Ako želiš mali prekidač za pauzu animacije (dev/test). */
  showToggle?: boolean;
  /** Početno stanje animacije. */
  motionOn?: boolean;
};

export default function BackgroundFX({ showToggle = false, motionOn = true }: Props) {
  const [motion, setMotion] = useState(motionOn);

  return (
    <>
      <div
        className="fx-root pointer-events-none"
        data-motion={motion ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="fx-aurora" />
        <div className="fx-prism" />
      </div>

      {/* LOGO SAFE ZONE: soft white fade za gornji levi ugao (iznad FX-a, ispod sadržaja) */}
      <div
        className="fixed inset-0 z-[0] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 56vmin 28vmin at 10rem 6rem, rgba(255,255,255,0.98) 0 70%, rgba(255,255,255,0.85) 70% 82%, rgba(255,255,255,0) 100%)",
        }}
        aria-hidden="true"
      />

      {showToggle && (
        <button
          type="button"
          onClick={() => setMotion((v) => !v)}
          aria-label={motion ? t("Pause animation") : t("Play animation")}
          className="fx-toggle"
        >
          {motion ? t("Pause animation") : t("Play animation")}
        </button>
      )}
    </>
  );
}