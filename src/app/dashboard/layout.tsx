// src/app/dashboard/layout.tsx
import type { ReactNode } from "react";
import Nav from "@/components/Nav";

export const metadata = { title: "Tierless — Dashboard" };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <Nav brandHref="/" showThemeToggle={true}/>
      </div>
      <main>{children}</main>
    </>
  );
}