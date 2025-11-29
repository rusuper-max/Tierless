// Debug endpoint to check stored events in PostgreSQL
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getPool();

    // Check if analytics_events table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'analytics_events'
      ) as exists
    `);

    if (!tableCheck.rows[0]?.exists) {
      return NextResponse.json({
        status: "no_table",
        message: "analytics_events table does not exist yet. No events have been recorded.",
      });
    }

    // Get total count
    const countResult = await pool.query(`SELECT COUNT(*) as total FROM analytics_events`);
    const totalEvents = parseInt(countResult.rows[0]?.total || "0");

    // Get events by type
    const typeStats = await pool.query(`
      SELECT event_type, COUNT(*) as count 
      FROM analytics_events 
      GROUP BY event_type 
      ORDER BY count DESC
    `);

    // Get events by page
    const pageStats = await pool.query(`
      SELECT page_id, COUNT(*) as count 
      FROM analytics_events 
      GROUP BY page_id 
      ORDER BY count DESC
      LIMIT 20
    `);

    // Get recent events
    const recentEvents = await pool.query(`
      SELECT page_id, event_type, session_id, ts, props
      FROM analytics_events
      ORDER BY ts DESC
      LIMIT 10
    `);

    // Get unique sessions count
    const sessionCount = await pool.query(`
      SELECT COUNT(DISTINCT session_id) as count FROM analytics_events
    `);

    return NextResponse.json({
      status: "ok",
      database: "PostgreSQL",
      totalEvents,
      uniqueSessions: parseInt(sessionCount.rows[0]?.count || "0"),
      byType: typeStats.rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row.event_type] = parseInt(row.count);
        return acc;
      }, {}),
      byPage: pageStats.rows.map((row: any) => ({
        pageId: row.page_id,
        count: parseInt(row.count),
      })),
      recentEvents: recentEvents.rows.map((row: any) => ({
        pageId: row.page_id,
        type: row.event_type,
        sessionId: row.session_id?.slice(0, 15) + "...",
        ts: new Date(parseInt(row.ts)).toISOString(),
        props: row.props,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: String(error),
    });
  }
}
