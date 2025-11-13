// src/app/p/[idOrSlug]/page.tsx
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------------- helpers ---------------- */

type Money = { currency?: string; decimals?: number };
function fmt(n: number | null | undefined, m?: Money) {
  if (n === null || n === undefined || isNaN(Number(n))) return "Custom";
  const currency = m?.currency || "EUR";
  const decimals = typeof m?.decimals === "number" ? m!.decimals : 0;
  return new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(n));
}

function parseKey(key: string) {
  const ix = key.indexOf("-");
  if (ix > 0) return { id: key.slice(0, ix), slug: key.slice(ix + 1) };
  return { id: "", slug: key };
}

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  return (env ? env : "http://localhost:3000").replace(/\/$/, "");
}
function apiUrl(segment: string) {
  return new URL(segment, baseUrl()).toString();
}

async function loadPublic(id: string, slug: string) {
  // 1) canonical by id
  if (id) {
    const key = `${id}${slug ? "-" + encodeURIComponent(slug) : ""}`;
    const r = await fetch(apiUrl(`/api/public/${key}?v=${Date.now()}`), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      return j?.data ?? j ?? null;
    }
  }
  // 2) fallback by slug
  if (slug) {
    const r = await fetch(apiUrl(`/api/public/${encodeURIComponent(slug)}?v=${Date.now()}`), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (r.ok) {
      const j = await r.json();
      return j?.data ?? j ?? null;
    }
  }
  return null;
}

/* ------------- small render components ------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** PACKAGES */
function PackagesBlock({
  block,
  money,
  legacyPackages,
}: {
  block?: any;
  money: Money;
  legacyPackages?: any[];
}) {
  // podaci mogu biti u block.data.packages ili u legacy root-u
  const pkgs: any[] =
    (Array.isArray(block?.data?.packages) ? block.data.packages : null) ??
    (Array.isArray(legacyPackages) ? legacyPackages : []) ??
    [];

  if (pkgs.length === 0) return <p className="opacity-70 text-sm">No packages configured.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pkgs.map((p: any) => (
        <div key={p.id} className="rounded-xl border border-[color:var(--border,#e5e7eb)] bg-[color:var(--card,white)] p-4">
          <div className="flex items-baseline justify-between">
            <div className="font-medium">{p.label || p.id}</div>
            {"basePrice" in p ? (
              <div className="text-sm opacity-70">{fmt(p.basePrice, money)}</div>
            ) : null}
          </div>
          {p.description ? (
            <p className="mt-1 text-sm opacity-70" style={{ whiteSpace: "pre-line" }}>
              {p.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** ITEMS (price list) */
function ItemsBlock({
  block,
  money,
  legacyItems,
  title,
}: {
  block?: any;
  money: Money;
  legacyItems?: any[];
  title: string;
}) {
  // očekujemo block.data.rows kao niz { id,label,price, note? } – ali podržimo i legacy items
  const rows: any[] =
    (Array.isArray(block?.data?.rows) ? block.data.rows : null) ??
    (Array.isArray(legacyItems) ? legacyItems : []) ??
    [];

  if (rows.length === 0) return null;

  return (
    <Section title={title}>
      <div className="divide-y rounded-xl border border-[color:var(--border,#e5e7eb)] bg-[color:var(--card,white)]">
        {rows.map((r: any, i: number) => (
          <div key={r.id || i} className="flex items-center justify-between gap-4 p-3">
            <div>
              <div className="font-medium">{r.label || r.id || `Item #${i + 1}`}</div>
              {r.note ? <div className="text-xs opacity-70">{r.note}</div> : null}
            </div>
            <div className="text-sm opacity-70">{fmt(r.price, money)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** OPTIONS (configurator fields) – za sada ih samo listamo; kasnije može UI za biranje */
function OptionsBlock({
  block,
  legacyFields,
  title,
}: {
  block?: any;
  legacyFields?: any[];
  title: string;
}) {
  const groups: any[] =
    (Array.isArray(block?.data?.rows) ? block.data.rows : null) ??
    (Array.isArray(legacyFields) ? legacyFields : []) ??
    [];
  if (groups.length === 0) return null;

  return (
    <Section title={title}>
      <ul className="space-y-2">
        {groups.map((g: any, i: number) => (
          <li key={g.id || i} className="rounded-lg border border-[color:var(--border,#e5e7eb)] p-3">
            <div className="font-medium">{g.label || g.id || `Group #${i + 1}`}</div>
            {Array.isArray(g.options) && g.options.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-sm opacity-70">
                {g.options.map((o: any, j: number) => (
                  <li key={o.id || j}>
                    {o.label || o.id} {o.priceDelta ? `(+ ${o.priceDelta})` : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm opacity-70">No options.</div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** EXTRAS (free text / note) */
function ExtrasBlock({ block, title }: { block?: any; title: string }) {
  const note = block?.data?.note ?? "";
  if (!note) return null;
  return (
    <Section title={title}>
      <div className="rounded-lg border border-[color:var(--border,#e5e7eb)] p-4 text-sm opacity-80" style={{ whiteSpace: "pre-line" }}>
        {note}
      </div>
    </Section>
  );
}

/* ---------------- page ---------------- */

export default async function PublicPage(
  props: { params: { idOrSlug: string } } | { params: Promise<{ idOrSlug: string }> }
) {
  const p: any = (props as any).params;
  const { idOrSlug } =
    typeof p?.then === "function" ? await (p as Promise<{ idOrSlug: string }>) : (p as { idOrSlug: string });

  if (!idOrSlug || typeof idOrSlug !== "string") notFound();

  const { id, slug } = parseKey(idOrSlug);
  const calc = await loadPublic(id, slug || idOrSlug);
  if (!calc) notFound();

  const money: Money = { currency: calc?.i18n?.currency || "EUR", decimals: calc?.i18n?.decimals ?? 0 };
  const blocks: any[] = Array.isArray(calc?.blocks) ? calc.blocks : [];

  const name = calc?.meta?.name ?? "Untitled";
  const desc = calc?.meta?.description ?? "";

  // legacy arrays (ako block.data ne postoji)
  const legacyPackages = Array.isArray(calc?.packages) ? calc.packages : [];
  const legacyItems = Array.isArray(calc?.items) ? calc.items : [];
  const legacyFields = Array.isArray(calc?.fields) ? calc.fields : [];
  const legacyAddons = Array.isArray(calc?.addons) ? calc.addons : [];

  return (
    <main className="min-h-screen bg-white text-black dark:bg-[#0b0b0c] dark:text-white px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-semibold">{name}</h1>
        {desc ? <p className="mt-1 text-sm opacity-70">{desc}</p> : null}

        {/* Ako nema blocks, prikaži bar packages kao ranije */}
        {blocks.length === 0 ? (
          <Section title="Plans">
            <PackagesBlock money={money} legacyPackages={legacyPackages} />
          </Section>
        ) : (
          blocks.map((b: any, i: number) => {
            const t = (b.title || b.type || "").toString();
            switch (b.type) {
              case "packages":
                return (
                  <Section key={b.id || i} title={t || "Packages"}>
                    <PackagesBlock block={b} money={money} legacyPackages={legacyPackages} />
                  </Section>
                );
              case "items":
                return (
                  <ItemsBlock key={b.id || i} block={b} money={money} legacyItems={legacyItems} title={t || "Items"} />
                );
              case "options":
                return (
                  <OptionsBlock key={b.id || i} block={b} legacyFields={legacyFields} title={t || "Options"} />
                );
              case "extras":
                return <ExtrasBlock key={b.id || i} block={b} title={t || "Extras"} />;
              default:
                return null;
            }
          })
        )}
      </div>
    </main>
  );
}