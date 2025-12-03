"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, Texture } from "ogl";

/**
 * ParticlesBackgroundLight - HOVER-ONLY RENDERING
 * 
 * Key optimization: Particles are discarded (not rendered) unless 
 * they're near the mouse cursor. This means GPU work is minimal
 * when not hovering, and only renders near the cursor.
 */
export default function ParticlesBackgroundLight() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use consistent DPR for cross-platform consistency
    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderer = new Renderer({
      dpr,
      alpha: true,
      depth: false,
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
    // PRICE ATLAS - Full quality (1024x1024, 8x8 grid)
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

        let fontSize = cellH * 0.35;
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

        let textWidth = ctx.measureText(text).width;
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
    // SHADERS - Light mode with hover reveal
    // ==========================================

    const vertex = /* glsl */ `
      attribute vec3 position;
      attribute vec4 random;
      
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uAspect;
      uniform float uDpr;
      
      varying vec4 vRandom;
      varying float vHover;
      varying vec2 vPos;

      void main() {
        vRandom = random; 
        
        // --- STATELESS ANIMATION LOGIC ---
        vec3 pos = position;
        
        // 1. Vertical Movement (Infinite Loop)
        float speed = 0.015 + random.y * 0.04; 
        float t = uTime + random.x * 100.0;
        
        float height = 2.4;
        float yOffset = mod(t * speed, height);
        pos.y = -1.2 + yOffset;
        
        // 2. Horizontal Wiggle
        pos.x += sin(uTime * 0.5 + random.z * 10.0) * 0.05;
        
        // Pass position for exclusion zone check in fragment shader
        vPos = pos.xy;
        
        // 3. Mouse Interaction
        vec2 particlePos = pos.xy;
        vec2 distVec = (particlePos - uMouse);
        distVec.x *= uAspect; 
        float dist = length(distVec);

        // Hover radius - balanced reveal effect
        vHover = 1.0 - smoothstep(0.0, 0.5, dist);

        gl_Position = vec4(pos, 1.0);

        // Size - Scale based on DPR for cross-platform consistency
        // Higher DPR = physically smaller pixels, so we need larger point sizes
        float dprScale = uDpr;
        float baseSize = mix(32.0, 64.0, random.x) * dprScale;
        float hoverSize = baseSize * (1.0 + vHover * 0.25);
        
        gl_PointSize = hoverSize;
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      uniform sampler2D uAtlas;
      varying vec4 vRandom;
      varying float vHover;
      varying vec2 vPos;
      
      void main() {
        // KEY OPTIMIZATION: Discard particles far from mouse
        // This means GPU doesn't render them at all!
        if (vHover < 0.01) discard;
        
        // EXCLUSION ZONE: Only around the LEFT side text area
        // Smaller zone - just the text "Whether you run... online" and buttons
        float exclusionLeft = -1.0;   // Start from left edge
        float exclusionRight = 0.05;  // Only left half of screen
        float exclusionBottom = -0.4; // Below buttons
        float exclusionTop = 0.55;    // Above "No website required" badge
        
        // Check if particle is inside exclusion zone
        bool inZoneX = vPos.x > exclusionLeft && vPos.x < exclusionRight;
        bool inZoneY = vPos.y > exclusionBottom && vPos.y < exclusionTop;
        
        float exclusionFade = 1.0; // Default: fully visible
        
        if (inZoneX && inZoneY) {
          // Inside exclusion zone - calculate fade based on distance from edges
          float distFromEdgeX = min(vPos.x - exclusionLeft, exclusionRight - vPos.x);
          float distFromEdgeY = min(vPos.y - exclusionBottom, exclusionTop - vPos.y);
          float distFromEdge = min(distFromEdgeX, distFromEdgeY);
          
          // Soft fade at edges (0.15 width)
          exclusionFade = 1.0 - smoothstep(0.0, 0.15, distFromEdge);
        }
        
        if (exclusionFade < 0.05) discard;
        
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

        // Brand gradient colors (indigo -> cyan -> teal)
        vec3 colorIndigo = vec3(0.392, 0.361, 0.945);  // #6366f1
        vec3 colorCyan = vec3(0.220, 0.741, 0.973);    // #38bdf8
        vec3 colorTeal = vec3(0.078, 0.722, 0.651);    // #14b8a6
        
        // Mix gradient based on random
        vec3 gradientColor = mix(colorIndigo, colorCyan, vRandom.w);
        gradientColor = mix(gradientColor, colorTeal, vRandom.y * 0.5);

        // Fade in from transparent to visible - balanced visibility
        // Also apply exclusion zone fade
        float alpha = vHover * 0.75 * exclusionFade;

        gl_FragColor = vec4(gradientColor, alpha * texColor.a);
      }
    `;

    // Balanced particle count - only visible near cursor anyway
    const numParticles = 180;

    const positionData = new Float32Array(numParticles * 3);
    const randomData = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; i++) {
      // Initial random positions
      positionData.set([
        (Math.random() * 2 - 1), // x
        (Math.random() * 2 - 1), // y
        0
      ], i * 3);

      // Random attributes
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
        uDpr: { value: dpr },
        uAtlas: { value: textureAtlas },
      },
      transparent: true,
      depthTest: false,
    });

    const points = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    // --- MOUSE TRACKING ---
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

    function resetMouse() {
      mouse.set(9999, 9999);
    }

    window.addEventListener("mousemove", updateMouse, { passive: true });
    window.addEventListener("touchmove", updateMouse, { passive: true });
    window.addEventListener("mouseleave", resetMouse);

    // --- RENDER LOOP ---
    // Since we discard most fragments when not hovering, 
    // full framerate is fine - GPU work is minimal
    let reqId: number;
    function update(t: number) {
      reqId = requestAnimationFrame(update);
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
      window.removeEventListener("mouseleave", resetMouse);
      cancelAnimationFrame(reqId);
      if (container && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
