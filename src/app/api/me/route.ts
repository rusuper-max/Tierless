// src/app/api/me/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getUserPlan } from "@/lib/account-store";

export async function GET(req: Request) {
  // 1) Pročitaj user-a iz session cookie-ja (JWT)
  const user = await getSessionUser(req);

  if (!user) {
    // Nema sesije
    return NextResponse.json(
      { authenticated: false, user: null, plan: "free" },
      { status: 200, headers: { "Cache-Control": "no-store", Vary: "Cookie" } }
    );
  }

  // 2) Ako cookie nema plan, povuci ga iz server-side storage-a (izvor istine)
  const plan = user.plan ?? (await getUserPlan(user.email));

  return NextResponse.json(
    {
      authenticated: true,
      user: { email: user.email, plan },
      plan,
    },
    { headers: { "Cache-Control": "no-store", Vary: "Cookie" } }
  );
}