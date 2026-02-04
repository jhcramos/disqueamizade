-- ============================================================================
-- Migration 003: V2 Fields & Missing Tables
-- Adds fichas system, creator fields, room V2 fields, roulette sessions,
-- ficha transactions, live gifts
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES V2 FIELDS
-- ═══════════════════════════════════════════════════════════════════════════

-- Rename stars to fichas (keep backward compat)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fichas_balance INTEGER DEFAULT 0 CHECK (fichas_balance >= 0),
  ADD COLUMN IF NOT EXISTS is_ostentacao BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_spent_fichas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings_fichas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rooms_visited INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS games_played INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_online_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hobbies TEXT[] DEFAULT '{}';

-- Backfill fichas_balance from stars_balance
UPDATE profiles SET fichas_balance = stars_balance WHERE fichas_balance = 0 AND stars_balance > 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ROOMS V2 FIELDS
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS room_type VARCHAR(50) DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS entry_cost_fichas INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS participants INTEGER DEFAULT 0;

-- Add constraint
ALTER TABLE rooms ADD CONSTRAINT rooms_entry_cost_check CHECK (entry_cost_fichas >= 0);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ROULETTE SESSIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS roulette_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'idle' NOT NULL,
  filters JSONB DEFAULT '{}',
  current_match_id UUID,
  matches_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roulette_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES roulette_sessions(id) ON DELETE CASCADE NOT NULL,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  added_friend BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_roulette_sessions_user ON roulette_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roulette_sessions_status ON roulette_sessions(status) WHERE status != 'ended';
CREATE INDEX IF NOT EXISTS idx_roulette_matches_session ON roulette_matches(session_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FICHA TRANSACTIONS TABLE (V2 of star_transactions)
-- ═══════════════════════════════════════════════════════════════════════════

-- Add new transaction types
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'gift';
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'purchase';
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'service';
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'vip_entry';
  ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'game';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create fichas-specific transaction view
CREATE OR REPLACE VIEW ficha_transactions AS
SELECT
  id,
  from_user_id,
  to_user_id,
  amount_stars AS amount,
  transaction_type,
  platform_fee_stars AS platform_fee,
  status,
  created_at
FROM star_transactions;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. LIVE GIFTS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS live_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  fichas_cost INTEGER NOT NULL CHECK (fichas_cost > 0),
  animation VARCHAR(50) NOT NULL DEFAULT 'float',
  rarity VARCHAR(20) NOT NULL DEFAULT 'common',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sent_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id UUID REFERENCES live_gifts(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  fichas_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_gifts_room ON sent_gifts(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_receiver ON sent_gifts(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_gifts_sender ON sent_gifts(sender_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. POPULATE DEFAULT LIVE GIFTS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO live_gifts (name, emoji, fichas_cost, animation, rarity) VALUES
  ('Coração', '❤️', 5, 'float', 'common'),
  ('Rosa', '🌹', 10, 'float', 'common'),
  ('Estrela', '⭐', 15, 'sparkle', 'common'),
  ('Diamante', '💎', 50, 'sparkle', 'rare'),
  ('Coroa', '👑', 100, 'crown', 'rare'),
  ('Fogos', '🎆', 200, 'fireworks', 'epic'),
  ('Unicórnio', '🦄', 500, 'parade', 'epic'),
  ('Dragão', '🐉', 1000, 'launch', 'legendary'),
  ('Chuva de Ouro', '🌧️', 2000, 'rain', 'legendary'),
  ('Planeta', '🌍', 5000, 'shower', 'legendary')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. FRIENDS / CONNECTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- pending, accepted, blocked
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_user1 ON user_connections(user1_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON user_connections(user2_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RLS POLICIES FOR NEW TABLES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE roulette_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roulette_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Roulette: users can manage own sessions
CREATE POLICY "Users manage own roulette sessions" ON roulette_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Roulette matches: users can see their own matches
CREATE POLICY "Users see own matches" ON roulette_matches
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Live gifts: anyone can read
CREATE POLICY "Anyone can read live gifts" ON live_gifts
  FOR SELECT USING (true);

-- Sent gifts: anyone can read, authenticated can send
CREATE POLICY "Anyone can read sent gifts" ON sent_gifts
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send gifts" ON sent_gifts
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Connections: users manage own connections
CREATE POLICY "Users manage own connections" ON user_connections
  FOR ALL USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- ✅ Profiles V2: fichas_balance, is_ostentacao, is_creator, badges, hobbies
-- ✅ Rooms V2: room_type, entry_cost_fichas, category, is_fixed, tags, thumbnail
-- ✅ Roulette sessions & matches tables
-- ✅ Ficha transactions view (alias over star_transactions)
-- ✅ Live gifts catalog + sent_gifts tracking
-- ✅ User connections (friends) table
-- ✅ RLS policies on all new tables
