"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { t } from "@/i18n";

const CARD_WIDTH = 300;
const GAP = 40; 

export default function MainPhase2() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001
  });

  // --- ANIMACIJE ---
  
  // 1. Dolazak Špila (Spušten niže da ne gazi naslov)
  const deckY = useTransform(smoothProgress, [0, 0.2], ["50vh", "0vh"]); 
  const deckScale = useTransform(smoothProgress, [0, 0.2], [0.8, 1]);
  const deckOpacity = useTransform(smoothProgress, [0, 0.1], [0, 1]);
  const deckRotateX = useTransform(smoothProgress, [0, 0.2], [30, 0]);

  // 2. Širenje Karata
  const spreadProgress = useTransform(smoothProgress, [0.15, 0.45], [0, 1]);
  
  const xLeft = useTransform(spreadProgress, [0, 1], [0, -(CARD_WIDTH + GAP)]);
  const rLeft = useTransform(spreadProgress, [0, 1], [-5, -2]);
  
  const zCenter = useTransform(spreadProgress, [0, 1], [0, 30]);
  const sCenter = useTransform(spreadProgress, [0, 1], [1, 1.05]);
  
  const xRight = useTransform(spreadProgress, [0, 1], [0, CARD_WIDTH + GAP]);
  const rRight = useTransform(spreadProgress, [0, 1], [5, 2]);

  // 3. Headline (Samo fade in, NEMA fade out)
  const headOp = useTransform(smoothProgress, [0, 0.1], [0, 1]);
  
  return (
    <section 
      ref={containerRef} 
      className="relative h-[350vh] bg-[#020617]"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center perspective-1000">
        
        {/* HEADLINE - Fiksiran visoko, stabilan */}
        <motion.div 
          style={{ opacity: headOp }}
          className="absolute top-28 z-20 text-center px-4 w-full pointer-events-none"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl">
            {t("Pick a template.")} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 animate-gradient">
              {t("Customize visually.")}
            </span>
          </h2>
          <p className="text-slate-400 text-lg mt-4 max-w-xl mx-auto">
            {t("Start with a preset, then make it yours. No coding required.")}
          </p>
        </motion.div>

        {/* 3D CARDS - Spuštene dole (mt-48) */}
        <motion.div
          style={{
            y: deckY,
            scale: deckScale,
            opacity: deckOpacity,
            rotateX: deckRotateX,
            transformStyle: "preserve-3d",
          }}
          className="relative z-10 flex items-center justify-center mt-48"
        >
          {/* KARTICE (Iste kao pre) */}
          <motion.div style={{ x: xLeft, rotateZ: rLeft }} className="absolute">
            <PricingCard title="Cafe Menu" price="QR" features={["Mobile Ready", "Unlimited Items", "Photos"]} accent="cyan" />
          </motion.div>

          <motion.div style={{ z: zCenter, scale: sCenter }} className="absolute z-20">
            <PricingCard title="SaaS Growth" price="$29" features={["Custom Domain", "Analytics", "A/B Testing"]} accent="brand" featured />
          </motion.div>

          <motion.div style={{ x: xRight, rotateZ: rRight }} className="absolute">
            <PricingCard title="Agency" price="Custom" features={["Whitelabel", "API Access", "Priority Support"]} accent="indigo" />
          </motion.div>
        </motion.div>

        {/* Bottom Overlay */}
        <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-40" />
        
      </div>
    </section>
  );
}

// ... (PricingCard komponenta ostaje ista kao u prošlom odgovoru)
// Kopiraj PricingCard funkciju iz prethodnog odgovora ovde
// --- KARTICA (CYAN DOMINANCE) ---
function PricingCard({ title, price, features, accent, featured }: any) {
  const isBrand = accent === "brand";
  
  // Boje
  let iconColor = "bg-slate-700";
  let checkColor = "bg-slate-600";
  let borderColorClass = "border-slate-700";

  if (accent === "cyan") {
    iconColor = "bg-cyan-500";
    checkColor = "bg-cyan-400";
    borderColorClass = "border-cyan-500/40";
  } else if (accent === "indigo") {
    iconColor = "bg-indigo-500";
    checkColor = "bg-indigo-400";
    borderColorClass = "border-indigo-500/40";
  }

  return (
    <div 
      className={`
        w-[300px] h-[460px] rounded-3xl p-6 flex flex-col relative overflow-hidden
        backdrop-blur-xl transition-all duration-300 select-none
        ${isBrand 
          // PROMENA: Shadow je sada Cyan/Sky, a ne Purple
          ? "bg-[#0f172a]/95 shadow-[0_0_60px_-15px_rgba(34,211,238,0.25)]" 
          : "bg-[#0b0f19]/90 shadow-2xl border " + borderColorClass
        }
      `}
      // PROMENA: Gradient Border je sada Cyan -> Sky Blue (bez Indigo/Purple)
      style={isBrand ? {
        border: '2px solid transparent',
        background: 'linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(135deg, #22D3EE 0%, #38bdf8 100%) border-box'
      } : {}}
    >
      {/* Glow Spot (Sada je Cyan) */}
      <div className={`absolute -top-20 -right-20 w-60 h-60 blur-[90px] rounded-full pointer-events-none opacity-40 ${isBrand ? "bg-cyan-500" : "bg-slate-500"}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div className={`p-3 rounded-2xl bg-white/5 border border-white/10`}>
          {/* Ikonica kružić */}
          <div className={`w-4 h-4 rounded-full ${isBrand ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee]" : iconColor}`} />
        </div>
        
        {/* POPULAR BADGE (Cyan Style) */}
        {featured && (
           <span className="px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-widest text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
             Popular
           </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-100 mb-1 tracking-wide">{title}</h3>
      <div className="text-3xl font-bold text-white mb-6">{price}</div>

      {/* Features */}
      <div className="space-y-4 flex-1">
        {features.map((f: string, i: number) => (
          <div key={i} className="flex items-center gap-3 text-sm text-slate-400 font-medium">
             {/* Tačkice su sada uvek Cyan na Brand kartici */}
             <div className={`w-1.5 h-1.5 rounded-full ${isBrand ? "bg-cyan-400 shadow-[0_0_6px_#22d3ee]" : checkColor}`} />
             {f}
          </div>
        ))}
      </div>

      {/* "FAKE BUTTON" -> Visual Component Indicator */}
      <div className={`
        w-full py-3 rounded-xl mt-6 flex items-center justify-center gap-2
        border border-dashed border-white/10 bg-white/5 text-slate-500 text-[10px] font-mono uppercase tracking-widest
      `}>
        <svg className="w-3 h-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Visual Component
      </div>

    </div>
  );
}