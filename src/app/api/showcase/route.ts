// src/app/api/showcase/route.ts
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import * as fullStore from "@/lib/fullStore";

// Tvoje 5 featured slugova (napravi ih na showcase account-u)
const FEATURED_SLUGS = [
    "restaurant-showcase",
    "salon-showcase",
    "dentist-showcase",
    "agency-showcase",
    "fitness-showcase",
];

export async function GET() {
    try {
        const pool = getPool();

        // 1) FEATURED - izvuci po slugovima
        const featuredRes = await pool.query(
            `SELECT user_id, slug, config, avg_rating, ratings_count, published
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

                return {
                    slug: row.slug,
                    title: meta.name || "Untitled",
                    cover,
                    avgRating: Number(row.avg_rating || 0),
                    ratingsCount: Number(row.ratings_count || 0),
                    description: meta.business?.description || null,
                };
            })
        );

        // 2) COMMUNITY - top 100 rated stranica (gde je listInExamples = true)
        // Lista samo published stranica
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

        console.log(`[Showcase] Found ${communityRes.rows.length} community pages`);
        communityRes.rows.forEach(row => {
            console.log(`  - ${row.slug}: ${row.avg_rating} (${row.ratings_count} votes)`);
        });

        const community = await Promise.all(
            communityRes.rows.map(async (row) => {
                const fullCalc = await fullStore.getFull(row.user_id, row.slug);
                const meta = fullCalc?.meta || {};
                const cover = meta.business?.coverUrl || meta.simpleCoverImage || null;

                return {
                    slug: row.slug,
                    title: meta.name || "Untitled",
                    cover,
                    avgRating: Number(row.avg_rating || 0),
                    ratingsCount: Number(row.ratings_count || 0),
                    description: meta.business?.description || null,
                };
            })
        );

        // 3) TOP RATED PAGES - top 100 stranica sa najboljim rejtingom
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

                // Extract author name from user_id (email)
                let authorName = `user_${row.user_id.slice(0, 8)}`;
                if (row.user_id && row.user_id.includes('@')) {
                    authorName = row.user_id.split('@')[0];
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

        // Popuni do 100 ako nema dovoljno
        while (topPages.length < 100) {
            topPages.push({
                rank: topPages.length + 1,
                slug: `empty-${topPages.length + 1}`,
                title: "Empty spot",
                author: "",
                avgRating: 0,
                ratingsCount: 0,
                totalViews: 0,
            });
        }

        return NextResponse.json({ featured, community, topPages });
    } catch (e) {
        console.error("SHOWCASE_API_ERROR", e);
        return NextResponse.json({
            featured: [],
            community: [],
            topPages: []
        });
    }
}