-- This project has no deployed chat_messages table. Historical bootstrap schemas
-- differ: stop for an explicit data migration instead of altering legacy messages.
DO $$ BEGIN
  IF to_regclass('public.chat_messages') IS NOT NULL THEN
    RAISE EXCEPTION 'Existing chat_messages requires schema review before moderated_chat';
  END IF;
END $$;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slug text NOT NULL CHECK (length(room_slug) BETWEEN 1 AND 120),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL CHECK (length(username) BETWEEN 1 AND 50),
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'emoji')),
  participant_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (participant_ids IS NULL OR (cardinality(participant_ids) = 2 AND user_id = ANY(participant_ids)))
);
CREATE INDEX chat_messages_room_created ON public.chat_messages(room_slug, created_at DESC);
CREATE INDEX chat_messages_sender_created ON public.chat_messages(user_id, created_at DESC);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
GRANT SELECT ON public.rooms, public.user_bans TO service_role;

CREATE POLICY approved_chat_read ON public.chat_messages FOR SELECT TO authenticated
USING (
  (participant_ids IS NOT NULL AND (SELECT auth.uid()) = ANY(participant_ids))
  OR (participant_ids IS NULL AND EXISTS (
    SELECT 1 FROM public.rooms r WHERE r.slug = chat_messages.room_slug
      AND r.is_active IS TRUE AND r.type::text = 'publica' AND r.ficha_cost = 0
  ))
);

CREATE FUNCTION public.send_chat_message(p_sender uuid, p_room_slug text, p_text text, p_username text, p_type text)
RETURNS SETOF public.chat_messages
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_pair text[];
  v_members uuid[];
  v_now timestamptz;
  v_uuid constant text := '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
BEGIN
  IF p_sender IS NULL OR p_room_slug IS NULL OR length(p_room_slug) NOT BETWEEN 1 AND 120
    OR p_text IS NULL OR length(btrim(p_text)) NOT BETWEEN 1 AND 500
    OR p_username IS NULL OR length(btrim(p_username)) NOT BETWEEN 1 AND 50
    OR p_type IS NULL OR p_type NOT IN ('text', 'emoji') THEN
    RAISE EXCEPTION 'invalid_request';
  END IF;
  -- Lock before taking wall-clock time: simultaneous edge workers share one limit.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_sender::text, 61057));
  v_now := clock_timestamp();
  IF EXISTS (SELECT 1 FROM public.user_bans WHERE user_id = p_sender AND (expires_at IS NULL OR expires_at > v_now)) THEN
    RAISE EXCEPTION 'banned';
  END IF;
  IF p_room_slug ~ '^(roulette|dm)-' THEN
    v_pair := regexp_match(p_room_slug, '^(?:roulette|dm)-(' || v_uuid || ')-(' || v_uuid || ')$');
    IF v_pair IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
    v_members := ARRAY[v_pair[1]::uuid, v_pair[2]::uuid];
    IF v_pair[1] >= v_pair[2] OR NOT (p_sender = ANY(v_members)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.rooms WHERE slug = p_room_slug AND is_active IS TRUE
      AND type::text = 'publica' AND ficha_cost = 0) THEN RAISE EXCEPTION 'forbidden'; END IF;
  END IF;
  IF (SELECT count(*) FROM public.chat_messages WHERE user_id = p_sender AND created_at > v_now - interval '3 seconds') >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
  RETURN QUERY INSERT INTO public.chat_messages(room_slug, user_id, username, content, type, participant_ids, created_at)
    VALUES (p_room_slug, p_sender, btrim(p_username), btrim(p_text), p_type, v_members, v_now) RETURNING *;
END;
$$;
REVOKE ALL ON FUNCTION public.send_chat_message(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_chat_message(uuid, text, text, text, text) TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;
