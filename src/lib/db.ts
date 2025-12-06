import { Pool } from "pg";
import crypto from "crypto";

// --- DATABASE CONNECTION (Singleton Pattern) ---

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (_pool) return _pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  _pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // Required for Neon
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return _pool;
}

// --- AUTHENTICATION (Magic Link Helpers) ---

/**
 * Kreira tabelu za tokene ako ne postoji.
 * Poziva se prilikom svakog slanja maila (lazy init), 
 * što je dobro rešenje kad nemaš migracije.
 */
export async function ensureAuthTables() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Tabela čuva token, email i vreme isteka (timestamp)
    await client.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at BIGINT NOT NULL
      );
    `);
  } finally {
    client.release();
  }
}

/**
 * Kreira tabelu za korisničke profile ako ne postoji.
 */
export async function ensureUserProfilesTable() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        email TEXT,
        business_name TEXT,
        phone TEXT,
        website TEXT,
        inquiry_email TEXT,
        currency TEXT DEFAULT 'USD',
        stripe_customer_id TEXT,
        whatsapp_number TEXT,
        telegram_username TEXT,
        order_destination TEXT DEFAULT 'email',
        lemon_customer_id TEXT,
        lemon_subscription_id TEXT,
        lemon_status TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add telegram_username column if it doesn't exist (for existing tables)
    await client.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS telegram_username TEXT;
    `);
  } finally {
    client.release();
  }
}

/**
 * Generiše novi token za dati email, čuva ga u bazi i vraća ga.
 * Token važi 15 minuta.
 */
export async function createAuthToken(email: string) {
  const pool = getPool();
  const token = crypto.randomUUID(); // Generiše siguran ID
  const expiresAt = Date.now() + 1000 * 60 * 15; // 15 minuta od sada

  const client = await pool.connect();
  try {
    // 1. Brišemo stare tokene za ovaj email da ne pravimo "đubre" u bazi
    await client.query('DELETE FROM auth_tokens WHERE email = $1', [email]);

    // 2. Upisujemo novi token
    await client.query(
      'INSERT INTO auth_tokens (token, email, expires_at) VALUES ($1, $2, $3)',
      [token, email.toLowerCase(), expiresAt]
    );
    return token;
  } finally {
    client.release();
  }
}

/**
 * Proverava da li token postoji i da li je validan.
 * Ako je validan, vraća email i BRIŠE token (One-time use).
 * Ako nije validan ili je istekao, vraća null.
 */
export async function verifyAndConsumeToken(token: string) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // 1. Pronađi token
    const res = await client.query(
      'SELECT email, expires_at FROM auth_tokens WHERE token = $1',
      [token]
    );

    if (res.rows.length === 0) {
      return null; // Token ne postoji
    }

    const { email, expires_at } = res.rows[0];

    // 2. ODMAH obriši token (da ne može da se iskoristi dva puta)
    await client.query('DELETE FROM auth_tokens WHERE token = $1', [token]);

    // 3. Proveri da li je istekao
    if (Date.now() > Number(expires_at)) {
      return null; // Token je istekao
    }

    // 4. Sve je ok, vraćamo email
    return email as string;
  } finally {
    client.release();
  }
}

// ============================================================================
// TEAMS SCHEMA (Phase 4 - Preparation for team collaboration)
// ============================================================================

/**
 * Team member roles with hierarchical permissions:
 * - owner: Full control, can delete team, transfer ownership
 * - admin: Can manage members, edit all pages, publish
 * - editor: Can edit pages, cannot manage members
 * - viewer: Read-only access to pages
 */
export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url?: string;
  created_at: number;
  updated_at: number;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: number;
}

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  invited_by: string;
  expires_at: number;
  created_at: number;
}

/**
 * Creates all team-related tables if they don't exist.
 * Call this during app initialization or first team creation.
 */
