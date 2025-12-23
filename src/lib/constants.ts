// src/lib/constants.ts
// Centralized constants to avoid magic strings throughout the codebase

/**
 * Plan identifiers for the subscription system.
 * Use these constants instead of raw strings like "free" or "pro".
 */
export const PLANS = {
    FREE: "free",
    STARTER: "starter",
    GROWTH: "growth",
    PRO: "pro",
    AGENCY: "agency",
    TIERLESS: "tierless", // Founder plan
} as const;

/**
 * Team member role identifiers.
 * Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER
 */
export const ROLES = {
    OWNER: "owner",
    ADMIN: "admin",
    EDITOR: "editor",
    VIEWER: "viewer",
} as const;

/**
 * Plan display order for pricing pages and comparisons.
 */
export const PLAN_DISPLAY_ORDER = [
    PLANS.FREE,
    PLANS.STARTER,
    PLANS.GROWTH,
    PLANS.PRO,
    PLANS.AGENCY,
] as const;

/**
 * Role hierarchy levels for permission checks.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
    [ROLES.OWNER]: 4,
    [ROLES.ADMIN]: 3,
    [ROLES.EDITOR]: 2,
    [ROLES.VIEWER]: 1,
};

// Type exports for type-safe usage
export type PlanKey = typeof PLANS[keyof typeof PLANS];
export type RoleKey = typeof ROLES[keyof typeof ROLES];
