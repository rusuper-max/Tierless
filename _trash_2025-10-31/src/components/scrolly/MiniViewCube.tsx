// src/components/scrolly/MiniViewCube.tsx
"use client";

import { useEffect, useRef } from "react";
import { t } from "@/i18n";

export default function MiniViewCube({
  trackRef,
  rx,
  ry,
  onChange,
}: {
  trackRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  rx: number;
  ry: number;
  onChange: (next: { rx: number; ry: number }) => void;
}) {
  const cubeRef = useRef<HTMLDivElement>(null);
  const scrollRyRef = useRef(0);

  const apply = () => {
    const el = cubeRef.current;
    if (!el) return;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry + scrollRyRef.current}deg)`;
  };

  // isti scroll algoritam kao u HeroPrism-u
  useEffect(() => {
    const wrap = trackRef.current as HTMLElement | null;
    if (!wrap) return;
    let raf = 0;
    const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vh);
      const raw = clamp((vh - rect.top) / travel, 0, 1);
      scrollRyRef.current = raw * 360;
      apply();
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trackRef]);

  // re-aplikacija kada parent promeni rx/ry
  useEffect(() => { apply(); }, [rx, ry]);

  // drag rotate
  useEffect(() => {
    const el = cubeRef.current;
    if (!el) return;

    let drag = false;
    let sx = 0, sy = 0, startRX = 0, startRY = 0;

    const down = (e: PointerEvent) => {
      drag = true;
      el.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY;
      startRX = rx; startRY = ry;
      (el as any).style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      const nextRX = Math.max(-45, Math.min(25, startRX - dy * 0.4));
      const nextRY = startRY + dx * 0.6;
      onChange({ rx: nextRX, ry: nextRY });
      e.preventDefault();
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      drag = false;
      try { el.releasePointerCapture(e.pointerId); } catch {}
      (el as any).style.cursor = "grab";
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    (el as any).style.cursor = "grab";

    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [rx, ry, onChange]);

  // UI
  return (
    <div
      className="absolute left-3 bottom-3 sm:left-5 sm:bottom-5 z-20 select-none"
      data-lenis-prevent
    >
      <div
        className="relative grid place-items-center"
        style={{ width: 88, height: 110 }}
      >
        {/* kocka */}
        <div
          ref={cubeRef}
          className="mini-cube"
          style={{
            width: 64,
            height: 64,
            transformStyle: "preserve-3d",
            transition: "transform .08s linear",
          }}
        >
          {/** faces */}
          <Face label="FRONT" style={{ transform: "rotateY(0deg) translateZ(32px)" }} />
          <Face label="BACK"  style={{ transform: "rotateY(180deg) translateZ(32px)" }} />
          <Face label="RIGHT" style={{ transform: "rotateY(90deg) translateZ(32px)" }} />
          <Face label="LEFT"  style={{ transform: "rotateY(-90deg) translateZ(32px)" }} />
          <Face label="TOP"   style={{ transform: "rotateX(90deg) translateZ(32px)" }} />
          <Face label="BOTTOM"style={{ transform: "rotateX(-90deg) translateZ(32px)" }} />
        </div>

        {/* label ispod */}
        <div className="absolute -bottom-4 left-0 right-0 text-center text-[11px] font-medium text-neutral-700">
          {t("Turn the cube")}
        </div>
      </div>

      {/* mobilni: malo manja kocka */}
      <style>{`
        @media (max-width: 639px) {
          .mini-cube { width: 56px !important; height: 56px !important; }
          .mini-cube .face { font-size: 9px !important; }
        }
      `}</style>
    </div>
  );
}

function Face({ label, style }: { label: string; style: React.CSSProperties }) {
  return (
    <div
      className="face grid place-items-center border rounded-md bg-white/90 shadow-sm"
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backfaceVisibility: "hidden",
        borderColor: "rgba(0,0,0,.1)",
        ...style,
      }}
    >
      <span className="text-[10px] font-semibold text-neutral-700">{label}</span>
    </div>
  );
}