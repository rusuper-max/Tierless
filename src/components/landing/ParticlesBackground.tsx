"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, Texture } from "ogl";

export default function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. SETUP RENDERER
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      depth: false
    });
    const gl = renderer.gl;

    gl.canvas.style.display = "block";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.position = "absolute";
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";

    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 45 });
    camera.position.set(0, 0, 5);

    function resize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    }
    window.addEventListener("resize", resize, false);
    resize();

    // ==========================================
    // 0. GENERISANJE CENA (SMART ATLAS)
    // ==========================================
    const makePriceAtlas = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const cols = 8;
      const rows = 8;
      const cellW = size / cols;
      const cellH = size / rows;

      // GLOBAL MIX LISTA
      const prices = [
        "$9.99", "€15", "£20", "¥1500",
        "CHF 10", "$49", "€9.50", "£5/mo",
        "1200 RSD", "R$ 50", "kr 99", "zł 25",
        "₹499", "AED 100", "HK$ 50", "₽500",
        "Free", "PRO", "Team", "Basic",
        "/mo", "/yr", "+VAT", "Trial",
        "99¢", "10k", "1M+", "0.00",
        "$1", "€0", "100%", "50% OFF",
        "₿ 0.1", "Ξ 2.5", "API", "SaaS",
        "$19", "$29", "$99", "$299",
        "€25", "€12", "€60", "€5",
        "DIN 500", "KM 10", "Kn 50", "Lek 100",
        "Sale", "Hot", "New", "Best"
      ];

      ctx.clearRect(0, 0, size, size);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";

      for (let i = 0; i < (cols * rows); i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellW + cellW / 2;
        const y = row * cellH + cellH / 2;
        const text = prices[i % prices.length];

        // --- SMART SCALING (FIX ZA CUT-OFF) ---
        let fontSize = cellH * 0.35; // Startuj sa velikim fontom
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

        // Meri širinu teksta
        let textWidth = ctx.measureText(text).width;

        // Ako je šire od ćelije (minus padding), smanjuj dok ne stane
        const maxWidth = cellW * 0.9;
        while (textWidth > maxWidth && fontSize > 10) {
          fontSize -= 2;
          ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
          textWidth = ctx.measureText(text).width;
        }

        ctx.fillText(text, x, y);
      }

      return new Texture(gl, {
        image: canvas,
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        premultiplyAlpha: true
      });
    };

    const textureAtlas = makePriceAtlas();

    // ==========================================
    // SHADERS (STATELESS & DETERMINISTIC)
    // ==========================================

    const vertex = /* glsl */ `
      attribute vec3 position;
      attribute vec4 random;
      
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uAspect;
      
      varying vec4 vRandom;
      varying float vHover;

      void main() {
        vRandom = random; 
        
        // --- STATELESS ANIMATION LOGIC ---
        // We calculate the exact position based on time.
        // No physics simulation, no accumulation of errors.
        
        vec3 pos = position;
        
        // 1. Vertical Movement (Infinite Loop)
        // Speed varies per particle - SLOWER
        float speed = 0.015 + random.y * 0.04; 
        
        // Offset time so they don't all start at 0
        float t = uTime + random.x * 100.0;
        
        // Modulo arithmetic to loop from -1.2 to 1.2
        float height = 2.4;
        float yOffset = mod(t * speed, height);
        pos.y = -1.2 + yOffset;
        
        // 2. Horizontal Wiggle
        // Gentle sine wave movement
        pos.x += sin(uTime * 0.5 + random.z * 10.0) * 0.05;
        
        // 3. Mouse Interaction
        vec2 particlePos = pos.xy;
        vec2 distVec = (particlePos - uMouse);
        distVec.x *= uAspect; 
        float dist = length(distVec);

        // Mouse reaction radius
        vHover = 1.0 - smoothstep(0.0, 0.45, dist);
        
        // Push away from mouse slightly
        // pos.xy += normalize(distVec) * vHover * 0.1;

        gl_Position = vec4(pos, 1.0);
        
        // Veličina
        float baseSize = mix(40.0, 90.0, random.x);
        float hoverSize = baseSize * (1.0 + vHover * 0.3);
        
        gl_PointSize = hoverSize;
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      uniform sampler2D uAtlas;
      varying vec4 vRandom;
      varying float vHover;
      
      void main() {
        float totalCells = 64.0;
        float cols = 8.0;
        float rows = 8.0;

        float cellIndex = floor(vRandom.z * totalCells);
        float col = mod(cellIndex, cols);
        float row = floor(cellIndex / cols);
        
        vec2 uv = gl_PointCoord;
        uv.y = 1.0 - uv.y; 
        
        uv = (uv + vec2(col, row)) / vec2(cols, rows);
        
        vec4 texColor = texture2D(uAtlas, uv);
        
        if (texColor.a < 0.1) discard;

        vec3 colorDeep = vec3(0.31, 0.275, 0.898); 
        vec3 colorLight = vec3(0.133, 0.827, 0.933); 
        vec3 colorWhite = vec3(1.0, 1.0, 1.0);

        vec3 finalColor = mix(colorDeep, colorLight, vRandom.w);
        finalColor = mix(finalColor, colorWhite, vHover);

        // SMIRENO: Mnogo niži opacity (5-12% umesto 30-50%)
        float baseAlpha = 0.05 + 0.07 * sin(vRandom.y * 10.0 + 1.0);
        float finalAlpha = mix(baseAlpha, 0.6, vHover);

        gl_FragColor = vec4(finalColor, finalAlpha * texColor.a);
      }
    `;

    // --- INIT ---

    const numParticles = 200;
    const positionData = new Float32Array(numParticles * 3);
    const randomData = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; i++) {
      // Initial random positions
      positionData.set([
        (Math.random() * 2 - 1), // x: -1 to 1
        (Math.random() * 2 - 1), // y: -1 to 1 (doesn't matter much as it's overridden by time)
        0
      ], i * 3);

      // Random attributes for variation
      randomData.set([
        Math.random(), // x: size & time offset
        Math.random(), // y: speed
        Math.random(), // z: texture index & wiggle phase
        Math.random()  // w: color mix
      ], i * 4);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positionData },
      random: { size: 4, data: randomData },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vec2(9999, 9999) },
        uAspect: { value: 1 },
        uAtlas: { value: textureAtlas },
      },
      transparent: true,
      depthTest: false,
    });

    const points = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    // --- EVENTS ---

    const mouse = new Vec2(9999, 9999);
    function updateMouse(e: MouseEvent | TouchEvent) {
      let x, y;
      if ("touches" in e) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else {
        x = (e as MouseEvent).clientX;
        y = (e as MouseEvent).clientY;
      }
      mouse.set(
        (x / window.innerWidth) * 2 - 1,
        (1 - y / window.innerHeight) * 2 - 1
      );
    }

    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("touchmove", updateMouse);

    let reqId: number;
    function update(t: number) {
      reqId = requestAnimationFrame(update);
      // Keep time within reasonable bounds to prevent float precision issues
      // 10000 seconds is plenty for a loop, and we mod it here
      const time = (t * 0.001) % 10000;

      program.uniforms.uTime.value = time;
      program.uniforms.uAspect.value = gl.canvas.width / gl.canvas.height;
      program.uniforms.uMouse.value = mouse;

      renderer.render({ scene: points, camera });
    }
    reqId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("touchmove", updateMouse);
      cancelAnimationFrame(reqId);
      if (container && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)' }}
    />
  );
}