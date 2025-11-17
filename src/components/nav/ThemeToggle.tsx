"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const BRAND_GRADIENT =
  "linear-gradient(90deg,var(--brand-1,#4F46E5),var(--brand-2,#22D3EE))";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Drži lokalni state uvek usklađen sa <html class="dark">
  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;

    const update = () => {
      setIsDark(html.classList.contains("dark"));
    };

    update();

    const obs = new MutationObserver(update);
    obs.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => obs.disconnect();
  }, []);

  const toggle = () => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const next = !html.classList.contains("dark");

    html.classList.toggle("dark", next);
    setIsDark(next);

    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}

    try {
      window.dispatchEvent(new Event("TL_THEME_TOGGLED"));
    } catch {}
  };

  const label = isDark ? "Dark" : "Light";
  const icon = isDark ? (
    <Moon className="size-4" />
  ) : (
    <Sun className="size-4" />
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
      className="inline-flex group cursor-pointer"
    >
      <span className="relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--card,white)] text-sm font-medium transition will-change-transform select-none px-3 py-1.5 text-[var(--text,#111827)] hover:shadow-[0_10px_24px_rgba(2,6,23,.10)] hover:-translate-y-0.5 active:translate-y-0 dark:bg-[var(--card,#020617)]">
        {/* Gradient outline kao na ActionButton-ima */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: 1.5,
            background: BRAND_GRADIENT,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor" as any,
            maskComposite: "exclude" as any,
          }}
        />
        {/* Suptilan glow na hover, isto kao stari brand dugmići */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
          style={{
            boxShadow: "0 0 14px 4px rgba(34,211,238,.22)",
            transition: "opacity .18s ease",
          }}
        />
        <span className="relative z-[1] inline-flex items-center gap-2 whitespace-nowrap text-xs">
          {icon}
          {label}
        </span>
      </span>
    </button>
  );
}