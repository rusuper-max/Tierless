// src/components/TemplateMiniPreview.tsx
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee, Utensils, Camera, Heart, Sparkles, Dumbbell,
  Globe, Code, Car, Scissors, Stethoscope, GraduationCap,
  Music, PawPrint, Briefcase, Home, Wrench, Plane, Cake,
  Flower2, ShoppingBag, Palette, Mic, TreePine, Pizza,
  SprayCan, Brush
} from "lucide-react";

interface Props {
  slug: string;
  isPremium?: boolean;
  accentColor?: string;
  className?: string;
  isHovered?: boolean; // Pass from parent for coordinated animations
}

// Get gradient colors based on slug/category
function getGradientForSlug(slug: string, isPremium: boolean): string {
  const lowerSlug = slug.toLowerCase();

  // 🔥 Neon Creative Studio - special gradient
  if (lowerSlug.includes("neon") || lowerSlug.includes("creative-studio")) {
    return "linear-gradient(135deg, #030712 0%, #0f0f1a 50%, #030712 100%)";
  }

  if (isPremium) {
    if (lowerSlug.includes("wedding") || lowerSlug.includes("photo")) {
      return "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)";
    }
    return "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)";
  }

  if (lowerSlug.includes("coffee") || lowerSlug.includes("cafe")) {
    return "linear-gradient(135deg, #78350f 0%, #92400e 100%)";
  }
  if (lowerSlug.includes("restaurant") || lowerSlug.includes("food")) {
    return "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
  }
  if (lowerSlug.includes("salon") || lowerSlug.includes("beauty") || lowerSlug.includes("spa")) {
    return "linear-gradient(135deg, #db2777 0%, #be185d 100%)";
  }
  if (lowerSlug.includes("fitness") || lowerSlug.includes("gym") || lowerSlug.includes("trainer")) {
    return "linear-gradient(135deg, #059669 0%, #047857 100%)";
  }
  if (lowerSlug.includes("agency") || lowerSlug.includes("web") || lowerSlug.includes("tech")) {
    return "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)";
  }
  if (lowerSlug.includes("cleaning")) {
    return "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)";
  }
  if (lowerSlug.includes("car") || lowerSlug.includes("auto")) {
    return "linear-gradient(135deg, #475569 0%, #334155 100%)";
  }
  if (lowerSlug.includes("pet") || lowerSlug.includes("vet")) {
    return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
  }
  if (lowerSlug.includes("dentist") || lowerSlug.includes("doctor") || lowerSlug.includes("medical")) {
    return "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)";
  }

  return "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
}

// Get animation type based on slug
function getAnimationType(slug: string): string {
  const lowerSlug = slug.toLowerCase();
  
  // 🔥 Neon Creative - special pulsing glow
  if (lowerSlug.includes("neon") || lowerSlug.includes("creative-studio")) return "neon";
  if (lowerSlug.includes("coffee") || lowerSlug.includes("cafe")) return "steam";
  if (lowerSlug.includes("cleaning")) return "sweep";
  if (lowerSlug.includes("wedding") || lowerSlug.includes("photo")) return "flash";
  if (lowerSlug.includes("salon") || lowerSlug.includes("barber")) return "snip";
  if (lowerSlug.includes("fitness") || lowerSlug.includes("gym") || lowerSlug.includes("trainer")) return "pump";
  if (lowerSlug.includes("car") || lowerSlug.includes("auto")) return "shine";
  if (lowerSlug.includes("pet") || lowerSlug.includes("vet")) return "wag";
  if (lowerSlug.includes("music") || lowerSlug.includes("dj")) return "bounce";
  if (lowerSlug.includes("agency") || lowerSlug.includes("web")) return "code";
  if (lowerSlug.includes("restaurant") || lowerSlug.includes("food")) return "sizzle";
  if (lowerSlug.includes("spa") || lowerSlug.includes("yoga")) return "zen";
  if (lowerSlug.includes("florist") || lowerSlug.includes("flower")) return "bloom";
  if (lowerSlug.includes("saas") || lowerSlug.includes("software") || lowerSlug.includes("pricing")) return "saas";
  
  return "pulse";
}

// ============================================
// ANIMATED ICON COMPONENTS
// ============================================

