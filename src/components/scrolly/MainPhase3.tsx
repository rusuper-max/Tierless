"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { t } from "@/i18n";
import ShinyButton from "@/components/marketing/ShinyButton";

export default function MainPhase3() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // --- ANIMACIJE ---

  // 1. QR KARTICA
  const cardScale = useTransform(smooth, [0.3, 0.5], [1, 0.8]);
  const cardX = useTransform(smooth, [0.3, 0.5], ["0%", "-25%"]);
  const cardOpacity = useTransform(smooth, [0.6, 0.65], [1, 0]); 
  const cardBlur = useTransform(smooth, [0.3, 0.5], ["0px", "4px"]);
  const cardY = useTransform(smooth, [0.1, 0.3], ["20vh", "10vh"]); 

  // 2. PHONE
  const phoneY = useTransform(smooth, [0.35, 0.55], ["100vh", "12vh"]); 
  const phoneOpacity = useTransform(smooth, [0.35, 0.45], [0, 1]);
  const phoneScale = useTransform(smooth, [0.4, 0.6], [0.8, 1]);

  // 3. EKRAN
  const cameraOpacity = useTransform(smooth, [0.6, 0.65], [1, 0]);
  const loaderOpacity = useTransform(smooth, [0.6, 0.65, 0.7, 0.75], [0, 1, 1, 0]);
  
  const menuY = useTransform(smooth, [0.75, 0.85], ["100%", "0%"]);
  const menuOpacity = useTransform(smooth, [0.75, 0.8], [0, 1]);

  // 4. TEKSTOVI
  const step1Op = useTransform(smooth, [0.1, 0.25], [1, 0]);
  const step2Op = useTransform(smooth, [0.35, 0.45, 0.55], [0, 1, 0]);
  const step3Op = useTransform(smooth, [0.65, 0.8, 0.9], [0, 1, 1]);

  // --- DATA ---
  const menuItems = [
    { name: "Truffle Smash", desc: "Double patty, truffle mayo, swiss", price: "$14" },
    { name: "Spicy Chicken", desc: "Crispy thigh, slaw, pickles", price: "$12" },
    { name: "Loaded Fries", desc: "Bacon bits, cheddar sauce", price: "$8" },
    { name: "Craft Lemonade", desc: "Fresh mint & ginger", price: "$5" },
  ];

  return (
    <section 
      ref={containerRef} 
      className="relative h-[450vh] bg-[#020617] z-20"
    >
      <div className="sticky top-0 h-screen w-full flex flex-col items-center overflow-hidden perspective-1000">
        
        {/* --- TEKST ZONA --- */}
        <div className="absolute top-28 w-full px-4 text-center z-30 h-32 pointer-events-none">
            
            <motion.div style={{ opacity: step1Op }} className="absolute inset-0 flex flex-col items-center">
                <Badge text="Step 1" color="cyan" />
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-xl">
                   {t("Scan the QR.")}
                </h2>
                <p className="text-lg text-slate-400">
                   {t("Put it on tables. No app download needed.")}
                </p>
            </motion.div>

            <motion.div style={{ opacity: step2Op }} className="absolute inset-0 flex flex-col items-center">
                <Badge text="Step 2" color="indigo" />
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-xl">
                   {t("Instant Detect.")}
                </h2>
                <p className="text-lg text-slate-400">
                   {t("Lightning fast loading experience.")}
                </p>
            </motion.div>

            <motion.div style={{ opacity: step3Op }} className="absolute inset-0 flex flex-col items-center">
                <Badge text="Step 3" color="emerald" />
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-3 drop-shadow-xl">
                   {t("Order & Enjoy.")}
                </h2>
                <p className="text-lg text-slate-400">
                   {t("Beautiful menu. Happy customers.")}
                </p>
            </motion.div>

        </div>

        {/* --- SCENA --- */}
        <div className="relative w-full max-w-md h-full flex items-center justify-center pointer-events-none">
            
            {/* 1. TABLE TENT */}
            <motion.div
                style={{ y: cardY, scale: cardScale, x: cardX, opacity: cardOpacity, filter: `blur(${cardBlur})` }}
                className="absolute z-10"
            >
                <div className="w-64 h-80 bg-[#0b101b] rounded-xl border-2 border-slate-800 flex flex-col items-center justify-center p-4 shadow-2xl transform -rotate-3 origin-bottom-left">
                    <div className="w-3 h-3 bg-slate-900 rounded-full mb-4 shadow-[inset_0_1px_3px_rgba(0,0,0,1)]" />
                    <div className="w-40 h-40 bg-white p-2 rounded-lg">
                         <svg viewBox="0 0 100 100" className="w-full h-full text-black fill-current">
                            <path d="M0,0 h100 v100 h-100 z" fill="none" />
                            <rect x="10" y="10" width="25" height="25" rx="2" />
                            <rect x="15" y="15" width="15" height="15" fill="white" />
                            <rect x="18" y="18" width="9" height="9" />
                            <rect x="65" y="10" width="25" height="25" rx="2" />
                            <rect x="70" y="15" width="15" height="15" fill="white" />
                            <rect x="73" y="18" width="9" height="9" />
                            <rect x="10" y="65" width="25" height="25" rx="2" />
                            <rect x="15" y="70" width="15" height="15" fill="white" />
                            <rect x="18" y="73" width="9" height="9" />
                            <rect x="45" y="45" width="8" height="8" rx="1" />
                            <rect x="55" y="15" width="8" height="8" rx="1" />
                            <rect x="65" y="55" width="8" height="8" rx="1" />
                            <rect x="25" y="50" width="8" height="8" rx="1" />
                            <rect x="80" y="80" width="8" height="8" rx="1" />
                         </svg>
                    </div>
                    <p className="mt-5 text-slate-500 text-xs font-bold uppercase tracking-widest">Scan for Menu</p>
                </div>
                <div className="w-52 h-8 bg-[#1e293b] mx-auto -mt-2 rounded-b-lg shadow-xl relative z-[-1]" />
            </motion.div>

            {/* 2. TELEFON (Interactive) */}
            <motion.div
                style={{ y: phoneY, opacity: phoneOpacity, scale: phoneScale }}
                className="absolute z-20 w-[300px] h-[600px] pointer-events-auto" // Enable click
            >
                <div className="w-full h-full bg-[#020617] rounded-[44px] border-[6px] border-slate-800 shadow-[0_0_0_2px_#334155,0_20px_60px_-10px_rgba(0,0,0,0.9)] relative overflow-hidden">
                   
                   {/* Dynamic Island */}
                   <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center justify-center gap-2 px-3">
                      <div className="w-2 h-2 bg-[#1e293b] rounded-full" />
                      <div className="w-1 h-1 bg-[#0f172a] rounded-full" />
                   </div>

                   {/* SCREEN */}
                   <div className="w-full h-full bg-black relative overflow-hidden">
                       
                       {/* CAMERA */}
                       <motion.div style={{ opacity: cameraOpacity }} className="absolute inset-0 bg-slate-900 z-30 flex flex-col items-center justify-center">
                           <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-slate-800 to-black" />
                           <div className="relative w-56 h-56 border border-white/20 rounded-3xl flex items-center justify-center overflow-hidden">
                               <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                               <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                               <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-scan" />
                           </div>
                           <p className="mt-8 text-white/70 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Scanning code...</p>
                       </motion.div>

                       {/* LOADING (Cyan) */}
                       <motion.div style={{ opacity: loaderOpacity }} className="absolute inset-0 bg-[#0f172a] z-40 flex flex-col items-center justify-center">
                           <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                           <p className="mt-4 text-cyan-200 text-sm font-medium">Loading Menu...</p>
                       </motion.div>

                       {/* MENU + CTA (Integrated) */}
                       <motion.div 
                         style={{ opacity: menuOpacity, y: menuY }}
                         className="absolute inset-0 bg-[#020617] z-50 flex flex-col"
                       >
                           <div className="h-44 bg-gradient-to-br from-orange-600 to-red-700 p-4 flex items-end relative">
                               <div className="absolute inset-0 bg-[linear-gradient(transparent,rgba(0,0,0,0.8))]" />
                               <div className="relative z-10 w-full">
                                   <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-white font-bold text-2xl tracking-tight">Burger & Co.</h3>
                                            <div className="flex items-center gap-1 text-amber-400 text-xs mt-1"><span>★★★★★</span><span className="text-slate-300">(124)</span></div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur px-2 py-1 rounded-lg text-white text-xs font-bold">OPEN</div>
                                   </div>
                               </div>
                           </div>
                           
                           <div className="px-4 py-3 flex gap-2 border-b border-slate-800/50">
                               <span className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-bold">Popular</span>
                               <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium">Mains</span>
                           </div>

                           <div className="flex-1 px-4 py-2 space-y-3 overflow-hidden">
                               {menuItems.map((item, i) => (
                                   <div key={i} className="flex justify-between items-start gap-3 p-2 rounded-xl hover:bg-slate-800/30 transition-colors">
                                       <div className="flex-1">
                                           <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                           <p className="text-slate-500 text-[10px] mt-0.5 leading-snug">{item.desc}</p>
                                           <p className="text-cyan-400 text-sm font-bold mt-1.5">{item.price}</p>
                                       </div>
                                       <div className="w-16 h-16 bg-slate-800 rounded-xl border border-slate-700/50 relative overflow-hidden shrink-0">
                                            <div className={`absolute inset-0 opacity-50 bg-gradient-to-br ${i%2===0 ? 'from-amber-600 to-orange-800' : 'from-red-600 to-rose-800'}`} />
                                            <div className="absolute bottom-1 right-1 bg-black/50 rounded-full p-0.5"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></div>
                                       </div>
                                   </div>
                               ))}
                           </div>

                           {/* INTEGRISANI CTA - Deo telefona */}
                          {/* INTEGRISANI CTA - Deo telefona */}
<div className="p-4 pt-2 border-t border-slate-800/50 bg-[#020617]/95 backdrop-blur pb-8">
    <ShinyButton 
        href="/start" 
        className="w-full" 
        rounded="rounded-xl" // <--- OVO REŠAVA PROBLEM
    >
       Create My QR Menu
    </ShinyButton>
</div>
                       </motion.div>

                   </div>
                </div>
            </motion.div>

        </div>

      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-60px); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(60px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </section>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
    const colors: any = {
        cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    };
    return (
        <span className={`inline-block py-1 px-3 rounded-full border text-[10px] font-bold tracking-widest mb-3 uppercase ${colors[color]}`}>
            {text}
        </span>
    );
}