export async function ensureTeamsTables() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Teams table - Core team information
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        owner_id TEXT NOT NULL,
        logo_url TEXT,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `);

    // 2. Team members table - User-team relationships
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        joined_at BIGINT NOT NULL,
        PRIMARY KEY (team_id, user_id)
      );
    `);

    // 3. Team invites table - Pending invitations
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_invites (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'viewer',
        invited_by TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL
      );
    `);

    // 4. Add team_id to calculators table (optional foreign key)
    await client.query(`
      ALTER TABLE calculators 
      ADD COLUMN IF NOT EXISTS team_id TEXT REFERENCES teams(id) ON DELETE SET NULL;
    `);

    // 5. Create indexes for efficient queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
      CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);
      CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
      CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);
      CREATE INDEX IF NOT EXISTS idx_calculators_team ON calculators(team_id) WHERE team_id IS NOT NULL;
    `);

    console.log("✅ Teams tables ensured successfully");
  } catch (e) {
    console.error("❌ Failed to ensure teams tables:", e);
    throw e;
  } finally {
    client.release();
  }
}

// ============================================================================
// TEAMS HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has at least the required role in a team.
 * Role hierarchy: owner > admin > editor > viewer
 */
export function hasTeamPermission(userRole: TeamRole, requiredRole: TeamRole): boolean {
  const hierarchy: Record<TeamRole, number> = {
    owner: 4,
    admin: 3,
    editor: 2,
    viewer: 1,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Get all teams a user belongs to.
 */
export async function getUserTeams(userId: string): Promise<(Team & { role: TeamRole })[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT t.*, tm.role 
     FROM teams t
     JOIN team_members tm ON t.id = tm.team_id
     WHERE tm.user_id = $1
     ORDER BY t.name ASC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    owner_id: r.owner_id,
    logo_url: r.logo_url,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
    role: r.role as TeamRole,
  }));
}

/**
 * Get a team by ID.
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM teams WHERE id = $1`,
    [teamId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    owner_id: r.owner_id,
    logo_url: r.logo_url,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
  };
}

/**
 * Get a user's role in a specific team.
 * Returns null if user is not a member.
 */
export async function getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2`,
    [userId, teamId]
  );
  return rows[0]?.role as TeamRole | null;
}

/**
 * Get all members of a team.
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
    [teamId]
  );
  return rows.map((r) => ({
    team_id: r.team_id,
    user_id: r.user_id,
    role: r.role as TeamRole,
    joined_at: Number(r.joined_at),
  }));
}

/**
 * Get all members of a team with their profile details.
 * Note: user_id in team_members IS the email address
 */
export async function getTeamMembersWithDetails(teamId: string): Promise<(TeamMember & { email?: string; name?: string })[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT tm.*, up.business_name as name
     FROM team_members tm
     LEFT JOIN user_profiles up ON tm.user_id = up.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.joined_at ASC`,
    [teamId]
  );
  return rows.map((r) => ({
    team_id: r.team_id,
    user_id: r.user_id,
    role: r.role as TeamRole,
    joined_at: Number(r.joined_at),
    email: r.user_id, // user_id IS the email
    name: r.name || r.user_id.split('@')[0], // fallback to email prefix
  }));
}

/**
 * Create a new team with the creator as owner.
 */
export async function createTeam(
  name: string,
  slug: string,
  ownerId: string,
  logoUrl?: string
): Promise<Team> {
  const pool = getPool();
  const client = await pool.connect();
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await client.query("BEGIN");

    // Create team
    await client.query(
      `INSERT INTO teams (id, name, slug, owner_id, logo_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name, slug, ownerId, logoUrl || null, now, now]
    );

    // Add owner as member
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role, joined_at)
       VALUES ($1, $2, 'owner', $3)`,
      [id, ownerId, now]
    );

    await client.query("COMMIT");

    return { id, name, slug, owner_id: ownerId, logo_url: logoUrl, created_at: now, updated_at: now };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Add a member to a team.
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = "viewer"
): Promise<void> {
  const pool = getPool();
  const now = Date.now();
  await pool.query(
    `INSERT INTO team_members (team_id, user_id, role, joined_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3`,
    [teamId, userId, role, now]
  );
}

