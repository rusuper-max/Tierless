// src/lib/permissions.ts
// Permission guards for multi-tenant access control

import { getPool, getUserTeamRole, type TeamRole, hasTeamPermission } from "@/lib/db";
import * as calcsStore from "@/lib/calcsStore";
import {
  type FeatureKey,
  hasFeature,
  firstPlanWithFeature,
  coercePlan
} from "@/lib/entitlements";

// ============================================================================
// TYPES
// ============================================================================

export type PermissionResult =
  | { allowed: true; role?: TeamRole }
  | { allowed: false; reason: string; status: number };

export type CalcOwnership = {
  userId: string;
  teamId: string | null;
};

// ============================================================================
// CORE PERMISSION CHECKS
// ============================================================================

/**
 * Check if a user is a member of a team with at least the required role.
 * 
 * @param userId - The user to check
 * @param teamId - The team to check membership in
 * @param minRole - Minimum required role (default: "viewer")
 * @returns PermissionResult
 */
export async function requireTeamMember(
  userId: string,
  teamId: string,
  minRole: TeamRole = "viewer"
): Promise<PermissionResult> {
  const userRole = await getUserTeamRole(userId, teamId);

  if (!userRole) {
    return {
      allowed: false,
      reason: "Not a member of this team",
      status: 403,
    };
  }

  if (!hasTeamPermission(userRole, minRole)) {
    return {
      allowed: false,
      reason: `Insufficient permissions. Required: ${minRole}, you have: ${userRole}`,
      status: 403,
    };
  }

  return { allowed: true, role: userRole };
}

/**
 * Get the ownership info for a calculator (who owns it, which team if any).
 */
export async function getCalcOwnership(
  userId: string,
  slug: string
): Promise<CalcOwnership | null> {
  const pool = getPool();

  // First check in calculators table
  const { rows } = await pool.query(
    `SELECT user_id, team_id FROM calculators WHERE user_id = $1 AND slug = $2 LIMIT 1`,
    [userId, slug]
  );

  if (rows[0]) {
    return {
      userId: rows[0].user_id,
      teamId: rows[0].team_id || null,
    };
  }

  return null;
}

/**
 * Check if a user can VIEW a calculator.
 * 
 * Rules:
 * 1. Owner can always view
 * 2. Team members (any role) can view team calculators
 */
export async function requireCanView(
  userId: string,
  ownerUserId: string,
  slug: string
): Promise<PermissionResult> {
  // Owner can always view
  if (userId === ownerUserId) {
    return { allowed: true };
  }

  // Check if calculator belongs to a team the user is in
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT c.team_id 
     FROM calculators c
     WHERE c.user_id = $1 AND c.slug = $2 AND c.team_id IS NOT NULL
     LIMIT 1`,
    [ownerUserId, slug]
  );

  if (rows[0]?.team_id) {
    const teamCheck = await requireTeamMember(userId, rows[0].team_id, "viewer");
    if (teamCheck.allowed) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: "You don't have access to this calculator",
    status: 403,
  };
}

/**
 * Check if a user can EDIT a calculator.
 * 
 * Rules:
 * 1. Owner can always edit
 * 2. Team editors/admins/owners can edit team calculators
 */
export async function requireCanEdit(
  userId: string,
  ownerUserId: string,
  slug: string
): Promise<PermissionResult> {
  // Owner can always edit
  if (userId === ownerUserId) {
    return { allowed: true };
  }

  // Check if calculator belongs to a team the user can edit in
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT c.team_id 
     FROM calculators c
     WHERE c.user_id = $1 AND c.slug = $2 AND c.team_id IS NOT NULL
     LIMIT 1`,
    [ownerUserId, slug]
  );

  if (rows[0]?.team_id) {
    const teamCheck = await requireTeamMember(userId, rows[0].team_id, "editor");
    if (teamCheck.allowed) {
      return { allowed: true };
    }
    return teamCheck; // Return the specific error
  }

  return {
    allowed: false,
    reason: "You don't have permission to edit this calculator",
    status: 403,
  };
}

/**
 * Check if a user can PUBLISH a calculator.
 * 
 * Rules:
 * 1. Owner can always publish
 * 2. Team admins/owners can publish team calculators
 * 3. Team editors CANNOT publish (need admin approval)
 */
