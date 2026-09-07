-- These products are either reached through their own route or belong to the
-- retired room catalogue. Keep only the current general and adult lounges.
UPDATE public.rooms
SET is_active = false
WHERE slug IN (
  'roleta-chat',
  'paquera-hetero',
  'adult-diversidade-hot'
);
