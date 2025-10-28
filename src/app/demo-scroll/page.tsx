import ScrollPricingIntro from "@/components/scrolly/ScrollPricingIntro";
import { t } from "@/i18n";

export default function Page() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Ovde je u realnosti tvoj HeroFX; samo prazan razmak za demo */}
      <section className="h-[40vh]" aria-hidden />

      <ScrollPricingIntro headline={t("Create your tiers on your price page")} />

      {/* Prazno posle scene – fokus je na animaciji */}
      <section className="h-[10vh]" aria-hidden />
    </main>
  );
}