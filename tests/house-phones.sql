-- Run inside BEGIN/ROLLBACK. Synthetic users only; no customer records read.
INSERT INTO auth.users(id) VALUES
 ('00000000-0000-4000-8000-000000009801'),
 ('00000000-0000-4000-8000-000000009802'),
 ('00000000-0000-4000-8000-000000009803');
DO $$
DECLARE
 a uuid := '00000000-0000-4000-8000-000000009801';
 b uuid := '00000000-0000-4000-8000-000000009802';
 c uuid := '00000000-0000-4000-8000-000000009803';
 data jsonb; cid uuid; target text; rejected boolean := false;
BEGIN
 PERFORM set_config('request.jwt.claim.sub',a::text,true);
 data := public.house_phone_desk(a,'garage',true,false,'call','garage-1');
 IF data->>'notice'<>'empty' THEN RAISE EXCEPTION 'empty room rang'; END IF;
 PERFORM set_config('request.jwt.claim.sub',b::text,true);
 PERFORM public.house_phone_desk(b,'living');
 PERFORM set_config('request.jwt.claim.sub',c::text,true);
 PERFORM public.house_phone_desk(c,'living');
 PERFORM set_config('request.jwt.claim.sub',a::text,true);
 data := public.house_phone_desk(a,'garage',true,false,'call','garage-1');
 cid := (data->'mine'->>'id')::uuid; target:=data->'mine'->>'target';
 IF cid IS NULL OR target NOT LIKE 'living-%' THEN RAISE EXCEPTION 'wrong cross-room route'; END IF;
 PERFORM set_config('request.jwt.claim.sub',b::text,true);
 data := public.house_phone_desk(b,'living');
 IF jsonb_array_length(data->'rings')<>1 THEN RAISE EXCEPTION 'ring not visible'; END IF;
 data := public.house_phone_desk(b,'living',true,false,'answer',NULL,cid);
 IF data->'mine'->>'status'<>'accepted' OR data->'mine'->>'inviteId' IS NULL THEN RAISE EXCEPTION 'no media authorization'; END IF;
 PERFORM set_config('request.jwt.claim.sub',c::text,true);
 BEGIN
  PERFORM public.house_phone_desk(c,'living',true,false,'answer',NULL,cid);
 EXCEPTION WHEN OTHERS THEN rejected := SQLERRM='call_unavailable'; END;
 IF NOT rejected THEN RAISE EXCEPTION 'second answer succeeded'; END IF;
 PERFORM set_config('request.jwt.claim.sub',a::text,true);
 data := public.house_phone_desk(a,'garage');
 IF data->'mine'->>'peer'<>b::text THEN RAISE EXCEPTION 'caller missing match'; END IF;
 PERFORM public.house_phone_desk(a,'garage',true,false,'end');
 PERFORM set_config('request.jwt.claim.sub',b::text,true);
 data := public.house_phone_desk(b,'living');
 IF data->'mine'<>'null'::jsonb THEN RAISE EXCEPTION 'end not propagated'; END IF;
 IF EXISTS(SELECT 1 FROM public.private_invites WHERE from_user=a AND status='accepted') THEN RAISE EXCEPTION 'invite not ended'; END IF;
END $$;
SELECT 'cross-room call, first answer, accepted invite and hangup passed' AS result;
