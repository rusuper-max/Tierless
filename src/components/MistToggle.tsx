// src/components/MistToggle.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

export default function MistToggle() {
  const KEY = "tierless:mist:enabled";
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === "0") setEnabled(false);
      else setEnabled(true);
    } catch {}
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem(KEY, next ? "1" : "0"); } catch {}
    window.dispatchEvent(new CustomEvent("tierless-mist-toggle", { detail: next }));
  };

  return (
    <Button className="btn-nav btn-plain" onClick={toggle} aria-pressed={enabled}>
      {enabled ? "Mist: On" : "Mist: Off"}
    </Button>
  );
}