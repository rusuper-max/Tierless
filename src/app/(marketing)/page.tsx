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
      <section id="hero" aria-label={t("Overview")}>
        <MainPhase1 />
      </section>

      <section id="pricing" aria-label={t("Pricing intro")}>
        <div className="phase2-bridge" data-stop="page-2">
          <MainPhase2 />
        </div>
      </section>

      <section id="templates" aria-label={t("Templates")}>
        <div className="phase3-bridge" data-stop="page-3">
          <MainPhase3 />
          {/* “Page 4” kraj — 1px, nema buffera */}
          <div id="end-of-p3" data-stop="page-4" className="h-px" />
        </div>
      </section>

      <ScrollNav side="right" sections={{}} showLogin showSignup />
    </main>
  );
}