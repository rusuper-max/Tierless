// src/components/marketing/PackageCard.tsx
"use client";

type Props = {
  name: string;
  price: string;
  accent: string; // npr. "from-amber-400 to-yellow-300"
  className?: string;
};

export default function PackageCard({ name, price, accent, className }: Props) {
  return (
    <div
      className={[
        "w-[260px] sm:w-[300px] rounded-2xl border border-white/30 shadow-xl backdrop-blur-md",
        "bg-white/70 dark:bg-neutral-900/70",
        "overflow-hidden",
        className || "",
      ].join(" ")}
    >
      <div className={`h-2 bg-gradient-to-r ${accent}`} />
      <div className="p-5">
        <div className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {name}
        </div>
        <div className="mt-1 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          {price}
        </div>
        <ul className="mt-4 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
          <li>• 1 landing stranica</li>
          <li>• Kontakt forma</li>
          <li>• Osnovna analitika</li>
        </ul>
        <div className="mt-5 h-10 rounded-xl bg-gradient-to-r from-purple-500/10 to-yellow-400/10" />
      </div>
    </div>
  );
}