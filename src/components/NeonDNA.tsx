"use client";

import { useEffect, useRef } from "react";

/**
 * Dve tanke neon trake (purple/orange) koje lete horizontalno
 * preko celog ekrana, izlaze van leve/desne ivice i vraćaju se
 * sa suprotne strane (wrap-around). Imaju dugačak, lagan trail i iskrice.
 */
export default function NeonDNA() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    let raf = 0;

    // ==== podesivi parametri (slobodno menjaj brojeve) ====
    const DIR = -1;             // -1 = desno→levo, 1 = levo→desno
    const SPEED = 1.45;         // px/frame brzina pomeranja (1.0–2.0 je “mirno”)
    const FREQ = 0.010;         // talasna frekvencija (veće = zbijeniji talas)
    const THIN_BASE = 0.25;     // minimum debljine linije (još tanje? smanji npr. 0.15)
    const THIN_MAX  = 1.25;     // maksimum debljine pri “svežem” delu traga
    const TRAIL_LEN = 240;      // broj tačaka u trail-u (veće = duži trag)
    const FADE_BG_DARK = 0.055; // tamno zatamnjenje po frame-u
    const FADE_BG_LITE = 0.055; // svetlo zatamnjenje po frame-u
    const SPARK_RATE   = 0.07;  // verovatnoća iskri po frame-u (0..1)
    const DPR_LIMIT    = 2;     // cap DPI skaliranja
    // ======================================================

    // DPI & resize
    const DPR = Math.max(1, Math.min(DPR_LIMIT, window.devicePixelRatio || 1));
    let W = 0, H = 0, MARGIN = 120, AMP = 120;
    const resize = () => {
      W = Math.floor(window.innerWidth);
      H = Math.floor(window.innerHeight);
      MARGIN = Math.max(80, Math.min(220, Math.round(Math.min(W, H) * 0.12)));
      AMP = Math.round(Math.min(W, H) * 0.22);    // amplituda sin talasa
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // CSS brand boje
    const css = getComputedStyle(document.documentElement);
    const PUR = css.getPropertyValue("--brand-1-rgb").trim() || "124,58,237";
    const ORA = css.getPropertyValue("--brand-2-rgb").trim() || "250,204,21";
    const isDark = () => document.documentElement.classList.contains("dark");

    type V = { x:number; y:number };
    const t1: V[] = [];
    const t2: V[] = [];

    // head pozicija (start malo van ekrana da “uleti”)
    let xHead = DIR > 0 ? -MARGIN : W + MARGIN;
    let time = 0;

    // iskrice
    const sparks: {x:number;y:number;vx:number;vy:number;life:number;color:string}[] = [];
    const rnd = (a:number,b:number)=>a+Math.random()*(b-a);

    function push(arr: V[], p: V) {
      arr.push(p);
      if (arr.length > TRAIL_LEN) arr.shift();
    }

    function drawTrail(arr: V[], rgb: string) {
      if (arr.length < 2) return;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 1; i < arr.length; i++) {
        const p0 = arr[i-1], p1 = arr[i];
        const age = i / arr.length; // 0..1
        const a = 0.52 * age * age;
        ctx.strokeStyle = `rgba(${rgb},${a})`;
        ctx.lineWidth = THIN_BASE + THIN_MAX * age * age;
        ctx.shadowColor = `rgba(${rgb},${Math.min(0.9, a*1.6)})`;
        ctx.shadowBlur = 10 + 26 * age;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    function spark(x:number, y:number, rgb:string) {
      sparks.push({
        x, y,
        vx: rnd(-1.2, 1.2),
        vy: rnd(-1.0, -0.2),
        life: rnd(26, 44),
        color: rgb
      });
    }

    function step() {
      // lagani fade “mastilo u vodi”
      ctx.globalCompositeOperation = "source-over";
      const f = isDark() ? FADE_BG_DARK : FADE_BG_LITE;
      ctx.fillStyle = isDark() ? `rgba(0,0,0,${f})` : `rgba(255,255,255,${f})`;
      ctx.fillRect(0, 0, W, H);

      // Head napred → wrap sa ivice
      xHead += DIR * SPEED;
      if (DIR < 0 && xHead < -MARGIN) {            // desno→levo, izašao levo
        xHead = W + MARGIN;
        t1.length = 0; t2.length = 0;              // prekini trag na wrap-u
      } else if (DIR > 0 && xHead > W + MARGIN) {  // levo→desno, izašao desno
        xHead = -MARGIN;
        t1.length = 0; t2.length = 0;
      }

      // blaga “živost” amplitude i centra
      const wob = 1 + Math.sin(time * 0.001) * 0.05;
      const cx = H * 0.5 + Math.sin(time * 0.0008) * H * 0.04;
      const A = AMP * wob;

      // DNK: dve sinusoide u kontra fazi (isti x, suprotan talas)
      const ang = xHead * FREQ + time * 0.0026;
      const y1 = cx + A * Math.sin(ang);
      const y2 = cx - A * Math.sin(ang + Math.PI);

      push(t1, { x: xHead, y: y1 });
      push(t2, { x: xHead, y: y2 });

      // iskrice uz “vrhove”
      if (Math.random() < SPARK_RATE) spark(xHead, y1, PUR);
      if (Math.random() < SPARK_RATE) spark(xHead, y2, ORA);

      // trake
      drawTrail(t1, PUR);
      drawTrail(t2, ORA);

      // update & crtaj iskrice
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += isDark() ? 0.012 : 0.016;
        s.life -= 1;
        const a = Math.max(0, Math.min(1, s.life / 44));
        ctx.fillStyle = `rgba(${s.color},${0.5*a})`;
        ctx.shadowColor = `rgba(${s.color},${Math.min(0.85, a)})`;
        ctx.shadowBlur = 10 + 14 * a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 0.7 + 1.4*a, 0, Math.PI*2);
        ctx.fill();
        if (s.life <= 0) sparks.splice(i,1);
      }
      ctx.shadowBlur = 0;

      time += 16.6667;
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Canvas je fiksiran preko cele strane; blend definisan u globals.css (.neon-canvas)
  return <canvas ref={ref} className="neon-canvas" aria-hidden="true" />;
}