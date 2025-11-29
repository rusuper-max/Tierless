import { NextRequest, NextResponse } from "next/server";
import { getVoterIdentity } from "@/lib/voter";
import { getRatingStatus } from "@/lib/ratingsStore";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
        return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
    }

    try {
        const { voterKey } = await getVoterIdentity(req);
        const result = await getRatingStatus(pageId, voterKey);

        return NextResponse.json(result);
    } catch (err) {
        console.error("Rating status error:", err);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
