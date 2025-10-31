// src/components/scrolly/WireGlobe.tsx
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";

type WireGlobeProps = {
  /** 0 → indigo, 1 → cyan (svetlije ka kraju) */
  phase: number;
  /** Outline PNG (samo stroke, transparent BG) */
  textureSrc?: string;
  /** Land mask PNG (kopno opaque, okean transparent) */
  landMaskSrc?: string;
  /** Land fill PNG (kopno obojeno, okean transparent) */
  landFillSrc?: string;
  /** Maksimalna providnost land fill-a (0..1) */
  fillMaxOpacity?: number;
  /** Fallback boje */
  indigo?: string;
  teal?: string; // koristimo kao cyan završnicu
};

/* ---------- helpers ---------- */
function mixTHREE(a: string, b: string, t: number) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, THREE.MathUtils.clamp(t, 0, 1));
}
function toCss(c: THREE.Color) {
  return `#${c.getHexString()}`;
}

const BASE_YAW = Math.PI * 0.1; // početni pomak ka "Atlantiku"

/* ---------- child unutar <Canvas> ---------- */
function GlobeWithStencil({
  outlineTex,
  maskTex,
  fillTex,
  wireColor,
  lineTint,
  fillOpacity,
  reducedMotion,
  modelScale,
}: {
  outlineTex: THREE.Texture | null;
  maskTex: THREE.Texture | null;
  fillTex: THREE.Texture | null;
  wireColor: string;
  lineTint: string;
  fillOpacity: number;
  reducedMotion: boolean;
  modelScale: number; // NEW: skala cele kugle (npr. 0.84 na mobilnom)
}) {
  // Axial tilt i shared spin parent
  const tiltRef = useRef<THREE.Group>(null!);
  const spinRef = useRef<THREE.Group>(null!);

  const wireRef = useRef<THREE.Mesh>(null!);
  const outlineRef = useRef<THREE.Mesh>(null!);
  const maskRef = useRef<THREE.Mesh>(null!);
  const fillRef = useRef<THREE.Mesh>(null!);

  // nagib ~23.4° i početni yaw
  useEffect(() => {
    if (tiltRef.current) tiltRef.current.rotation.z = THREE.MathUtils.degToRad(23.4);
    if (spinRef.current) spinRef.current.rotation.y = BASE_YAW;
  }, []);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    if (spinRef.current) spinRef.current.rotation.y += dt * 0.15;
  });

  return (
    <group ref={tiltRef} scale={modelScale}>
      <group ref={spinRef}>
        {/* 0) LAND FILL — ispod svega, blago providan (desktop only) */}
        {fillTex && (
          <mesh ref={fillRef} renderOrder={0}>
            <sphereGeometry args={[0.999, 64, 64]} />
            <meshBasicMaterial
              map={fillTex}
              transparent
              opacity={fillOpacity}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          </mesh>
        )}

        {/* 1) LAND MASK u stencil buffer (piše 1 gde je kopno) */}
        {maskTex && (
          <mesh ref={maskRef} renderOrder={1}>
            <sphereGeometry args={[1.0, 64, 64]} />
            {/* @ts-ignore stencil props */}
            <meshBasicMaterial
              map={maskTex}
              transparent
              alphaTest={0.5}
              colorWrite={false}
              depthWrite={false}
              depthTest={false}
              stencilWrite
              stencilRef={1}
              stencilFunc={THREE.AlwaysStencilFunc}
              stencilZPass={THREE.ReplaceStencilOp}
              stencilZFail={THREE.KeepStencilOp}
              stencilFail={THREE.KeepStencilOp}
            />
          </mesh>
        )}

        {/* 2) WIREFRAME — vidi se samo gde maska NIJE (okeani) */}
        <mesh ref={wireRef} renderOrder={2}>
          <sphereGeometry args={[1.0, 48, 48]} />
          {/* @ts-ignore stencil props */}
          <meshBasicMaterial
            wireframe
            color={wireColor}
            transparent
            opacity={0.48}
            stencilWrite={!!maskTex}
            stencilRef={1}
            stencilFunc={THREE.NotEqualStencilFunc}
            stencilZPass={THREE.KeepStencilOp}
            stencilZFail={THREE.KeepStencilOp}
            stencilFail={THREE.KeepStencilOp}
          />
        </mesh>

        {/* 3) OUTLINE — preko svega */}
        {outlineTex && (
          <mesh ref={outlineRef} renderOrder={3}>
            <sphereGeometry args={[1.001, 64, 64]} />
            <meshBasicMaterial
              map={outlineTex}
              transparent
              color={lineTint}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

/* ---------- public komponenta ---------- */
export default function WireGlobe({
  phase,
  textureSrc = "/textures/world-outline.png",
  landMaskSrc = "/textures/world-land-mask.png",
  landFillSrc = "/textures/world-land-fill.png",
  fillMaxOpacity = 0.32,
  indigo = "#4f46e5",
  teal = "#22d3ee", // brand cyan
}: WireGlobeProps) {
  // Boja: indigo → cyan + blago posvetljavanje
  const base = useMemo(() => mixTHREE(indigo, teal, phase), [indigo, teal, phase]);
  const final = useMemo(() => {
    const c = base.clone().lerp(new THREE.Color("#ffffff"), phase * 0.18);
    return { css: toCss(c), three: c };
  }, [base, phase]);

  // Land fill providnost raste ka kraju (desktop only)
  const fillOpacity = Math.min(fillMaxOpacity, fillMaxOpacity * (0.2 + 0.8 * phase));

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Detekcija mobilnog (<= 640px) — za isključivanje land-fill-a i smanjenje kugle
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)") : null;
    const apply = () => setIsMobile(!!mq?.matches);
    apply();
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, []);

  // Učitavanje tekstura (land-fill se NE učitava na mobilnom)
  const [outlineTex, setOutlineTex] = useState<THREE.Texture | null>(null);
  const [maskTex, setMaskTex] = useState<THREE.Texture | null>(null);
  const [fillTex, setFillTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let dead = false;
    const loader = new THREE.TextureLoader();

    const load = (src: string, setter: (t: THREE.Texture | null) => void) => {
      loader.load(
        src,
        (tex) => {
          if (dead) return;
          tex.anisotropy = 8;
          tex.wrapS = THREE.ClampToEdgeWrapping;
          tex.wrapT = THREE.ClampToEdgeWrapping;
          tex.premultiplyAlpha = true;
          tex.center.set(0.5, 0.5);
          tex.offset.set(0, 0);
          tex.needsUpdate = true;
          setter(tex);
        },
        undefined,
        () => {
          if (!dead) setter(null);
        }
      );
    };

    load(textureSrc, setOutlineTex);
    load(landMaskSrc, setMaskTex);
    if (!isMobile) {
      load(landFillSrc, setFillTex);
    } else {
      setFillTex(null);
    }

    return () => {
      dead = true;
    };
  }, [textureSrc, landMaskSrc, landFillSrc, isMobile]);

  // Kamera/scale za mobilni → dosta manja kugla
  const camZ = isMobile ? 3.65 : 3.15;
  const camFov = isMobile ? 42 : 45;
  const modelScale = isMobile ? 0.84 : 1;

  return (
    <div className="relative w-full h-full">
      {/* Tip balon — samo na mobilnom, iznad kugle */}
      {isMobile && (
        <div className="absolute top-3 inset-x-0 z-[5] text-center px-3">
          <div
            className="mx-auto max-w-[90%] text-white/85 text-sm leading-snug rounded-xl px-3 py-1.5"
            style={{
              background: "rgba(3,7,18,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(4px)",
            }}
          >
            Tip: you can spin the globe with your finger — no reason, it’s just awesome.
          </div>
        </div>
      )}

      <Canvas
        gl={{ antialias: true, alpha: true, stencil: true }}
        camera={{ position: [0, 0, camZ], fov: camFov }}
        dpr={[1, 2]}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.9} />

        <GlobeWithStencil
          outlineTex={outlineTex}
          maskTex={maskTex}
          fillTex={fillTex} // na mobilnom je null → nema land fill-a
          wireColor={final.css}
          lineTint={final.css}
          fillOpacity={fillOpacity}
          reducedMotion={!!reduced}
          modelScale={modelScale}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate
          enableDamping
          dampingFactor={0.06}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
}