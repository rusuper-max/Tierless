import "@/styles/marketing.css";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import Phase1Snap from "@/components/scrolly/Phase1Snap";
import Phase2LiftCut from "@/components/scrolly/Phase2LiftCut";
import ScrollyPhase3Mount from "@/components/scrolly/ScrollyPhase3Mount";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description:
    "Create a price page without a website. Share, configure, receive structured inquiries.",
};

export default function Page() {
  return (
    <>
      {/* Phase 1 (hero) */}
      <MainPhase1 />

      {/* Snap iz P1 čim krene skrol (radi sa Lenis-om koji si već dodao) */}
      <Phase1Snap
        prevRefSelector={`section[aria-label="Hero Phase"]`}
        targetSelector={`#phase2`}
        duration={0.6}
      />

      {/* Phase 2 (sticky scrollytelling) */}
      <section id="phase2" className="relative z-10">
        {/* Bitno: MainPhase2 ima data-track="p2" i h u svh jedinicama */}
        <MainPhase2 headline="Create your price page for any business" />
      </section>

      {/* Bridge za P2 → P3 bez gapa.
          - prevRefSelector gađa TAČNO root track P2 (section[data-track="p2"])
          - adjust < 0 vuče Phase 3 naviše (smanjuje gap)
          - kreni od -40, pa fino podešavaj po 5–10px */}
      <Phase2LiftCut prevRefSelector='section[data-track="p2"]' adjust={-40}>
        <ScrollyPhase3Mount />
      </Phase2LiftCut>
    </>
  );
}