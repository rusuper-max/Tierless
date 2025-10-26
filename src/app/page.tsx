import Button from "@/components/ui/Button";

export default function HomePage() {
  return (
    <main className="container-page">
      <section className="space-y-4">
        <h1 className="text-5xl font-semibold tracking-tight">Tierless</h1>
        <p className="text-xl text-neutral-500 dark:text-neutral-400 max-w-3xl">
          Make a shareable price page in minutes. No website required.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Outline uvek vidljiv, brand tek na hover */}
          <Button href="/dashboard" size="lg" pill>
            Go to Dashboard
          </Button>

          {/* Primer jakog outline-a sa “ink” tekstom (po želji ukloni) */}
          <Button size="lg" pill className="btn-ink">
            Buy
          </Button>
        </div>
      </section>
    </main>
  );
}