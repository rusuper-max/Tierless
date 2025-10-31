import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export default async function StartGate() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/signin?next=/dashboard");
}