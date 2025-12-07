import React from "react";
import { CALC_TEMPLATES } from "@/data/calcTemplates";
import UseTemplateButton from "@/components/UseTemplateButton";
import { t } from "@/i18n/server";

export const runtime = "nodejs";

export default function TemplatesPage() {
  return (
    <main className="container-page space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--text)]">{t("Templates")}</h1>
        <p className="text-[var(--muted)] text-lg">
          {t("Choose a template to start with.")}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CALC_TEMPLATES.map((tmpl) => (
          <div
            key={tmpl.slug}
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-[var(--text)] mb-2">
                {tmpl.name}
              </h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                {tmpl.description}
              </p>
            </div>

            <div className="mt-auto pt-4">
              <UseTemplateButton slug={tmpl.slug} name={tmpl.defaultName || tmpl.name} className="w-full justify-center" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
