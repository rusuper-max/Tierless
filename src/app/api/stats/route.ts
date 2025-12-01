// src/app/api/stats/route.ts
// Analytics Stats API - PostgreSQL based
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

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
  props?: Record<string, any>;
}

// Ensure analytics table exists
async function ensureAnalyticsTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      page_id TEXT NOT NULL,
      ts BIGINT NOT NULL,
      session_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      props JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_analytics_page_ts ON analytics_events(page_id, ts);
    CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
  `);
}

// Fetch events for specified page IDs from PostgreSQL
async function getEventsForPages(pageIds: string[], days: number = 7): Promise<AnalyticsEvent[]> {
  const pool = getPool();

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const { rows } = await pool.query(
    `SELECT event_type, page_id, ts, session_id, client_id, props
     FROM analytics_events
     WHERE page_id = ANY($1) AND ts >= $2
     ORDER BY ts ASC`,
    [pageIds, cutoff]
  );

  return rows.map((row: any) => ({
    type: row.event_type as EventType,
    pageId: row.page_id,
    ts: parseInt(row.ts),
    sessionId: row.session_id,
    clientId: row.client_id,
    props: row.props || {},
  }));
}

function aggregateEvents(events: AnalyticsEvent[], pageIds: string[]) {
  // Filter events to only include user's pages
  const pageEvents = events.filter(e => pageIds.includes(e.pageId) || !e.pageId);

  // Aggregate by type
  const pageViews = pageEvents.filter(e => e.type === "page_view");
  const pageExits = pageEvents.filter(e => e.type === "page_exit");

  // ALL engagement events (not just "interaction" type)
  const engagementEvents = pageEvents.filter(e =>
    e.type === "interaction" ||
    e.type === "section_open" ||
    e.type === "search" ||
    e.type === "checkout_click" ||
    e.type === "rating_set" ||
    e.type === "scroll_depth" ||
    e.type === "copy_contact" ||
    e.type === "click_link"
  );

  const checkouts = pageEvents.filter(e => e.type === "checkout_click");
  const ratings = pageEvents.filter(e => e.type === "rating_set");
  const scrollEvents = pageEvents.filter(e => e.type === "scroll_depth");

  // Unique sessions (total visitors)
  const uniqueSessions = new Set(pageViews.map(e => e.sessionId)).size;

  // Engaged sessions (visitors who did ANYTHING beyond just viewing)
  const engagedSessions = new Set(engagementEvents.map(e => e.sessionId)).size;

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
    engagedSessions: number; // ADDED: New metric
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
    const pc = checkouts.filter(e => e.pageId === pid);
    const pr = ratings.filter(e => e.pageId === pid);
    const ps = scrollEvents.filter(e => e.pageId === pid);

    // All engagement events for this page
    const pageEngagement = engagementEvents.filter(e => e.pageId === pid);
    const pageEngagedSessions = new Set(pageEngagement.map(e => e.sessionId)).size;

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
      engagedSessions: pageEngagedSessions,
      interactions: pageEngagement.length, // Raw interactions count
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
      interactionTypes: pageEngagement.reduce((acc, e) => {
        let key = e.type;
        if (e.type === "interaction" && e.props?.interactionType) {
          key = e.props.interactionType;
        }
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgTimeOnPage: pe.length > 0 ? pe.reduce((sum, e) => sum + (e.props?.timeOnPage || 0), 0) / pe.length : 0,
      scrollDepth: pageScrollDepth,
    };
  }

  // Daily breakdown
  const dailyStats: Record<string, { views: number; interactions: number; checkouts: number }> = {};

  for (const e of pageEvents) {
    const day = new Date(e.ts).toISOString().split("T")[0];
    if (!dailyStats[day]) {
      dailyStats[day] = { views: 0, interactions: 0, checkouts: 0 };
    }
    if (e.type === "page_view") dailyStats[day].views++;
    // Keep showing raw interaction count on graph, but maybe you want engaged sessions here too?
    // For now, raw interactions is fine for a line chart "volume"
    if (engagementEvents.includes(e)) {
      dailyStats[day].interactions++;
    }
    if (e.type === "checkout_click") dailyStats[day].checkouts++;
  }

  // Helper lists
  const allReferrers: Record<string, number> = {};
  for (const e of pageViews) {
    const r = e.props?.referrer || "direct";
    allReferrers[r] = (allReferrers[r] || 0) + 1;
  }

  const utmSources: Record<string, number> = {};
  for (const e of pageViews) {
    if (e.props?.utm_source) {
      const key = `${e.props.utm_source}/${e.props.utm_medium || ""}`;
      utmSources[key] = (utmSources[key] || 0) + 1;
    }
  }

  const devices: Record<string, number> = {};
  for (const e of pageViews) {
    const d = e.props?.device || "unknown";
    devices[d] = (devices[d] || 0) + 1;
  }

  const countries: Record<string, number> = {};
  for (const e of pageViews) {
    const c = e.props?.country || "Unknown";
    countries[c] = (countries[c] || 0) + 1;
  }

  return {
    summary: {
      totalViews: pageViews.length,
      uniqueVisitors: uniqueSessions,
      totalInteractions: engagementEvents.length,
      totalCheckouts: checkouts.length,
      conversionRate: uniqueSessions > 0 ? (checkouts.length / uniqueSessions * 100).toFixed(2) : "0",
      // FIX: Interaction Rate is now Engaged Sessions / Total Sessions
      interactionRate: uniqueSessions > 0 ? (engagedSessions / uniqueSessions * 100).toFixed(2) : "0",
      engagedSessions,
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
    const user = await getSessionUser(req);

    if (!user?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    const pageIdFilter = searchParams.get("pageId");

    const userId = user.email;
    const pool = getPool();

    const { rows } = await pool.query(
      `SELECT slug FROM calculators WHERE user_id = $1`,
      [userId]
    );

    const userPages: { slug: string; id: string }[] = [];
    const fullStore = await import("@/lib/fullStore");
    for (const row of rows) {
      const slug = row.slug;
      try {
        const full = await fullStore.getFull(userId, slug);
        userPages.push({ slug, id: full?.meta?.id || "" });
      } catch {
        userPages.push({ slug, id: "" });
      }
    }

    let targetIdentifiers: string[] = [];
    if (pageIdFilter) {
      const page = userPages.find(p => p.slug === pageIdFilter);
      if (page) {
        targetIdentifiers.push(page.slug);
        if (page.id) targetIdentifiers.push(page.id);
      } else {
        targetIdentifiers.push(pageIdFilter);
      }
    } else {
      for (const p of userPages) {
        targetIdentifiers.push(p.slug);
        if (p.id) targetIdentifiers.push(p.id);
      }
    }

    const events = await getEventsForPages(targetIdentifiers, days);

    const normalizedEvents = events.map(e => {
      const page = userPages.find(p => p.id === e.pageId);
      return page ? { ...e, pageId: page.slug } : e;
    });

    const stats = aggregateEvents(normalizedEvents, userPages.map(p => p.slug));

    return NextResponse.json({
      ok: true,
      period: { days, from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() },
      pageIds: userPages.map(p => p.slug),
      ...stats,
    });
  } catch (error) {
    console.error("[stats] GET Error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// Record new events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body as { events: AnalyticsEvent[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "no_events" }, { status: 400 });
    }

    // --- FIX FOR COUNTRY ---
    // Extract country from Vercel headers (or Cloudflare/Next headers)
    const country = req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "Unknown";

    // Inject country into page_view events
    events.forEach(e => {
      if (e.type === "page_view" && e.props) {
        e.props.country = country;
      } else if (e.type === "page_view") {
        e.props = { country };
      }
    });
    // -----------------------

    const pool = getPool();

    // Bulk insert using UNNEST for efficiency
    // We construct arrays for each column to pass to UNNEST
    const types = events.map(e => e.type);
    const pageIds = events.map(e => e.pageId);
    const timestamps = events.map(e => e.ts);
    const sessionIds = events.map(e => e.sessionId);
    const clientIds = events.map(e => e.clientId);
    const propsList = events.map(e => JSON.stringify(e.props || {}));

    await pool.query(
      `INSERT INTO analytics_events (event_type, page_id, ts, session_id, client_id, props)
       SELECT * FROM UNNEST(
         $1::text[], 
         $2::text[], 
         $3::bigint[], 
         $4::text[], 
         $5::text[], 
         $6::jsonb[]
       )`,
      [types, pageIds, timestamps, sessionIds, clientIds, propsList]
    );

    return NextResponse.json({ ok: true, recorded: events.length });
  } catch (error) {
    console.error("[stats] POST Error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}