"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createNoise3D } from "simplex-noise";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

export default function MorphingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll(); // Globalni scroll 0..1
  
  // Refovi da ne gubimo stanje
  const sceneRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- INIT THREE.JS ---
    const scene = new THREE.Scene();
    // Magla da sakrije ivice (Dark Mode boja)
    scene.fog = new THREE.FogExp2(0x020617, 0.035); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- GENERATORI OBLIKA (UI LOGIKA) ---
    const PARTICLE_COUNT = 12000; // Dovoljno za UI
    const SHAPE_SIZE = 10;

    // 1. MENU SHAPE (Lista)
    const menuPos = new Float32Array(PARTICLE_COUNT * 3);
    for(let i=0; i<PARTICLE_COUNT; i++) {
       const line = Math.floor(Math.random() * 8); // 8 linija teksta
       const width = SHAPE_SIZE * 1.2;
       const y = (4 - line) * 1.2; 
       let x = (Math.random() - 0.5) * width;
       // Rupa u sredini (space between item and price)
       if (Math.abs(x) < 1) x = (x > 0 ? 1 : -1) * (1 + Math.random() * 2);
       
       menuPos[i*3] = x;
       menuPos[i*3+1] = y;
       menuPos[i*3+2] = (Math.random() - 0.5) * 0.5;
    }

    // 2. TIERS SHAPE (3 Kolone)
    const tierPos = new Float32Array(PARTICLE_COUNT * 3);
    for(let i=0; i<PARTICLE_COUNT; i++) {
       const col = Math.floor(Math.random() * 3); // 0, 1, 2
       const colW = 3.5;
       const gap = 1.0;
       let cx = 0;
       if (col === 0) cx = -(colW + gap);
       if (col === 2) cx = (colW + gap);
       
       // Srednja kartica malo visa
       const h = col === 1 ? 7 : 6;
       
       tierPos[i*3] = cx + (Math.random() - 0.5) * colW;
       tierPos[i*3+1] = (Math.random() - 0.5) * h;
       tierPos[i*3+2] = col === 1 ? 1 : 0; // Srednja bliza kameri
    }

    // --- PARTICLE SYSTEM ---
    const geometry = new THREE.BufferGeometry();
    const currentPos = new Float32Array(menuPos); // Startujemo kao Menu
    
    geometry.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));
    
    // Custom Shader Material za boju i veličinu
    const material = new THREE.ShaderMaterial({
        uniforms: {
            colorA: { value: new THREE.Color("#4F46E5") }, // Indigo
            colorB: { value: new THREE.Color("#22D3EE") }, // Cyan
            uTime: { value: 0 },
            uMorph: { value: 0 }, // 0 = Menu, 1 = Tiers
        },
        vertexShader: `
            uniform float uTime;
            uniform float uMorph;
            attribute vec3 tierTarget; // Gde treba da idu za Tiers
            varying vec3 vColor;
            
            // Simplex Noise funkcija (skracena verzija)
            // ... (zamisli noise funkciju ovde) ...
            
            void main() {
                // Lerp between positions
                // Ali ne linearno! Dodajemo noise da izgleda kao tecnost
                vec3 pos = position; 
                
                // Ovde bi isla logika mesanja pozicija u shaderu za performanse
                // Ali radi jednostavnosti u ovom primeru, radimo update u JS-u (vidi dole)
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = (4.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 colorA;
            uniform vec3 colorB;
            void main() {
                // Circular particle
                float r = distance(gl_PointCoord, vec2(0.5));
                if (r > 0.5) discard;
                
                // Gradient boja
                gl_FragColor = vec4(mix(colorA, colorB, gl_PointCoord.y), 0.8);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    
    // Koristimo PointsMaterial za sad radi jednostavnosti (radi brze)
    const pointsMat = new THREE.PointsMaterial({
        size: 0.08,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8
    });
    
    // Generisemo boje
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const c1 = new THREE.Color("#4F46E5");
    const c2 = new THREE.Color("#22D3EE");
    for(let i=0; i<PARTICLE_COUNT; i++) {
        const mixed = c1.clone().lerp(c2, Math.random());
        colors[i*3] = mixed.r;
        colors[i*3+1] = mixed.g;
        colors[i*3+2] = mixed.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(geometry, pointsMat);
    scene.add(particles);
    sceneRef.current = { particles, menuPos, tierPos, currentPos };

    // --- ANIMATION LOOP ---
    const noise3D = createNoise3D();
    let time = 0;

    function animate() {
      requestAnimationFrame(animate);
      time += 0.005;
      
      // Blaga rotacija celog sistema
      particles.rotation.y = time * 0.1;
      
      // Noise movement (da "dise")
      const positions = particles.geometry.attributes.position.array;
      
      // Ovde se desava magija MORPHING-a u JS-u
      // (Za 10k cestica JS je ok, za 100k mora Shader)
      const targetMorph = sceneRef.current.targetMorph || 0; // Dolazi iz skrola
      
      // Interpolacija
      for(let i=0; i<PARTICLE_COUNT; i++) {
          const i3 = i*3;
          
          // Trenutna ciljna pozicija (Interpolacija izmedju Menu i Tier na osnovu scrolla)
          const tx = menuPos[i3] * (1-targetMorph) + tierPos[i3] * targetMorph;
          const ty = menuPos[i3+1] * (1-targetMorph) + tierPos[i3+1] * targetMorph;
          const tz = menuPos[i3+2] * (1-targetMorph) + tierPos[i3+2] * targetMorph;

          // Dodajemo Noise (haos)
          const n = noise3D(positions[i3]*0.1, positions[i3+1]*0.1, time) * 0.2;
          
          // Easing ka cilju (Lerp)
          positions[i3] += (tx + n - positions[i3]) * 0.05;
          positions[i3+1] += (ty + n - positions[i3+1]) * 0.05;
          positions[i3+2] += (tz - positions[i3+2]) * 0.05;
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    
    animate();

    // Resize handle
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        if(containerRef.current) containerRef.current.innerHTML = '';
    }
  }, []);

  // --- SCROLL CONTROL ---
  // Ovo povezuje tvoj scroll sa morphing varijablom
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
     if (sceneRef.current) {
         // Mapiramo scroll 0-0.5 na morph 0-1
         // Znaci kad skrolujes pola strane, on se pretvori u Tiers
         const m = Math.min(1, Math.max(0, (latest * 3))); 
         sceneRef.current.targetMorph = m;
     }
  });

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
}