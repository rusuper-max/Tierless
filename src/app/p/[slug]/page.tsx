// Public page (SSR) — jednostavno i stabilno: učitaj podatke iz store-a, bez headers trikova.
// "Edit" dugme renderuje client komponenta EditIfLoggedIn (na osnovu /api/me).
import { notFound } from "next/navigation";
import PublicRenderer from "@/components/PublicRenderer";
import { getCalculator } from "@/lib/store";
import { getCalc } from "@/lib/calcsStore";
import { calcFromMetaConfig } from "@/lib/calc-init";

type Params = { slug: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PublicPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;

  // Podaci: full store → mini seed
  let data: any = null;
  try {
    data = await getCalculator(slug);
  } catch {}

  if (!data) {
    try {
      const mini = await getCalc(slug);
      if (mini) data = calcFromMetaConfig(mini);
    } catch {}
  }

  if (!data || data?.error === "not_found") {
    notFound();
  }

  return (
    <main data-theme="tierless">
      <PublicRenderer data={data} />
    </main>
  );
}