-- Database Schema Initialization for Tierless
-- This migration should be run once during deployment (build-time or pre-deploy hook)

-- ============================================================================
-- CALCULATORS TABLE (Metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calculators (
  user_id     TEXT NOT NULL,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  template    TEXT,
  config      JSONB,
  published   BOOLEAN DEFAULT FALSE,
  favorite    BOOLEAN DEFAULT FALSE,
  "order"     INTEGER DEFAULT 0,
  views7d     INTEGER DEFAULT 0,
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL,
  avg_rating  DECIMAL(3,2) DEFAULT 0,
  ratings_count INTEGER DEFAULT 0,
  is_example  BOOLEAN DEFAULT FALSE,
  team_id     TEXT,
  PRIMARY KEY (user_id, slug)
);

-- Indexes for calculators
CREATE INDEX IF NOT EXISTS idx_calculators_user ON calculators(user_id);
CREATE INDEX IF NOT EXISTS idx_calculators_user_published ON calculators(user_id, published);
CREATE INDEX IF NOT EXISTS idx_calculators_rating ON calculators(avg_rating DESC, ratings_count DESC);
CREATE INDEX IF NOT EXISTS idx_calculators_user_example ON calculators(user_id, is_example);
CREATE INDEX IF NOT EXISTS idx_calculators_example_published ON calculators(is_example, published) WHERE is_example = TRUE;
CREATE INDEX IF NOT EXISTS idx_calculators_team ON calculators(team_id) WHERE team_id IS NOT NULL;

-- ============================================================================
-- CALC_FULL TABLE (Full Calculator JSON)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calc_full (
  user_id    TEXT   NOT NULL,
  slug       TEXT   NOT NULL,
  calc       JSONB  NOT NULL,
  updated_at BIGINT NOT NULL,
  version    INTEGER NOT NULL DEFAULT 1,
  team_id    TEXT,
  PRIMARY KEY (user_id, slug)
);

-- Indexes for calc_full
CREATE INDEX IF NOT EXISTS idx_calc_full_slug ON calc_full(slug);
CREATE INDEX IF NOT EXISTS idx_calc_full_meta_id ON calc_full((calc->'meta'->>'id'));
CREATE INDEX IF NOT EXISTS idx_calc_full_team ON calc_full(team_id) WHERE team_id IS NOT NULL;

-- ============================================================================
-- TRASH TABLE (Soft Deletes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trash_items (
  user_id       TEXT NOT NULL,
  slug          TEXT NOT NULL,
  original_slug TEXT,
  name          TEXT NOT NULL,
  template      TEXT,
  config        JSONB,
  deleted_at    BIGINT NOT NULL,
  PRIMARY KEY (user_id, slug)
);

-- Indexes for trash
CREATE INDEX IF NOT EXISTS idx_trash_user ON trash_items(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_user_deleted ON trash_items(user_id, deleted_at DESC);

-- ============================================================================
-- ANALYTICS TABLE (Events Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_id TEXT NOT NULL,
  ts BIGINT NOT NULL,
  session_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  props JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_page_ts ON analytics_events(page_id, ts);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);

-- ============================================================================
-- USER PLANS TABLE (Subscription Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_plans (
  user_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL,
  renews_on TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false
);

-- ============================================================================
-- AUTH TOKENS TABLE (Magic Link Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at BIGINT NOT NULL
);

-- ============================================================================
-- USER PROFILES TABLE (User Settings & Preferences)
-- ============================================================================
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

-- ============================================================================
-- TEAMS TABLE (Future Support - schema only)
-- ============================================================================
-- Note: This table is prepared for future Teams functionality
-- Foreign key constraints from calculators and calc_full will be added
-- when Teams feature is implemented

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Add foreign key constraints (conditional - only if teams table exists)
-- These will fail gracefully if teams table doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'calculators_team_id_fkey'
  ) THEN
    ALTER TABLE calculators 
    ADD CONSTRAINT calculators_team_id_fkey 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema initialization completed successfully';
END $$;
