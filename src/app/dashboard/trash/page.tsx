// src/app/dashboard/trash/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import TrashClient from "./page.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrashGate() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard/trash");
  return <TrashClient />;
}