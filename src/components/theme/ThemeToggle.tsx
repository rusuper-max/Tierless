"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({
  variant = "icon", // "icon" ili "pill"
}: { variant?: "icon" | "pill" }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // izbegni mismatch pre mounta
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="rounded-full p-3 ring-1 ring-inset ring-white/12 bg-black/25 text-white/90"
      >
        <Moon className="size-[20px]" />
      </button>
    );
  }

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";
  const next = isDark ? "light" : "dark";

  const onClick = () => setTheme(next);

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm
                   ring-1 ring-inset ring-white/12 bg-black/25 text-white/95 hover:ring-cyan-300/60 transition"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        <span className="uppercase tracking-wide text-[12px]">
          {isDark ? "Light" : "Dark"}
        </span>
      </button>
    );
  }

  // icon variant
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full p-3 ring-1 ring-inset ring-white/12 bg-black/25 text-white/90 hover:ring-cyan-300/60 transition"
      aria-label="Toggle theme"
      title={`Switch to ${next} mode`}
    >
      {isDark ? <Sun className="size-[20px]" /> : <Moon className="size-[20px]" />}
    </button>
  );
}