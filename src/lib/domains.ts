/**
 * Domain helper for Middleware.
 * 
 * In a real implementation, this would likely query Edge Config, Redis, or a high-performance DB endpoint.
 * For now, we stub this to test the routing logic.
 */

export async function getSlugFromDomain(domain: string): Promise<string | null> {
    // 1. Remove port if present (e.g. localhost:3000)
    const hostname = domain.split(":")[0];

    // 2. Stub mappings for testing
    const MOCK_DB: Record<string, string> = {
        "menu.bistro.com": "bistro-menu",
        "pricing.saas.com": "saas-pricing-v1",
        // Add more for local testing
        "localhost": "demo-page", // Careful with this one if testing locally
    };

    if (MOCK_DB[hostname]) {
        return MOCK_DB[hostname];
    }

    // 3. In production, we might return null if not found
    return null;
}
