"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = mounted ? (theme === "system" ? systemTheme : theme) : undefined;
  const label = current === "dark" ? "Light" : "Dark";
  const next = current === "dark" ? "light" : "dark";

  return (
    <Button
      variant="nav"
      size="sm"
      pill
      onClick={() => setTheme(next ?? "dark")}
      aria-label="Toggle theme"
    >
      {mounted ? label : "Theme"}
    </Button>
  );
}