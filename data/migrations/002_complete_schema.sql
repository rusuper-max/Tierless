-- ============================================================================
-- Migration 002: Complete Schema
-- Adds missing tables and ensures all indexes exist
-- ============================================================================

-- ============================================================================
-- RATINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  ip_hash TEXT,
  user_id TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  UNIQUE(page_id, voter_key)
);

CREATE INDEX IF NOT EXISTS idx_ratings_page ON ratings(page_id);
CREATE INDEX IF NOT EXISTS idx_ratings_voter ON ratings(voter_key);

-- ============================================================================
-- RATING EVENTS TABLE (Audit Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rating_events (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  score INT NOT NULL,
  ip_hash TEXT,
  user_id TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rating_events_page ON rating_events(page_id);

-- ============================================================================
-- TEAM MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  joined_at BIGINT NOT NULL,
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- Add foreign key to teams (if teams table exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_members_team_id_fkey'
  ) THEN
    ALTER TABLE team_members 
    ADD CONSTRAINT team_members_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- TEAM INVITES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_invites (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);

-- Add foreign key to teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invites_team_id_fkey'
  ) THEN
    ALTER TABLE team_invites 
    ADD CONSTRAINT team_invites_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- UPDATE TEAMS TABLE (Add missing columns if needed)
-- ============================================================================
ALTER TABLE teams ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add unique constraint on slug if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'teams_slug_key'
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_slug_key UNIQUE (slug);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON teams(slug);

-- ============================================================================
-- ADD FOREIGN KEYS TO CALC_FULL (if not exists)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'calc_full_team_id_fkey'
  ) THEN
    ALTER TABLE calc_full 
    ADD CONSTRAINT calc_full_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 002: Complete Schema applied successfully';
END $$;


