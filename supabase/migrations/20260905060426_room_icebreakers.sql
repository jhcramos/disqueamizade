CREATE TABLE public.icebreaker_rounds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), room_slug text NOT NULL UNIQUE,
 question text NOT NULL CHECK(length(question) BETWEEN 1 AND 200),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.icebreaker_answers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 round_id uuid NOT NULL REFERENCES public.icebreaker_rounds(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL CHECK(length(username) BETWEEN 1 AND 50),
 content text NOT NULL CHECK(length(content) BETWEEN 1 AND 160), UNIQUE(round_id,user_id)
);
CREATE TABLE public.icebreaker_reactions (
 answer_id uuid NOT NULL REFERENCES public.icebreaker_answers(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, PRIMARY KEY(answer_id,user_id)
);
CREATE INDEX icebreaker_answers_user ON public.icebreaker_answers(user_id);
CREATE INDEX icebreaker_reactions_user ON public.icebreaker_reactions(user_id);
ALTER TABLE public.icebreaker_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icebreaker_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.icebreaker_rounds, public.icebreaker_answers, public.icebreaker_reactions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.icebreaker_rounds, public.icebreaker_answers, public.icebreaker_reactions TO service_role;

-- Client roles have no direct access; only the authenticating/moderating Edge calls this.
CREATE FUNCTION public.icebreaker_action(p_user uuid, p_room text, p_action text,
 p_round uuid DEFAULT NULL, p_text text DEFAULT NULL, p_name text DEFAULT NULL,
 p_question text DEFAULT NULL, p_answer uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE r public.icebreaker_rounds; t timestamptz; phase text; n integer; result jsonb;
BEGIN
 -- p_user comes exclusively from Edge auth.getUser; auth.users is not exposed.
 IF p_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
 IF p_action IS NULL OR p_action NOT IN ('state','start','answer','withdraw','react') THEN RAISE EXCEPTION 'invalid_request'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.rooms WHERE slug=p_room AND is_active IS TRUE AND type::text='publica' AND ficha_cost=0) THEN RAISE EXCEPTION 'forbidden'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_room,71058));
 t:=clock_timestamp();
 IF EXISTS(SELECT 1 FROM public.user_bans WHERE user_id=p_user AND (expires_at IS NULL OR expires_at>t)) THEN RAISE EXCEPTION 'banned'; END IF;
 SELECT * INTO r FROM public.icebreaker_rounds WHERE room_slug=p_room;
 SELECT count(*) INTO n FROM public.icebreaker_answers WHERE round_id=r.id;
 IF p_action='start' THEN
  IF r.id IS NOT NULL AND t<r.created_at+(CASE WHEN n<2 THEN interval '360 seconds' ELSE interval '525 seconds' END) THEN RAISE EXCEPTION 'cooldown'; END IF;
  IF p_question IS NULL OR length(p_question) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'invalid_request'; END IF;
  DELETE FROM public.icebreaker_rounds WHERE room_slug=p_room;
  INSERT INTO public.icebreaker_rounds(room_slug,question,created_at) VALUES(p_room,p_question,t) RETURNING * INTO r;
 ELSIF p_action<>'state' AND (r.id IS NULL OR p_round IS DISTINCT FROM r.id) THEN RAISE EXCEPTION 'stale_round';
 END IF;
 IF r.id IS NULL THEN RETURN jsonb_build_object('phase','idle','serverNow',t); END IF;
 SELECT count(*) INTO n FROM public.icebreaker_answers WHERE round_id=r.id;
 phase:=CASE WHEN t<r.created_at+interval '60 seconds' THEN 'answering'
  WHEN n<2 OR t>=r.created_at+interval '225 seconds' THEN 'finished'
  WHEN t<r.created_at+interval '105 seconds' THEN 'guessing' ELSE 'revealed' END;
 IF p_action IN ('answer','withdraw') THEN
  IF phase<>'answering' THEN RAISE EXCEPTION 'phase_closed'; END IF;
  IF p_action='withdraw' THEN DELETE FROM public.icebreaker_answers WHERE round_id=r.id AND user_id=p_user;
  ELSE
   IF p_text IS NULL OR length(btrim(p_text)) NOT BETWEEN 1 AND 160 OR p_name IS NULL OR length(p_name) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'invalid_request'; END IF;
   IF EXISTS(SELECT 1 FROM public.icebreaker_answers WHERE round_id=r.id AND user_id=p_user) THEN RAISE EXCEPTION 'already_answered'; END IF;
   IF n>=24 THEN RAISE EXCEPTION 'round_full'; END IF;
   INSERT INTO public.icebreaker_answers(round_id,user_id,username,content) VALUES(r.id,p_user,p_name,btrim(p_text));
  END IF;
 ELSIF p_action='react' THEN
  IF phase<>'revealed' THEN RAISE EXCEPTION 'phase_closed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.icebreaker_answers WHERE id=p_answer AND round_id=r.id AND user_id<>p_user) THEN RAISE EXCEPTION 'invalid_request'; END IF;
  INSERT INTO public.icebreaker_reactions(answer_id,user_id) VALUES(p_answer,p_user) ON CONFLICT DO NOTHING;
 END IF;
 SELECT count(*) INTO n FROM public.icebreaker_answers WHERE round_id=r.id;
 result:=jsonb_build_object('id',r.id,'question',r.question,'phase',phase,'serverNow',t,
  'answerUntil',r.created_at+interval '60 seconds','guessUntil',r.created_at+interval '105 seconds',
  'endAt',r.created_at+interval '225 seconds','nextAt',r.created_at+(CASE WHEN n<2 THEN interval '360 seconds' ELSE interval '525 seconds' END),'count',n);
 IF phase='answering' THEN
  result:=result||jsonb_build_object('ownAnswer',(SELECT content FROM public.icebreaker_answers WHERE round_id=r.id AND user_id=p_user));
 ELSIF phase IN ('guessing','revealed') THEN
  result:=result||jsonb_build_object('answers',COALESCE((SELECT jsonb_agg(
   jsonb_build_object('id',a.id,'text',a.content)||CASE WHEN phase='revealed' THEN
    jsonb_build_object('userId',a.user_id,'username',a.username,'isMine',a.user_id=p_user,
     'meToo',(SELECT count(*) FROM public.icebreaker_reactions WHERE answer_id=a.id),
     'reacted',EXISTS(SELECT 1 FROM public.icebreaker_reactions WHERE answer_id=a.id AND user_id=p_user))
    ELSE '{}'::jsonb END ORDER BY a.id)
   FROM public.icebreaker_answers a WHERE a.round_id=r.id),'[]'::jsonb));
  -- Independent ordering; candidate IDs never link to answer IDs before reveal.
  result:=result||jsonb_build_object('candidates',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.user_id,'name',a.username) ORDER BY a.user_id)
   FROM public.icebreaker_answers a WHERE a.round_id=r.id),'[]'::jsonb));
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.icebreaker_action(uuid,text,text,uuid,text,text,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.icebreaker_action(uuid,text,text,uuid,text,text,text,uuid) TO service_role;
