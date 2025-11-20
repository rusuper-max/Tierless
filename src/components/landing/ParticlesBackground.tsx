"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh, Vec2, GPGPU } from "ogl";

export default function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. SETUP RENDERER
    const renderer = new Renderer({ 
      dpr: Math.min(window.devicePixelRatio, 2), 
      alpha: true, // Transparent da se vidi background boja ispod
      depth: false 
    });
    const gl = renderer.gl;
    
    // Forsiraj da canvas popuni div
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

    // --- SHADERS ---

    const vertex = /* glsl */ `
      attribute vec2 coords;
      attribute vec4 random;
      uniform float uTime;
      uniform sampler2D tPosition;
      uniform sampler2D tVelocity;
      varying vec4 vRandom;
      varying vec4 vVelocity;
      void main() {
        vRandom = random;
        vec4 position = texture2D(tPosition, coords);
        vVelocity = texture2D(tVelocity, coords);
        
        // Blago kretanje u mestu
        position.xy += sin(vec2(uTime) * vRandom.wy + vRandom.xz * 6.28) * vRandom.zy * 0.1;
        
        gl_Position = vec4(position.xy, 0, 1);
        
        // Veličina čestica
        gl_PointSize = mix(2.0, 4.5, vRandom.x);
        // Povećaj kad se kreću brzo
        gl_PointSize *= 1.0 + min(1.0, length(vVelocity.xy));
      }
    `;

    const fragment = /* glsl */ `
      precision highp float;
      varying vec4 vRandom;
      varying vec4 vVelocity;
      void main() {
        // Kružni oblik
        if (step(0.5, length(gl_PointCoord.xy - 0.5)) > 0.0) discard;
        
        // BOJE: Cyan (#22D3EE) i Indigo (#4F46E5)
        vec3 colorCyan = vec3(0.133, 0.827, 0.933); 
        vec3 colorIndigo = vec3(0.31, 0.275, 0.898);
        
        // Miksuj boje nasumično
        vec3 finalColor = mix(colorIndigo, colorCyan, vRandom.w);

        // Providnost opada sa brzinom
        float alpha = 1.0 - pow(1.0 - smoothstep(0.0, 0.7, length(vVelocity.xy)), 2.0);
        
        gl_FragColor = vec4(finalColor, alpha * 0.9);
      }
    `;

    const positionFragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform sampler2D tVelocity;
      uniform sampler2D tMap;
      varying vec2 vUv;
      void main() {
        vec4 position = texture2D(tMap, vUv);
        vec4 velocity = texture2D(tVelocity, vUv);
        position.xy += velocity.xy * 0.01;
        
        // Zadrži unutar ekrana
        vec2 limits = vec2(1);
        position.xy += (1.0 - step(-limits.xy, position.xy)) * limits.xy * 2.0;
        position.xy -= step(limits.xy, position.xy) * limits.xy * 2.0;
        gl_FragColor = position;
      }
    `;

    const velocityFragment = /* glsl */ `
      precision highp float;
      uniform float uTime;
      uniform sampler2D tPosition;
      uniform sampler2D tMap;
      uniform vec2 uMouse;
      varying vec2 vUv;
      void main() {
        vec4 position = texture2D(tPosition, vUv);
        vec4 velocity = texture2D(tMap, vUv);
        
        // Bežanje od miša
        vec2 toMouse = position.xy - uMouse;
        float strength = smoothstep(0.3, 0.0, length(toMouse));
        velocity.xy += strength * normalize(toMouse) * 0.5;
        
        // Trenje
        velocity.xy *= 0.96;
        gl_FragColor = velocity;
      }
    `;

    // --- LOGIKA ---
    const numParticles = 32768; // Dovoljno za lep efekat, a ne guši CPU
    const initialPositionData = new Float32Array(numParticles * 4);
    const initialVelocityData = new Float32Array(numParticles * 4);
    const random = new Float32Array(numParticles * 4);

    for (let i = 0; i < numParticles; i++) {
      initialPositionData.set([(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0, 1], i * 4);
      initialVelocityData.set([0, 0, 0, 1], i * 4);
      random.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }

    const position = new GPGPU(gl, { data: initialPositionData });
    const velocity = new GPGPU(gl, { data: initialVelocityData });

    position.addPass({ fragment: positionFragment, uniforms: { uTime: { value: 0 }, tVelocity: velocity.uniform } });
    velocity.addPass({ fragment: velocityFragment, uniforms: { uTime: { value: 0 }, uMouse: { value: new Vec2() }, tPosition: position.uniform } });

    const geometry = new Geometry(gl, {
      random: { size: 4, data: random },
      coords: { size: 2, data: position.coords },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        tPosition: position.uniform,
        tVelocity: velocity.uniform,
      },
      transparent: true,
    });

    const points = new Mesh(gl, { geometry, program, mode: gl.POINTS });

    // Mouse handler
    const mouse = new Vec2();
    function updateMouse(e: MouseEvent | TouchEvent) {
      let x, y;
      if ("touches" in e) {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      } else {
        x = (e as MouseEvent).clientX;
        y = (e as MouseEvent).clientY;
      }
      
      // Mapiranje na WebGL koordinate (-1 do 1)
      // Koristimo innerWidth/Height jer je canvas fixed/full screen
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
      velocity.passes[0].uniforms.uTime.value = time;
      velocity.passes[0].uniforms.uMouse.value = mouse;
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
      // Deep Space Gradient (Tvoj Brand Background)
      style={{ background: 'radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 80%)' }}
    />
  );
}