// Coffee with rising steam - steam goes UP from the cup
function CoffeeAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      {/* Steam lines - positioned ABOVE the cup */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 rounded-full origin-bottom"
            style={{ backgroundColor: color }}
            initial={{ height: 8, opacity: 0.2, scaleY: 0.5 }}
            animate={isHovered ? {
              height: [8, 20, 12, 18, 8],
              opacity: [0.2, 0.6, 0.4, 0.5, 0.2],
              scaleY: [0.5, 1, 0.8, 1, 0.5],
              x: [0, (i - 1) * 3, 0],
            } : { height: 8, opacity: 0.2, scaleY: 0.5 }}
            transition={{
              duration: 2,
              repeat: isHovered ? Infinity : 0,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <Coffee size={56} color={color} strokeWidth={1.5} />
    </div>
  );
}

// Spray can cleaning with sparkle particles
function SweepAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      {/* Spray can that shakes when spraying */}
      <motion.div
        animate={isHovered ? { 
          rotate: [-5, 5, -5],
          x: [-2, 2, -2]
        } : { rotate: 0, x: 0 }}
        transition={{ duration: 0.15, repeat: isHovered ? Infinity : 0 }}
      >
        <SprayCan size={56} color={color} strokeWidth={1.5} />
      </motion.div>
      
      {/* Spray mist particles */}
      <AnimatePresence>
        {isHovered && [0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ 
              backgroundColor: color, 
              width: 3 + Math.random() * 3,
              height: 3 + Math.random() * 3,
              top: 10, 
              left: 45 
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0],
              x: [0, 30 + Math.random() * 20],
              y: [0, (i - 2.5) * 8],
              scale: [0.5, 1, 0.3],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.08,
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Sparkle effect at spray target */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute"
            style={{ top: 5, left: 60 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1.2, 0.5],
              rotate: [0, 180]
            }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            <Sparkles size={20} color={color} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Camera with flash
function FlashAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <motion.div
        animate={isHovered ? { scale: [1, 0.92, 1] } : { scale: 1 }}
        transition={{ duration: 0.25, repeat: isHovered ? Infinity : 0, repeatDelay: 1.2 }}
      >
        <Camera size={56} color={color} strokeWidth={1.5} />
      </motion.div>
      
      {/* Flash effect - bigger and more dramatic */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-6 -left-6"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.9, 0],
              scale: [0.3, 1.2, 0.3],
            }}
            transition={{ duration: 0.25, repeat: Infinity, repeatDelay: 1.2 }}
          >
            <div 
              className="w-20 h-20 rounded-full blur-lg"
              style={{ backgroundColor: color }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Scissors snipping
function SnipAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <motion.div
      animate={isHovered ? { 
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.05, 1, 1.05, 1]
      } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.6, repeat: isHovered ? Infinity : 0, repeatDelay: 0.3 }}
    >
      <Scissors size={56} color={color} strokeWidth={1.5} />
    </motion.div>
  );
}

// Dumbbell pumping
function PumpAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <motion.div
      animate={isHovered ? { 
        y: [0, -8, 0],
        scale: [1, 1.1, 1]
      } : { y: 0, scale: 1 }}
      transition={{ duration: 0.4, repeat: isHovered ? Infinity : 0 }}
    >
      <Dumbbell size={56} color={color} strokeWidth={1.5} />
    </motion.div>
  );
}

