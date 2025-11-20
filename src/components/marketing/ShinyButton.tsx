"use client";

import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href?: string;
  children: ReactNode;
  className?: string;
  rounded?: string; // <--- NOVI PROP
};

export default function ShinyButton({ 
  href, 
  children, 
  className = "",
  rounded = "rounded-full" // Default je i dalje pilula
}: Props) {
  
  const content = (
    // 1. Outer Container - Prima 'rounded' prop
    <div className={`group relative inline-flex items-center justify-center p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 overflow-hidden ${rounded} ${className}`}>
      
      {/* 2. Gradient - Nema radius, on je ogroman kvadrat iza */}
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#020617_0%,#4F46E5_50%,#22D3EE_100%)] opacity-70 transition-opacity group-hover:opacity-100" />

      {/* 3. Inner Container - MORA DA PRIMI ISTI 'rounded' PROP */}
      <span className={`relative inline-flex h-full w-full cursor-pointer items-center justify-center bg-[#020617] px-8 py-3.5 text-sm font-bold text-white transition-all group-hover:bg-[#0f172a] group-hover:text-cyan-50 ${rounded}`}>
        
        {/* Top Highlight */}
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        
        {/* Content */}
        <span className="flex items-center gap-2 relative z-10">
          {children}
          <svg 
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 text-cyan-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
      </span>
    </div>
  );

  if (href) {
    return <Link href={href} className={rounded}>{content}</Link>; // I linku treba radius za focus ring
  }

  return <button className={rounded}>{content}</button>;
}