/**
 * Remove a member from a team.
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2`,
    [teamId, userId]
  );
}

/**
 * Update a member's role in a team.
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  newRole: TeamRole
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE team_members SET role = $1 WHERE team_id = $2 AND user_id = $3`,
    [newRole, teamId, userId]
  );
}

/**
 * Create a team invite.
 */
export async function createTeamInvite(
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string,
  expiresInDays = 7
): Promise<TeamInvite> {
  const pool = getPool();
  const id = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

  await pool.query(
    `INSERT INTO team_invites (id, team_id, email, role, invited_by, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, teamId, email.toLowerCase(), role, invitedBy, expiresAt, now]
  );

  return { id, team_id: teamId, email, role, invited_by: invitedBy, expires_at: expiresAt, created_at: now };
}

/**
 * Get pending invites for an email.
 */
export async function getInvitesForEmail(email: string): Promise<TeamInvite[]> {
  const pool = getPool();
  const now = Date.now();
  const { rows } = await pool.query(
    `SELECT * FROM team_invites WHERE email = $1 AND expires_at > $2`,
    [email.toLowerCase(), now]
  );
  return rows.map((r) => ({
    id: r.id,
    team_id: r.team_id,
    email: r.email,
    role: r.role as TeamRole,
    invited_by: r.invited_by,
    expires_at: Number(r.expires_at),
    created_at: Number(r.created_at),
  }));
}

/**
 * Get pending invites for an email with team details.
 */
export interface TeamInviteWithDetails extends TeamInvite {
  team_name: string;
  team_slug: string;
}

export async function getInvitesForEmailWithDetails(email: string): Promise<TeamInviteWithDetails[]> {
  const pool = getPool();
  const now = Date.now();
  const { rows } = await pool.query(
    `SELECT
      ti.id, ti.team_id, ti.email, ti.role, ti.invited_by, ti.expires_at, ti.created_at,
      t.name as team_name, t.slug as team_slug
    FROM team_invites ti
    JOIN teams t ON t.id = ti.team_id
    WHERE ti.email = $1 AND ti.expires_at > $2
    ORDER BY ti.created_at DESC`,
    [email.toLowerCase(), now]
  );
  return rows.map((r) => ({
    id: r.id,
    team_id: r.team_id,
    email: r.email,
    role: r.role as TeamRole,
    invited_by: r.invited_by,
    expires_at: Number(r.expires_at),
    created_at: Number(r.created_at),
    team_name: r.team_name,
    team_slug: r.team_slug,
  }));
}

/**
 * Get pending invites for a team.
 */
export async function getInvitesForTeam(teamId: string): Promise<TeamInvite[]> {
  const pool = getPool();
  const now = Date.now();
  const { rows } = await pool.query(
    `SELECT * FROM team_invites WHERE team_id = $1 AND expires_at > $2 ORDER BY created_at DESC`,
    [teamId, now]
  );
  return rows.map((r) => ({
    id: r.id,
    team_id: r.team_id,
    email: r.email,
    role: r.role as TeamRole,
    invited_by: r.invited_by,
    expires_at: Number(r.expires_at),
    created_at: Number(r.created_at),
  }));
}

/**
 * Accept a team invite.
 */
export async function acceptTeamInvite(inviteId: string, userId: string): Promise<boolean> {
  const pool = getPool();
  const client = await pool.connect();
  const now = Date.now();

  try {
    await client.query("BEGIN");

    // Get invite
    const { rows } = await client.query(
      `SELECT * FROM team_invites WHERE id = $1 AND expires_at > $2`,
      [inviteId, now]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    const invite = rows[0];

    // Add user to team
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role, joined_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3`,
      [invite.team_id, userId, invite.role, now]
    );

    // Delete invite
    await client.query(`DELETE FROM team_invites WHERE id = $1`, [inviteId]);

    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Assign a calculator to a team.
 */
export async function assignCalculatorToTeam(
  userId: string,
  slug: string,
  teamId: string | null
): Promise<void> {
  const pool = getPool();
  const now = Date.now();
  await pool.query(
    `UPDATE calculators SET team_id = $1, updated_at = $2 WHERE user_id = $3 AND slug = $4`,
    [teamId, now, userId, slug]
  );
}

/**
 * Get all calculators for a team.
 */
export async function getTeamCalculators(teamId: string): Promise<{ user_id: string; slug: string; name: string }[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT user_id, slug, name FROM calculators WHERE team_id = $1 ORDER BY name ASC`,
    [teamId]
  );
  return rows;
}

/**
 * Delete a team.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const pool = getPool();
  // Cascade delete handles members and invites.
  // Calculators with team_id will be set to NULL (based on ON DELETE SET NULL) or we should check?
  // In ensureTeamsTables: ON DELETE SET NULL is used for calculators.
  await pool.query(`DELETE FROM teams WHERE id = $1`, [teamId]);
}

/**
 * Update team name.
 */
export async function updateTeamName(teamId: string, name: string): Promise<void> {
  const pool = getPool();
  const now = Date.now();
  await pool.query(
    `UPDATE teams SET name = $1, updated_at = $2 WHERE id = $3`,
    [name, now, teamId]
  );
}

// ============================================================================
// TEAM COUNTING (for plan limits)
// ============================================================================

/**
 * Count how many teams a user OWNS (created).
 */
export async function countUserOwnedTeams(userId: string): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM teams WHERE owner_id = $1`,
    [userId]
  );
  return parseInt(rows[0]?.count || "0", 10);
}

