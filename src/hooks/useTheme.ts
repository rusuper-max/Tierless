// src/hooks/useTheme.ts
"use client";

import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

const LS_KEY = "theme";

function getSystemPref(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = (localStorage.getItem(LS_KEY) as Theme | null);
  return saved ?? getSystemPref();
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  // apply to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem(LS_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for theme toggle events from ThemeToggle component
  useEffect(() => {
    const handleThemeToggle = (e: CustomEvent<{ dark: boolean }>) => {
      setTheme(e.detail.dark ? "dark" : "light");
    };
    
    window.addEventListener("TL_THEME_TOGGLED" as any, handleThemeToggle);
    return () => window.removeEventListener("TL_THEME_TOGGLED" as any, handleThemeToggle);
  }, []);

  // keep in sync with system changes (optional but nice)
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const saved = localStorage.getItem(LS_KEY);
      // only auto-switch if user hasn't explicitly chosen
      if (!saved) setTheme(mql.matches ? "dark" : "light");
    };
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
    // When user toggles, we keep the explicit choice in LS
    localStorage.setItem(LS_KEY, theme === "dark" ? "light" : "dark");
  }, [theme]);

  return { theme, setTheme, toggle, mounted };
}