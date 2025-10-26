import { redirect } from "next/navigation";

type Params = { slug: string };

export default async function CtoPAlias({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params; // Next 16: params je Promise
  redirect(`/p/${slug}`);
}