// src/hooks/useToast.ts
"use client";

import { useCallback, useEffect, useState } from "react";

export type ToastVariant = "success" | "error" | "info";
export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number; // ms
};

type Listener = (items: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const l of listeners) l([...toasts]);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function push(base: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).slice(2);
  const item: ToastItem = { duration: 3500, ...base, id };
  toasts = [...toasts, item];
  notify();

  // Auto-dismiss (browser env; fajl je "use client")
  const tm = setTimeout(() => dismissToast(id), item.duration);
  void tm; // silence unused in some linters

  return id;
}

export function useToast() {
  return {
    push,
    success: (title: string, description?: string) =>
      push({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      push({ title, description, variant: "error" }),
    info: (title: string, description?: string) =>
      push({ title, description, variant: "info" }),
    dismiss: dismissToast,
  };
}

export function useToastState() {
  const [list, setList] = useState<ToastItem[]>(toasts);

  // Stabilan listener za exhaustive-deps
  const handleUpdate = useCallback<Listener>((items) => {
    setList(items);
  }, []);

  useEffect(() => {
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [handleUpdate]);

  return list;
}