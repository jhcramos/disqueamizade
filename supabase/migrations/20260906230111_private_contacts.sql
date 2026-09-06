CREATE TABLE public.room_contact_preferences (
  room_slug text NOT NULL REFERENCES public.rooms(slug) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepts_message boolean NOT NULL DEFAULT true,
  accepts_audio boolean NOT NULL DEFAULT false,
  accepts_video boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '4 hours'),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (room_slug, user_id),
  CHECK (length(room_slug) BETWEEN 1 AND 120)
);

CREATE TABLE public.private_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slug text NOT NULL REFERENCES public.rooms(slug) ON DELETE CASCADE,
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('message', 'audio', 'video')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'ended', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '30 seconds'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (from_user <> to_user)
);

CREATE INDEX room_contact_preferences_expiry ON public.room_contact_preferences(expires_at);
CREATE INDEX private_invites_recipient_active ON public.private_invites(to_user, status, expires_at DESC);
CREATE INDEX private_invites_sender_active ON public.private_invites(from_user, status, expires_at DESC);

ALTER TABLE public.room_contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.room_contact_preferences, public.private_invites FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.room_contact_preferences, public.private_invites TO service_role;
GRANT SELECT ON public.private_invites TO authenticated;

CREATE POLICY private_invites_participant_read ON public.private_invites
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = from_user OR (SELECT auth.uid()) = to_user);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'private_invites'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_invites;
  END IF;
END $$;
