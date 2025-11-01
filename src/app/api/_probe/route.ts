// src/app/api/_probe/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sessionOptions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const c = cookies();
  const anyC = c as unknown as { get?: (name: string) => { value?: string } | undefined };

  const shape = {
    hasGet: typeof anyC.get === "function",
    sessionCookieName: sessionOptions.cookieName,
    cookieValue: typeof anyC.get === "function"
      ? (anyC.get(sessionOptions.cookieName)?.value ?? null)
      : null,
  };

  return NextResponse.json(shape, { headers: { "Cache-Control": "no-store" } });
}