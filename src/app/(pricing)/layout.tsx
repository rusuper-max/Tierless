// src/app/(pricing)/layout.tsx
import type { ReactNode } from "react";

export const metadata = {
  title: "Pricing • Tierless",
};

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    // Posebni scope za pricing — bez marketing CSS-a
    <div className="tl-pricing min-h-screen bg-white text-slate-900 dark:bg-black dark:text-slate-100">
      {children}
    </div>
  );
}