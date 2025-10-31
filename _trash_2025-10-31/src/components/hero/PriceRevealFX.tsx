// src/components/hero/PriceRevealFX.tsx
"use client";

import { useEffect, useRef } from "react";

type Props = { targetId?: string; durationMs?: number };

export default function PriceRevealFX({ targetId = "pricing", durationMs = 2300 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const section = document.getElementById(targetId);
    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    let active = false;

    const fit = () => {
      const r = section.getBoundingClientRect();
      canvas.style.position = "absolute";
      canvas.style.inset = "0";
      canvas.style.zIndex = "1";
      canvas.style.pointerEvents = "none";

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.floor(r.width * dpr));
      const h = Math.max(1, Math.floor(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let rezTimer: number | null = null;
    const onResize = () => {
      if (rezTimer) cancelAnimationFrame(rezTimer);
      rezTimer = requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener("resize", onResize);

    const start = () => {
      if (active) return;
      active = true;
      const startAt = performance.now();

      const cs = getComputedStyle(document.documentElement);
      const c1 = cs.getPropertyValue("--brand-1").trim() || "#7e3af2";
      const c2 = cs.getPropertyValue("--brand-2").trim() || "#eab308";

      const draw = () => {
        const now = performance.now();
        const t = now - startAt;

        // Fading trail — polutransparentno "gasimo" staro
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Parametri linija
        const lines = 10;
        for (let i = 0; i < lines; i++) {
          const p = i / (lines - 1 || 1);
          const dir = i % 2 === 0 ? 1 : -1;
          const y = (canvas.height * (0.15 + 0.7 * p)) | 0;
          const prog = Math.min(1, t / durationMs);
          const x0 = dir > 0 ? -canvas.width * (1 - prog) : canvas.width * (1 - prog);
          const x1 = canvas.width * 0.33 + (Math.sin((t * 0.002 + i) * 1.7) * canvas.width) / 40;
          const x2 = canvas.width * 0.66 + (Math.cos((t * 0.002 + i) * 1.3) * canvas.width) / 35;
          const x3 = dir > 0 ? canvas.width * prog : canvas.width * (1 - prog);

          ctx.beginPath();
          ctx.moveTo(x0, y);
          ctx.bezierCurveTo(x1, y - 40 * dir, x2, y + 40 * dir, x3, y);
          ctx.lineWidth = 1 + 1.5 * Math.sin((t * 0.006 + i) * 2.0 + p * 3.14);
          ctx.shadowBlur = 12;
          ctx.shadowColor = i % 2 === 0 ? c1 : c2;
          ctx.globalAlpha = 0.75 * (1 - Math.pow(1 - prog, 2));
          ctx.strokeStyle = i % 2 === 0 ? c1 : c2;
          ctx.stroke();
        }

        // Kraj animacije
        if (t < durationMs) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          // odjavimo se i "ugasimo" preostali trail par frame-ova
          let frames = 8;
          const fadeOut = () => {
            frames--;
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            if (frames > 0) rafRef.current = requestAnimationFrame(fadeOut);
          };
          fadeOut();
        }
      };

      draw();
    };

    const stop = () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Intersection observer
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) start();
        else stop();
      },
      { threshold: 0.25 }
    );
    io.observe(section);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, [targetId, durationMs]);

  return <canvas ref={ref} aria-hidden="true" />;
}