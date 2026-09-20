-- Reuse only existing active free official rooms. No fabricated rooms or people.
-- Legacy rooms and message history remain intact for rollback.
ALTER TABLE public.community_rooms ALTER COLUMN owner_id DROP NOT NULL;
INSERT INTO public.community_rooms(id,slug,name,description,rules,theme,access)
SELECT id,slug,left(name,60),left(coalesce(description,''),300),
 'Respeite os limites de cada pessoa. Sem ataques, spam ou exposição de dados pessoais.',
 CASE WHEN slug LIKE 'adult-%' THEN 'adulto' WHEN slug IN ('games','tecnologia-ia') THEN 'games'
 WHEN slug IN ('karaoke','musica','dj-room') THEN 'musica' WHEN slug LIKE 'idioma-%' THEN 'idiomas' ELSE 'amizade' END,'public'
FROM public.rooms WHERE is_active AND type='publica' AND coalesce(ficha_cost,0)=0 AND owner_id IS NULL
ON CONFLICT DO NOTHING;
-- Existing platform administrators become moderators of these official rooms.
-- is_admin is protected by guard_privileged_profile_fields; never user metadata.
INSERT INTO public.community_members(room_id,user_id,nickname,role,last_seen)
SELECT r.id,p.id,CASE WHEN char_length(coalesce(p.username,''))<2 THEN 'Moderação' ELSE left(p.username,24) END,'moderator','epoch'::timestamptz
FROM public.community_rooms r CROSS JOIN public.profiles p WHERE r.owner_id IS NULL AND p.is_admin
ON CONFLICT(room_id,user_id) DO NOTHING;
