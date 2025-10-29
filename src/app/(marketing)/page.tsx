// src/app/(marketing)/page.tsx
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
      <MainPhase1 />
      {/* Jeton-style bridge: povuci P3 nagore */}
      <div className="phase2-bridge">
        <MainPhase2 />
      </div>
      {/* Trim posle P3 da nema mrtvog hoda pre budućeg P4 */}
      <div className="phase3-trim">
        <MainPhase3 />
      </div>
    </main>
  );
}