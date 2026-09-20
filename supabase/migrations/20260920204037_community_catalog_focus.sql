-- Refocus unused official community rooms, preserving IDs, membership and links by UUID.
-- Legacy rooms and the House are not modified. Owned community rooms are excluded.
UPDATE public.community_rooms SET slug=v.new_slug,name=v.name,description=v.description,theme=v.theme
FROM (VALUES
 ('papo-livre','papo-livre','Papo Livre','Conheça gente nova, faça amizades e converse sobre o seu dia.','amizade'),
 ('karaoke','desabafa-aqui','Desabafa aqui','Um espaço para conversar, escutar e compartilhar o que você está sentindo.','amizade'),
 ('games','paquera-e-namoro','Paquera e namoro','Conheça alguém especial. Uma conversa pode ser o começo de uma conexão.','paquera'),
 ('46-plus','46-plus','Amizade 40+','Histórias, novas amizades e boas conversas para quem tem 40 anos ou mais.','amizade'),
 ('geral-brasil','paquera-lgbtqia','Paquera LGBTQIA+','Conheça pessoas LGBTQIA+ para paquerar, fazer amizades e encontrar afinidades.','paquera'),
 ('adult-lounge','adult-lounge','Lounge 18+','Um espaço para conversas entre adultos, com respeito e consentimento. Entre com ou sem câmera.','adulto')
) AS v(old_slug,new_slug,name,description,theme)
WHERE community_rooms.slug=v.old_slug AND community_rooms.owner_id IS NULL;
