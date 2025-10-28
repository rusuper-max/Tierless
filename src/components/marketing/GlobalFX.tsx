"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Offset = { x?: number; y?: number; scale?: number };

export default function GlobalFX({
  auroraOffset = { x: 0, y: 0, scale: 1 },
  maskOffset = { x: -16, y: -5, scale: 1 }, // ~(-1rem, -0.3rem)
}: {
  auroraOffset?: Offset;
  maskOffset?: Offset;
}) {
  const [ready, setReady] = useState(false);
  const auroraRoot = useRef<HTMLDivElement | null>(null);
  const maskRoot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Anti-drift zaštite (Safari/Chrome quirks)
    const style = document.createElement("style");
    style.textContent = `
      html, body { transform: none !important; }
      #global-aurora-root, #global-mask-root {
        position: fixed !important;
        top: 0; left: 0; right: 0; bottom: 0;
        width: 100% !important; height: 100% !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);

    const a = document.createElement("div");
    a.id = "global-aurora-root";
    const m = document.createElement("div");
    m.id = "global-mask-root";
    document.body.appendChild(a);
    document.body.appendChild(m);
    auroraRoot.current = a;
    maskRoot.current = m;
    setReady(true);

    return () => {
      style.remove();
      a.remove();
      m.remove();
    };
  }, []);

  if (!ready || !auroraRoot.current || !maskRoot.current) return null;

  const ax = auroraOffset.x ?? 0;
  const ay = auroraOffset.y ?? 0;
  const as = auroraOffset.scale ?? 1;
  const mx = maskOffset.x ?? 0;
  const my = maskOffset.y ?? 0;
  const ms = maskOffset.scale ?? 1;

  return (
    <>
      {/* AURORA — fiksno, iznad marketing-hero-bg, ispod maske/sadržaja */}
      {createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 6,               // ⬅️ iznad hero-bg (z-0), ispod maske (9) i sadržaja (12+)
            pointerEvents: "none",
            transform: `translate3d(${ax}px, ${ay}px, 0) scale(${as})`,
            transformOrigin: "top left",
          }}
          aria-hidden="true"
        >
          <div className="w-full h-full">
            <div className="fx-aurora -tight w-full h-full">
              <span className="spot spot-tl" aria-hidden="true" />
              <span className="l1" />
              <span className="l2" />
              <span className="l3" />
              <span className="l1" />
              <span className="l2" />
              <span className="l3" />
            </div>
          </div>
        </div>,
        auroraRoot.current,
      )}

      {/* LOGO SAFE-ZONE MASKA — fiksno, iznad Aurore, ispod sadržaja */}
      {createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9,               // ⬅️ iznad Aurore (6), ispod sadržaja (12+)
            pointerEvents: "none",
            transform: `translate3d(${mx}px, ${my}px, 0) scale(${ms})`,
            transformOrigin: "top left",
            background:
              "radial-gradient(ellipse 60vmin 5vmin at 0rem 3.5rem, rgba(255,255,255,.98) 0 70%, rgba(255,255,255,.85) 70% 83%, rgba(255,255,255,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0 10rem, rgba(0,0,0,.8) 12rem 18rem, transparent 28rem)",
            maskImage:
              "linear-gradient(to right, transparent 0 10rem, rgba(0,0,0,.8) 12rem 18rem, transparent 28rem)",
          }}
          aria-hidden="true"
        />,
        maskRoot.current,
      )}
    </>
  );
}