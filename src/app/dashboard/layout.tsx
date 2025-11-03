// src/app/dashboard/layout.tsx
// src/app/dashboard/layout.tsx
import "@/app/overrides.css"; // ⬅️ umesto "@/styles/overrides.css"

import type { ReactNode } from "react";
import Nav from "@/components/Nav";
import Sidebar from "@/components/dashboard/Sidebar";
import DevControls from "@/components/dev/DevControls"; // DEV-ONLY (press "D" to toggle)

export const metadata = { title: "Tierless — Dashboard" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Top nav ostaje isti */}
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <Nav brandHref="/" showThemeToggle={true} />
      </div>

      {/* Sidebar levo, gradijent separator, sadržaj desno */}
      <div className="min-h-screen w-full flex">
        <Sidebar />

        {/* BRAND GRADIENT SEPARATOR (2px) */}
        <div
          aria-hidden
          className="hidden md:block w-[2px] shrink-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, var(--brand-1,#4F46E5), var(--brand-2,#22D3EE))",
          }}
        />

        <div className="flex-1 min-w-0">{children}</div>
      </div>

      {/* DEV-ONLY — ukloniti pre produkcije */}
      <DevControls />
    </>
  );
}