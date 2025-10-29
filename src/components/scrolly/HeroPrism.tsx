// src/components/scrolly/HeroPrism.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * HeroPrism — CSS 3D kocka sa brand “glass” izgledom.
 * - Rotacija oko Y je vezana za scroll u okviru trackRef (sticky track Phase1).
 * - Svaka "face" može da prikaže PNG (object-fit: contain).
 * - offsetX/offsetY pomeraju prizmu (koriste se CSS varijable --prism-tx/--prism-ty).
 *
 * VAŽNO (CSS):
 * U marketing.css neka .prism koristi:
 *   transform: translate3d(var(--prism-tx,0), var(--prism-ty,0), 0)
 *              rotateX(var(--prism-rx)) rotateY(var(--prism-ry));
 * i u @keyframes prism-idle isto ubaci translate3d(...) da animacija ne pregazi offset.
 */

export type Faces = Array<string | null | undefined>; // [front, back, right, left, top, bottom]

export default function HeroPrism({
  trackRef,
  faces,
  suppressFallback = true,
  offsetX = "0%",
  offsetY = "0%",
}: {
  trackRef: React.RefObject<HTMLElement | HTMLDivElement | null>;
  faces?: Faces;
  suppressFallback?: boolean;
  offsetX?: string;
  offsetY?: string;
}) {
  const prismRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = trackRef.current as HTMLElement | null;
    const prism = prismRef.current;
    if (!wrap || !prism) return;

    let raf = 0;
    const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const travel = Math.max(1, rect.height - vh);
      const raw = clamp((vh - rect.top) / travel, 0, 1);
      const ry = raw * 360; // puni krug kroz Phase1
      prism.style.setProperty("--prism-ry", `${ry}deg`);
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

    // Kratak “pulse” da isprati font/image reflow odmah posle mount-a
    const id = setInterval(update, 250);
    setTimeout(() => clearInterval(id), 1500);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [trackRef]);

  const Face = ({ idx, fallback }: { idx: number; fallback: string }) => {
    const src = faces?.[idx];
    if (!src && suppressFallback) {
      return <div className="face-content" aria-hidden />;
    }
    return (
      <div className="face-content">
        {src ? (
          <img
            src={src}
            alt=""
            decoding="async"
            loading="lazy"
            className="hero-prism-face-img"
          />
        ) : (
          <div className="label">{fallback}</div>
        )}
      </div>
    );
  };

  return (
    <div className="hero-prism3d" aria-hidden>
      <div
        ref={prismRef}
        className="prism"
        style={{
          // CSS varijable koje koristi .prism u transform-u
          ["--prism-tx" as any]: offsetX,
          ["--prism-ty" as any]: offsetY,
        }}
      >
        <div className="face f-front"><Face idx={0} fallback="For mechanics" /></div>
        <div className="face f-back"><Face idx={1} fallback="For dentists" /></div>
        <div className="face f-right"><Face idx={2} fallback="For photographers" /></div>
        <div className="face f-left"><Face idx={3} fallback="For salons" /></div>
        <div className="face f-top"><Face idx={4} fallback="For trainers" /></div>
        <div className="face f-bottom"><Face idx={5} fallback="For any craft" /></div>
      </div>
    </div>
  );
}