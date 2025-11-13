// src/dev/exposeStore.ts
"use client";
import { useEditorStore } from "@/hooks/useEditorStore";

declare global {
  interface Window {
    __ZUSTAND__?: any;
  }
}

// Nemoj spamovati u production
if (typeof window !== "undefined") {
  // Kreiraj sandbox objekat ako ne postoji
  window.__ZUSTAND__ = window.__ZUSTAND__ || {};
  // Izloži baš ono što koristimo stalno u konzoli
  window.__ZUSTAND__.useEditorStore = useEditorStore;
}