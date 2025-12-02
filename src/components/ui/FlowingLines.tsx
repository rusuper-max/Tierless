"use client";

import { useEffect, useRef } from "react";

type HelixConfig = {
  y: number;
  amplitude: number;
  frequency: number;
  speed: number;
  colorA: string;
  colorB: string;
};

const HELICES: HelixConfig[] = [
  { y: 0.22, amplitude: 0.08, frequency: 0.006, speed: 0.02, colorA: "99, 102, 241", colorB: "6, 182, 212" },
  { y: 0.5, amplitude: 0.12, frequency: 0.004, speed: 0.016, colorA: "139, 92, 246", colorB: "56, 189, 248" },
  { y: 0.78, amplitude: 0.09, frequency: 0.007, speed: 0.024, colorA: "6, 182, 212", colorB: "79, 70, 229" },
];

/**
 * Canvas-based neon helix lines inspired by the reference snippet.
 * Optimized for low CPU usage by limiting draw resolution and dpr.
 */
export default function FlowingLines({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let frameId: number;
    const helices = HELICES.map((helix) => ({ ...helix, offset: Math.random() * 1000 }));
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? 400;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const rgba = (color: string, alpha: number) => `rgba(${color}, ${alpha})`;

    const drawStrand = (
      baseY: number,
      amplitude: number,
      freq: number,
      speed: number,
      offset: number,
      phase: number,
      gradient: CanvasGradient,
      glow: string
    ) => {
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const angle = x * freq + time * speed + offset + phase;
        const y = baseY + Math.sin(angle) * amplitude;
        if (x === 0) ctx.moveTo(0, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineWidth = 1.25;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawHelix = (helix: HelixConfig & { offset: number }) => {
      const baseY = helix.y * height;
      const amplitude = helix.amplitude * height;
      const gradientA = ctx.createLinearGradient(0, 0, width, 0);
      gradientA.addColorStop(0, rgba(helix.colorA, 0.12));
      gradientA.addColorStop(1, rgba(helix.colorB, 0.4));
      const gradientB = ctx.createLinearGradient(0, 0, width, 0);
      gradientB.addColorStop(0, rgba(helix.colorB, 0.12));
      gradientB.addColorStop(1, rgba(helix.colorA, 0.38));

      drawStrand(baseY, amplitude, helix.frequency, helix.speed, helix.offset, 0, gradientA, rgba(helix.colorB, 0.35));
      drawStrand(baseY, amplitude, helix.frequency, helix.speed, helix.offset, Math.PI, gradientB, rgba(helix.colorA, 0.3));
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      helices.forEach(drawHelix);
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      frameId = requestAnimationFrame(tick);
      time += 0.6;
      render();
    };

    if (prefersReducedMotion) {
      render();
    } else {
      tick();
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} />;
}
