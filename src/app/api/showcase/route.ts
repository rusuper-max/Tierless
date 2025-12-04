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

// Helper to get author name with proper priority
async function getAuthorName(pool: any, userId: string, meta: any): Promise<string> {
  // Priority 1: Check user_profiles table for business_name
  try {
    const profileRes = await pool.query(
      `SELECT business_name FROM user_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (profileRes.rows[0]?.business_name) {
      return profileRes.rows[0].business_name;
    }
  } catch (e) {
    // Table might not exist yet, ignore
  }

  // Priority 2: displayName from meta
  if (meta?.displayName) return meta.displayName;

  // Priority 3: publicName from meta  
  if (meta?.publicName) return meta.publicName;

  // Priority 4: business.name from meta
  if (meta?.business?.name) return meta.business.name;

  // Priority 5: Email prefix as fallback
  if (userId?.includes("@")) {
    return userId.split("@")[0];
  }

  // Final fallback
  return `user_${userId.slice(0, 8)}`;
}

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
      const cover = meta.business?.coverUrl || meta.simpleCoverImage || meta.heroImageUrl || null;

      // Get author from profile business_name first, then meta, then email
      const authorName = await getAuthorName(pool, row.user_id, meta);

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
      const cover = meta.business?.coverUrl || meta.simpleCoverImage || meta.heroImageUrl || null;

      // Get author from profile business_name first, then meta, then email
      const authorName = await getAuthorName(pool, row.user_id, meta);

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

      // Get author from profile business_name first, then meta, then email
      const authorName = await getAuthorName(pool, row.user_id, meta);

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
