// src/app/(marketing)/page.tsx
import "@/styles/marketing.css";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import MainPhase3 from "@/components/scrolly/MainPhase3";
import ScrollNav from "@/components/marketing/ScrollNav";
import { t } from "@/i18n";

export const metadata = {
  title: "Tierless — Pricing pages made simple",
  description: "Create a price page without a website. Share, configure, receive structured inquiries.",
};

export default function MarketingHomePage() {
  return (
    <main className="relative">
      {/* HERO / OVERVIEW */}
      <section id="hero" aria-label={t("Overview")}>
        <MainPhase1 />
      </section>

      {/* PRICING INTRO (Phase 2) */}
      <section id="pricing" aria-label={t("Pricing intro")}>
        <div className="phase2-bridge">
          <MainPhase2 />
        </div>
      </section>

      {/* TEMPLATES / GALLERY (Phase 3) */}
      <section id="templates" aria-label={t("Templates")}>
        <div className="phase3-bridge">
          <MainPhase3 />
        </div>
      </section>

      {/* FAQ anchor */}
      <section id="faq" aria-label="FAQ">
        <div className="h-[40vh]" />
      </section>

      {/* Quick nav: desni rail na desktopu, dock na mobilnom */}
      <ScrollNav
        side="right"
        sections={{ faq: "faq" }}
        showLogin
        showSignup
        // Ako hoćeš da izbaciš "Page 3", možeš proslediti pages:
        // pages={[ { id: "page-2", label: t("Page 2") }, { id: "page-4", label: t("Page 3") } ]}
      />
    </main>
  );
}