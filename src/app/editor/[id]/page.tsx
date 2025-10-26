// Server Component (Next.js 16): params je Promise — razrešavamo ga sa await.
import EditorClient from "./EditorClient";

type Params = { id: string };

export default async function EditorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params; // ✅ umesto direktnog params.id

  // Server deo ne radi logiku — samo prosleđuje slug/id u klijentski editor
  return <EditorClient slug={id} />;
}