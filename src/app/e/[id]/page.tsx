// src/app/e/[id]/page.tsx
import EditorClient from "@/components/editor/EditorClient";

type Params = { id: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};
  const isGuest =
    sp["guest"] === "1" ||
    sp["guest"] === "true" ||
    (Array.isArray(sp["guest"]) && sp["guest"]?.[0] === "1");

  return <EditorClient slug={id} guest={!!isGuest} />;
}