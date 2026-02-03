-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');
CREATE TYPE room_role AS ENUM ('participant', 'moderator', 'owner');
CREATE TYPE message_type AS ENUM ('text', 'image', 'emoji', 'system');
CREATE TYPE session_status AS ENUM ('requested', 'accepted', 'rejected', 'in_progress', 'completed', 'canceled');
CREATE TYPE transaction_type AS ENUM ('service_payment', 'withdrawal', 'bonus', 'refund');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'refunded');
CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  age INTEGER CHECK (age >= 18 AND age <= 120),
  city VARCHAR(100),
  languages TEXT[] DEFAULT '{}',

  -- Subscription
  subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
  subscription_expires_at TIMESTAMPTZ,

  -- Status
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,

  -- Virtual currency
  stars_balance INTEGER DEFAULT 0 CHECK (stars_balance >= 0),

  -- Service provider fields
  is_service_provider BOOLEAN DEFAULT false,
  total_earnings_stars INTEGER DEFAULT 0,
  rating_average DECIMAL(3, 2) CHECK (rating_average >= 0 AND rating_average <= 5),
  total_services_completed INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROOMS TABLE
-- ============================================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  theme VARCHAR(50),
  sub_theme VARCHAR(50),
  max_users INTEGER DEFAULT 30 CHECK (max_users > 0 AND max_users <= 30),
  is_private BOOLEAN DEFAULT false,
  password_hash TEXT,
  requires_subscription subscription_tier,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROOM PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role room_role DEFAULT 'participant' NOT NULL,
  is_broadcasting BOOLEAN DEFAULT false,
  video_enabled BOOLEAN DEFAULT false,
  audio_enabled BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- ============================================================================
-- CHAT MESSAGES TABLE
-- ============================================================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'text' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE (Stripe integration)
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  tier subscription_tier NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FEATURED PROFILES TABLE
-- ============================================================================
CREATE TABLE featured_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  featured_from TIMESTAMPTZ DEFAULT NOW(),
  featured_until TIMESTAMPTZ NOT NULL,
  payment_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BROADCAST SESSIONS TABLE
-- ============================================================================
CREATE TABLE broadcast_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcaster_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  livekit_channel_name VARCHAR(255),
  max_viewers_reached INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- BROADCAST VIEWERS TABLE
-- ============================================================================
CREATE TABLE broadcast_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID REFERENCES broadcast_sessions(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(broadcast_id, viewer_id)
);

-- ============================================================================
-- USER SERVICES TABLE (Marketplace)
-- ============================================================================
CREATE TABLE user_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(50) NOT NULL,
  description TEXT CHECK (LENGTH(description) <= 200),
  price_stars INTEGER NOT NULL CHECK (price_stars >= 10 AND price_stars <= 1000),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  position INTEGER CHECK (position >= 1 AND position <= 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, position)
);

-- ============================================================================
-- STAR PURCHASES TABLE
-- ============================================================================
CREATE TABLE star_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  package_size INTEGER NOT NULL,
  stars_amount INTEGER NOT NULL,
  paid_amount_brl DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STAR TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE star_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount_stars INTEGER NOT NULL CHECK (amount_stars > 0),
  transaction_type transaction_type NOT NULL,
  related_service_id UUID REFERENCES user_services(id),
  related_session_id UUID,
  platform_fee_stars INTEGER DEFAULT 0,
  status transaction_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAID SESSIONS TABLE
-- ============================================================================
CREATE TABLE paid_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES user_services(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  price_stars INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status session_status DEFAULT 'requested' NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- SERVICE REVIEWS TABLE
-- ============================================================================
CREATE TABLE service_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES paid_sessions(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewed_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, reviewer_id)
);

-- ============================================================================
-- STAR WITHDRAWALS TABLE
-- ============================================================================
CREATE TABLE star_withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stars_amount INTEGER NOT NULL CHECK (stars_amount >= 100),
  brl_amount DECIMAL(10, 2) NOT NULL,
  fee_brl DECIMAL(10, 2) NOT NULL,
  net_amount_brl DECIMAL(10, 2) NOT NULL,
  pix_key VARCHAR(255) NOT NULL,
  status withdrawal_status DEFAULT 'pending' NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- GAMIFICATION SESSIONS TABLE
