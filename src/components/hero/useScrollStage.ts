// src/components/hero/useScrollStage.ts
"use client";

import { useEffect, useState } from "react";

export type Stage = "hero" | "copy1" | "pricing" | "cta";

const IDS: Stage[] = ["hero", "copy1", "pricing", "cta"];

export function useScrollStage(): Stage {
  const [stage, setStage] = useState<Stage>("hero");

  useEffect(() => {
    const sections = IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // uzmi najveći intersectionRatio
        let best: { id: Stage; r: number } = { id: "hero", r: -1 };
        for (const e of entries) {
          const id = e.target.id as Stage;
          if (e.intersectionRatio > best.r) best = { id, r: e.intersectionRatio };
        }
        if (best.r >= 0) setStage(best.id);
      },
      { threshold: [0.05, 0.2, 0.5, 0.8] }
    );

    sections.forEach((el) => io.observe(el));

    const onScrollFallback = () => {
      // ako IO ne radi, odredi po viewport pragovima
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (y < vh * 0.6) setStage("hero");
      else if (y < vh * 1.6) setStage("copy1");
      else if (y < vh * 2.6) setStage("pricing");
      else setStage("cta");
    };

    // mali fallback listener (pasivno)
    window.addEventListener("scroll", onScrollFallback, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScrollFallback);
    };
  }, []);

  return stage;
}