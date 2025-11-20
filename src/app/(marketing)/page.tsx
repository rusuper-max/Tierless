"use client";

import StartHeader from "@/components/marketing/MarketingHeader"; // ili MarketingHeader
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import MainPhase3 from "@/components/scrolly/MainPhase3";
import Footer from "@/components/marketing/Footer"; // Importuj Footer

export default function LandingPage() {
  return (
    <>
      <StartHeader />
      <MainPhase1 />
      <MainPhase2 />
      <MainPhase3 />
      <Footer /> {/* Dodaj Footer na dno */}
    </>
  );
}