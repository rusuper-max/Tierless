// src/app/api/stats/route.ts
// Analytics Stats API - Aggregates events for dashboard
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { promises as fs } from "fs";
import path from "path";

// Event types we track
type EventType =
  | "page_view"
  | "page_exit"
  | "interaction"
  | "checkout_click"
  | "rating_set"
  | "section_open"
  | "search"
  | "copy_contact"
  | "click_link"
  | "scroll_depth";

interface AnalyticsEvent {
  type: EventType;
  pageId: string;
  ts: number;
  sessionId: string;
  clientId: string;
  props?: {
    interactionType?: string;
    method?: string; // whatsapp | email | custom
    value?: number;
    sectionId?: string;
    searchTerm?: string;
    linkType?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    device?: string;
    platform?: string;
    country?: string;
    city?: string;
    // Time & scroll tracking
    timeOnPage?: number;
    timeBucket?: string;
    maxScrollDepth?: number;
    depth?: number;
  };
}

// Simple file-based event storage for MVP (replace with DB in production)
const EVENTS_DIR = path.join(process.cwd(), "data", "events");

async function ensureEventsDir() {
  try {
    await fs.mkdir(EVENTS_DIR, { recursive: true });
  } catch { }
}

async function getEventsForPages(pageIds: string[], days: number = 7): Promise<AnalyticsEvent[]> {
  await ensureEventsDir();

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const allEvents: AnalyticsEvent[] = [];

  // Read events from each page's event file
  for (const pageId of pageIds) {
    try {
      const pageEventsFile = path.join(EVENTS_DIR, `page_${pageId.replace(/[^a-zA-Z0-9-]/g, "_")}.json`);
      const content = await fs.readFile(pageEventsFile, "utf-8");
      const pageEvents: AnalyticsEvent[] = JSON.parse(content);

      // Filter by time and add to results
      const filtered = pageEvents.filter(e => e.ts >= cutoff);
      allEvents.push(...filtered);
    } catch {
      // No events file for this page yet - that's ok
    }
  }

  return allEvents;
}

async function getPageIdsForUser(userId: string): Promise<string[]> {
  // Get list of pages owned by this user from calculators
  try {
    const calcsPath = path.join(process.cwd(), "data", "users", userId.replace(/[@.]/g, "_"), "full");
    const files = await fs.readdir(calcsPath);
    return files.filter(f => f.endsWith(".json")).map(f => f.replace(".json", ""));
  } catch {
    return [];
  }
}

