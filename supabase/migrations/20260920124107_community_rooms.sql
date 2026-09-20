-- Independent from legacy rooms and the experimental House. All access goes
-- through community-rooms, which verifies the JWT before supplying p_actor.
-- Auth is not exposed through PostgREST. Only these non-secret columns are needed
-- for the service-only RPC's account validation; do not grant whole-table access.
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT(id,is_anonymous,email_confirmed_at) ON auth.users TO service_role;
GRANT SELECT ON public.user_bans TO service_role;
CREATE TABLE public.community_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 slug text NOT NULL UNIQUE DEFAULT ('comunidade-' || gen_random_uuid()::text),
 name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
 description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 300),
 rules text NOT NULL DEFAULT '' CHECK (char_length(rules) <= 1000),
 theme text NOT NULL CHECK (theme IN ('amizade','musica','games','idiomas','paquera','adulto','outros')),
 access text NOT NULL CHECK (access IN ('public','invite')),
 invite_token uuid NOT NULL DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.community_members (
 room_id uuid NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 24),
 role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','moderator','owner')),
 banned boolean NOT NULL DEFAULT false,
 last_seen timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(room_id,user_id)
);
CREATE TABLE public.community_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX community_messages_history ON public.community_messages(room_id,created_at DESC);
CREATE INDEX community_messages_rate ON public.community_messages(user_id,created_at DESC);
CREATE INDEX community_members_presence ON public.community_members(room_id,last_seen DESC);
CREATE TABLE public.community_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
 message_id uuid NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
 reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 resolved boolean NOT NULL DEFAULT false,
 UNIQUE(message_id,reporter_id)
);
CREATE INDEX community_reports_pending ON public.community_reports(room_id,created_at DESC) WHERE NOT resolved;
CREATE INDEX community_reports_rate ON public.community_reports(reporter_id,created_at DESC);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_rooms,public.community_members,public.community_messages,public.community_reports FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_rooms,public.community_members,public.community_messages,public.community_reports TO service_role;

