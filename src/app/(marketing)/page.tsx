// src/app/(marketing)/page.tsx
import "@/styles/marketing.css";
import MainPhase1 from "@/components/scrolly/MainPhase1";
import MainPhase2 from "@/components/scrolly/MainPhase2";
import { t } from "@/i18n";

export const metadata = {
  title: t("Tierless — Pricing pages made simple"),
  description: t("Create a price page without a website. Share, configure, receive structured inquiries."),
};

export default function Page() {
  return (
    <main className="marketing-root">
      <MainPhase1 />

      {/* P2: zadržavamo animaciju kartica, ali bez “centralnog praznog hoda” */}
      <div className="phase2-bridge">
        <MainPhase2 />
      </div>
    </main>
  );
}