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

        // 3) TOP CREATORS - agregacija po user_id
        // Uzmi sve published + listInExamples stranice i grupiši po user_id
        const creatorsRes = await pool.query(
            `SELECT 
                c.user_id,
                SUM(c.ratings_count) as total_votes,
                SUM(c.avg_rating * c.ratings_count) as weighted_rating_sum,
                SUM(c.views7d) as total_views
             FROM calculators c
             INNER JOIN calc_full cf ON c.user_id = cf.user_id AND c.slug = cf.slug
             WHERE c.published = true
               AND (cf.calc->'meta'->>'listInExamples')::boolean = true
             GROUP BY c.user_id
             HAVING SUM(c.ratings_count) > 0
             ORDER BY 
                (SUM(c.avg_rating * c.ratings_count) / NULLIF(SUM(c.ratings_count), 0)) DESC,
                SUM(c.ratings_count) DESC,
                SUM(c.views7d) DESC
             LIMIT 100`
        );

        const creators = creatorsRes.rows.map((row, index) => {
            const totalVotes = Number(row.total_votes || 0);
            const avgRating = totalVotes > 0
                ? Number((row.weighted_rating_sum / totalVotes).toFixed(2))
                : 0;

            return {
                rank: index + 1,
                userId: row.user_id,
                avgRating,
                ratingsCount: totalVotes,
                totalViews: Number(row.total_views || 0),
            };
        });

        // user_id je već email u tvom sistemu, pa izvuči prefix
        const creatorsWithNames = creators.map(c => {
            let name = `user_${c.userId.slice(0, 8)}`;

            // user_id je email, izvuci deo pre @
            if (c.userId && c.userId.includes('@')) {
                name = c.userId.split('@')[0];
            }

            return {
                ...c,
                name,
            };
        });

        // Popuni do 100 ako nema dovoljno
        while (creatorsWithNames.length < 100) {
            creatorsWithNames.push({
                rank: creatorsWithNames.length + 1,
                userId: `empty-${creatorsWithNames.length + 1}`,
                name: "Empty spot",
                avgRating: 0,
                ratingsCount: 0,
                totalViews: 0,
            });
        }

        return NextResponse.json({ featured, community, creators: creatorsWithNames });
    } catch (e) {
        console.error("SHOWCASE_API_ERROR", e);
        return NextResponse.json({
            featured: [],
            community: [],
            creators: []
        });
    }
}