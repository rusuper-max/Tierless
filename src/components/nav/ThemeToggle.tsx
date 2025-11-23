"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
    } catch { }

    try {
      window.dispatchEvent(new Event("TL_THEME_TOGGLED"));
    } catch { }
  };

  const label = isDark ? "Dark" : "Light";
  const icon = isDark ? (
    <Moon className="size-4" />
  ) : (
    <Sun className="size-4" />
  );

  return (
    <Button
      variant="neutral"
      size="xs"
      onClick={toggle}
      title="Toggle theme"
      icon={icon}
    >
      {label}
    </Button>
  );
}