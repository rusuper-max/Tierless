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

/* ---------- child unutar <Canvas> ---------- */
function GlobeWithStencil({
  outlineTex,
  maskTex,
  fillTex,
  wireColor,
  lineTint,
  fillOpacity,
  reducedMotion,
}: {
  outlineTex: THREE.Texture | null;
  maskTex: THREE.Texture | null;
  fillTex: THREE.Texture | null;
  wireColor: string;
  lineTint: string;
  fillOpacity: number;
  reducedMotion: boolean;
}) {
  const tiltRef = useRef<THREE.Group>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const outlineRef = useRef<THREE.Mesh>(null!);
  const maskRef = useRef<THREE.Mesh>(null!);
  const fillRef = useRef<THREE.Mesh>(null!);

  // aksijalni nagib ~23.4°
  useEffect(() => {
    if (tiltRef.current) tiltRef.current.rotation.z = THREE.MathUtils.degToRad(23.4);
  }, []);

  useFrame((_, dt) => {
    if (reducedMotion) return;
    const spin = dt * 0.15;
    if (wireRef.current) wireRef.current.rotation.y += spin;
    if (outlineRef.current) outlineRef.current.rotation.y += spin;
    if (maskRef.current) maskRef.current.rotation.y += spin;
    if (fillRef.current) fillRef.current.rotation.y += spin;
  });

  return (
    <group ref={tiltRef}>
      {/* 0) LAND FILL — ispod svega, blago providan */}
      {fillTex && (
        <mesh ref={fillRef} rotation={[0, Math.PI * 0.1, 0]} renderOrder={0}>
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
        <mesh ref={maskRef} rotation={[0, Math.PI * 0.1, 0]} renderOrder={1}>
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
      <mesh ref={wireRef} rotation={[0, Math.PI * 0.1, 0]} renderOrder={2}>
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
        <mesh ref={outlineRef} rotation={[0, Math.PI * 0.1, 0]} renderOrder={3}>
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

  // Land fill providnost lagano raste ka kraju (možeš zameniti za konstantu fillMaxOpacity)
  const fillOpacity = Math.min(fillMaxOpacity, fillMaxOpacity * (0.2 + 0.8 * phase));

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Učitavanje tekstura
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
          setter(tex);
        },
        undefined,
        () => { if (!dead) setter(null); }
      );
    };

    load(textureSrc, setOutlineTex);
    load(landMaskSrc, setMaskTex);
    load(landFillSrc, setFillTex);

    return () => { dead = true; };
  }, [textureSrc, landMaskSrc, landFillSrc]);

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, stencil: true }}
      camera={{ position: [0, 0, 3.15], fov: 45 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.9} />

      <GlobeWithStencil
        outlineTex={outlineTex}
        maskTex={maskTex}
        fillTex={fillTex}
        wireColor={final.css}
        lineTint={final.css}
        fillOpacity={fillOpacity}
        reducedMotion={!!reduced}
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
  );
}