CREATE FUNCTION public.community_action(p_actor uuid,p_action text,p_input jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 r public.community_rooms; m public.community_members; target public.community_members; reported public.community_messages;
 v_now timestamptz := clock_timestamp(); v_result jsonb; v_nickname text; v_verified boolean;
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor) THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=p_actor AND (expires_at IS NULL OR expires_at>v_now)) THEN RAISE EXCEPTION 'banned'; END IF;
 IF p_action='list' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.online DESC,q.created_at DESC),'[]') INTO v_result FROM (
     SELECT c.id,c.slug,c.name,c.description,c.rules,c.theme,c.access,c.owner_id,c.created_at,
       (SELECT count(*) FROM public.community_members cm WHERE cm.room_id=c.id AND NOT cm.banned AND cm.last_seen>v_now-interval '45 seconds') AS online
     FROM public.community_rooms c WHERE c.access='public' OR c.owner_id=p_actor OR EXISTS(
       SELECT 1 FROM public.community_members cm WHERE cm.room_id=c.id AND cm.user_id=p_actor AND NOT cm.banned)
   ) q;
   RETURN jsonb_build_object('rooms',v_result);
 END IF;
 IF p_action='create' THEN
   SELECT NOT coalesce(is_anonymous,false) AND email_confirmed_at IS NOT NULL INTO v_verified FROM auth.users WHERE id=p_actor;
   IF NOT coalesce(v_verified,false) THEN RAISE EXCEPTION 'verified_account_required'; END IF;
   IF char_length(btrim(coalesce(p_input->>'name',''))) NOT BETWEEN 3 AND 60
      OR char_length(coalesce(p_input->>'description',''))>300 OR char_length(coalesce(p_input->>'rules',''))>1000
      OR coalesce(p_input->>'theme','') NOT IN ('amizade','musica','games','idiomas','paquera','adulto','outros')
      OR coalesce(p_input->>'access','') NOT IN ('public','invite') THEN RAISE EXCEPTION 'invalid_request'; END IF;
   IF p_input->>'theme'='adulto' AND coalesce(p_input->>'adultAcknowledged','false')<>'true' THEN RAISE EXCEPTION 'adult_confirmation_required'; END IF;
   BEGIN
     INSERT INTO public.community_rooms(owner_id,name,description,rules,theme,access)
       VALUES(p_actor,btrim(p_input->>'name'),btrim(coalesce(p_input->>'description','')),btrim(coalesce(p_input->>'rules','')),p_input->>'theme',p_input->>'access') RETURNING * INTO r;
   EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'room_limit'; END;
   INSERT INTO public.community_members(room_id,user_id,nickname,role) VALUES(r.id,p_actor,'Anfitrião','owner');
   RETURN jsonb_build_object('room',to_jsonb(r)-'invite_token');
 END IF;
 -- Serialize membership changes and access checks, including bans and invite rotation.
 SELECT * INTO r FROM public.community_rooms WHERE slug=p_input->>'slug' FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
 SELECT * INTO m FROM public.community_members WHERE room_id=r.id AND user_id=p_actor;
 IF m.banned THEN RAISE EXCEPTION 'banned'; END IF;
 IF p_action='preview' THEN
   IF r.access='invite' AND m.user_id IS NULL AND coalesce(p_input->>'invite','')<>r.invite_token::text THEN RAISE EXCEPTION 'invite_required'; END IF;
   RETURN jsonb_build_object('room',to_jsonb(r)-'invite_token');
 END IF;
 IF p_action='join' THEN
   IF r.theme='adulto' AND coalesce(p_input->>'adultAcknowledged','false')<>'true' THEN RAISE EXCEPTION 'adult_confirmation_required'; END IF;
   IF r.access='invite' AND m.user_id IS NULL AND coalesce(p_input->>'invite','')<>r.invite_token::text THEN RAISE EXCEPTION 'invite_required'; END IF;
   v_nickname:=btrim(coalesce(p_input->>'nickname',''));
   IF char_length(v_nickname) NOT BETWEEN 2 AND 24 THEN RAISE EXCEPTION 'invalid_request'; END IF;
   INSERT INTO public.community_members(room_id,user_id,nickname) VALUES(r.id,p_actor,v_nickname)
     ON CONFLICT(room_id,user_id) DO UPDATE SET nickname=excluded.nickname,last_seen=v_now;
   SELECT * INTO m FROM public.community_members WHERE room_id=r.id AND user_id=p_actor;
 ELSIF m.user_id IS NULL THEN RAISE EXCEPTION 'forbidden';
 END IF;
 IF p_action IN ('join','state') THEN
   UPDATE public.community_members SET last_seen=v_now WHERE room_id=r.id AND user_id=p_actor;
   RETURN jsonb_build_object('room',to_jsonb(r)-'invite_token','role',m.role,
     'reports',CASE WHEN m.role IN ('owner','moderator') THEN (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
       SELECT cr.id,cm.user_id,cm.nickname,cm.body FROM public.community_reports cr JOIN public.community_messages cm ON cm.id=cr.message_id
       WHERE cr.room_id=r.id AND NOT cr.resolved ORDER BY cr.created_at DESC LIMIT 100) q) ELSE '[]'::jsonb END,
     'members',(SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (SELECT user_id,nickname,role,banned,last_seen FROM public.community_members
       WHERE room_id=r.id AND ((NOT banned AND last_seen>v_now-interval '45 seconds') OR (m.role IN ('owner','moderator') AND banned)) ORDER BY role,nickname) q),
     'messages',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at,q.id),'[]') FROM (SELECT id,user_id,nickname,body,created_at FROM public.community_messages WHERE room_id=r.id ORDER BY created_at DESC,id DESC LIMIT 50) q));
 END IF;
 IF p_action='send' THEN
   IF char_length(btrim(coalesce(p_input->>'text',''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'invalid_request'; END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,20260920));
   v_now:=clock_timestamp();
   IF EXISTS(SELECT 1 FROM public.community_messages WHERE user_id=p_actor AND created_at>v_now-interval '2 seconds')
      OR EXISTS(SELECT 1 FROM public.community_messages WHERE user_id=p_actor AND body=btrim(p_input->>'text') AND created_at>v_now-interval '30 seconds') THEN RAISE EXCEPTION 'rate_limited'; END IF;
   INSERT INTO public.community_messages(room_id,user_id,nickname,body) VALUES(r.id,p_actor,m.nickname,btrim(p_input->>'text')) RETURNING to_jsonb(community_messages) INTO v_result;
   RETURN jsonb_build_object('message',v_result);
 END IF;
 IF p_action='report' THEN
   SELECT * INTO reported FROM public.community_messages WHERE room_id=r.id AND id::text=p_input->>'messageId';
   IF reported.id IS NULL OR reported.user_id=p_actor THEN RAISE EXCEPTION 'invalid_request'; END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,20260921));
   IF EXISTS(SELECT 1 FROM public.community_reports WHERE reporter_id=p_actor AND created_at>clock_timestamp()-interval '30 seconds') THEN RAISE EXCEPTION 'rate_limited'; END IF;
   INSERT INTO public.community_reports(room_id,message_id,reporter_id) VALUES(r.id,reported.id,p_actor) ON CONFLICT DO NOTHING;
   RETURN '{"ok":true}';
 END IF;
 IF p_action='resolve-report' THEN
   IF m.role NOT IN ('owner','moderator') THEN RAISE EXCEPTION 'forbidden'; END IF;
   UPDATE public.community_reports SET resolved=true WHERE room_id=r.id AND id::text=p_input->>'reportId';
   RETURN '{"ok":true}';
 END IF;
 IF p_action='leave' THEN
   UPDATE public.community_members SET last_seen='epoch' WHERE room_id=r.id AND user_id=p_actor;
   RETURN '{"ok":true}';
 END IF;
 IF p_action='invite' THEN
   IF m.role NOT IN ('owner','moderator') THEN RAISE EXCEPTION 'forbidden'; END IF;
   IF coalesce(p_input->>'rotate','false')='true' THEN UPDATE public.community_rooms SET invite_token=gen_random_uuid() WHERE id=r.id RETURNING * INTO r; END IF;
   RETURN jsonb_build_object('invite',r.invite_token);
 END IF;
 IF p_action='moderate' THEN
   IF m.role NOT IN ('owner','moderator') THEN RAISE EXCEPTION 'forbidden'; END IF;
   SELECT * INTO target FROM public.community_members WHERE room_id=r.id AND user_id::text=p_input->>'target';
   IF target.user_id IS NULL OR target.role='owner' OR target.user_id=p_actor THEN RAISE EXCEPTION 'forbidden'; END IF;
   IF p_input->>'operation' IN ('promote','demote') THEN
     IF m.role<>'owner' OR target.banned THEN RAISE EXCEPTION 'forbidden'; END IF;
     UPDATE public.community_members SET role=CASE WHEN p_input->>'operation'='promote' THEN 'moderator' ELSE 'member' END WHERE room_id=r.id AND user_id=target.user_id;
   ELSIF p_input->>'operation' IN ('ban','unban') THEN
     IF target.role='moderator' AND m.role<>'owner' THEN RAISE EXCEPTION 'forbidden'; END IF;
     UPDATE public.community_members SET banned=(p_input->>'operation'='ban'),last_seen='epoch' WHERE room_id=r.id AND user_id=target.user_id;
   ELSE RAISE EXCEPTION 'invalid_request'; END IF;
   RETURN '{"ok":true}';
 END IF;
 RAISE EXCEPTION 'invalid_request';
END $$;
REVOKE ALL ON FUNCTION public.community_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_action(uuid,text,jsonb) TO service_role;
