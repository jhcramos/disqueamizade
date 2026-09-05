BEGIN;
CREATE FUNCTION pg_temp.expect_error(q text, expected text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN
  IF SQLERRM=expected THEN RETURN; END IF;
  RAISE EXCEPTION 'Expected %, received %',expected,SQLERRM;
 END;
 RAISE EXCEPTION 'Expected failure %',expected;
END $$;
DO $$
DECLARE u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); room text; r jsonb; rid uuid; aid uuid; old_id uuid;
BEGIN
 SELECT slug INTO room FROM public.rooms WHERE is_active IS TRUE AND type::text='publica' AND ficha_cost=0 LIMIT 1;
 IF room IS NULL THEN RAISE EXCEPTION 'No public fixture room'; END IF;
 INSERT INTO auth.users(id) VALUES(u),(v);
 -- The transaction rolls back: no synthetic users, answers or rounds persist.
 DELETE FROM public.icebreaker_rounds WHERE room_slug=room;
 r:=public.icebreaker_action(u,room,'state');
 ASSERT r->>'phase'='idle';
 r:=public.icebreaker_action(u,room,'start',p_question=>'Qual hobby você gosta?');rid:=(r->>'id')::uuid;
 ASSERT r->>'phase'='answering';
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,p_question=>%L)',u,room,'start','Outra'),'cooldown');
 r:=public.icebreaker_action(u,room,'answer',rid,'Cozinhar','Teste A');
 ASSERT r->>'ownAnswer'='Cozinhar'; ASSERT NOT r?'answers'; ASSERT NOT r?'candidates';
 r:=public.icebreaker_action(v,room,'state');ASSERT r->>'ownAnswer' IS NULL; ASSERT NOT r?'answers';
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,%L,%L,%L)',u,room,'answer',rid,'Outra','Teste'),'already_answered');
 r:=public.icebreaker_action(u,room,'withdraw',rid);ASSERT (r->>'count')::int=0;
 PERFORM public.icebreaker_action(u,room,'answer',rid,'Cozinhar','Teste A');
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp()-interval '65 seconds' WHERE id=rid;
 r:=public.icebreaker_action(v,room,'state');ASSERT r->>'phase'='finished';ASSERT NOT r?'answers';
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp() WHERE id=rid;
 PERFORM public.icebreaker_action(v,room,'answer',rid,'Desenhar','Teste B');
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp()-interval '65 seconds' WHERE id=rid;
 r:=public.icebreaker_action(u,room,'state'); ASSERT r->>'phase'='guessing'; ASSERT jsonb_array_length(r->'answers')=2;
 ASSERT NOT(r->'answers'->0)?'userId'; ASSERT NOT(r->'answers'->0)?'username'; ASSERT NOT(r->'answers'->0)?'isMine';
 ASSERT jsonb_array_length(r->'candidates')=2;
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,%L)',u,room,'withdraw',rid),'phase_closed');
 SELECT id INTO aid FROM public.icebreaker_answers WHERE round_id=rid AND user_id=v;
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,%L,p_answer=>%L)',u,room,'react',rid,aid),'phase_closed');
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp()-interval '110 seconds' WHERE id=rid;
 r:=public.icebreaker_action(u,room,'state');ASSERT r->>'phase'='revealed';ASSERT (r->'answers'->0)?'userId';
 PERFORM public.icebreaker_action(u,room,'react',rid,p_answer=>aid);
 PERFORM public.icebreaker_action(u,room,'react',rid,p_answer=>aid);
 ASSERT (SELECT count(*) FROM public.icebreaker_reactions WHERE answer_id=aid)=1;
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,%L,p_answer=>%L)',v,room,'react',rid,aid),'invalid_request');
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L)',u,'nonexistent-icebreaker-room','state'),'forbidden');
 PERFORM pg_temp.expect_error(format('select public.icebreaker_action(%L,%L,%L,%L,%L,%L)',u,room,'answer',gen_random_uuid(),'Outra','Teste'),'stale_round');
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp()-interval '230 seconds' WHERE id=rid;
 r:=public.icebreaker_action(u,room,'state');ASSERT r->>'phase'='finished';ASSERT NOT r?'answers';
 UPDATE public.icebreaker_rounds SET created_at=clock_timestamp()-interval '530 seconds' WHERE id=rid;
 old_id:=rid;r:=public.icebreaker_action(u,room,'start',p_question=>'Outra pergunta?');
 ASSERT (r->>'id')::uuid<>old_id;ASSERT NOT EXISTS(SELECT 1 FROM public.icebreaker_answers WHERE round_id=old_id);
 ASSERT NOT has_table_privilege('authenticated','public.icebreaker_answers','SELECT');
 ASSERT NOT has_table_privilege('anon','public.icebreaker_rounds','SELECT');
 ASSERT NOT has_function_privilege('authenticated','public.icebreaker_action(uuid,text,text,uuid,text,text,text,uuid)','EXECUTE');
 ASSERT has_function_privilege('service_role','public.icebreaker_action(uuid,text,text,uuid,text,text,text,uuid)','EXECUTE');
 ASSERT (SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN('public.icebreaker_answers'::regclass,'public.icebreaker_rounds'::regclass,'public.icebreaker_reactions'::regclass));
 SET LOCAL ROLE service_role;
 r:=public.icebreaker_action(u,room,'state');ASSERT r->>'phase'='answering';
 RESET ROLE;
END $$;
ROLLBACK;
