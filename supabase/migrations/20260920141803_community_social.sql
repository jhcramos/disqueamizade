-- Private content is accessible only through the authenticated Edge gateway.
CREATE TABLE public.community_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
 sender uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 recipient uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('direct','reserved','video')),
 status text NOT NULL CHECK(status IN ('pending','accepted','declined','ended')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '5 minutes',
 CHECK(sender<>recipient)
);
CREATE INDEX community_threads_sender ON public.community_threads(room_id,sender,created_at DESC);
CREATE INDEX community_threads_recipient ON public.community_threads(room_id,recipient,created_at DESC);
CREATE TABLE public.community_private_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 nickname text NOT NULL,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX community_private_history ON public.community_private_messages(thread_id,created_at DESC);
CREATE INDEX community_private_rate ON public.community_private_messages(user_id,created_at DESC);
ALTER TABLE public.community_reports ALTER COLUMN message_id DROP NOT NULL;
ALTER TABLE public.community_reports ADD COLUMN private_message_id uuid REFERENCES public.community_private_messages(id) ON DELETE CASCADE;
ALTER TABLE public.community_reports ADD CONSTRAINT community_report_one_message CHECK ((message_id IS NULL) <> (private_message_id IS NULL));
CREATE UNIQUE INDEX community_private_report_unique ON public.community_reports(private_message_id,reporter_id);
CREATE TABLE public.community_blocks (
 actor uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 target uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 PRIMARY KEY(actor,target), CHECK(actor<>target)
);
CREATE INDEX community_blocks_target ON public.community_blocks(target);
CREATE TABLE public.community_favorites (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 room_id uuid NOT NULL REFERENCES public.community_rooms(id) ON DELETE CASCADE,
 PRIMARY KEY(user_id,room_id)
);
CREATE INDEX community_favorites_room ON public.community_favorites(room_id);
CREATE TABLE public.community_media_revocations (
 room_name text NOT NULL, identity uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(room_name,identity)
);
ALTER TABLE public.community_media_revocations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_media_revocations FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_media_revocations TO service_role;
CREATE FUNCTION public.community_revoke_media() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.kind='video' AND NEW.status IN ('ended','declined') AND OLD.status<>NEW.status THEN
   INSERT INTO public.community_media_revocations(room_name,identity) VALUES('community-private-'||NEW.id,NEW.sender),('community-private-'||NEW.id,NEW.recipient)
   ON CONFLICT(room_name,identity) DO UPDATE SET created_at=clock_timestamp();
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.community_revoke_media() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_revoke_media() TO service_role;
CREATE TRIGGER community_revoke_media AFTER UPDATE ON public.community_threads FOR EACH ROW EXECUTE FUNCTION public.community_revoke_media();
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_favorites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.community_threads,public.community_private_messages,public.community_blocks,public.community_favorites FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.community_threads,public.community_private_messages,public.community_blocks,public.community_favorites TO service_role;
ALTER TABLE public.community_messages ADD COLUMN reply_to uuid REFERENCES public.community_messages(id) ON DELETE SET NULL;
CREATE INDEX community_messages_reply ON public.community_messages(reply_to);

