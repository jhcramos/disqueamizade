-- One free adult lounge, independent of the general lobby's occupancy.
-- Slug is the existing room-directory classification for adult rooms.
INSERT INTO public.rooms (name, slug, description, type, max_participants, ficha_cost, is_active)
VALUES (
  'Lounge Adulto · 18+',
  'adult-lounge',
  'Um espaço para conversas entre adultos. Apenas maiores de 18 anos, com respeito e consentimento. Entre com ou sem câmera.',
  'publica', 30, 0, true
)
ON CONFLICT (slug) DO NOTHING;
