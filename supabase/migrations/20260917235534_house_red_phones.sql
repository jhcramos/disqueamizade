-- The phone desk owns matching. Browsers cannot insert or accept calls directly.
CREATE TABLE public.house_phone_visitors (
 user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
 tab_id uuid NOT NULL,
 room text NOT NULL CHECK (room IN ('garage','living','bar')),
 available boolean NOT NULL DEFAULT false,
 adult boolean NOT NULL DEFAULT false,
 alive_until timestamptz NOT NULL
);
CREATE TABLE public.house_phone_calls (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 caller uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
 receiver uuid REFERENCES auth.users ON DELETE CASCADE,
 source text NOT NULL,
 target text,
 status text NOT NULL CHECK (status IN ('ringing','accepted','ended')),
 invite_id uuid REFERENCES public.private_invites ON DELETE SET NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (caller <> receiver)
);
CREATE INDEX house_phone_active ON public.house_phone_calls(status, expires_at);
CREATE INDEX house_phone_caller ON public.house_phone_calls(caller, created_at DESC);
CREATE INDEX house_phone_receiver ON public.house_phone_calls(receiver) WHERE receiver IS NOT NULL;
ALTER TABLE public.house_phone_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_phone_calls ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.house_phone_visitors, public.house_phone_calls FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.house_phone_visitors, public.house_phone_calls TO service_role;

