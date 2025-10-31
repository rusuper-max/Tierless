// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DashboardPageClient from "./page.client"; // tvoj postojeći klijent (onaj što si slao)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardGate() {
  const user = await getSessionUser();
  if (!user) redirect("/signin?next=/dashboard");
  return <DashboardPageClient />;
}