import { NextResponse } from "next/server";
import { listExamples } from "@/lib/calcsStore";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const examples = await listExamples(50);
        return NextResponse.json({ examples });
    } catch (err) {
        console.error("Examples list error:", err);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
