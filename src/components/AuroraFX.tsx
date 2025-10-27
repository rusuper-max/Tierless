// src/components/AuroraFX.tsx
"use client";

import { useEffect, useRef } from "react";

/**
 * GPU aurora (WebGL) – “mastilo u vodi”.
 * - Poštuje globalno stanje (localStorage + custom event).
 * - Kad je OFF: canvas je display:none i render petlja potpuno staje.
 * - Promena teme ne “pali” canvas ako je OFF.
 */
export default function AuroraFX() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const runningRef = useRef(false);
  const enabledRef = useRef<boolean>(true); // biće overwrite iz LS
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const KEY = "tierless:mist:enabled";

    // ----- init enabled from LS -----
    const fromLS = (() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw === "0") return false;
        if (raw === "1") return true;
      } catch {}
      return true; // default ON
    })();
    enabledRef.current = fromLS;

    const canvas = canvasRef.current!;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) return;
    glRef.current = gl;

    // ---------- Shaders ----------
    const VERT = `
      attribute vec2 a_position;
      void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const FRAG = `
      precision mediump float;
      uniform vec2  u_res;
      uniform float u_time;
      uniform vec2  u_mouse;
      uniform vec3  u_c1;
      uniform vec3  u_c2;
      uniform float u_intensity;

      mat2 rot(float a){ float s=sin(a), c=cos(a); return mat2(c,-s,s,c); }
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p), f=fract(p);
        vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
                   mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
      }
      float fbm(vec2 p){
        float v=0.0, a=0.5;
        for(int i=0;i<5;i++){
          v+=a*noise(p);
          p=rot(1.5708)*p*1.95+0.5;
          a*=0.55;
        }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        vec2 p  = (uv - 0.5);
        p.x *= u_res.x / u_res.y;

        // sporije kretanje nego ranije
        float t = u_time * 0.00035;

        vec2 flow = vec2(t*1.4, 0.0);

        vec2 m = (u_mouse - 0.5);
        m.x *= u_res.x / u_res.y;

        float f1 = fbm((p*2.0 + flow) + m*0.6);
        float f2 = fbm((p*2.0 - flow) - m*0.6);

        float mask = smoothstep(0.2, 0.9, f1) + smoothstep(0.2, 0.9, f2);
        mask = clamp(mask, 0.0, 1.2);

        vec3 col = mix(u_c1, u_c2, 0.5 + 0.5*(f1 - f2));
        col = pow(col, vec3(1.2));
        col *= (0.35 + 0.65*mask) * u_intensity;

        float d = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
        col += (d - 0.5) / 255.0;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    progRef.current = prog;

    // full-screen tri
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes       = gl.getUniformLocation(prog, "u_res");
    const uTime      = gl.getUniformLocation(prog, "u_time");
    const uMouse     = gl.getUniformLocation(prog, "u_mouse");
    const uC1        = gl.getUniformLocation(prog, "u_c1");
    const uC2        = gl.getUniformLocation(prog, "u_c2");
    const uIntensity = gl.getUniformLocation(prog, "u_intensity");

    // boje iz CSS varijabli
    const css = getComputedStyle(document.documentElement);
    const toRGB = (v: string) =>
      v.split(",").map((n) => Math.max(0, Math.min(255, parseFloat(n)))) as number[];
    const c1 = toRGB(css.getPropertyValue("--brand-1-rgb").trim() || "124,58,237");
    const c2 = toRGB(css.getPropertyValue("--brand-2-rgb").trim() || "250,204,21");
    gl.uniform3f(uC1, c1[0]/255, c1[1]/255, c1[2]/255);
    gl.uniform3f(uC2, c2[0]/255, c2[1]/255, c2[2]/255);

    // rezolucija (downscale radi FPS-a)
    const SCALE = 0.7;
    const DPR = Math.min(1.75, window.devicePixelRatio || 1);
    const setSize = () => {
      const W = Math.floor(window.innerWidth);
      const H = Math.floor(window.innerHeight);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      canvas.width  = Math.max(1, Math.floor(W * DPR * SCALE));
      canvas.height = Math.max(1, Math.floor(H * DPR * SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    setSize();
    window.addEventListener("resize", setSize);

    // blend po temi (ne diramo display!)
    const isDark = () => document.documentElement.classList.contains("dark");
    const applyBlend = () => {
      canvas.style.position = "fixed";
      canvas.style.inset = "0";
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = "0";
      canvas.style.display = enabledRef.current ? "block" : "none"; // poštuj stanje
      canvas.style.mixBlendMode = isDark() ? "screen" : "multiply";
      canvas.style.opacity = isDark() ? "0.55" : "0.42";
    };
    applyBlend();

    const themeObs = new MutationObserver(applyBlend);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // mouse
    const mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMove);

    // petlja
    const start = performance.now();
    const loop = () => {
      if (!runningRef.current) return;
      const gl = glRef.current!;
      const t = performance.now() - start;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);

      const intensity = isDark() ? 0.65 : 0.58;
      gl.uniform1f(uIntensity, intensity);

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      if (!runningRef.current) return;
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };

    // primeni inicijalno stanje
    if (enabledRef.current) {
      canvas.style.display = "block";
      startLoop();
    } else {
      canvas.style.display = "none";
      stopLoop();
    }

    // slušaj global toggle
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      enabledRef.current = !!detail;
      try { localStorage.setItem(KEY, enabledRef.current ? "1" : "0"); } catch {}
      canvas.style.display = enabledRef.current ? "block" : "none";
      if (enabledRef.current) startLoop();
      else stopLoop();
    };
    window.addEventListener("tierless-mist-toggle", onToggle as EventListener);

    return () => {
      stopLoop();
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("tierless-mist-toggle", onToggle as EventListener);
      themeObs.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} />;
}