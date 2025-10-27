"use client";

import { useEffect, useRef } from "react";

/**
 * DnaGlow2D — tanki “DNK” twin filamenti + dugačak, nežan trail (Canvas 2D)
 * - Additive blending (“lighter”) za neon feel u dark, lepo se vidi i u light (preko mix-blend-mode).
 * - Trail nastaje tako što svaki frejm malo “izbledi” postojeći crtež (destination-out),
 *   pa se novi potez dodaje preko (source-over + lighter).
 * - Nema burn-in piksela, performanse odlične (SCALE, POINTS podešavanja).
 *
 * Najbitnije kontrole (nađi ispod TWEAK BLOK):
 *  - LINE_THICK_CORE: debljina jezgra linije (1.0–1.8 za super tanko)
 *  - LINE_THICK_GLOW: spoljni blur/halo (8–22 za mek glow)
 *  - TRAIL_FADE: 0.02–0.06 (manje = duži trag)
 *  - SPEED_X: 0.8–1.5 (vodoravno klizanje)
 *  - AMP: 0.15–0.26 (amplituda – “otvaranje DNK”)
 *  - JITTER: 0.4–0.9 (mala živa vibracija)
 *  - POINTS: 140–220 (više = glađe, malo skuplje)
 *  - SCALE: 0.6–0.8 (interni render za brzinu)
 */

export default function DnaGlow2D() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext("2d", { alpha: true })!;
    let raf = 0;

    // ---------- TWEAK BLOK ----------
    const SCALE = 0.7;           // interna rezolucija (niže = brže)
    const POINTS = 180;          // broj tačaka po širini
    const SPEED_X = 1.05;        // pikseli po ms (pomera fazu ulevo)
    const FREQ = 1.8;            // broj talasa po širini
    const AMP = 0.20;            // relativna amplituda (0..0.5)
    const JITTER = 0.65;         // jačina “živog” mikro pomeranja
    const TRAIL_FADE = 0.032;    // 0.02–0.06: trail dužina (manje = duže)
    const LINE_THICK_CORE = 1.2; // jezgro linije (px u internoj rezoluciji)
    const LINE_THICK_GLOW = 16;  // halo (shadowBlur + debeli potez)

    // boje čitamo iz CSS varijabli (brand-1/2-rgb)
    const css = getComputedStyle(document.documentElement);
    const c1 = (css.getPropertyValue("--brand-1-rgb") || "124,58,237").trim();
    const c2 = (css.getPropertyValue("--brand-2-rgb") || "250,204,21").trim();
    const rgb1 = `rgb(${c1})`;
    const rgb2 = `rgb(${c2})`;

    // canvas sizing
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const setSize = () => {
      const W = Math.floor(window.innerWidth);
      const H = Math.floor(window.innerHeight);
      cvs.style.width = W + "px";
      cvs.style.height = H + "px";
      cvs.width = Math.max(1, Math.floor(W * DPR * SCALE));
      cvs.height = Math.max(1, Math.floor(H * DPR * SCALE));
    };
    setSize();
    window.addEventListener("resize", setSize);

    // pozicioniranje ispod sadržaja
    cvs.style.position = "fixed";
    cvs.style.inset = "0";
    cvs.style.pointerEvents = "none";
    cvs.style.zIndex = "0";
    // lep blend preko stranice (svetli u dark, nenametno u light)
    const applyBlend = () => {
      const dark = document.documentElement.classList.contains("dark");
      cvs.style.mixBlendMode = dark ? "screen" : "multiply";
      cvs.style.opacity = dark ? "0.58" : "0.42";
    };
    applyBlend();
    const mo = new MutationObserver(applyBlend);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // mala “koherentna” šum funkcija (glatka)
    // approach: value noise sa lerp-om između random čvorova
    const mkNoise = (period = 1200) => {
      let lastT = 0;
      let a = Math.random() * 2 - 1;
      let b = Math.random() * 2 - 1;
      return (t: number) => {
        if (t - lastT > period) {
          lastT = t;
          a = b;
          b = Math.random() * 2 - 1;
        }
        const u = (t - lastT) / period;
        const s = u * u * (3 - 2 * u); // smoothstep lerp
        return a * (1 - s) + b * s;
      };
    };
    const n1 = mkNoise(1400);
    const n2 = mkNoise(1700);
    const n3 = mkNoise(2000);

    // crtanje jedne “žice”
    function drawWire(color: string, phase: number, t: number) {
      const W = cvs.width;
      const H = cvs.height;
      const midY = H * 0.5;

      // jitter oscilacije — blagi, glatki offset
      const jitterY = (n1(t) * 0.5 + n2(t) * 0.5) * (AMP * 0.6) * H * JITTER;

      // priprema puta
      ctx.beginPath();
      for (let i = 0; i <= POINTS; i++) {
        const u = i / POINTS;     // 0..1
        const x = u * W;

        // horizontala “klizi” ulevo preko vremena
        const scroll = (t * SPEED_X) / W; // u pikselima/ms → faza
        const phi = (u + scroll) * (Math.PI * 2) * FREQ + phase;

        // DNK profil
        const y =
          midY +
          Math.sin(phi) * (AMP * H) +
          // malo “živo” treperenje da nije sterilno
          (Math.sin(t * 0.0012 + i * 0.15 + n3(t) * 2) * 0.15 * AMP * H * JITTER) +
          jitterY;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // GLOW sloj (halo)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = color;
      ctx.shadowBlur = LINE_THICK_GLOW;
      ctx.lineWidth = Math.max(2, LINE_THICK_GLOW * 0.35);
      ctx.stroke();
      ctx.restore();

      // CORE sloj (tanka žica)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_THICK_CORE;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }

    // animacija
    const t0 = performance.now();
    const tick = () => {
      const now = performance.now();
      const t = now - t0; // ms

      // 1) blagi “fade out” da nastane trail
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${TRAIL_FADE})`;
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      ctx.restore();

      // 2) novi potezi (dve žice u protiv-fazi)
      drawWire(rgb1, 0.0, t);
      drawWire(rgb2, Math.PI, t);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      mo.disconnect();
    };
  }, []);

  return <canvas ref={ref} />;
}