// Car shine effect
function ShineAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <Car size={56} color={color} strokeWidth={1.5} />
      
      {/* Shine sparkles */}
      <AnimatePresence>
        {isHovered && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ 
              top: 10 + i * 15, 
              left: 20 + i * 20,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <Sparkles size={16} color={color} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Paw wagging (tail wag effect)
function WagAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <motion.div
        animate={isHovered ? { rotate: [-5, 5, -5] } : { rotate: 0 }}
        transition={{ duration: 0.2, repeat: isHovered ? Infinity : 0 }}
      >
        <PawPrint size={56} color={color} strokeWidth={1.5} />
      </motion.div>
      
      {/* Hearts */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute -top-4 -right-2"
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], y: [0, -10, -20] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Heart size={20} color={color} fill={color} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Music bouncing
function BounceAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <motion.div
        animate={isHovered ? { y: [0, -5, 0] } : { y: 0 }}
        transition={{ duration: 0.3, repeat: isHovered ? Infinity : 0 }}
      >
        <Music size={56} color={color} strokeWidth={1.5} />
      </motion.div>
      
      {/* Music notes */}
      <AnimatePresence>
        {isHovered && [0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{ color, right: -10 + i * 15, top: 0 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: [0, 1, 0], y: [10, -20], x: [0, i === 0 ? -10 : 10] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.4 }}
          >
            ♪
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Code typing effect
function CodeAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <Globe size={56} color={color} strokeWidth={1.5} />
      
      {/* Orbiting dots */}
      <AnimatePresence>
        {isHovered && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: color,
              top: "50%",
              left: "50%",
            }}
            animate={{
              x: [0, 40 * Math.cos((i * 120 + 0) * Math.PI / 180), 40 * Math.cos((i * 120 + 360) * Math.PI / 180)],
              y: [0, 40 * Math.sin((i * 120 + 0) * Math.PI / 180), 40 * Math.sin((i * 120 + 360) * Math.PI / 180)],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Food sizzle effect  
function SizzleAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <Utensils size={56} color={color} strokeWidth={1.5} />
      
      {/* Sizzle particles */}
      <AnimatePresence>
        {isHovered && [0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ backgroundColor: color, bottom: 20, left: 30 + i * 6 }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [0, -15 - Math.random() * 10],
              x: [0, (Math.random() - 0.5) * 10],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Zen/Spa breathing effect
function ZenAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <motion.div
      animate={isHovered ? { 
        scale: [1, 1.05, 1],
        opacity: [0.7, 1, 0.7]
      } : { scale: 1, opacity: 1 }}
      transition={{ duration: 2, repeat: isHovered ? Infinity : 0, ease: "easeInOut" }}
    >
      <Flower2 size={56} color={color} strokeWidth={1.5} />
    </motion.div>
  );
}

// Flower blooming
function BloomAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <motion.div
      animate={isHovered ? { 
        rotate: [0, 5, -5, 0],
        scale: [1, 1.1, 1]
      } : { rotate: 0, scale: 1 }}
      transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
    >
      <Flower2 size={56} color={color} strokeWidth={1.5} />
    </motion.div>
  );
}

