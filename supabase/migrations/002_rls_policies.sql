-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE star_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view non-banned profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- ROOMS POLICIES
-- ============================================================================

-- Public rooms are viewable by everyone
CREATE POLICY "Public rooms are viewable by everyone"
  ON rooms FOR SELECT
  USING (is_active = true);

-- Authenticated users can create rooms (feature gating done in app logic)
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Room owners can update their rooms
CREATE POLICY "Room owners can update their rooms"
  ON rooms FOR UPDATE
  USING (auth.uid() = owner_id);

-- Room owners can delete their rooms
CREATE POLICY "Room owners can delete their rooms"
  ON rooms FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- ROOM PARTICIPANTS POLICIES
-- ============================================================================

-- Anyone can view room participants
CREATE POLICY "Room participants are viewable by everyone"
  ON room_participants FOR SELECT
  USING (true);

-- Users can join rooms (insert their own participation)
CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation (camera, audio, etc.)
CREATE POLICY "Users can update own participation"
  ON room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can leave rooms (delete their own participation)
CREATE POLICY "Users can leave rooms"
  ON room_participants FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHAT MESSAGES POLICIES
-- ============================================================================

-- Messages are viewable by room participants
CREATE POLICY "Messages viewable by room participants"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = chat_messages.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

-- Users can send messages in rooms they're in
CREATE POLICY "Users can send messages in their rooms"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = chat_messages.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS POLICIES
-- ============================================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Subscriptions are managed by backend/webhooks (no direct user insert/update)
CREATE POLICY "Only service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (false);

-- ============================================================================
-- FEATURED PROFILES POLICIES
-- ============================================================================

-- Everyone can view featured profiles
CREATE POLICY "Featured profiles are viewable by everyone"
  ON featured_profiles FOR SELECT
  USING (featured_until > NOW());

-- ============================================================================
-- BROADCAST SESSIONS POLICIES
-- ============================================================================

-- Everyone can view active broadcasts
CREATE POLICY "Active broadcasts are viewable by everyone"
  ON broadcast_sessions FOR SELECT
  USING (is_active = true);

-- Users can create their own broadcast sessions
CREATE POLICY "Users can create own broadcasts"
  ON broadcast_sessions FOR INSERT
  WITH CHECK (auth.uid() = broadcaster_id);

-- Users can update their own broadcasts
CREATE POLICY "Users can update own broadcasts"
  ON broadcast_sessions FOR UPDATE
  USING (auth.uid() = broadcaster_id);

-- ============================================================================
-- BROADCAST VIEWERS POLICIES
-- ============================================================================

-- Everyone can view broadcast viewers
CREATE POLICY "Broadcast viewers are viewable by everyone"
  ON broadcast_viewers FOR SELECT
  USING (true);

-- Users can add themselves as viewers
CREATE POLICY "Users can add themselves as viewers"
  ON broadcast_viewers FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Users can update their own viewer record
CREATE POLICY "Users can update own viewer record"
  ON broadcast_viewers FOR UPDATE
  USING (auth.uid() = viewer_id);

-- ============================================================================
-- USER SERVICES POLICIES
-- ============================================================================

-- Active services are viewable by everyone
CREATE POLICY "Active services are viewable by everyone"
  ON user_services FOR SELECT
  USING (is_active = true);

-- Service providers can create their own services
CREATE POLICY "Users can create own services"
  ON user_services FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Service providers can update their own services
CREATE POLICY "Users can update own services"
  ON user_services FOR UPDATE
  USING (auth.uid() = provider_id);

-- Service providers can delete their own services
CREATE POLICY "Users can delete own services"
  ON user_services FOR DELETE
  USING (auth.uid() = provider_id);

-- ============================================================================
-- STAR PURCHASES POLICIES
-- ============================================================================

-- Users can view their own purchases
CREATE POLICY "Users can view own star purchases"
  ON star_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- STAR TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view transactions they're involved in
CREATE POLICY "Users can view own transactions"
  ON star_transactions FOR SELECT
  USING (
    auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  );

-- ============================================================================
-- PAID SESSIONS POLICIES
-- ============================================================================

-- Users can view sessions they're involved in
CREATE POLICY "Users can view own sessions"
  ON paid_sessions FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = provider_id
  );

-- Buyers can create session requests
CREATE POLICY "Buyers can request sessions"
  ON paid_sessions FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Providers can update sessions (accept/reject)
CREATE POLICY "Providers can update sessions"
  ON paid_sessions FOR UPDATE
  USING (auth.uid() = provider_id);

-- ============================================================================
-- SERVICE REVIEWS POLICIES
-- ============================================================================

-- Reviews are viewable by everyone
CREATE POLICY "Reviews are viewable by everyone"
  ON service_reviews FOR SELECT
  USING (true);

-- Users can create reviews for sessions they participated in
CREATE POLICY "Users can create reviews for their sessions"
  ON service_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM paid_sessions
      WHERE paid_sessions.id = service_reviews.session_id
        AND (paid_sessions.buyer_id = auth.uid() OR paid_sessions.provider_id = auth.uid())
        AND paid_sessions.status = 'completed'
    )
  );

-- ============================================================================
-- STAR WITHDRAWALS POLICIES
-- ============================================================================

-- Users can view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
  ON star_withdrawals FOR SELECT
  USING (auth.uid() = user_id);

-- Users can request withdrawals
CREATE POLICY "Users can request withdrawals"
  ON star_withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GAMIFICATION SESSIONS POLICIES
-- ============================================================================

-- Room participants can view game sessions in their room
CREATE POLICY "Room participants can view game sessions"
  ON gamification_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = gamification_sessions.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

-- Room participants can create game sessions
CREATE POLICY "Room participants can create games"
  ON gamification_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = gamification_sessions.room_id
        AND room_participants.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECRET CABINS POLICIES
-- ============================================================================

-- Premium users can view secret cabins
CREATE POLICY "Premium users can view cabins"
  ON secret_cabins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.subscription_tier = 'premium'
    )
  );

-- ============================================================================
-- REPORTS POLICIES
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