/**
 * Count how many teams a user is a MEMBER of (including owned).
 */
export async function countUserTeamMemberships(userId: string): Promise<number> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM team_members WHERE user_id = $1`,
    [userId]
  );
  return parseInt(rows[0]?.count || "0", 10);
}

/**
 * Check if user can create a new team based on plan limits.
 */
export async function canUserCreateTeam(
  userId: string,
  planLimit: number | "unlimited"
): Promise<{ allowed: boolean; current: number; limit: number | "unlimited" }> {
  if (planLimit === "unlimited") {
    return { allowed: true, current: 0, limit: "unlimited" };
  }
  
  const current = await countUserOwnedTeams(userId);
  return {
    allowed: current < planLimit,
    current,
    limit: planLimit,
  };
}

/**
 * Check if user can join another team based on plan limits.
 */
export async function canUserJoinTeam(
  userId: string,
  planLimit: number | "unlimited"
): Promise<{ allowed: boolean; current: number; limit: number | "unlimited" }> {
  if (planLimit === "unlimited") {
    return { allowed: true, current: 0, limit: "unlimited" };
  }
  
  const current = await countUserTeamMemberships(userId);
  return {
    allowed: current < planLimit,
    current,
    limit: planLimit,
  };
}

/**
 * Permanently delete a user and all their data.
 */
export async function deleteUser(userId: string): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Delete user's calculators
    await client.query("DELETE FROM calculators WHERE user_id = $1", [userId]);

    // 2. Delete teams owned by user
    await client.query("DELETE FROM teams WHERE owner_id = $1", [userId]);

    // 3. Remove from team memberships
    await client.query("DELETE FROM team_members WHERE user_id = $1", [userId]);

    // 4. Remove pending invites (where user is the invitee)
    await client.query("DELETE FROM team_invites WHERE email = $1", [userId]);

    // 5. Delete profile and plan
    await client.query("DELETE FROM user_profiles WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM user_plans WHERE user_id = $1", [userId]);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}