// Debug endpoint to check stored events
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTS_DIR = path.join(process.cwd(), "data", "events");

export async function GET() {
  try {
    // Check if events directory exists
    let dirExists = false;
    try {
      await fs.access(EVENTS_DIR);
      dirExists = true;
    } catch {
      dirExists = false;
    }

    if (!dirExists) {
      return NextResponse.json({
        status: "no_events_dir",
        path: EVENTS_DIR,
        message: "Events directory does not exist yet. No events have been recorded.",
      });
    }

    // List all event files
    const files = await fs.readdir(EVENTS_DIR);
    const eventFiles = files.filter(f => f.endsWith(".json"));

    // Read each file and count events
    const summary: Record<string, { count: number; types: Record<string, number>; lastEvent?: any }> = {};

    for (const file of eventFiles) {
      try {
        const content = await fs.readFile(path.join(EVENTS_DIR, file), "utf-8");
        const events = JSON.parse(content);
        const types: Record<string, number> = {};
        for (const e of events) {
          types[e.type] = (types[e.type] || 0) + 1;
        }
        summary[file] = {
          count: events.length,
          types,
          lastEvent: events[events.length - 1],
        };
      } catch (e) {
        summary[file] = { count: 0, types: {}, lastEvent: null };
      }
    }

    return NextResponse.json({
      status: "ok",
      eventsDir: EVENTS_DIR,
      files: eventFiles,
      summary,
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: String(error),
    });
  }
}

