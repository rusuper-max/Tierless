// src/app/api/stats/route.ts
// Analytics Stats API - PostgreSQL based
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import * as fullStore from "@/lib/fullStore";
import { checkRateLimit, getClientIP, rateLimitHeaders, STATS_LIMIT } from "@/lib/rateLimit";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
}

// Optimized SQL-based stats fetching
async function getStatsFromDB(pageIds: string[], days: number = 7) {
  const pool = getPool();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  // Engagement event types
  const engagementTypes = [
    'interaction', 'section_open', 'search', 'checkout_click',
    'rating_set', 'scroll_depth', 'copy_contact', 'click_link'
  ];

  // 1. Summary Stats
  // We use multiple queries or a single complex one. For clarity and maintainability, let's use parallel queries.
  // Note: props is JSONB, so we access fields with ->>

  const summaryQuery = `
    SELECT
      COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as unique_visitors,
      COUNT(*) FILTER (WHERE event_type = ANY($3::text[])) as interactions,
      COUNT(*) FILTER (WHERE event_type = 'checkout_click') as checkouts,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = ANY($3::text[])) as engaged_sessions,
      AVG((props->>'timeOnPage')::numeric) FILTER (WHERE event_type = 'page_exit') as avg_time
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2
  `;

  // 2. Daily Stats
  const dailyQuery = `
    SELECT
      to_timestamp(ts/1000)::date as day,
      COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
      COUNT(*) FILTER (WHERE event_type = ANY($3::text[])) as interactions,
      COUNT(*) FILTER (WHERE event_type = 'checkout_click') as checkouts
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2
    GROUP BY day
    ORDER BY day ASC
  `;

  // 3. Top Lists (Referrers, Countries, Devices, UTM) - based on page_view
  const topListQuery = (field: string) => `
    SELECT props->>$3 as name, COUNT(*) as count
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2 AND event_type = 'page_view'
    GROUP BY name
    ORDER BY count DESC
    LIMIT 10
  `;

  // 4. Scroll Depth Distribution
  const scrollQuery = `
    SELECT props->>'depth' as depth, COUNT(*) as count
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2 AND event_type = 'scroll_depth'
    GROUP BY depth
  `;

  // 5. Time Buckets
  const timeQuery = `
    SELECT props->>'timeBucket' as bucket, COUNT(*) as count
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2 AND event_type = 'page_exit'
    GROUP BY bucket
  `;

  // Execute queries in parallel
  const [
    summaryRes,
    dailyRes,
    referrersRes,
    countriesRes,
    devicesRes,
    scrollRes,
    timeRes
  ] = await Promise.all([
    pool.query(summaryQuery, [pageIds, cutoff, engagementTypes]),
    pool.query(dailyQuery, [pageIds, cutoff, engagementTypes]),
    pool.query(topListQuery('referrer'), [pageIds, cutoff, 'referrer']),
    pool.query(topListQuery('country'), [pageIds, cutoff, 'country']),
    pool.query(topListQuery('device'), [pageIds, cutoff, 'device']),
    pool.query(scrollQuery, [pageIds, cutoff]),
    pool.query(timeQuery, [pageIds, cutoff])
  ]);

  const s = summaryRes.rows[0];

  // Process Scroll Depth
  const scrollDepthCounts: Record<number, number> = { 25: 0, 50: 0, 75: 0, 100: 0 };
  scrollRes.rows.forEach((r: any) => {
    if (r.depth) scrollDepthCounts[parseInt(r.depth)] = parseInt(r.count);
  });

  // Process Time Buckets
  const timeBuckets: Record<string, number> = {};
  timeRes.rows.forEach((r: any) => {
    if (r.bucket) timeBuckets[r.bucket] = parseInt(r.count);
  });

  // Calculate Rates
  const uniqueVisitors = parseInt(s.unique_visitors || '0');
  const engagedSessions = parseInt(s.engaged_sessions || '0');
  const checkouts = parseInt(s.checkouts || '0');

  // Per Page Stats (Simplified for performance, or we can do a separate query if needed)
  // For now, let's do a single query grouped by page_id to get the table data
  const perPageQuery = `
    SELECT
      page_id,
      COUNT(*) FILTER (WHERE event_type = 'page_view') as views,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') as unique_visitors,
      COUNT(*) FILTER (WHERE event_type = ANY($3::text[])) as interactions,
      COUNT(*) FILTER (WHERE event_type = 'checkout_click') as checkouts,
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = ANY($3::text[])) as engaged_sessions,
      AVG((props->>'timeOnPage')::numeric) FILTER (WHERE event_type = 'page_exit') as avg_time
    FROM analytics_events
    WHERE page_id = ANY($1) AND ts >= $2
    GROUP BY page_id
  `;
  const perPageRes = await pool.query(perPageQuery, [pageIds, cutoff, engagementTypes]);

  const perPage: Record<string, any> = {};
  perPageRes.rows.forEach((row: any) => {
    perPage[row.page_id] = {
      views: parseInt(row.views),
      uniqueVisitors: parseInt(row.unique_visitors),
      engagedSessions: parseInt(row.engaged_sessions),
      interactions: parseInt(row.interactions),
      checkouts: parseInt(row.checkouts),
      avgTimeOnPage: parseFloat(row.avg_time || '0'),
      // Detailed breakdowns per page would require more queries, 
      // for now we return empty objects or simplified data to match interface if strictly needed.
      // The frontend mostly displays these top-level metrics in the table.
      checkoutMethods: {},
      avgRating: 0,
      ratingsCount: 0,
      devices: {},
      referrers: {},
      countries: {},
      interactionTypes: {},
      scrollDepth: {}
    };
  });

  return {
    summary: {
      totalViews: parseInt(s.views || '0'),
      uniqueVisitors,
      totalInteractions: parseInt(s.interactions || '0'),
      totalCheckouts: checkouts,
      conversionRate: uniqueVisitors > 0 ? (checkouts / uniqueVisitors * 100).toFixed(2) : "0",
      interactionRate: uniqueVisitors > 0 ? (engagedSessions / uniqueVisitors * 100).toFixed(2) : "0",
      engagedSessions,
      avgTimeOnPage: Math.round(parseFloat(s.avg_time || '0')),
      timeBuckets,
      scrollDepth: scrollDepthCounts,
    },
    perPage,
    dailyStats: dailyRes.rows.map((r: any) => ({
      date: r.day.toISOString().split('T')[0],
      views: parseInt(r.views),
      interactions: parseInt(r.interactions),
      checkouts: parseInt(r.checkouts)
    })),
    referrers: referrersRes.rows.map((r: any) => ({ name: r.name || 'direct', count: parseInt(r.count) })),
    // UTM sources would be another query, skipping for brevity unless critical
    utmSources: [],
    devices: devicesRes.rows.map((r: any) => ({
      name: r.name || 'unknown',
      count: parseInt(r.count),
      percent: s.views > 0 ? (parseInt(r.count) / parseInt(s.views) * 100).toFixed(1) : "0"
    })),
    countries: countriesRes.rows.map((r: any) => ({ name: r.name || 'Unknown', count: parseInt(r.count) })),
  };
}

export async function GET(req: NextRequest) {
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

  const stats = await getStatsFromDB(targetIdentifiers, days);

  return NextResponse.json({
    ok: true,
    period: { days, from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() },
    pageIds: userPages.map(p => p.slug),
    ...stats,
  });
}

// Record new events
export async function POST(req: NextRequest) {
  try {
    // Rate Limiting - 100 requests per minute per IP
    const clientIP = getClientIP(req);
    const rateResult = checkRateLimit(clientIP, STATS_LIMIT);
    
    if (!rateResult.success) {
      // Don't log every rate limit hit for stats (could be noisy)
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

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
