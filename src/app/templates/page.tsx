// src/components/UseTemplateButton.tsx
"use client";

import Link from "next/link";
import { t } from "@/i18n";
import { track } from "@/lib/track";

type Props = {
  slug: string;
  name: string;
  className?: string;
};

export default function UseTemplateButton({ slug, name, className }: Props) {
  const href = `/editor/new?template=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}`;

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={() => track?.("template_use_clicked", { slug, name })}
      className={[
        "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:-translate-y-[1px]",
        className ?? "",
      ].join(" ")}
      style={{
        background: "linear-gradient(#fff,#fff) padding-box, var(--brand-gradient) border-box",
        border: "2px solid transparent",
        color: "#0f172a",
      }}
      aria-label={t("Use template: {name}", { name })}
    >
      {t("Use template")}
    </Link>
  );
}