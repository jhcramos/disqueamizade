-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  name text,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  active boolean DEFAULT true,
  source text DEFAULT 'website'
);

-- RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (subscribe)
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Only service role can read/update
CREATE POLICY "Service role full access" ON newsletter_subscribers
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-subscribe authenticated users
CREATE OR REPLACE FUNCTION auto_subscribe_newsletter()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO newsletter_subscribers (email, name, source)
  VALUES (NEW.email, NEW.raw_user_meta_data->>'username', 'signup')
  ON CONFLICT (email) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_newsletter ON auth.users;
CREATE TRIGGER on_auth_user_created_newsletter
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_subscribe_newsletter();

-- Index
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(active) WHERE active = true;
