"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, GPGPU, Texture } from "ogl";

/**
 * ParticlesBackgroundLight
 * 
 * Light mode version with hover-reveal effect:
 * - Prices are nearly invisible by default (2-3% opacity)
 * - On mouse hover, prices "light up" in brand gradient colors
 * - Creates a subtle, interactive "easter egg" effect
 */
export default function ParticlesBackgroundLight() {
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
    // PRICE ATLAS - Dark text for light background
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
      ctx.fillStyle = "white"; // White text, we'll color it in shader

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
      attribute vec2 coords;
      attribute vec4 random;
      uniform float uTime;
      uniform sampler2D tPosition;
      uniform vec2 uMouse;
      uniform float uAspect;
      
      varying vec4 vRandom;
      varying float vHover;

      void main() {
        vRandom = random; 
        vec4 position = texture2D(tPosition, coords);
        
        gl_Position = vec4(position.xy, 0, 1);
        
        vec2 particlePos = position.xy;
        vec2 distVec = (particlePos - uMouse);
        distVec.x *= uAspect; 
        float dist = length(distVec);

        // Hover radius - LARGER for better reveal effect
        vHover = 1.0 - smoothstep(0.0, 0.6, dist);

        // Size - LARGER particles
        float baseSize = mix(50.0, 100.0, vRandom.x);
        float hoverSize = baseSize * (1.0 + vHover * 0.3);
        
        gl_PointSize = hoverSize;
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      uniform sampler2D uAtlas;
      uniform float uTime;
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

        // Brand gradient colors (indigo -> cyan -> teal)
        vec3 colorIndigo = vec3(0.392, 0.361, 0.945);  // #6366f1
        vec3 colorCyan = vec3(0.220, 0.741, 0.973);    // #38bdf8
        vec3 colorTeal = vec3(0.078, 0.722, 0.651);    // #14b8a6
        
        // Subtle gray for non-hovered state (more visible now)
        vec3 colorGray = vec3(0.75, 0.78, 0.82);
        
        // Mix between gradient colors based on random
        vec3 gradientColor = mix(colorIndigo, colorCyan, vRandom.w);
        gradientColor = mix(gradientColor, colorTeal, vRandom.y * 0.5);
        
        // Final color: gray when not hovered, gradient when hovered
        vec3 finalColor = mix(colorGray, gradientColor, vHover);

        // MORE VISIBLE: Higher base opacity, much higher hover opacity
        float baseAlpha = 0.12; // Visible but subtle
        float hoverAlpha = 0.85; // Very visible on hover
        float finalAlpha = mix(baseAlpha, hoverAlpha, vHover);

        gl_FragColor = vec4(finalColor, finalAlpha * texColor.a);
      }
    `;

    // Position shader - slow floating movement
    const positionFragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform sampler2D tMap;
      varying vec2 vUv;
      
      float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec4 position = texture2D(tMap, vUv);
        
        // Very slow upward drift
        float speed = 0.0001 + rand(vUv) * 0.00025; 
        position.y += speed;
        
        // Reset when off screen
        if (position.y > 1.15) {
            position.y = -1.15;
            position.x = rand(vec2(position.x, uTime)) * 2.0 - 1.0;
        }

        gl_FragColor = position;
      }
    `;

    // --- INIT ---
    const numParticles = 250; // Slightly fewer for cleaner look

    const initialPositionData = new Float32Array(numParticles * 4);
    const randomData = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; i++) {
      initialPositionData.set([
        (Math.random() * 2 - 1),
        (Math.random() * 2 - 1),
        0,
        1
      ], i * 4);

      randomData.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }

    const position = new GPGPU(gl, { data: initialPositionData });

    position.addPass({
      fragment: positionFragment,
      uniforms: { uTime: { value: 0 } }
    });

    const geometry = new Geometry(gl, {
      random: { size: 4, data: randomData },
      coords: { size: 2, data: position.coords },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        tPosition: position.uniform,
        uMouse: { value: new Vec2(9999, 9999) },
        uAspect: { value: 1 },
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

    // Reset mouse when leaving window
    function resetMouse() {
      mouse.set(9999, 9999);
    }

    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("touchmove", updateMouse);
    window.addEventListener("mouseleave", resetMouse);

    let reqId: number;
    function update(t: number) {
      reqId = requestAnimationFrame(update);
      const time = t * 0.001;

      program.uniforms.uTime.value = time;
      program.uniforms.uAspect.value = gl.canvas.width / gl.canvas.height;
      program.uniforms.uMouse.value = mouse;

      position.passes[0].uniforms.uTime.value = time;

      position.render();
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