// SaaS pricing with floating coins/badges
function SaasAnimation({ isHovered, color }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative">
      <motion.div
        animate={isHovered ? { y: [0, -3, 0] } : { y: 0 }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      >
        <Code size={56} color={color} strokeWidth={1.5} />
      </motion.div>
      
      {/* Floating price tags */}
      <AnimatePresence>
        {isHovered && [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute text-xs font-bold"
            style={{ 
              color,
              top: -5 + i * 15,
              left: 50 + i * 10,
            }}
            initial={{ opacity: 0, x: -10, y: 5 }}
            animate={{ 
              opacity: [0, 1, 0],
              x: [0, 20 + i * 5],
              y: [0, -10 - i * 5],
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            {i === 0 ? "$" : i === 1 ? "$$" : "$$$"}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Pulse ring effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{ borderColor: color }}
            initial={{ width: 30, height: 30, opacity: 0.8 }}
            animate={{ 
              width: [30, 80],
              height: [30, 80],
              opacity: [0.6, 0],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Default pulse animation
function PulseAnimation({ isHovered, color, Icon }: { isHovered: boolean; color: string; Icon: React.ElementType }) {
  return (
    <motion.div
      animate={isHovered ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
    >
      <Icon size={56} color={color} strokeWidth={1.5} />
    </motion.div>
  );
}

// 🔥 NEON animation - pulsing gradient glow effect
function NeonAnimation({ isHovered }: { isHovered: boolean; color: string }) {
  return (
    <div className="relative w-20 h-20">
      {/* Background pulsing glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl"
        style={{
          background: "linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)",
        }}
        animate={isHovered ? {
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.2, 1],
        } : {
          opacity: 0.25,
          scale: 1,
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Main icon with gradient */}
      <motion.div
        className="relative flex items-center justify-center w-full h-full"
        animate={isHovered ? {
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        } : { scale: 1, rotate: 0 }}
        transition={{ duration: 1.5, repeat: isHovered ? Infinity : 0 }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
          <defs>
            <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          {/* Zap/Lightning bolt icon */}
          <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke="url(#neonGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </motion.div>

      {/* Orbiting particles */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i === 0 ? "#06b6d4" : i === 1 ? "#8b5cf6" : "#ec4899",
                  boxShadow: `0 0 8px ${i === 0 ? "#06b6d4" : i === 1 ? "#8b5cf6" : "#ec4899"}`,
                }}
                initial={{ opacity: 0, x: 40, y: 40 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: [40, 40 + Math.cos(i * 2.1) * 30, 40 + Math.cos(i * 2.1 + Math.PI) * 30],
                  y: [40, 40 + Math.sin(i * 2.1) * 30, 40 + Math.sin(i * 2.1 + Math.PI) * 30],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "linear",
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Glitch lines effect */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[0, 1].map((i) => (
              <motion.div
                key={`line-${i}`}
                className="absolute h-[2px] rounded-full"
                style={{
                  background: i === 0 ? "#06b6d4" : "#ec4899",
                  width: 20,
                  top: 25 + i * 25,
                  left: i === 0 ? 5 : 55,
                }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scaleX: [0, 1, 0],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main animated icon selector
function AnimatedIcon({ type, isHovered, color }: { type: string; isHovered: boolean; color: string }) {
  switch (type) {
    case "neon": return <NeonAnimation isHovered={isHovered} color={color} />;
    case "steam": return <CoffeeAnimation isHovered={isHovered} color={color} />;
    case "sweep": return <SweepAnimation isHovered={isHovered} color={color} />;
    case "flash": return <FlashAnimation isHovered={isHovered} color={color} />;
    case "snip": return <SnipAnimation isHovered={isHovered} color={color} />;
    case "pump": return <PumpAnimation isHovered={isHovered} color={color} />;
    case "shine": return <ShineAnimation isHovered={isHovered} color={color} />;
    case "wag": return <WagAnimation isHovered={isHovered} color={color} />;
    case "bounce": return <BounceAnimation isHovered={isHovered} color={color} />;
    case "code": return <CodeAnimation isHovered={isHovered} color={color} />;
    case "sizzle": return <SizzleAnimation isHovered={isHovered} color={color} />;
    case "zen": return <ZenAnimation isHovered={isHovered} color={color} />;
    case "bloom": return <BloomAnimation isHovered={isHovered} color={color} />;
    case "saas": return <SaasAnimation isHovered={isHovered} color={color} />;
    default: return <PulseAnimation isHovered={isHovered} color={color} Icon={Sparkles} />;
  }
}

/**
 * Elegant template preview with animated themed icons
 */
export default function TemplateMiniPreview({ slug, isPremium = false, className = "", isHovered = false }: Props) {
  const bg = getGradientForSlug(slug, isPremium);
  const animationType = getAnimationType(slug);

  // Icon colors - brighter when hovered
  const mainColor = isPremium 
    ? (isHovered ? "rgba(253, 186, 116, 0.7)" : "rgba(253, 186, 116, 0.4)")
    : (isHovered ? "rgba(255, 255, 255, 0.6)" : "rgba(255, 255, 255, 0.35)");
  const secondaryColor = isPremium ? "rgba(253, 186, 116, 0.25)" : "rgba(255, 255, 255, 0.2)";

  return (
    <div
      className={`w-full h-full overflow-hidden relative ${className}`}
      style={{ background: bg }}
    >
      {/* Main animated icon - positioned in bottom-right corner to not block button */}
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <motion.div
          animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedIcon type={animationType} isHovered={isHovered} color={mainColor} />
        </motion.div>
      </div>

      {/* Secondary decorative icon - top left */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <motion.div
          animate={isHovered ? { opacity: 0.5, scale: 1.1 } : { opacity: 0.25, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatedIcon type={animationType} isHovered={false} color={secondaryColor} />
        </motion.div>
      </div>

      {/* Subtle glow overlay for premium */}
      {isPremium && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 80% 80%, rgba(253,186,116,0.2) 0%, transparent 50%)"
          }}
        />
      )}
      
      {/* General glow on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={isHovered ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          background: isPremium 
            ? "radial-gradient(circle at 80% 80%, rgba(253,186,116,0.15) 0%, transparent 60%)"
            : "radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 60%)"
        }}
      />
    </div>
  );
}
