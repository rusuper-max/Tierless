"use client";

import StartHeader from "@/components/marketing/MarketingHeader";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import MainPhase3Benefits from "@/components/scrolly/MainPhase3Benefits";
import MainPhase4 from "@/components/scrolly/MainPhase4";
import Footer from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <>
      <StartHeader />
      <MainPhase1 />       {/* Hero: Your prices. Online. Beautiful. */}
      <MainPhase2 />       {/* Examples: Salon → Dentist → Restaurant */}
      <MainPhase3Benefits /> {/* Why Tierless? Benefits grid */}
      <MainPhase4 />       {/* QR Demo: Scan → Detect → Book */}
      <Footer />
    </>
  );
}