-- Optional social identity. Anonymous visitors cannot write or enumerate profiles.
CREATE SCHEMA IF NOT EXISTS garage_private;
REVOKE ALL ON SCHEMA garage_private FROM PUBLIC;
GRANT USAGE ON SCHEMA garage_private TO authenticated;
CREATE TABLE public.garage_profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 handle text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,24}$'),
 display_name text NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 24),
 bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 160),
 interests text[] NOT NULL DEFAULT '{}' CHECK (cardinality(interests) <= 5 AND length(array_to_string(interests, ',')) <= 150),
 accepts_requests boolean NOT NULL DEFAULT true
);
CREATE TABLE public.garage_avatars (
 user_id uuid PRIMARY KEY REFERENCES public.garage_profiles(id) ON DELETE CASCADE,
 avatar integer NOT NULL CHECK (avatar BETWEEN 0 AND 9),
 appearance jsonb NOT NULL CHECK (jsonb_typeof(appearance) = 'object' AND octet_length(appearance::text) <= 4096)
);
CREATE TABLE public.garage_blocks (
 owner uuid NOT NULL REFERENCES public.garage_profiles(id) ON DELETE CASCADE,
 target uuid NOT NULL REFERENCES public.garage_profiles(id) ON DELETE CASCADE,
 PRIMARY KEY (owner,target), CHECK (owner <> target)
);
CREATE TABLE public.garage_friendships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 requester uuid NOT NULL REFERENCES public.garage_profiles(id) ON DELETE CASCADE,
 recipient uuid NOT NULL REFERENCES public.garage_profiles(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
 created_at timestamptz NOT NULL DEFAULT now(), CHECK (requester <> recipient)
);
CREATE UNIQUE INDEX garage_friend_pair ON public.garage_friendships(least(requester,recipient), greatest(requester,recipient));
CREATE INDEX garage_friend_recipient ON public.garage_friendships(recipient);
CREATE INDEX garage_block_target ON public.garage_blocks(target);
CREATE FUNCTION garage_private.blocked(peer uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NULL OR EXISTS (SELECT 1 FROM public.garage_blocks b WHERE (b.owner = auth.uid() AND b.target = peer) OR (b.target = auth.uid() AND b.owner = peer));
$$;
REVOKE ALL ON FUNCTION garage_private.blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION garage_private.blocked(uuid) TO authenticated;
ALTER TABLE public.garage_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_friendships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.garage_profiles, public.garage_avatars, public.garage_blocks, public.garage_friendships FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.garage_profiles, public.garage_avatars TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.garage_blocks TO authenticated;
GRANT SELECT, DELETE ON public.garage_friendships TO authenticated;
GRANT INSERT(requester, recipient) ON public.garage_friendships TO authenticated;
GRANT UPDATE(status) ON public.garage_friendships TO authenticated;
GRANT ALL ON public.garage_profiles, public.garage_avatars, public.garage_blocks, public.garage_friendships TO service_role;
CREATE POLICY registered_profiles ON public.garage_profiles AS RESTRICTIVE TO authenticated USING ((SELECT auth.jwt()->>'is_anonymous') = 'false') WITH CHECK ((SELECT auth.jwt()->>'is_anonymous') = 'false');
CREATE POLICY profile_read ON public.garage_profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()) OR NOT garage_private.blocked(id));
CREATE POLICY profile_insert ON public.garage_profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profile_update ON public.garage_profiles FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY registered_avatars ON public.garage_avatars AS RESTRICTIVE TO authenticated USING ((SELECT auth.jwt()->>'is_anonymous') = 'false') WITH CHECK ((SELECT auth.jwt()->>'is_anonymous') = 'false');
CREATE POLICY avatar_owner ON public.garage_avatars TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY registered_blocks ON public.garage_blocks AS RESTRICTIVE TO authenticated USING ((SELECT auth.jwt()->>'is_anonymous') = 'false') WITH CHECK ((SELECT auth.jwt()->>'is_anonymous') = 'false');
CREATE POLICY block_owner ON public.garage_blocks TO authenticated USING (owner = (SELECT auth.uid())) WITH CHECK (owner = (SELECT auth.uid()));
CREATE POLICY registered_friends ON public.garage_friendships AS RESTRICTIVE TO authenticated USING ((SELECT auth.jwt()->>'is_anonymous') = 'false') WITH CHECK ((SELECT auth.jwt()->>'is_anonymous') = 'false');
CREATE POLICY friend_read ON public.garage_friendships FOR SELECT TO authenticated USING ((requester = (SELECT auth.uid()) OR recipient = (SELECT auth.uid())) AND NOT garage_private.blocked(CASE WHEN requester = auth.uid() THEN recipient ELSE requester END));
CREATE POLICY friend_request ON public.garage_friendships FOR INSERT TO authenticated WITH CHECK (requester = (SELECT auth.uid()) AND status = 'pending' AND NOT garage_private.blocked(recipient) AND EXISTS (SELECT 1 FROM public.garage_profiles p WHERE p.id = recipient AND p.accepts_requests));
CREATE POLICY friend_accept ON public.garage_friendships FOR UPDATE TO authenticated USING (recipient = (SELECT auth.uid()) AND status = 'pending' AND NOT garage_private.blocked(requester)) WITH CHECK (recipient = (SELECT auth.uid()) AND status = 'accepted' AND NOT garage_private.blocked(requester));
CREATE POLICY friend_remove ON public.garage_friendships FOR DELETE TO authenticated USING (requester = (SELECT auth.uid()) OR recipient = (SELECT auth.uid()));
-- Blocking also removes the relationship, so unblocking never restores friendship.
CREATE FUNCTION garage_private.remove_blocked_friendship() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS DISTINCT FROM NEW.owner THEN RAISE EXCEPTION 'Not authorized'; END IF;
 DELETE FROM public.garage_friendships WHERE (requester = NEW.owner AND recipient = NEW.target) OR (requester = NEW.target AND recipient = NEW.owner);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION garage_private.remove_blocked_friendship() FROM PUBLIC;
CREATE TRIGGER garage_block_cleanup AFTER INSERT ON public.garage_blocks FOR EACH ROW EXECUTE FUNCTION garage_private.remove_blocked_friendship();
-- Bound outstanding requests even if a client bypasses the UI.
CREATE FUNCTION garage_private.limit_friend_requests() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS DISTINCT FROM NEW.requester THEN RAISE EXCEPTION 'Not authorized'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.requester::text, 0));
 IF (SELECT count(*) FROM public.garage_friendships WHERE requester = NEW.requester AND status = 'pending') >= 20 THEN
  RAISE EXCEPTION 'Too many pending requests' USING ERRCODE = '23514';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION garage_private.limit_friend_requests() FROM PUBLIC;
CREATE TRIGGER garage_request_limit BEFORE INSERT ON public.garage_friendships FOR EACH ROW EXECUTE FUNCTION garage_private.limit_friend_requests();
