// src/components/DevPlanSwitcher.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount, setDevPlanOverride, isDevUser } from "@/hooks/useAccount";
import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Plan } from "@/lib/entitlements.adapter";

const PLANS: { id: Plan; label: string; color: string }[] = [
  { id: "free", label: "Free", color: "#6B7280" },
  { id: "starter", label: "Starter", color: "#10B981" },
  { id: "growth", label: "Growth", color: "#3B82F6" },
  { id: "pro", label: "Pro", color: "#8B5CF6" },
  { id: "tierless", label: "Tierless", color: "#F59E0B" },
];

export default function DevPlanSwitcher() {
  const { email, plan } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything on server or before mount
  if (!mounted) return null;

  // Only show for dev users (localhost only)
  if (!isDevUser(email)) return null;

  const currentPlan = PLANS.find((p) => p.id === plan) || PLANS[0];
  const hasOverride = typeof window !== "undefined" && localStorage.getItem("tierless_dev_plan_override");

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 z-[9999] px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
        title="Dev Plan Switcher"
      >
        <Bug className="w-3.5 h-3.5" />
        <span>DEV</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-[9999] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl text-white text-sm overflow-hidden min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs uppercase tracking-wide text-amber-400">Dev Mode</span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Current Plan */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentPlan.color }}
          />
          <span className="font-medium">{currentPlan.label}</span>
          {hasOverride && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
              OVERRIDE
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Plan Options */}
      {isOpen && (
        <div className="border-t border-gray-700">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setDevPlanOverride(p.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors ${
                plan === p.id ? "bg-gray-800" : ""
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.label}</span>
              {plan === p.id && (
                <span className="ml-auto text-emerald-400">✓</span>
              )}
            </button>
          ))}

          {/* Reset */}
          {hasOverride && (
            <button
              onClick={() => {
                setDevPlanOverride(null);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors border-t border-gray-700"
            >
              <X className="w-3 h-3" />
              <span>Reset to Real Plan</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

