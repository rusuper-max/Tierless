// src/app/api/examples/route.ts
import { NextResponse } from "next/server";
import { listExamples } from "@/lib/calcsStore";

// ISR - revalidate every 60 seconds
export const revalidate = 60;

export async function GET() {
  const examples = await listExamples(50);
  return NextResponse.json({ examples }, { status: 200 });
}
