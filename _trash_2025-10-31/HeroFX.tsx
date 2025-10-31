// src/components/hero/HeroFX.tsx
"use client";

import { useEffect, useRef } from "react";

type HeroFXProps = {
  /** 0..1 — ukupna vidljivost efekta (na belom 0.14–0.24) */
  opacity?: number;
  /** render canvasa (ekran) DPR skala (0.6–0.9) */
  dprScale?: number;
  /** simulacija teksta je još niža radi performansi (0.35–0.7) */
  simScale?: number;
  /** screen (light), multiply (dark), ili normal */
  blendMode?: "screen" | "multiply" | "normal";
  enabled?: boolean;
};

export default function HeroFX({
  opacity = 0.2,
  dprScale = 0.75,
  simScale = 0.5,
  blendMode = "screen",
  enabled = true,
}: HeroFXProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        premultipliedAlpha: true,
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      // bez WebGL-a: nema efekta (fallback je CSS pozadina)
      return;
    }

    // ---------- Common helpers ----------
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s) || "shader compile failed");
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const createProgram = (vsSrc: string, fsSrc: string) => {
      const vs = createShader(gl.VERTEX_SHADER, vsSrc);
      const fs = createShader(gl.FRAGMENT_SHADER, fsSrc);
      if (!vs || !fs) return null;
      const p = gl.createProgram()!;
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p) || "program link failed");
        gl.deleteProgram(p);
        return null;
      }
      return p;
    };

    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    const quadVerts = new Float32Array([
      -1, -1, 1, -1, -1, 1,
      1, -1, 1,  1, -1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // ---------- Shaders ----------
    const vs = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){
        v_uv = (a_pos + 1.0) * 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;

    // 1) Sim pass: advekcija + difuzija + decay + injekcije
    const fsSim = `
      precision highp float;
      varying vec2 v_uv;

      uniform sampler2D u_tex;   // prethodni dye (R kanal)
      uniform vec2 u_res;        // rezolucija sim teksture (px)
      uniform float u_time;
      uniform vec2 u_mouse;      // 0..1 (NDC)
      uniform float u_dt;        // vremenski korak
      uniform float u_adv;       // jačina advekcije
      uniform float u_diff;      // difuzija (0..1)
      uniform float u_decay;     // gašenje po frejmu (0..1)
      uniform vec2 u_inj1;       // injection centar (0..1)
      uniform vec2 u_inj2;       // injection centar (0..1)
      uniform float u_injAmt;    // količina dodavanja

      // hash / noise / fbm
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0,0.0));
        float c = hash(i + vec2(0.0,1.0));
        float d = hash(i + vec2(1.0,1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      float fbm(vec2 p){
        float v = 0.0;
        float a = 0.5;
        for(int i=0;i<5;i++){
          v += a * noise(p);
          p = mat2(0.8,-0.6,0.6,0.8)*p*2.0;
          a *= 0.55;
        }
        return v;
      }

      // curl-noise (divergence-free) aproksimacija
      vec2 curl(vec2 p){
        float e = 0.0015;
        // grad potencijala
        float px1 = fbm(p + vec2(e,0.0));
        float px2 = fbm(p - vec2(e,0.0));
        float py1 = fbm(p + vec2(0.0,e));
        float py2 = fbm(p - vec2(0.0,e));
        // rotirani grad (∇⊥)
        return vec2(py1 - py2, -(px1 - px2));
      }

      void main(){
        vec2 uv = v_uv;
        // koords za curl
        vec2 p = uv * 3.0 + vec2(0.0, u_time*0.07);
        vec2 v = curl(p) * u_adv;     // polje brzina

        // blagi uticaj miša (privlačenje)
        vec2 m = u_mouse;
        v += (m - uv) * 0.05 * u_adv;

        // advekcija: uzmi prethodni dye u tački uv - v*dt (backtrace)
        vec2 back = uv - v * u_dt;
        vec4 prev = texture2D(u_tex, back);

        // difuzija (5-tap blur)
        vec2 px = 1.0 / u_res;
        vec4 n = texture2D(u_tex, uv + vec2(0.0, -px.y));
        vec4 s = texture2D(u_tex, uv + vec2(0.0,  px.y));
        vec4 e = texture2D(u_tex, uv + vec2( px.x, 0.0));
        vec4 w = texture2D(u_tex, uv + vec2(-px.x, 0.0));
        vec4 diffused = mix(prev, 0.25*(n+s+e+w), u_diff);

        float dye = diffused.r;

        // injekcije (dva izvora, blag radius i perlin treperenje)
        float r1 = distance(uv, u_inj1);
        float r2 = distance(uv, u_inj2);
        float pulse = 0.5 + 0.5*sin(u_time*1.15);
        dye += u_injAmt * smoothstep(0.15, 0.0, r1) * (0.7 + 0.3*pulse);
        dye += u_injAmt * smoothstep(0.18, 0.0, r2) * (0.7 + 0.3*pulse);

        // decay (lagano gašenje)
        dye *= u_decay;

        // lagano "clamp i kontrast" da bude više “ink” nego “fog”
        dye = clamp(dye, 0.0, 1.0);
        dye = pow(dye, 1.1);

        gl_FragColor = vec4(dye, dye, dye, 1.0);
      }
    `;

    // 2) Draw pass: bojenje brend bojama + vignette + dither
    const fsDraw = `
      precision highp float;
      varying vec2 v_uv;

      uniform sampler2D u_tex;   // poslednji sim rezultat
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec3 u_c1;
      uniform vec3 u_c2;
      uniform float u_intensity;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
      float dither(vec2 p){ return (hash(p + fract(u_time*0.123)) - 0.5) / 255.0; }

      void main(){
        float dye = texture2D(u_tex, v_uv).r;

        // edge-emphasis: blago naglasi rubove (ali bez artefakata)
        vec2 px = 1.0 / u_res;
        float gx = texture2D(u_tex, v_uv + vec2(px.x, 0.0)).r - texture2D(u_tex, v_uv - vec2(px.x, 0.0)).r;
        float gy = texture2D(u_tex, v_uv + vec2(0.0, px.y)).r - texture2D(u_tex, v_uv - vec2(0.0, px.y)).r;
        float edge = clamp( (abs(gx)+abs(gy))*0.6, 0.0, 1.0 );
        dye = clamp(dye + edge*0.08, 0.0, 1.0);

        // radijalni fade
        vec2 st = v_uv - 0.5;
        st.x *= u_res.x / u_res.y;
        float vign = smoothstep(1.2, 0.25, length(st));
        dye *= vign;

        vec3 col = mix(u_c1, u_c2, dye);
        col *= u_intensity;

        col += dither(gl_FragCoord.xy);
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const simProg = createProgram(vs, fsSim)!;
    const drawProg = createProgram(vs, fsDraw)!;

    // a_pos za oba programa
    const bindPosAttrib = (prog: WebGLProgram) => {
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // --------- Textures & FBO ping-pong ----------
    const createTexture = (w: number, h: number) => {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      return t;
    };

    const createFBO = (tex: WebGLTexture) => {
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return fbo;
    };

    let texA = createTexture(4, 4);
    let texB = createTexture(4, 4);
    let fboA = createFBO(texA);
    let fboB = createFBO(texB);

    // ------ Uniform lokacije ------
    // sim
    const u_sim_tex = gl.getUniformLocation(simProg, "u_tex")!;
    const u_sim_res = gl.getUniformLocation(simProg, "u_res")!;
    const u_sim_time = gl.getUniformLocation(simProg, "u_time")!;
    const u_sim_mouse = gl.getUniformLocation(simProg, "u_mouse")!;
    const u_sim_dt = gl.getUniformLocation(simProg, "u_dt")!;
    const u_sim_adv = gl.getUniformLocation(simProg, "u_adv")!;
    const u_sim_diff = gl.getUniformLocation(simProg, "u_diff")!;
    const u_sim_decay = gl.getUniformLocation(simProg, "u_decay")!;
    const u_sim_inj1 = gl.getUniformLocation(simProg, "u_inj1")!;
    const u_sim_inj2 = gl.getUniformLocation(simProg, "u_inj2")!;
    const u_sim_injAmt = gl.getUniformLocation(simProg, "u_injAmt")!;

    // draw
    const u_draw_tex = gl.getUniformLocation(drawProg, "u_tex")!;
    const u_draw_res = gl.getUniformLocation(drawProg, "u_res")!;
    const u_draw_time = gl.getUniformLocation(drawProg, "u_time")!;
    const u_draw_c1 = gl.getUniformLocation(drawProg, "u_c1")!;
    const u_draw_c2 = gl.getUniformLocation(drawProg, "u_c2")!;
    const u_draw_int = gl.getUniformLocation(drawProg, "u_intensity")!;

    // ---- Boje iz CSS-a ----
    const pickBrandColors = () => {
      const cs = getComputedStyle(document.documentElement);
      const get = (k: string) => cs.getPropertyValue(k).trim();

      const parseRgb = (v: string): [number, number, number] | null => {
        const m =
          v.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i) ||
          v.match(/(\d+)\s+(\d+)\s+(\d+)/);
        if (!m) return null;
        return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255];
      };

      const fallback1: [number, number, number] = [79 / 255, 70 / 255, 229 / 255];
      const fallback2: [number, number, number] = [34 / 255, 211 / 255, 238 / 255];

      const raw1 = get("--brand-1-rgb") || get("--brand-1");
      const raw2 = get("--brand-2-rgb") || get("--brand-2");

      return {
        c1: parseRgb(raw1) || fallback1,
        c2: parseRgb(raw2) || fallback2,
      };
    };
    const { c1, c2 } = pickBrandColors();

    // ---- Resize & setup ----
    let raf = 0;
    let lastT = performance.now();
    let start = lastT;

    const mouse: [number, number] = [0.6, 0.35];

    const setSizes = () => {
      const pr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const renderScale = Math.max(0.5, Math.min(1.0, dprScale));
      const simR = Math.max(0.3, Math.min(1.0, simScale));

      // render canvas
      const cw = Math.floor(window.innerWidth * pr * renderScale);
      const ch = Math.floor(window.innerHeight * pr * renderScale);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      // sim textures
      const sw = Math.max(64, Math.floor(cw * simR));
      const sh = Math.max(64, Math.floor(ch * simR));

      // recreate ping-pong to new size
      const newA = createTexture(sw, sh);
      const newB = createTexture(sw, sh);
      const newFboA = createFBO(newA);
      const newFboB = createFBO(newB);

      // free previous
      gl.deleteTexture(texA);
      gl.deleteTexture(texB);
      gl.deleteFramebuffer(fboA);
      gl.deleteFramebuffer(fboB);

      texA = newA; texB = newB;
      fboA = newFboA; fboB = newFboB;
    };
    setSizes();

    let resizeTimer: number | undefined;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setSizes, 150);
    };
    window.addEventListener("resize", onResize);

    // mouse — veoma blag uticaj
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      mouse[0] += (nx - mouse[0]) * 0.08;
      mouse[1] += (ny - mouse[1]) * 0.08;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Ping-pong refs
    let readTex = texA, writeTex = texB;
    let readFbo = fboA, writeFbo = fboB;
    const swap = () => {
      [readTex, writeTex] = [writeTex, readTex];
      [readFbo, writeFbo] = [writeFbo, readFbo];
    };

    // ---- Main loop ----
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.033, (now - lastT) / 1000); // clamp max 33ms
      lastT = now;
      const t = (now - start) / 1000;

      // 1) SIM STEP: advection + diffusion + decay + injection
      gl.useProgram(simProg);
      bindPosAttrib(simProg);

      // target: writeFbo
      gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
      // viewport = size of writeTex (we didn't store size, but we can query with gl.getTexLevelParameter? not in webgl1)
      // Shortcut: we know it's canvas size * simScale; but not stored. We'll set via drawing to full FBO; it's ok.

      // bind prev texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(u_sim_tex, 0);

      // uniforms
      // We cannot query texture size easily; instead compute from canvas size * simScale again:
      const pr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const renderScale = Math.max(0.5, Math.min(1.0, dprScale));
      const simR = Math.max(0.3, Math.min(1.0, simScale));
      const sw = Math.max(64, Math.floor(Math.floor(window.innerWidth * pr * renderScale) * simR));
      const sh = Math.max(64, Math.floor(Math.floor(window.innerHeight * pr * renderScale) * simR));
      gl.viewport(0, 0, sw, sh);

      gl.uniform2f(u_sim_res, sw, sh);
      gl.uniform1f(u_sim_time, t);
      gl.uniform2f(u_sim_mouse, mouse[0], 1.0 - mouse[1]);
      gl.uniform1f(u_sim_dt, dt);
      gl.uniform1f(u_sim_adv, 0.55);     // jačina advekcije (probaj 0.45–0.75)
      gl.uniform1f(u_sim_diff, 0.22);    // difuzija (0..1)
      gl.uniform1f(u_sim_decay, 0.985);  // blago gašenje
      // injektori – kruže oko centra + mousy
      const inj1x = 0.45 + 0.18 * Math.cos(t * 0.35) + (mouse[0]-0.5)*0.10;
      const inj1y = 0.38 + 0.14 * Math.sin(t * 0.28) + (1.0 - mouse[1]-0.5)*0.06;
      const inj2x = 0.62 + 0.16 * Math.cos(t * 0.22 + 1.3);
      const inj2y = 0.44 + 0.12 * Math.sin(t * 0.31 + 0.6);
      gl.uniform2f(u_sim_inj1, inj1x, inj1y);
      gl.uniform2f(u_sim_inj2, inj2x, inj2y);
      gl.uniform1f(u_sim_injAmt, 0.035); // količina boje po frejmu

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // swap ping-pong
      swap();

      // 2) DRAW to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(drawProg);
      bindPosAttrib(drawProg);

      const cw = canvas.width, ch = canvas.height;
      gl.viewport(0, 0, cw, ch);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, readTex);
      gl.uniform1i(u_draw_tex, 0);
      gl.uniform2f(u_draw_res, cw, ch);
      gl.uniform1f(u_draw_time, t);
      gl.uniform3f(u_draw_c1, c1[0], c1[1], c1[2]);
      gl.uniform3f(u_draw_c2, c2[0], c2[1], c2[2]);
      gl.uniform1f(u_draw_int, 1.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(null);
      gl.deleteTexture(texA);
      gl.deleteTexture(texB);
      gl.deleteFramebuffer(fboA);
      gl.deleteFramebuffer(fboB);
      gl.deleteBuffer(quadBuf);
      gl.deleteProgram(simProg);
      gl.deleteProgram(drawProg);
    };
  }, [enabled, dprScale, simScale]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        mixBlendMode: blendMode,
        opacity,
        display:
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "none"
            : "block",
      }}
    />
  );
}