export async function requireCanPublish(
  userId: string,
  ownerUserId: string,
  slug: string
): Promise<PermissionResult> {
  // Owner can always publish
  if (userId === ownerUserId) {
    return { allowed: true };
  }

  // Check if calculator belongs to a team the user can publish in
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT c.team_id 
     FROM calculators c
     WHERE c.user_id = $1 AND c.slug = $2 AND c.team_id IS NOT NULL
     LIMIT 1`,
    [ownerUserId, slug]
  );

  if (rows[0]?.team_id) {
    // Need admin role to publish
    const teamCheck = await requireTeamMember(userId, rows[0].team_id, "admin");
    if (teamCheck.allowed) {
      return { allowed: true };
    }

    // Check if user is at least an editor (for better error message)
    const editorCheck = await requireTeamMember(userId, rows[0].team_id, "editor");
    if (editorCheck.allowed) {
      return {
        allowed: false,
        reason: "Editors cannot publish. Ask a team admin to publish this page.",
        status: 403,
      };
    }

    return teamCheck;
  }

  return {
    allowed: false,
    reason: "You don't have permission to publish this calculator",
    status: 403,
  };
}

/**
 * Check if a user can DELETE a calculator.
 * 
 * Rules:
 * 1. Owner can always delete
 * 2. Team admins/owners can delete team calculators
 * 3. Team editors CANNOT delete
 */
export async function requireCanDelete(
  userId: string,
  ownerUserId: string,
  slug: string
): Promise<PermissionResult> {
  // Owner can always delete
  if (userId === ownerUserId) {
    return { allowed: true };
  }

  // Check if calculator belongs to a team the user can delete in
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT c.team_id 
     FROM calculators c
     WHERE c.user_id = $1 AND c.slug = $2 AND c.team_id IS NOT NULL
     LIMIT 1`,
    [ownerUserId, slug]
  );

  if (rows[0]?.team_id) {
    // Need admin role to delete
    const teamCheck = await requireTeamMember(userId, rows[0].team_id, "admin");
    if (teamCheck.allowed) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: "Only team admins can delete team pages",
      status: 403,
    };
  }

  return {
    allowed: false,
    reason: "You don't have permission to delete this calculator",
    status: 403,
  };
}

// ============================================================================
// HELPER: Find calculator by slug (cross-user for team access)
// ============================================================================

/**
 * Find calculator ownership by slug only (for team access scenarios).
 * Returns the owner's userId and teamId if found.
 */
export async function findCalcBySlug(slug: string): Promise<CalcOwnership | null> {
  const pool = getPool();

  const { rows } = await pool.query(
    `SELECT user_id, team_id FROM calculators WHERE slug = $1 LIMIT 1`,
    [slug]
  );

  if (rows[0]) {
    return {
      userId: rows[0].user_id,
      teamId: rows[0].team_id || null,
    };
  }

  return null;
}

/**
 * Check if user has access to a calculator (by slug only).
 * Used when we don't know the owner upfront.
 * 
 * Returns the owner userId if access is granted, null otherwise.
 */
export async function findAccessibleCalc(
  userId: string,
  slug: string,
  minPermission: "view" | "edit" | "publish" | "delete" = "view"
): Promise<{ ownerUserId: string; teamId: string | null } | null> {
  const pool = getPool();

  // First, try to find as direct owner
  const ownCheck = await pool.query(
    `SELECT user_id, team_id FROM calculators WHERE user_id = $1 AND slug = $2 LIMIT 1`,
    [userId, slug]
  );

  if (ownCheck.rows[0]) {
    return {
      ownerUserId: userId,
      teamId: ownCheck.rows[0].team_id || null,
    };
  }

  // Not direct owner, check if it's a team calculator we have access to
  const teamCalcCheck = await pool.query(
    `SELECT c.user_id, c.team_id, tm.role
     FROM calculators c
     JOIN team_members tm ON c.team_id = tm.team_id
     WHERE c.slug = $1 AND tm.user_id = $2 AND c.team_id IS NOT NULL
     LIMIT 1`,
    [slug, userId]
  );

  if (teamCalcCheck.rows[0]) {
    const { user_id: ownerUserId, team_id: teamId, role } = teamCalcCheck.rows[0];

    // Check if role is sufficient
    const roleMap: Record<string, TeamRole> = {
      view: "viewer",
      edit: "editor",
      publish: "admin",
      delete: "admin",
    };

    const requiredRole = roleMap[minPermission];
    if (hasTeamPermission(role as TeamRole, requiredRole)) {
      return { ownerUserId, teamId };
    }
  }

  return null;
}

// ============================================================================
// ENTITLEMENT CHECKS (Plan-based)
// ============================================================================

/**
 * Check if user's plan allows a specific feature.
 * This wraps the entitlements logic for cleaner API usage.
 * 
 * @param userId - The user ID to check
 * @param feature - The feature key to check access for
 * @returns PermissionResult indicating if the feature is allowed
 */
export async function requirePlanFeature(
  userId: string,
  feature: FeatureKey
): Promise<PermissionResult> {
  const pool = getPool();

  // Look up user's plan from user_plans table
  const { rows } = await pool.query(
    `SELECT plan FROM user_plans WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  // Default to free plan if not found
  const plan = coercePlan(rows[0]?.plan);
  const allowed = hasFeature(plan, feature);

  if (!allowed) {
    const requiredPlan = firstPlanWithFeature(feature);
    return {
      allowed: false,
      reason: `This feature requires the ${requiredPlan} plan or higher. Your current plan: ${plan}`,
      status: 403,
    };
  }

  return { allowed: true };
}



