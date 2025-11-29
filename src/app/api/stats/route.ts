// src/app/api/stats/route.ts
// Analytics Stats API - Aggregates events for dashboard
// Storage: PostgreSQL database (Vercel-compatible)
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

// Fetch events from PostgreSQL database
async function getEventsForPages(pageIds: string[], days: number = 7): Promise<AnalyticsEvent[]> {
  if (pageIds.length === 0) return [];
  
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  try {
    const pool = getPool();

    // Query events for all pageIds within time range
    const { rows } = await pool.query(
      `SELECT 
        page_id as "pageId",
        event_type as type,
        session_id as "sessionId",
        client_id as "clientId",
        ts,
        props
      FROM analytics_events
      WHERE page_id = ANY($1)
        AND ts >= $2
      ORDER BY ts DESC`,
      [pageIds, cutoff]
    );

    console.log(`[stats] Fetched ${rows.length} events from database for ${pageIds.length} pages`);

    // Parse JSONB props back to objects
    return rows.map(row => ({
      ...row,
      props: typeof row.props === 'string' ? JSON.parse(row.props) : row.props
    }));
  } catch (error) {
    console.error("[stats] Error fetching events from database:", error);
    return []; // Return empty array on error to prevent dashboard crash
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
    const user = await getSessionUser(req);

    if (!user?.email) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "7");
    const pageIdFilter = searchParams.get("pageId");

    const userId = user.email;
    const pool = getPool();

    // Get all user pages from database
    const userPages: { slug: string; id: string }[] = [];
    try {
      const { rows } = await pool.query(
        `SELECT slug FROM calculators WHERE user_id = $1`,
        [userId]
      );

      // For each slug, try to get the ID from fullStore
      const fullStore = await import("@/lib/fullStore");
      for (const row of rows) {
        const slug = row.slug;
        try {
          const full = await fullStore.getFull(userId, slug);
          userPages.push({
            slug,
            id: full?.meta?.id || ""
          });
        } catch {
          userPages.push({ slug, id: "" });
        }
      }
    } catch (e) {
      console.error("[stats] Error reading pages from database:", e);
    }

    const pageIds = userPages.map(p => p.slug);

    // Determine which page IDs (slugs AND uuids) to fetch events for
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

    // Fetch events from database
    const events = await getEventsForPages(targetIdentifiers, days);

    // Normalize events: map UUIDs back to Slugs for aggregation
    const normalizedEvents = events.map(e => {
      const page = userPages.find(p => p.id === e.pageId);
      if (page) {
        return { ...e, pageId: page.slug };
      }
      return e;
    });

    const stats = aggregateEvents(normalizedEvents, userPages.map(p => p.slug));

    return NextResponse.json({
      ok: true,
      period: { days, from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() },
      pageIds,
      ...stats,
    });
  } catch (error) {
    console.error("[stats] GET Error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

// Record new events to PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body as { events: AnalyticsEvent[] };

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "no_events" }, { status: 400 });
    }

    const pool = getPool();

    // Ensure analytics table exists (idempotent - safe on every request)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id BIGSERIAL PRIMARY KEY,
        page_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        session_id TEXT NOT NULL,
        client_id TEXT NOT NULL,
        ts BIGINT NOT NULL,
        props JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes if they don't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_page_ts ON analytics_events(page_id, ts DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id, page_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
    `);

    // Insert events using batch insert for better performance
    const values: any[] = [];
    const placeholders: string[] = [];
    
    events.forEach((event, i) => {
      const offset = i * 6;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(
        event.pageId,
        event.type,
        event.sessionId,
        event.clientId,
        event.ts,
        JSON.stringify(event.props || {})
      );
    });

    await pool.query(
      `INSERT INTO analytics_events (page_id, event_type, session_id, client_id, ts, props)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    console.log(`[stats] Inserted ${events.length} events into PostgreSQL`);

    return NextResponse.json({ ok: true, recorded: events.length });
  } catch (error) {
    console.error("[stats] POST Error:", error);
    return NextResponse.json({ error: "internal_error", details: String(error) }, { status: 500 });
  }
}