CREATE FUNCTION public.house_phone_desk(
 p_tab uuid, p_room text, p_available boolean DEFAULT true, p_adult boolean DEFAULT false,
 p_action text DEFAULT 'poll', p_phone text DEFAULT NULL, p_call uuid DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
 u uuid := auth.uid(); t timestamptz := clock_timestamp(); c public.house_phone_calls;
 v public.house_phone_visitors; dest text; invitation uuid; result jsonb;
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'authentication_required'; END IF;
 IF p_room NOT IN ('garage','living','bar') OR p_action NOT IN ('poll','call','answer','end','leave') OR p_tab IS NULL THEN RAISE EXCEPTION 'invalid_request'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=u AND (expires_at IS NULL OR expires_at>t)) THEN RAISE EXCEPTION 'unavailable'; END IF;
 -- One active tab per account prevents a background tab from stealing an answer.
 SELECT * INTO v FROM public.house_phone_visitors WHERE user_id=u FOR UPDATE;
 IF FOUND AND v.tab_id<>p_tab AND v.alive_until>t THEN RAISE EXCEPTION 'phone_in_another_tab'; END IF;
 INSERT INTO public.house_phone_visitors VALUES(u,p_tab,p_room,p_available,p_adult,t+interval '20 seconds')
 ON CONFLICT(user_id) DO UPDATE SET tab_id=p_tab,room=p_room,available=p_available,adult=p_adult,alive_until=t+interval '20 seconds';
 IF p_action IN ('call','answer','end','leave') THEN
  -- Serialize only matching mutations: answering is first-come, never broadcast-based.
  PERFORM pg_advisory_xact_lock(8129041);
 END IF;
 IF p_action IN ('end','leave') THEN
  UPDATE public.private_invites SET status='ended',expires_at=t WHERE id IN
   (SELECT invite_id FROM public.house_phone_calls WHERE (caller=u OR receiver=u) AND status<>'ended');
  UPDATE public.house_phone_calls SET status='ended',expires_at=t WHERE (caller=u OR receiver=u) AND status<>'ended';
  IF p_action='leave' THEN DELETE FROM public.house_phone_visitors WHERE user_id=u; RETURN '{}'::jsonb; END IF;
 END IF;
 IF p_action='call' THEN
  IF NOT p_available OR p_phone IS NULL OR p_phone !~ '^(garage|living|bar)-[1-4]$' OR split_part(p_phone,'-',1)<>p_room OR (p_room='bar' AND NOT p_adult) THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  IF EXISTS(SELECT 1 FROM public.house_phone_calls WHERE (caller=u OR receiver=u) AND status<>'ended' AND expires_at>t) THEN RAISE EXCEPTION 'already_in_call'; END IF;
  IF EXISTS(SELECT 1 FROM public.house_phone_calls WHERE (source=p_phone OR target=p_phone) AND status<>'ended' AND expires_at>t) THEN RAISE EXCEPTION 'call_unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM public.house_phone_calls WHERE caller=u AND created_at>t-interval '8 seconds') THEN RAISE EXCEPTION 'please_wait'; END IF;
  SELECT r||'-'||n INTO dest FROM unnest(ARRAY['garage','living','bar']) r CROSS JOIN generate_series(1,4) n
  WHERE r||'-'||n<>p_phone AND (r<>'bar' OR p_adult)
   AND NOT EXISTS(SELECT 1 FROM public.house_phone_calls a WHERE a.status<>'ended' AND a.expires_at>t AND (a.target=r||'-'||n OR a.source=r||'-'||n))
   AND EXISTS(SELECT 1 FROM public.house_phone_visitors b WHERE b.room=r AND b.user_id<>u AND b.available AND b.alive_until>t
    AND (p_room<>'bar' OR b.adult)
    AND NOT EXISTS(SELECT 1 FROM public.house_phone_calls a WHERE (a.caller=b.user_id OR a.receiver=b.user_id) AND a.status<>'ended' AND a.expires_at>t)
    AND NOT EXISTS(SELECT 1 FROM public.garage_blocks k WHERE (k.owner=u AND k.target=b.user_id) OR (k.target=u AND k.owner=b.user_id)))
  ORDER BY random() LIMIT 1;
  IF dest IS NULL THEN RETURN jsonb_build_object('notice','empty','rings','[]'::jsonb); END IF;
  INSERT INTO public.house_phone_calls(caller,source,target,status,expires_at) VALUES(u,p_phone,dest,'ringing',t+interval '35 seconds');
 END IF;
 IF p_action='answer' THEN
  SELECT * INTO c FROM public.house_phone_calls WHERE id=p_call FOR UPDATE;
  IF NOT FOUND OR c.status<>'ringing' OR c.expires_at<=t OR c.caller=u OR split_part(c.target,'-',1)<>p_room OR NOT p_available THEN RAISE EXCEPTION 'call_unavailable'; END IF;
  IF (split_part(c.source,'-',1)='bar' OR p_room='bar') AND NOT p_adult THEN RAISE EXCEPTION 'adult_only'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.house_phone_visitors WHERE user_id=c.caller AND alive_until>t) THEN RAISE EXCEPTION 'call_unavailable'; END IF;
  IF EXISTS(SELECT 1 FROM public.house_phone_calls WHERE (caller=u OR receiver=u) AND status<>'ended' AND expires_at>t) THEN RAISE EXCEPTION 'already_in_call'; END IF;
  IF EXISTS(SELECT 1 FROM public.garage_blocks WHERE (owner=u AND target=c.caller) OR (target=u AND owner=c.caller)) THEN RAISE EXCEPTION 'call_unavailable'; END IF;
  INSERT INTO public.private_invites(room_slug,from_user,to_user,mode,status,expires_at)
   VALUES('roleta-chat',c.caller,u,'video','accepted',t+interval '30 minutes') RETURNING id INTO invitation;
  UPDATE public.house_phone_calls SET receiver=u,status='accepted',invite_id=invitation,expires_at=t+interval '30 minutes' WHERE id=c.id;
 END IF;
 SELECT * INTO c FROM public.house_phone_calls WHERE (caller=u OR receiver=u) AND status<>'ended' AND expires_at>t ORDER BY created_at DESC LIMIT 1;
 IF FOUND AND c.status='accepted' AND NOT EXISTS(SELECT 1 FROM public.house_phone_visitors WHERE user_id=CASE WHEN c.caller=u THEN c.receiver ELSE c.caller END AND alive_until>t) THEN
  UPDATE public.house_phone_calls SET status='ended',expires_at=t WHERE id=c.id;
  UPDATE public.private_invites SET status='ended',expires_at=t WHERE id=c.invite_id;
  c := NULL;
 END IF;
 result := jsonb_build_object('mine',CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('id',c.id,'source',c.source,'target',c.target,'status',c.status,'expires',c.expires_at,
  'peer',CASE WHEN c.caller=u THEN c.receiver ELSE c.caller END,'roomId',CASE WHEN c.receiver IS NULL THEN NULL ELSE least(c.caller::text,c.receiver::text)||'-'||greatest(c.caller::text,c.receiver::text) END,'inviteId',c.invite_id) END);
 RETURN result || jsonb_build_object('rings',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'phone',a.target,'expires',a.expires_at)) FROM public.house_phone_calls a
  WHERE a.status='ringing' AND a.expires_at>t AND a.caller<>u AND split_part(a.target,'-',1)=p_room AND p_available
   AND (split_part(a.source,'-',1)<>'bar' OR p_adult)
   AND EXISTS(SELECT 1 FROM public.house_phone_visitors WHERE user_id=a.caller AND alive_until>t)
   AND NOT EXISTS(SELECT 1 FROM public.garage_blocks WHERE (owner=u AND target=a.caller) OR (target=u AND owner=a.caller))), '[]'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public.house_phone_desk(uuid,text,boolean,boolean,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.house_phone_desk(uuid,text,boolean,boolean,text,text,uuid) TO authenticated;
