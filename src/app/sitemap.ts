import { MetadataRoute } from 'next';
import { getPool } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://tierless.net';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE_URL}/start`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/cookies`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${BASE_URL}/examples`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ];

    // Dynamic pages - published calculators
    let publicPages: MetadataRoute.Sitemap = [];

    try {
        const pool = getPool();
        const { rows } = await pool.query<{
            slug: string;
            id: string;
            updated_at: number;
        }>(`
            SELECT
                c.slug,
                cf.calc->'meta'->>'id' as id,
                c.updated_at
            FROM calculators c
            JOIN calc_full cf ON c.user_id = cf.user_id AND c.slug = cf.slug
            WHERE c.published = true
            ORDER BY c.updated_at DESC
            LIMIT 1000
        `);

        publicPages = rows.map((row) => ({
            url: row.id
                ? `${BASE_URL}/p/${row.id}-${row.slug}`
                : `${BASE_URL}/p/${row.slug}`,
            lastModified: row.updated_at && !isNaN(Number(row.updated_at))
                ? new Date(Number(row.updated_at))
                : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }));
    } catch (error) {
        console.error('Failed to fetch published calculators for sitemap:', error);
    }

    return [...staticPages, ...publicPages];
}