function aggregateEvents(events: AnalyticsEvent[], pageIds: string[]) {
  // Filter events to only include user's pages
  const pageEvents = events.filter(e => pageIds.includes(e.pageId) || !e.pageId);

  // Aggregate by type
  const pageViews = pageEvents.filter(e => e.type === "page_view");
  const pageExits = pageEvents.filter(e => e.type === "page_exit");
  const interactions = pageEvents.filter(e => e.type === "interaction");
  const checkouts = pageEvents.filter(e => e.type === "checkout_click");
  const ratings = pageEvents.filter(e => e.type === "rating_set");
  const scrollEvents = pageEvents.filter(e => e.type === "scroll_depth");

  // Unique sessions
  const uniqueSessions = new Set(pageViews.map(e => e.sessionId)).size;

  // Calculate average time on page
  const avgTimeOnPage = pageExits.length > 0
    ? pageExits.reduce((sum, e) => sum + (e.props?.timeOnPage || 0), 0) / pageExits.length
    : 0;

  // Time buckets distribution
  const timeBuckets: Record<string, number> = {};
  for (const e of pageExits) {
    const bucket = e.props?.timeBucket || "unknown";
    timeBuckets[bucket] = (timeBuckets[bucket] || 0) + 1;
  }

  // Scroll depth distribution
  const scrollDepthCounts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  for (const e of scrollEvents) {
    const depth = e.props?.depth;
    if (depth && scrollDepthCounts[depth] !== undefined) {
      scrollDepthCounts[depth]++;
    }
  }

  // Per-page stats
  const perPage: Record<string, {
    views: number;
    uniqueVisitors: number;
    interactions: number;
    checkouts: number;
    checkoutMethods: Record<string, number>;
    avgRating: number;
    ratingsCount: number;
    devices: Record<string, number>;
    referrers: Record<string, number>;
    countries: Record<string, number>;
    interactionTypes: Record<string, number>;
    avgTimeOnPage: number;
    scrollDepth: Record<number, number>;
  }> = {};

  for (const pid of pageIds) {
    const pv = pageViews.filter(e => e.pageId === pid);
    const pe = pageExits.filter(e => e.pageId === pid);
    const pi = interactions.filter(e => e.pageId === pid);
    const pc = checkouts.filter(e => e.pageId === pid);
    const pr = ratings.filter(e => e.pageId === pid);
    const ps = scrollEvents.filter(e => e.pageId === pid);

    const pageScrollDepth: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
    for (const e of ps) {
      const depth = e.props?.depth;
      if (depth && pageScrollDepth[depth] !== undefined) {
        pageScrollDepth[depth]++;
      }
    }

    perPage[pid] = {
      views: pv.length,
      uniqueVisitors: new Set(pv.map(e => e.sessionId)).size,
      interactions: pi.length,
      checkouts: pc.length,
      checkoutMethods: pc.reduce((acc, e) => {
        const m = e.props?.method || "unknown";
        acc[m] = (acc[m] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgRating: pr.length > 0 ? pr.reduce((a, e) => a + (e.props?.value || 0), 0) / pr.length : 0,
      ratingsCount: pr.length,
      devices: pv.reduce((acc, e) => {
        const d = e.props?.device || "unknown";
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      referrers: pv.reduce((acc, e) => {
        const r = e.props?.referrer || "direct";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      countries: pv.reduce((acc, e) => {
        const c = e.props?.country || "Unknown";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      interactionTypes: pi.reduce((acc, e) => {
        const t = e.props?.interactionType || "unknown";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgTimeOnPage: pe.length > 0 ? pe.reduce((sum, e) => sum + (e.props?.timeOnPage || 0), 0) / pe.length : 0,
      scrollDepth: pageScrollDepth,
    };
  }

  // Daily breakdown for chart
  const dailyStats: Record<string, { views: number; interactions: number; checkouts: number }> = {};

  for (const e of pageEvents) {
    const day = new Date(e.ts).toISOString().split("T")[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { views: 0, interactions: 0, checkouts: 0 };
    }
    if (e.type === "page_view") dailyStats[day].views++;
    if (e.type === "interaction") dailyStats[day].interactions++;
    if (e.type === "checkout_click") dailyStats[day].checkouts++;
  }

  // Top referrers
  const allReferrers: Record<string, number> = {};
  for (const e of pageViews) {
    const r = e.props?.referrer || "direct";
    allReferrers[r] = (allReferrers[r] || 0) + 1;
  }

  // Top UTM sources
  const utmSources: Record<string, number> = {};
  for (const e of pageViews) {
    if (e.props?.utm_source) {
      const key = `${e.props.utm_source}/${e.props.utm_medium || ""}`;
      utmSources[key] = (utmSources[key] || 0) + 1;
    }
  }

  // Device breakdown
  const devices: Record<string, number> = {};
  for (const e of pageViews) {
    const d = e.props?.device || "unknown";
    devices[d] = (devices[d] || 0) + 1;
  }

  // Country breakdown
  const countries: Record<string, number> = {};
  for (const e of pageViews) {
    const c = e.props?.country || "Unknown";
    countries[c] = (countries[c] || 0) + 1;
  }

  return {
    summary: {
      totalViews: pageViews.length,
      uniqueVisitors: uniqueSessions,
      totalInteractions: interactions.length,
      totalCheckouts: checkouts.length,
      conversionRate: pageViews.length > 0 ? (checkouts.length / pageViews.length * 100).toFixed(2) : "0",
      interactionRate: pageViews.length > 0 ? (interactions.length / pageViews.length * 100).toFixed(2) : "0",
      engagedSessions: new Set(interactions.map(e => e.sessionId)).size,
      avgTimeOnPage: Math.round(avgTimeOnPage),
      timeBuckets,
      scrollDepth: scrollDepthCounts,
    },
    perPage,
    dailyStats: Object.entries(dailyStats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, stats]) => ({ date, ...stats })),
    referrers: Object.entries(allReferrers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    utmSources: Object.entries(utmSources)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
    devices: Object.entries(devices)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count, percent: pageViews.length > 0 ? (count / pageViews.length * 100).toFixed(1) : "0" })),
    countries: Object.entries(countries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    const pageIdFilter = searchParams.get("pageId"); // Optional filter

    const userId = session.user.email;

    // Get all user pages with their IDs and Slugs
    const userPages: { slug: string; id: string }[] = [];
    try {
      const calcsPath = path.join(process.cwd(), "data", "users", userId.replace(/[@.]/g, "_"), "full");
      console.log("[stats] Reading pages from:", calcsPath);
      const files = await fs.readdir(calcsPath);
      console.log("[stats] Found files:", files);
      for (const file of files) {
        if (!file.endsWith(".json")) continue;
        try {
          const content = await fs.readFile(path.join(calcsPath, file), "utf-8");
          const json = JSON.parse(content);
          userPages.push({
            slug: json.meta?.slug || file.replace(".json", ""),
            id: json.meta?.id || ""
          });
        } catch (e) {
          console.error("[stats] Error reading file:", file, e);
        }
      }
    } catch (e) {
      console.error("[stats] Error reading user directory:", e);
    }

    console.log("[stats] User pages loaded:", userPages);

    const pageIds = userPages.map(p => p.slug); // For backward compatibility in response

    console.log("[stats] User:", userId, "Pages:", userPages.length);

    // Determine which page IDs (slugs AND uuids) to fetch events for
    let targetIdentifiers: string[] = [];
    if (pageIdFilter) {
      // If filtering by a specific page (slug), also include its ID
      const page = userPages.find(p => p.slug === pageIdFilter);
      if (page) {
        targetIdentifiers.push(page.slug);
        if (page.id) targetIdentifiers.push(page.id);
      } else {
        targetIdentifiers.push(pageIdFilter);
      }
    } else {
      // Fetch for all pages (slugs and IDs)
      for (const p of userPages) {
        targetIdentifiers.push(p.slug);
        if (p.id) targetIdentifiers.push(p.id);
      }
    }

    console.log("[stats] Target identifiers to fetch events for:", targetIdentifiers);

    // Fetch events
    const events = await getEventsForPages(targetIdentifiers, days);

    console.log("[stats] Found", events.length, "events");
    console.log("[stats] Event pageIds:", [...new Set(events.map(e => e.pageId))]);

    // Normalize events: map UUIDs back to Slugs
    const normalizedEvents = events.map(e => {
      const page = userPages.find(p => p.id === e.pageId);
      if (page) {
        console.log("[stats] Normalizing event pageId from", e.pageId, "to", page.slug);
        return { ...e, pageId: page.slug };
      }
      return e;
    });

    console.log("[stats] Normalized event pageIds:", [...new Set(normalizedEvents.map(e => e.pageId))]);

    const stats = aggregateEvents(normalizedEvents, userPages.map(p => p.slug));

    console.log("[stats] Aggregated stats summary:", stats.summary);
    console.log("[stats] Aggregated perPage keys:", Object.keys(stats.perPage));

    return NextResponse.json({
      ok: true,
      period: { days, from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() },
      pageIds,
      ...stats,
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// Record new events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body as { events: AnalyticsEvent[] };

    console.log("[stats] POST received", events?.length, "events");

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "no_events" }, { status: 400 });
    }

    // For MVP, store by pageId
    await ensureEventsDir();

    // Group events by pageId
    const eventsByPage: Record<string, AnalyticsEvent[]> = {};
    for (const e of events) {
      const pid = e.pageId || "_global";
      if (!eventsByPage[pid]) eventsByPage[pid] = [];
      eventsByPage[pid].push(e);
    }

    console.log("[stats] Grouped events by page:", Object.keys(eventsByPage));

    for (const [pageId, pageEvents] of Object.entries(eventsByPage)) {
      const filePath = path.join(EVENTS_DIR, `page_${pageId.replace(/[^a-zA-Z0-9-]/g, "_")}.json`);

      console.log("[stats] Writing to:", filePath);

      let existing: AnalyticsEvent[] = [];
      try {
        const content = await fs.readFile(filePath, "utf-8");
        existing = JSON.parse(content);
      } catch { }

      // Append new events
      existing.push(...pageEvents);

      // Keep only last 90 days
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      existing = existing.filter(e => e.ts >= cutoff);

      await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
      console.log("[stats] Saved", existing.length, "total events for page", pageId);
    }

    return NextResponse.json({ ok: true, recorded: events.length });
  } catch (error) {
    console.error("[stats] POST Error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

