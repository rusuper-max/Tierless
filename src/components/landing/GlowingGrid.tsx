"use client";

import React, { useRef, useState, useEffect } from "react";

interface GlowingGridProps {
    children: React.ReactNode;
    className?: string;
}

export default function GlowingGrid({ children, className = "" }: GlowingGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateMousePosition = (ev: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            setMousePosition({
                x: ev.clientX - rect.left,
                y: ev.clientY - rect.top,
            });
        };

        container.addEventListener("mousemove", updateMousePosition);
        return () => {
            container.removeEventListener("mousemove", updateMousePosition);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative rounded-3xl bg-slate-100 p-[1px] overflow-hidden ${className}`}
        >
            {/* 1. The "Glow" Background Layer 
          - This layer sits behind the cards.
          - It is mostly slate-100 (the default border color).
          - It has a radial gradient "spotlight" that follows the mouse.
      */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    background: `
            radial-gradient(
              600px circle at ${mousePosition.x}px ${mousePosition.y}px, 
              rgba(99, 102, 241, 0.4), 
              rgba(6, 182, 212, 0.4), 
              rgba(241, 245, 249, 1) 40%
            )
          `,
                }}
            />

            {/* 2. The Grid Container 
          - Uses gap-px to create 1px borders between cards.
          - The background of this container is transparent, letting the layer above show through the gaps.
      */}
            <div className="relative z-10 grid gap-[1px] sm:grid-cols-2 lg:grid-cols-3 rounded-3xl overflow-hidden bg-transparent">
                {children}
            </div>
        </div>
    );
}