ALTER FUNCTION public.community_action(uuid,text,jsonb) RENAME TO community_base_action;
CREATE FUNCTION public.community_action(p_actor uuid,p_action text,p_input jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 r public.community_rooms; m public.community_members; peer public.community_members;
 t public.community_threads; result jsonb; messages jsonb; v_target uuid; v_now timestamptz:=clock_timestamp();
BEGIN
 IF p_actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor) THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=p_actor AND (expires_at IS NULL OR expires_at>v_now)) THEN RAISE EXCEPTION 'banned'; END IF;
 IF p_action NOT IN ('list','create') THEN
   SELECT * INTO r FROM public.community_rooms WHERE slug=p_input->>'slug' OR id::text=p_input->>'slug';
   IF r.id IS NOT NULL THEN p_input:=p_input||jsonb_build_object('slug',r.slug); END IF;
 END IF;
 IF p_action IN ('list','create','preview') THEN
   result:=public.community_base_action(p_actor,p_action,p_input);
   IF p_action='list' THEN
     result:=result||jsonb_build_object('favorites',(SELECT coalesce(jsonb_agg(room_id),'[]') FROM public.community_favorites WHERE user_id=p_actor));
   END IF;
   RETURN result;
 END IF;
 -- All social actions serialize on the room, including acceptance, bans and blocks.
 SELECT * INTO r FROM public.community_rooms WHERE slug=p_input->>'slug' FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;
 IF p_action='join' THEN result:=public.community_base_action(p_actor,p_action,p_input); END IF;
 SELECT * INTO m FROM public.community_members WHERE room_id=r.id AND user_id=p_actor;
 IF m.user_id IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF m.banned THEN RAISE EXCEPTION 'banned'; END IF;
 IF p_action IN ('join','state') THEN
   IF p_action='state' THEN result:=public.community_base_action(p_actor,'state',p_input); END IF;
   UPDATE public.community_threads SET status='ended' WHERE room_id=r.id AND status IN ('pending','accepted') AND expires_at<v_now;
   SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at,q.id),'[]') INTO messages FROM (
     SELECT cm.id,cm.user_id,cm.nickname,cm.body,cm.created_at,
       CASE WHEN reply.id IS NOT NULL THEN jsonb_build_object('nickname',reply.nickname,'body',reply.body) ELSE NULL END AS reply
     FROM public.community_messages cm LEFT JOIN public.community_messages reply ON reply.id=cm.reply_to
     WHERE cm.room_id=r.id AND NOT EXISTS(SELECT 1 FROM public.community_blocks b WHERE b.actor=p_actor AND b.target=cm.user_id)
     ORDER BY cm.created_at DESC,cm.id DESC LIMIT 50) q;
   RETURN result||jsonb_build_object('messages',messages,
     'reports',coalesce(result->'reports','[]')||CASE WHEN m.role IN ('owner','moderator') THEN (SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') FROM (
       SELECT cr.id,pm.user_id,pm.nickname,pm.body FROM public.community_reports cr JOIN public.community_private_messages pm ON pm.id=cr.private_message_id
       WHERE cr.room_id=r.id AND NOT cr.resolved ORDER BY cr.created_at DESC LIMIT 100) q) ELSE '[]'::jsonb END,
     'blocked',(SELECT coalesce(jsonb_agg(target),'[]') FROM public.community_blocks WHERE actor=p_actor),
     'favorite',EXISTS(SELECT 1 FROM public.community_favorites WHERE user_id=p_actor AND room_id=r.id),
     'threads',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at DESC),'[]') FROM (
       SELECT ct.*,other.nickname FROM public.community_threads ct
       JOIN public.community_members other ON other.room_id=ct.room_id AND other.user_id=CASE WHEN ct.sender=p_actor THEN ct.recipient ELSE ct.sender END
       WHERE ct.room_id=r.id AND p_actor IN (ct.sender,ct.recipient) AND NOT other.banned
       AND NOT EXISTS(SELECT 1 FROM public.community_blocks b WHERE (b.actor=ct.sender AND b.target=ct.recipient) OR (b.actor=ct.recipient AND b.target=ct.sender))
       ORDER BY ct.created_at DESC LIMIT 80) q));
 END IF;
 IF p_action='favorite' THEN
   IF p_input->>'enabled'='true' THEN INSERT INTO public.community_favorites VALUES(p_actor,r.id) ON CONFLICT DO NOTHING;
   ELSE DELETE FROM public.community_favorites WHERE user_id=p_actor AND room_id=r.id; END IF;
   RETURN '{"ok":true}';
 END IF;
 IF p_action='report' AND coalesce(p_input->>'threadId','')<>'' THEN
   SELECT ct.* INTO t FROM public.community_threads ct JOIN public.community_private_messages pm ON pm.thread_id=ct.id
     WHERE ct.room_id=r.id AND ct.id::text=p_input->>'threadId' AND pm.id::text=p_input->>'messageId' AND pm.user_id<>p_actor AND p_actor IN (ct.sender,ct.recipient);
   IF t.id IS NULL THEN RAISE EXCEPTION 'forbidden'; END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,20260921));
   IF EXISTS(SELECT 1 FROM public.community_reports WHERE reporter_id=p_actor AND created_at>clock_timestamp()-interval '30 seconds') THEN RAISE EXCEPTION 'rate_limited'; END IF;
   INSERT INTO public.community_reports(room_id,private_message_id,reporter_id) VALUES(r.id,(p_input->>'messageId')::uuid,p_actor) ON CONFLICT DO NOTHING;
   RETURN '{"ok":true}';
 END IF;
 IF p_action IN ('block','contact') THEN
   SELECT * INTO peer FROM public.community_members WHERE room_id=r.id AND user_id::text=p_input->>'target';
   IF peer.user_id IS NULL OR peer.user_id=p_actor THEN RAISE EXCEPTION 'invalid_request'; END IF;
   v_target:=peer.user_id;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(p_actor,v_target)::text||greatest(p_actor,v_target)::text,20260924));
   IF p_action='block' THEN
     IF p_input->>'enabled'='false' THEN DELETE FROM public.community_blocks WHERE actor=p_actor AND target=v_target;
     ELSE
       INSERT INTO public.community_blocks VALUES(p_actor,v_target) ON CONFLICT DO NOTHING;
       UPDATE public.community_threads SET status='ended' WHERE (sender=p_actor AND recipient=v_target) OR (sender=v_target AND recipient=p_actor);
     END IF;
     RETURN '{"ok":true}';
   END IF;
   IF peer.banned OR EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=v_target AND (expires_at IS NULL OR expires_at>v_now)) OR EXISTS(SELECT 1 FROM public.community_blocks WHERE (actor=p_actor AND target=v_target) OR (actor=v_target AND target=p_actor)) THEN RAISE EXCEPTION 'forbidden'; END IF;
   IF coalesce(p_input->>'kind','') NOT IN ('direct','reserved','video') THEN RAISE EXCEPTION 'invalid_request'; END IF;
   SELECT * INTO t FROM public.community_threads WHERE room_id=r.id AND kind=p_input->>'kind' AND status IN ('pending','accepted') AND expires_at>v_now
     AND ((sender=p_actor AND recipient=v_target) OR (sender=v_target AND recipient=p_actor)) ORDER BY created_at DESC LIMIT 1;
   IF t.id IS NULL THEN
     PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,20260922));
     IF (SELECT count(*) FROM public.community_threads WHERE sender=p_actor AND created_at>v_now-interval '1 minute')>=5 THEN RAISE EXCEPTION 'rate_limited'; END IF;
     INSERT INTO public.community_threads(room_id,sender,recipient,kind,status,expires_at) VALUES(r.id,p_actor,v_target,p_input->>'kind',
       CASE WHEN p_input->>'kind'='direct' THEN 'accepted' ELSE 'pending' END,
       CASE WHEN p_input->>'kind'='direct' THEN v_now+interval '30 days' ELSE v_now+interval '5 minutes' END) RETURNING * INTO t;
   END IF;
   RETURN jsonb_build_object('thread',to_jsonb(t)||jsonb_build_object('nickname',peer.nickname));
 END IF;
 IF p_action IN ('respond','private-state','private-send','video-authorize') AND coalesce(p_input->>'threadId','')<>'' THEN
   SELECT * INTO t FROM public.community_threads WHERE room_id=r.id AND id::text=p_input->>'threadId' FOR UPDATE;
   IF t.id IS NULL OR p_actor NOT IN (t.sender,t.recipient) THEN RAISE EXCEPTION 'forbidden'; END IF;
   v_target:=CASE WHEN t.sender=p_actor THEN t.recipient ELSE t.sender END;
   IF EXISTS(SELECT 1 FROM public.community_members WHERE room_id=r.id AND user_id=v_target AND banned) OR EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=v_target AND (expires_at IS NULL OR expires_at>v_now)) OR EXISTS(SELECT 1 FROM public.community_blocks WHERE (actor=p_actor AND target=v_target) OR (actor=v_target AND target=p_actor)) THEN RAISE EXCEPTION 'forbidden'; END IF;
   IF t.expires_at<=v_now THEN RAISE EXCEPTION 'expired'; END IF;
   IF p_action='respond' THEN
     IF p_input->>'response'='accept' AND t.status='pending' AND t.recipient=p_actor THEN
       UPDATE public.community_threads SET status='accepted',expires_at=v_now+interval '2 hours' WHERE id=t.id;
     ELSIF p_input->>'response'='decline' AND t.status='pending' AND t.recipient=p_actor THEN
       UPDATE public.community_threads SET status='declined' WHERE id=t.id;
     ELSIF p_input->>'response'='end' AND t.status IN ('pending','accepted') THEN
       UPDATE public.community_threads SET status='ended' WHERE id=t.id;
     ELSE RAISE EXCEPTION 'forbidden'; END IF;
     RETURN '{"ok":true}';
   END IF;
   IF t.status<>'accepted' THEN RAISE EXCEPTION 'forbidden'; END IF;
   IF p_action='private-state' THEN
     RETURN jsonb_build_object('messages',(SELECT coalesce(jsonb_agg(to_jsonb(q) ORDER BY q.created_at,q.id),'[]') FROM (
       SELECT id,user_id,nickname,body,created_at FROM public.community_private_messages WHERE thread_id=t.id ORDER BY created_at DESC,id DESC LIMIT 50) q));
   END IF;
   IF p_action='private-send' THEN
     IF char_length(btrim(coalesce(p_input->>'text',''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'invalid_request'; END IF;
     PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_actor::text,20260923));
     IF EXISTS(SELECT 1 FROM public.community_private_messages WHERE user_id=p_actor AND created_at>clock_timestamp()-interval '2 seconds') THEN RAISE EXCEPTION 'rate_limited'; END IF;
     INSERT INTO public.community_private_messages(thread_id,user_id,nickname,body) VALUES(t.id,p_actor,m.nickname,btrim(p_input->>'text'));
     RETURN '{"ok":true}';
   END IF;
 END IF;
 IF p_action='video-authorize' THEN
   IF coalesce(p_input->>'threadId','')<>'' THEN
     IF t.id IS NULL OR t.kind<>'video' THEN RAISE EXCEPTION 'forbidden'; END IF;
     RETURN jsonb_build_object('room','community-private-'||t.id,'nickname',m.nickname);
   END IF;
   RETURN jsonb_build_object('room','community-public-'||r.id,'nickname',m.nickname);
 END IF;
 IF p_action='send' AND coalesce(p_input->>'replyTo','')<>'' THEN
   IF NOT EXISTS(SELECT 1 FROM public.community_messages WHERE room_id=r.id AND id::text=p_input->>'replyTo') THEN RAISE EXCEPTION 'invalid_request'; END IF;
   result:=public.community_base_action(p_actor,'send',p_input);
   UPDATE public.community_messages SET reply_to=(p_input->>'replyTo')::uuid WHERE id::text=result->'message'->>'id';
   RETURN result;
 END IF;
 IF p_action='moderate' AND p_input->>'operation'='ban' THEN
   result:=public.community_base_action(p_actor,p_action,p_input);
   UPDATE public.community_threads SET status='ended' WHERE room_id=r.id AND (sender::text=p_input->>'target' OR recipient::text=p_input->>'target');
   INSERT INTO public.community_media_revocations(room_name,identity) VALUES('community-public-'||r.id,(p_input->>'target')::uuid) ON CONFLICT(room_name,identity) DO UPDATE SET created_at=clock_timestamp();
   RETURN result;
 END IF;
 RETURN public.community_base_action(p_actor,p_action,p_input);
END $$;
REVOKE ALL ON FUNCTION public.community_action(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.community_action(uuid,text,jsonb) TO service_role;
