// src/app/(marketing)/page.tsx
import HeroFX from "@/components/hero/HeroFX";
import BrandButton from "@/components/BrandButton";

export const metadata = {
  title: "Tierless — Create your price page without a website",
  description: "Package-first pricing you can share. Configure add-ons and receive structured inquiries.",
};

export default function MarketingHomePage() {
  return (
    <>
      {/* Mastilo u vodi — tiho u pozadini */}
      <HeroFX />

      {/* HERO */}
      <section id="hero" className="hero-wrap min-h-[88svh] px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 items-center gap-10 pt-24">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight text-neutral-900">
              Create your price page
              <br /> without a website
            </h1>
            <p className="text-lg text-neutral-600 max-w-[52ch]">
              Configure packages and add-ons, share a beautiful link, receive structured inquiries.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <BrandButton variant="brand" size="lg" pill className="btn-fill">Start free</BrandButton>
              <BrandButton variant="outline" size="lg" pill className="btn-swap" data-text="See templates">
                <span className="btn-text">See templates</span>
              </BrandButton>
            </div>
          </div>

          {/* desna kolona ostaje prazna za sada (čist look) */}
          <div className="hidden lg:block" />
        </div>
      </section>
    </>
  );
}