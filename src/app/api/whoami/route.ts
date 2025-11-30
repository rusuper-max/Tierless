import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getPool, ensureUserProfilesTable } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return NextResponse.json({ userId: null });
  }

  try {
    // Fetch profile data
    await ensureUserProfilesTable();
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT order_destination, whatsapp_number FROM user_profiles WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    const profile = rows[0] || {};

    return NextResponse.json({
      userId,
      orderDestination: profile.order_destination || "email",
      whatsappNumber: profile.whatsapp_number || ""
    });
  } catch (error) {
    console.error("Failed to fetch profile in whoami:", error);
    return NextResponse.json({ userId });
  }
}