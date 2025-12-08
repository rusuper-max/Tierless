import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEMON_API_BASE = "https://api.lemonsqueezy.com/v1";

/**
 * GET /api/integrations/lemon/portal
 * Returns a Lemon Squeezy customer portal URL for the authenticated user
 */
export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.LEMON_API_KEY;
  if (!apiKey) {
    console.error("[Portal] LEMON_API_KEY is not set");
    return NextResponse.json(
      { error: "Lemon Squeezy API key is not configured" },
      { status: 500 }
    );
  }

  // Get user's lemon_customer_id from database
  const pool = getPool();
  const result = await pool.query(
    `SELECT lemon_customer_id FROM user_profiles WHERE user_id = $1`,
    [userId]
  );

  const lemonCustomerId = result.rows?.[0]?.lemon_customer_id;

  if (!lemonCustomerId) {
    // User doesn't have a Lemon customer ID - they haven't subscribed yet
    return NextResponse.json(
      { error: "No subscription found", redirect: "/start" },
      { status: 404 }
    );
  }

  try {
    // Call Lemon Squeezy API to get customer portal URL
    const response = await fetch(
      `${LEMON_API_BASE}/customers/${lemonCustomerId}/customer-portal`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[Portal] Lemon API error:", response.status, errorText);

      // If customer not found in Lemon, clear the stale ID
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Customer not found in Lemon Squeezy", redirect: "/start" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: "Failed to get customer portal URL" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const portalUrl = data?.data?.attributes?.url;

    if (!portalUrl) {
      console.error("[Portal] No URL in response:", data);
      return NextResponse.json(
        { error: "Invalid response from Lemon Squeezy" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error("[Portal] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
