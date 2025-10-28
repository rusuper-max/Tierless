// src/components/hero/HeroFX.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type RGB = [number, number, number];
const toUnit = (c: RGB): RGB => [c[0] / 255, c[1] / 255, c[2] / 255];

function parseCssRgbVar(v?: string, fallback: RGB = [79, 70, 229]): RGB {
  if (!v) return fallback;
  const m = v.match(/-?\d+(\.\d+)?/g);
  if (!m || m.length < 3) return fallback;
  return [Math.min(255, +m[0]), Math.min(255, +m[1]), Math.min(255, +m[2])] as RGB;
}

export default function HeroFX() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    const canvas = ref.current;
    if (!canvas) return;

    type GL = WebGLRenderingContext;
    const gl =
      (canvas.getContext("webgl", { premultipliedAlpha: false }) as GL | null) ||
      (canvas.getContext("experimental-webgl", { premultipliedAlpha: false }) as GL | null);
    if (!gl) {
      setSupported(false);
      return;
    }

    // Boje iz CSS varijabli (na klijentu)
    const cs = getComputedStyle(document.documentElement);
    const c1 = toUnit(parseCssRgbVar(cs.getPropertyValue("--brand-1-rgb") || cs.getPropertyValue("--brand-1"), [79, 70, 229]));
    const c2 = toUnit(parseCssRgbVar(cs.getPropertyValue("--brand-2-rgb") || cs.getPropertyValue("--brand-2"), [34, 211, 238]));

    // DPR scaling (~0.7)
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.7;
    const resize = () => {
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    let rezTimer: number | null = null;
    const debouncedResize = () => {
      if (rezTimer) cancelAnimationFrame(rezTimer);
      rezTimer = requestAnimationFrame(resize);
    };
    resize();
    window.addEventListener("resize", debouncedResize);

    // Shaders
    const vertSrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // Hash-dither (nema indeksiranja nizom) + pasivan drift
    const fragSrc = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec3 u_c1;
      uniform vec3 u_c2;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.,0.));
        float c = hash(i + vec2(0.,1.));
        float d = hash(i + vec2(1.,1.));
        vec2 u = f*f*(3.-2.*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        for(int i=0;i<5;i++){
          v += a*noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main(){
        vec2 p = (v_uv - 0.5);
        p.x *= u_res.x/u_res.y;

        float t = u_time * 0.12;
        vec2 q = p*2.0 + vec2(t, -t*0.8);
        float w = fbm(q + vec2(sin(t*0.7), cos(t*0.6))*0.2);

        float ink = smoothstep(0.25, 0.95, fbm(q + w));
        float edge = smoothstep(0.0, 0.4, 1.0 - length(p)*1.15);

        vec3 col = mix(u_c1, u_c2, ink) * edge;

        // smirenje saturacije za light pozadinu
        float luma = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(luma), 0.10);

        // hash dither — jednostavno, bez nizova
        float d = hash(gl_FragCoord.xy) - 0.5;
        col += d * 0.01;

        gl_FragColor = vec4(clamp(col, 0.0, 1.0), 0.85);
      }
    `;

    const program = gl.createProgram()!;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, vertSrc);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(vs)); setSupported(false); return; }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, fragSrc);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(fs)); setSupported(false); return; }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(program)); setSupported(false); return; }
    gl.useProgram(program);

    // Fullscreen triangle
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const verts = new Float32Array([-1,-1, 3,-1, -1,3]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const u_res = gl.getUniformLocation(program, "u_res");
    const u_time = gl.getUniformLocation(program, "u_time");
    const u_c1 = gl.getUniformLocation(program, "u_c1");
    const u_c2 = gl.getUniformLocation(program, "u_c2");
    gl.uniform3f(u_c1, c1[0], c1[1], c1[2]);
    gl.uniform3f(u_c2, c2[0], c2[1], c2[2]);

    // Render loop (bez scroll logike za sada da svedemo bugove na 0)
    let t0 = performance.now();
    const frame = () => {
      rafRef.current = requestAnimationFrame(frame);
      const t = (performance.now() - t0) / 1000;
      gl.uniform2f(u_res, canvas.width, canvas.height);
      gl.uniform1f(u_time, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    frame();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      gl.deleteShader(vs); gl.deleteShader(fs);
      gl.deleteProgram(program); gl.deleteBuffer(buf);
    };
  }, []);

  if (!supported) return null;

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 -z-10 pointer-events-none mix-blend-screen"
      style={{ contain: "strict", opacity: 0.7 }}
      aria-hidden="true"
    />
  );
}