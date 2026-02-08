-- Admin settings (key-value config store)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed cold-start settings
INSERT INTO public.admin_settings (key, value) VALUES
  ('cold_start', '{"bots_presence": true, "inflated_counters": true, "auto_chat": true, "lobby_mode": true}'),
  ('moderation', '{"profanity_filter": true, "auto_ban_threshold": 5, "banned_words": ["puta", "merda", "caralho"]}'),
  ('general', '{"maintenance_mode": false, "registration_open": true, "max_rooms": 100}')
ON CONFLICT (key) DO NOTHING;

-- Reports / user complaints
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES public.profiles(id),
  reported_user_id UUID REFERENCES public.profiles(id),
  room_id UUID REFERENCES public.rooms(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- User bans
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  banned_by UUID REFERENCES public.profiles(id),
  reason TEXT,
  ban_type TEXT DEFAULT 'temporary', -- temporary, permanent
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin role flag on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- RLS for admin tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write admin_settings
CREATE POLICY "Admin settings readable by admins" ON public.admin_settings 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
CREATE POLICY "Admin settings writable by admins" ON public.admin_settings 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Reports: anyone can create, admins can read/update
CREATE POLICY "Anyone can report" ON public.reports 
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage reports" ON public.reports 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bans: admins only
CREATE POLICY "Admins manage bans" ON public.user_bans 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Service role can read admin_settings (for frontend cold-start check)
CREATE POLICY "Service role reads settings" ON public.admin_settings
  FOR SELECT USING (true);
