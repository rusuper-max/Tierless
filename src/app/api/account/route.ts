import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { getPool, ensureUserProfilesTable } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await ensureUserProfilesTable();
    const pool = getPool();

    try {
        const { rows } = await pool.query(
            "SELECT * FROM user_profiles WHERE user_id = $1",
            [userId]
        );

        if (rows.length === 0) {
            return NextResponse.json({});
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    await ensureUserProfilesTable();
    const pool = getPool();

    const {
        businessName,
        phone,
        website,
        inquiryEmail,
        currency,
        orderDestination,
        whatsapp
    } = body;

    try {
        // Upsert profile
        console.log("Saving profile for user:", userId, body);
        await pool.query(
            `INSERT INTO user_profiles (
        user_id, business_name, phone, website, inquiry_email, currency, order_destination, whatsapp_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        business_name = EXCLUDED.business_name,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        inquiry_email = EXCLUDED.inquiry_email,
        currency = EXCLUDED.currency,
        order_destination = EXCLUDED.order_destination,
        whatsapp_number = EXCLUDED.whatsapp_number
      `,
            [
                userId,
                businessName || null,
                phone || null,
                website || null,
                inquiryEmail || null,
                currency || 'USD',
                orderDestination || 'email',
                whatsapp || null
            ]
        );
        console.log("Profile saved successfully");

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Failed to update profile:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
