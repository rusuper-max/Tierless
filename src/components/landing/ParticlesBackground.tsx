"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, GPGPU, Texture } from "ogl";

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
    // 0. GENERISANJE CENA (ATLAS TEKSTURA)
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

      // LISTA CENA I SIMBOLA
      const prices = [
        "$9.99", "Free", "€15", "$49",
        "£20", "99 RSD", "$0", "€9.50",
        "$19/mo", "PRO", "€120", "$5",
        "1200", "€4.90", "$299", "Sale",
        "$14", "€0", "2500", "$8.50",
        "£99", "Best", "$1", "€25",
        "100%", "$79", "€60", "500",
        "$12.99", "VIP", "€35", "$99",
        "$9", "€9", "£5", "RSD",
        "$20", "€20", "£10", "FREE",
        "$50", "€50", "1k", "$4.99",
        "$99/yr", "€19", "$25", "Hot",
        "$200", "€75", "£15", "$6.50",
        "$39", "€2.5", "10k", "$0.99",
        "$150", "€80", "£45", "New",
        "$300", "€10", "50%", "$11"
      ];

      ctx.clearRect(0, 0, size, size);
      ctx.font = `bold ${cellH * 0.35}px Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "white";

      for (let i = 0; i < (cols * rows); i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * cellW + cellW / 2;
        const y = row * cellH + cellH / 2;

        const text = prices[i % prices.length];
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
    // SHADERS
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

        vHover = 1.0 - smoothstep(0.0, 0.45, dist);

        float baseSize = mix(40.0, 70.0, vRandom.x);
        float hoverSize = baseSize * (1.0 + vHover * 0.5);
        
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

        float baseAlpha = 0.25 + 0.2 * sin(vRandom.y * 10.0 + 1.0);
        float finalAlpha = mix(baseAlpha, 1.0, vHover);

        gl_FragColor = vec4(finalColor, finalAlpha * texColor.a);
      }
    `;

    // --- PHYSICS ---

    const velocityFragment = /* glsl */ `
      precision highp float;
      uniform sampler2D tMap;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(tMap, vUv); 
      }
    `;

    const positionFragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform sampler2D tVelocity;
      uniform sampler2D tMap;
      varying vec2 vUv;
      
      float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec4 position = texture2D(tMap, vUv);
        vec4 velocity = texture2D(tVelocity, vUv);
        
        position.xy += velocity.xy;
        
        if (position.y > 1.15) {
            position.y = -1.15;
            float newX = rand(vec2(position.x, uTime)) * 2.0 - 1.0;
            position.x = newX;
        }

        gl_FragColor = position;
      }
    `;

    // --- INIT ---

    const numParticles = 512;

    const initialPositionData = new Float32Array(numParticles * 4);
    const initialVelocityData = new Float32Array(numParticles * 4);
    const randomData = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; i++) {
      initialPositionData.set([
        (Math.random() * 2 - 1),
        (Math.random() * 2 - 1),
        0,
        1
      ], i * 4);

      initialVelocityData.set([0, 0.0003 + Math.random() * 0.0005, 0, 1], i * 4);
      randomData.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }

    const position = new GPGPU(gl, { data: initialPositionData });
    const velocity = new GPGPU(gl, { data: initialVelocityData });

    position.addPass({
      fragment: positionFragment,
      uniforms: { uTime: { value: 0 }, tVelocity: velocity.uniform }
    });

    // FIX: Dodato 'uTime' u uniformse ovde da se ne bi crashovalo u update loopu
    velocity.addPass({
      fragment: velocityFragment,
      uniforms: {
        uTime: { value: 0 }, // <--- OVO JE FALILO
        tPosition: position.uniform
      }
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
        tVelocity: velocity.uniform,
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
      const time = t * 0.001;

      program.uniforms.uTime.value = time;
      program.uniforms.uAspect.value = gl.canvas.width / gl.canvas.height;
      program.uniforms.uMouse.value = mouse;

      // Ovde je pucalo jer uTime nije postojao u velocity pass-u. Sad postoji.
      velocity.passes[0].uniforms.uTime.value = time;
      position.passes[0].uniforms.uTime.value = time;

      velocity.render();
      position.render();
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