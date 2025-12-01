// src/app/api/showcase/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as fullStore from "@/lib/fullStore";

// ISR - revalidate every 60 seconds
export const revalidate = 60;

// Featured slugs
const FEATURED_SLUGS = [
  "restaurant-showcase",
  "salon-showcase",
  "dentist-showcase",
  "agency-showcase",
  "fitness-showcase",
];

export async function GET() {
  const pool = getPool();

  // 1) FEATURED
  const featuredRes = await pool.query(
    `SELECT user_id, slug, avg_rating, ratings_count, published
     FROM calculators
     WHERE slug = ANY($1) AND published = true
     ORDER BY array_position($1, slug)`,
    [FEATURED_SLUGS]
  );

  const featured = await Promise.all(
    featuredRes.rows.map(async (row) => {
      const fullCalc = await fullStore.getFull(row.user_id, row.slug);
      const meta = fullCalc?.meta || {};
      const cover = meta.business?.coverUrl || meta.simpleCoverImage || null;

      let authorName = meta.business?.name || `user_${row.user_id.slice(0, 8)}`;
      if (row.user_id && row.user_id.includes("@")) {
        authorName = row.user_id.split("@")[0];
      }

      return {
        slug: row.slug,
        title: meta.name || "Untitled",
        cover,
        avgRating: Number(row.avg_rating || 0),
        ratingsCount: Number(row.ratings_count || 0),
        description: meta.business?.description || null,
        author: authorName,
      };
    })
  );

  // 2) COMMUNITY
  const communityRes = await pool.query(
    `SELECT c.user_id, c.slug, c.avg_rating, c.ratings_count
     FROM calculators c
     INNER JOIN calc_full cf ON c.user_id = cf.user_id AND c.slug = cf.slug
     WHERE c.published = true
       AND (cf.calc->'meta'->>'listInExamples')::boolean = true
     ORDER BY c.avg_rating DESC NULLS LAST,
              c.ratings_count DESC NULLS LAST,
              c.updated_at DESC
     LIMIT 100`
  );

  const community = await Promise.all(
    communityRes.rows.map(async (row) => {
      const fullCalc = await fullStore.getFull(row.user_id, row.slug);
      const meta = fullCalc?.meta || {};
      const cover = meta.business?.coverUrl || meta.simpleCoverImage || null;

      let authorName = meta.business?.name || `user_${row.user_id.slice(0, 8)}`;
      if (row.user_id && row.user_id.includes("@")) {
        authorName = row.user_id.split("@")[0];
      }

      return {
        slug: row.slug,
        title: meta.name || "Untitled",
        cover,
        avgRating: Number(row.avg_rating || 0),
        ratingsCount: Number(row.ratings_count || 0),
        description: meta.business?.description || null,
        author: authorName,
      };
    })
  );

  // 3) TOP PAGES
  const topPagesRes = await pool.query(
    `SELECT 
        c.user_id,
        c.slug,
        c.avg_rating,
        c.ratings_count,
        c.views7d
     FROM calculators c
     INNER JOIN calc_full cf ON c.user_id = cf.user_id AND c.slug = cf.slug
     WHERE c.published = true
       AND (cf.calc->'meta'->>'listInExamples')::boolean = true
       AND c.ratings_count > 0
     ORDER BY 
        c.avg_rating DESC NULLS LAST,
        c.ratings_count DESC NULLS LAST,
        c.views7d DESC
     LIMIT 100`
  );

  const topPages = await Promise.all(
    topPagesRes.rows.map(async (row, index) => {
      const fullCalc = await fullStore.getFull(row.user_id, row.slug);
      const meta = fullCalc?.meta || {};

      let authorName = `user_${row.user_id.slice(0, 8)}`;
      if (row.user_id && row.user_id.includes("@")) {
        authorName = row.user_id.split("@")[0];
      }

      return {
        rank: index + 1,
        slug: row.slug,
        title: meta.name || "Untitled",
        author: authorName,
        avgRating: Number(row.avg_rating || 0),
        ratingsCount: Number(row.ratings_count || 0),
        totalViews: Number(row.views7d || 0),
      };
    })
  );

  return NextResponse.json(
    { featured, community, topPages, items: featured },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=60" },
    }
  );
}
