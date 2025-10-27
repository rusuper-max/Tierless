import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDevProfileByUserId } from "@/lib/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = getUserIdFromRequest(req); // "dev:email" ili "anon:token"

  // default user (anon/fallback)
  let user: any = {
    id: userId,
    isDev: false,
    plan: "free",
    name: "user",
  };

  // ako je dev:email → dodaj profil/ulogu/pozdrav
  const { email, profile } = getDevProfileByUserId(userId);
  if (email && profile) {
    user = {
      ...user,
      isDev: true,
      email,
      plan: profile.plan,
      role: profile.role,
      name: profile.displayName,     // koristi se u pozdravu
      title: profile.title,          // dodatni opis
    };
  }

  return NextResponse.json({ user }, { headers: { "cache-control": "no-store" } });
}