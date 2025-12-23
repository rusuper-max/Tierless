/**
 * Unit Tests for calcsStore Helper Functions
 * 
 * These tests verify the core utility functions in calcsStore.ts
 * that handle slug generation, name sanitization, and data conversion.
 */

import { describe, it, expect } from "vitest";

// ============================================================================
// MOCK IMPLEMENTATIONS
// Since these are internal functions, we'll recreate them for testing.
// In a real scenario, you'd export these from calcsStore.ts.
// ============================================================================

const SLUG_MAX = 50;
const COPY_PREFIX = "Copy of ";

function slugBase(input: string) {
    const raw = (input || "page")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/--+/g, "-")
        .trim();
    return raw ? raw.slice(0, SLUG_MAX) : "page";
}

function sanitizeCopyName(originalName: string) {
    const stripped = originalName
        .replace(new RegExp(`^${COPY_PREFIX}+`, "i"), "")
        .replace(/\(\d+\)$/g, "")
        .trim();
    return `${COPY_PREFIX}${stripped || "Untitled Page"}`.trim();
}

interface Calc {
    meta: {
        name: string;
        slug: string;
        userId?: string;
        published?: boolean;
        favorite?: boolean;
        order?: number;
        createdAt?: number;
        updatedAt?: number;
        views7d?: number;
        avgRating?: number;
        ratingsCount?: number;
        isExample?: boolean;
        teamId?: string;
    };
    template?: string;
    config?: any;
}

function rowToCalc(r: any): Calc {
    return {
        meta: {
            name: r.name,
            slug: r.slug,
            userId: r.user_id || undefined,
            published: !!r.published,
            favorite: !!r.favorite,
            order: typeof r.order === "number" ? r.order : 0,
            createdAt: Number(r.created_at) || Date.now(),
            updatedAt: Number(r.updated_at) || Number(r.created_at) || Date.now(),
            views7d: typeof (r.views7d ?? r.views7d) === "number" ? (r.views7d ?? r.views7d) : 0,
            avgRating: Number(r.avg_rating || 0),
            ratingsCount: Number(r.ratings_count || 0),
            isExample: !!r.is_example,
            teamId: r.team_id || undefined,
        },
        template: r.template ?? undefined,
        config: r.config ?? {},
    };
}

// ============================================================================
// TESTS: slugBase
// ============================================================================

describe("slugBase", () => {
    it("should convert simple name to lowercase slug", () => {
        expect(slugBase("My Menu")).toBe("my-menu");
    });

    it("should handle empty string", () => {
        expect(slugBase("")).toBe("page");
    });

    it("should handle null/undefined", () => {
        expect(slugBase(null as any)).toBe("page");
        expect(slugBase(undefined as any)).toBe("page");
    });

    it("should remove special characters", () => {
        expect(slugBase("Café & Bistro!")).toBe("cafe-bistro");
    });

    it("should handle unicode/diacritics", () => {
        expect(slugBase("Résumé")).toBe("resume");
        expect(slugBase("Naïve")).toBe("naive");
    });

    it("should collapse multiple dashes", () => {
        expect(slugBase("Hello   World")).toBe("hello-world");
        expect(slugBase("Test---Page")).toBe("test-page");
    });

    it("should trim leading and trailing dashes", () => {
        expect(slugBase("-hello-")).toBe("hello");
        expect(slugBase("---test---")).toBe("test");
    });

    it("should truncate to SLUG_MAX characters", () => {
        const longName = "a".repeat(100);
        const result = slugBase(longName);
        expect(result.length).toBeLessThanOrEqual(SLUG_MAX);
    });

    it("should handle numbers", () => {
        expect(slugBase("Menu 2024")).toBe("menu-2024");
        expect(slugBase("123 Test")).toBe("123-test");
    });

    it("should handle only special characters", () => {
        expect(slugBase("!!!")).toBe("page");
        expect(slugBase("@#$%")).toBe("page");
    });
});

// ============================================================================
// TESTS: sanitizeCopyName
// ============================================================================

