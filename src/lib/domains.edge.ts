/**
 * Edge-compatible domain lookup for middleware
 * 
 * This file is designed to work in Edge runtime.
 * It uses fetch to call an internal API instead of direct database access.
 */

/**
 * Get slug for a custom domain (used by middleware for routing)
 * Calls internal API to avoid Node.js dependencies in Edge runtime.
 */
export async function getSlugFromDomain(domain: string, origin: string): Promise<string | null> {
    // Remove port if present (e.g. localhost:3000)
    const hostname = domain.split(":")[0].toLowerCase();

    try {
        // Call internal API for domain lookup
        const res = await fetch(`${origin}/api/domains/lookup?domain=${encodeURIComponent(hostname)}`, {
            method: "GET",
            headers: { "x-internal": "1" }, // Mark as internal request
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.slug || null;
    } catch (err) {
        console.error("[middleware] Domain lookup error:", err);
        return null;
    }
}
