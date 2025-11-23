// src/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  className?: string;
  ariaLabel?: string;
};

export default function ThemeToggle({ className = "", ariaLabel = "Toggle theme" }: Props) {
  const [isDark, setIsDark] = useState(false);

  // inicijalno stanje iz <html> ili localStorage
  useEffect(() => {
    const html = document.documentElement;
    const stored = (() => {
      try { return localStorage.getItem("theme"); } catch { return null; }
    })();
    const dark = stored ? stored === "dark" : html.classList.contains("dark");
    html.classList.toggle("dark", dark);
    setIsDark(dark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const html = document.documentElement;
    html.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { }
    // obavesti ostatak app-a (ako sluša)
    window.dispatchEvent(new CustomEvent("TL_THEME_TOGGLED", { detail: { dark: next } }));
  };

  return (
    <Button
      aria-label={ariaLabel}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={toggle}
      variant="brand"
      size="icon"
      pill
      className={[
        // nežna pozadina da se ne “lepi” na tamnu traku
        "backdrop-blur-[2px]",
        "bg-transparent",
        // ukloni bilo kakav puni fill koji bi delovao kao “beli track”
        "!text-inherit",
        className,
      ].join(" ")}
      icon={isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    />
  );
}