"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type Props = {
  href?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Clean, professional CTA button
 * No spinning gradients, no excessive effects
 * Just solid colors with subtle hover state
 */
export default function ShinyButton({ 
  href, 
  children, 
  className = "",
}: Props) {
  
  const content = (
    <span 
      className={`
        group inline-flex items-center justify-center gap-2
        h-14 px-8 rounded-full
        bg-white text-slate-900
        font-semibold text-lg
        transition-all duration-200
        hover:bg-slate-100 hover:scale-[1.02]
        active:scale-[0.98]
        shadow-xl shadow-black/10
        ${className}
      `}
    >
      {children}
      <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
    </span>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return <button type="button">{content}</button>;
}