// src/app/editor/new/page.tsx
import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default async function NewEditorPage() {
  const id = newId();
  redirect(`/e/${id}?guest=1`);
}