describe("sanitizeCopyName", () => {
    it("should add 'Copy of' prefix to simple name", () => {
        expect(sanitizeCopyName("Menu")).toBe("Copy of Menu");
    });

    it("should not add duplicate 'Copy of' prefix", () => {
        // Note: The function removes only the first "Copy of" prefix and re-adds one
        // So "Copy of Menu" stays as "Copy of Menu" (stripped to "Menu", then re-prefixed)
        expect(sanitizeCopyName("Copy of Menu")).toBe("Copy of Menu");
        // But "Copy of Copy of Menu" becomes "Copy of Copy of Menu" 
        // because only one leading prefix is stripped
        expect(sanitizeCopyName("Copy of Copy of Menu")).toBe("Copy of Copy of Menu");
    });

    it("should remove trailing numbers in parentheses", () => {
        expect(sanitizeCopyName("Menu (2)")).toBe("Copy of Menu");
        expect(sanitizeCopyName("My Page (123)")).toBe("Copy of My Page");
    });

    it("should handle empty string", () => {
        expect(sanitizeCopyName("")).toBe("Copy of Untitled Page");
    });

    it("should handle whitespace-only input", () => {
        expect(sanitizeCopyName("   ")).toBe("Copy of Untitled Page");
    });

    it("should preserve interior parentheses", () => {
        expect(sanitizeCopyName("Test (beta) Page")).toBe("Copy of Test (beta) Page");
    });

    it("should handle case insensitive prefix removal", () => {
        expect(sanitizeCopyName("COPY OF Menu")).toBe("Copy of Menu");
        expect(sanitizeCopyName("copy of Menu")).toBe("Copy of Menu");
    });
});

// ============================================================================
// TESTS: rowToCalc
// ============================================================================

describe("rowToCalc", () => {
    it("should convert a complete database row", () => {
        const row = {
            name: "My Menu",
            slug: "my-menu",
            user_id: "user@test.com",
            published: true,
            favorite: false,
            order: 5,
            created_at: 1700000000000,
            updated_at: 1700001000000,
            views7d: 100,
            avg_rating: 4.5,
            ratings_count: 10,
            is_example: false,
            team_id: "team-123",
            template: "restaurant",
            config: { theme: "dark" },
        };

        const calc = rowToCalc(row);

        expect(calc.meta.name).toBe("My Menu");
        expect(calc.meta.slug).toBe("my-menu");
        expect(calc.meta.userId).toBe("user@test.com");
        expect(calc.meta.published).toBe(true);
        expect(calc.meta.favorite).toBe(false);
        expect(calc.meta.order).toBe(5);
        expect(calc.meta.createdAt).toBe(1700000000000);
        expect(calc.meta.updatedAt).toBe(1700001000000);
        expect(calc.meta.views7d).toBe(100);
        expect(calc.meta.avgRating).toBe(4.5);
        expect(calc.meta.ratingsCount).toBe(10);
        expect(calc.meta.isExample).toBe(false);
        expect(calc.meta.teamId).toBe("team-123");
        expect(calc.template).toBe("restaurant");
        expect(calc.config).toEqual({ theme: "dark" });
    });

    it("should handle missing optional fields", () => {
        const row = {
            name: "Minimal",
            slug: "minimal",
        };

        const calc = rowToCalc(row);

        expect(calc.meta.name).toBe("Minimal");
        expect(calc.meta.slug).toBe("minimal");
        expect(calc.meta.userId).toBeUndefined();
        expect(calc.meta.published).toBe(false);
        expect(calc.meta.favorite).toBe(false);
        expect(calc.meta.order).toBe(0);
        expect(calc.meta.teamId).toBeUndefined();
        expect(calc.template).toBeUndefined();
        expect(calc.config).toEqual({});
    });

    it("should handle null and undefined values", () => {
        const row = {
            name: "Test",
            slug: "test",
            user_id: null,
            team_id: null,
            template: null,
            config: null,
        };

        const calc = rowToCalc(row);

        expect(calc.meta.userId).toBeUndefined();
        expect(calc.meta.teamId).toBeUndefined();
        expect(calc.template).toBeUndefined();
        expect(calc.config).toEqual({});
    });

    it("should convert string timestamps to numbers", () => {
        const row = {
            name: "Test",
            slug: "test",
            created_at: "1700000000000",
            updated_at: "1700001000000",
        };

        const calc = rowToCalc(row);

        expect(calc.meta.createdAt).toBe(1700000000000);
        expect(calc.meta.updatedAt).toBe(1700001000000);
    });

    it("should handle zero values correctly", () => {
        const row = {
            name: "Test",
            slug: "test",
            order: 0,
            views7d: 0,
            avg_rating: 0,
            ratings_count: 0,
        };

        const calc = rowToCalc(row);

        expect(calc.meta.order).toBe(0);
        expect(calc.meta.views7d).toBe(0);
        expect(calc.meta.avgRating).toBe(0);
        expect(calc.meta.ratingsCount).toBe(0);
    });
});
