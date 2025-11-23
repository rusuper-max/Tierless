"use client";

import React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type HelpModeContextType = {
  isActive: boolean;
  hasSeenIntro: boolean;
  enableHelpMode: () => void;
  disableHelpMode: () => void;
  toggleHelpMode: () => void;
  markIntroAsSeen: () => void;
};

const HelpModeContext = createContext<HelpModeContextType | null>(null);

const INTRO_SEEN_KEY = "tierless_help_intro_seen";

export function HelpModeProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(INTRO_SEEN_KEY);
      setHasSeenIntro(seen === "true");
    } catch {
      // ignore
    }
  }, []);

  const enableHelpMode = () => setIsActive(true);
  const disableHelpMode = () => setIsActive(false);
  const toggleHelpMode = () => setIsActive((prev) => !prev);

  const markIntroAsSeen = () => {
    setHasSeenIntro(true);
    try {
      localStorage.setItem(INTRO_SEEN_KEY, "true");
    } catch {
      // ignore
    }
  };

  const value = {
    isActive,
    hasSeenIntro,
    enableHelpMode,
    disableHelpMode,
    toggleHelpMode,
    markIntroAsSeen,
  };

  return (
    <HelpModeContext.Provider value={value}>
      {children}
    </HelpModeContext.Provider>
  );
}

export function useHelpMode() {
  const context = useContext(HelpModeContext);
  if (!context) {
    throw new Error("useHelpMode must be used within HelpModeProvider");
  }
  return context;
}
