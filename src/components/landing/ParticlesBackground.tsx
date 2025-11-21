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

        // Mouse reaction radius
        vHover = 1.0 - smoothstep(0.0, 0.45, dist);

        // Veličina
        float baseSize = mix(40.0, 90.0, vRandom.x);
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

        float baseAlpha = 0.3 + 0.2 * sin(vRandom.y * 10.0 + 1.0);
        float finalAlpha = mix(baseAlpha, 1.0, vHover);

        gl_FragColor = vec4(finalColor, finalAlpha * texColor.a);
      }
    `;

    // --- PHYSICS (SIMPLIFIED ROBUST LOOP) ---
    // Nema više velocity shadera koji može da zabaguje. 
    // Brzina se računa direktno ovde.

    const positionFragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform sampler2D tMap; // Stara pozicija
      varying vec2 vUv;
      
      // Random generator na osnovu koordinata
      float rand(vec2 co){
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      void main() {
        vec4 position = texture2D(tMap, vUv);
        
        // Generišemo unikatnu brzinu za svaku česticu na osnovu njene UV adrese
        // Ovo garantuje da je brzina konstantna i nikad nula.
        float speed = 0.0005 + rand(vUv) * 0.0015; 
        
        // Pomeraj na gore
        position.y += speed;
        
        // Reset kad ode gore (Infinite loop)
        if (position.y > 1.15) {
            position.y = -1.15;
            // Random X kad se respawn-uje
            position.x = rand(vec2(position.x, uTime)) * 2.0 - 1.0;
        }

        gl_FragColor = position;
      }
    `;

    // --- INIT ---

    const numParticles = 512;

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

    // Samo jedan pass (pozicija), velocity je integrisan
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

      position.passes[0].uniforms.uTime.value = time;

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