-- ============================================================================
CREATE TABLE gamification_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  participants JSONB NOT NULL,
  game_state JSONB,
  status VARCHAR(20) DEFAULT 'waiting',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- ============================================================================
-- SECRET CABINS TABLE
-- ============================================================================
CREATE TABLE secret_cabins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cabin_number INTEGER UNIQUE NOT NULL,
  max_occupants INTEGER DEFAULT 4,
  is_occupied BOOLEAN DEFAULT false,
  current_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- REPORTS TABLE (Moderation)
-- ============================================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX idx_profiles_is_online ON profiles(is_online);
CREATE INDEX idx_profiles_is_service_provider ON profiles(is_service_provider);
CREATE INDEX idx_profiles_rating_average ON profiles(rating_average DESC) WHERE is_service_provider = true;

-- Rooms
CREATE INDEX idx_rooms_theme_subtheme ON rooms(theme, sub_theme);
CREATE INDEX idx_rooms_is_active ON rooms(is_active);
CREATE INDEX idx_rooms_owner_id ON rooms(owner_id);

-- Room Participants
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);

-- Chat Messages
CREATE INDEX idx_chat_messages_room_created ON chat_messages(room_id, created_at DESC);

-- Broadcast Sessions
CREATE INDEX idx_broadcast_sessions_status ON broadcast_sessions(is_active, started_at DESC);

-- User Services
CREATE INDEX idx_user_services_provider ON user_services(provider_id);
CREATE INDEX idx_user_services_category ON user_services(category) WHERE is_active = true;
CREATE INDEX idx_user_services_price ON user_services(price_stars) WHERE is_active = true;

-- Paid Sessions
CREATE INDEX idx_paid_sessions_buyer ON paid_sessions(buyer_id, created_at DESC);
CREATE INDEX idx_paid_sessions_provider ON paid_sessions(provider_id, created_at DESC);
CREATE INDEX idx_paid_sessions_status ON paid_sessions(status);
CREATE INDEX idx_paid_sessions_started ON paid_sessions(started_at DESC) WHERE status = 'in_progress';

-- Star Transactions
CREATE INDEX idx_star_transactions_from_user ON star_transactions(from_user_id, created_at DESC);
CREATE INDEX idx_star_transactions_to_user ON star_transactions(to_user_id, created_at DESC);
CREATE INDEX idx_star_transactions_status ON star_transactions(status);

-- Service Reviews
CREATE INDEX idx_service_reviews_reviewed_user ON service_reviews(reviewed_user_id, created_at DESC);
CREATE INDEX idx_service_reviews_rating ON service_reviews(rating);

-- Notifications
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_services_updated_at BEFORE UPDATE ON user_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to increment viewer count for a broadcast
CREATE OR REPLACE FUNCTION increment_viewer_count(
  broadcaster_id UUID,
  viewer_id UUID
)
RETURNS VOID AS $$
DECLARE
  active_broadcast_id UUID;
BEGIN
  -- Get active broadcast session
  SELECT id INTO active_broadcast_id
  FROM broadcast_sessions
  WHERE broadcaster_id = increment_viewer_count.broadcaster_id
    AND is_active = true
  LIMIT 1;

  IF active_broadcast_id IS NOT NULL THEN
    -- Insert viewer record (or update if exists)
    INSERT INTO broadcast_viewers (broadcast_id, viewer_id)
    VALUES (active_broadcast_id, increment_viewer_count.viewer_id)
    ON CONFLICT (broadcast_id, viewer_id) DO NOTHING;

    -- Update max viewers reached
    UPDATE broadcast_sessions
    SET max_viewers_reached = GREATEST(
      max_viewers_reached,
      (SELECT COUNT(*) FROM broadcast_viewers WHERE broadcast_id = active_broadcast_id AND left_at IS NULL)
    )
    WHERE id = active_broadcast_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update user rating average
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM service_reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id
    ),
    total_services_completed = (
      SELECT COUNT(*)
      FROM service_reviews
      WHERE reviewed_user_id = NEW.reviewed_user_id
    )
  WHERE id = NEW.reviewed_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review AFTER INSERT ON service_reviews
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert some secret cabins
INSERT INTO secret_cabins (cabin_number, max_occupants) VALUES
  (1, 2),
  (2, 2),
  (3, 4),
  (4, 4),
  (5, 4);
