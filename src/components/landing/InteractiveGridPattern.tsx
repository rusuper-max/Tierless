"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

export default function InteractiveGridPattern({ className }: { className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Use motion values for performant updates
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Create smooth springs for the trail effect
    const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
    const trailX = useSpring(mouseX, springConfig);
    const trailY = useSpring(mouseY, springConfig);

    // Mask image templates
    // 1. Main Spotlight: Instant tracking (no spring)
    const maskImage = useMotionTemplate`radial-gradient(150px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

    // 2. Trail Spotlight: Smooth spring delay
    const trailMaskImage = useMotionTemplate`radial-gradient(300px circle at ${trailX}px ${trailY}px, black, transparent)`;

    useEffect(() => {
        const updateMousePosition = (ev: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            mouseX.set(ev.clientX - rect.left);
            mouseY.set(ev.clientY - rect.top);
        };

        window.addEventListener("mousemove", updateMousePosition);
        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
        };
    }, [mouseX, mouseY]);

    return (
        <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* 1. Base Grid (Always visible, extremely faint) */}
            <div
                className="absolute inset-0 z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* 2. Main Spotlight Grid (Sharp, immediate) */}
            <motion.div
                className="absolute inset-0 z-10 opacity-[0.3]"
                style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    maskImage,
                    WebkitMaskImage: maskImage,
                }}
            />

            {/* 3. Trail Grid (Laggy, softer) */}
            <motion.div
                className="absolute inset-0 z-10 opacity-[0.15]"
                style={{
                    backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                    maskImage: trailMaskImage,
                    WebkitMaskImage: trailMaskImage,
                }}
            />

            {/* 4. Spotlight Glow (Soft gradient blob - reduced size and opacity) */}
            <motion.div
                className="absolute z-0 w-[400px] h-[400px] rounded-full pointer-events-none mix-blend-multiply"
                style={{
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)",
                    left: 0,
                    top: 0,
                    x: useSpring(mouseX, { stiffness: 50, damping: 20 }), // Slightly different spring for the blob
                    y: useSpring(mouseY, { stiffness: 50, damping: 20 }),
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            />
        </div>
    );
}
