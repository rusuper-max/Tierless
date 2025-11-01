// src/app/editor/[id]/page.tsx
import { redirect } from "next/navigation";

type Params = { id: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LegacyEditorRedirect({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const qp = new URLSearchParams();

  if (sp) {
    for (const [k, v] of Object.entries(sp)) {
      if (Array.isArray(v)) v.forEach((vv) => qp.append(k, String(vv)));
      else if (v != null) qp.set(k, String(v));
    }
  }

  redirect(`/e/${id}${qp.toString() ? `?${qp.toString()}` : ""}`);
}