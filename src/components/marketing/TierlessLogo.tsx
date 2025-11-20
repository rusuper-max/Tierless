"use client";

export default function TierlessLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Tierless Logo"
    >
      <defs>
        <linearGradient id="tierless-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo */}
          <stop offset="100%" stopColor="#22D3EE" /> {/* Cyan */}
        </linearGradient>
      </defs>
      
      {/* Horizontal Bar (Top Tier) */}
      <rect x="2" y="2" width="28" height="8" rx="2" fill="url(#tierless-grad)" />
      
      {/* Vertical Bar (Stem) - Malo odvojen da se vidi "slaganje" */}
      <rect x="11" y="12" width="10" height="18" rx="2" fill="url(#tierless-grad)" fillOpacity="0.9" />
    </svg>
  );
}