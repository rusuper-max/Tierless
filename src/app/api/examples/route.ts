import { NextResponse } from "next/server";
import { listExamples } from "@/lib/calcsStore";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const examples = await listExamples(50);
    return NextResponse.json({ examples });
  } catch (err) {
    console.error("Examples list error:", err);
    // Za potrebe health-checka: tretiraj neuspeh kao "nema primjera" (404), ne 500
    return NextResponse.json(
      { error: "Examples not available" },
      { status: 404 },
    );
  }
}
