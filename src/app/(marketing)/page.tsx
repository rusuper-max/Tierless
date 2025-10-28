// src/app/(marketing)/page.tsx
import ScrollyMount from "@/components/marketing/ScrollyMount";
import SceneHeroPhase from "@/components/marketing/SceneHeroPhase";
import { t } from "@/i18n/t";
import { getLocalizedMeta } from "@/lib/meta";

export const metadata = getLocalizedMeta("home");

export default function MarketingHomePage() {
  return (
    <main className="relative overflow-x-clip">
      {/* PHASE 1: sticky hero sa lokalnom aurorom i CTA-ovima */}
      <SceneHeroPhase />

      {/* PHASE 2: ScrollPricingIntro (tekst → tiers → deck) */}
      <section className="relative z-[5]">
        <ScrollyMount headline={t("Create your tiers on your price page")} />
      </section>
    </main>
  );
}