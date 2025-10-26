import { NextResponse } from "next/server";
import { getSessionOnRoute } from "@/lib/session";

export const dynamic = "force-dynamic"; // da nema keširanja

export async function GET(req: Request) {
  // koristimo isti req/res pristup kao u debug ruti
  const tmp = NextResponse.json({});
  const s = await getSessionOnRoute(req, tmp);

  return new NextResponse(
    JSON.stringify({ user: s.user ?? null }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // propagiraj eventualni Set-Cookie iz tmp (nije nužno, ali bezbedno je)
        ...(tmp.headers.get("set-cookie")
          ? { "set-cookie": tmp.headers.get("set-cookie") as string }
          : {}),
      },
    }
  );
}