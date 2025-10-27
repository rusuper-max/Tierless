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
          <Button as="a" href="/dashboard" size="lg" pill>
            Go to Dashboard
          </Button>

          <Button size="lg" pill>
            Buy
          </Button>
        </div>
      </section>
    </main>
  );
}