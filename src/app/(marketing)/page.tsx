// src/app/(marketing)/page.tsx
import "@/styles/marketing.css";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import MainPhase3 from "@/components/scrolly/MainPhase3";
import { t } from "@/i18n";

export const metadata = {
  title: t("Tierless — Pricing pages made simple"),
  description: t("Create a price page without a website. Share, configure, receive structured inquiries."),
};

export default function Page() {
  return (
    <main className="marketing-root">
      {/* Phase 1 — hero */}
      <MainPhase1 />

      {/* Phase 2 — scrolly pricing intro */}
      <div className="phase2-bridge">
        <MainPhase2 />
      </div>

      {/* Phase 3 — final globe scene (last scroll stop) */}
      <div className="phase3-bridge">
        <MainPhase3 />
      </div>
    </main>
  );
}