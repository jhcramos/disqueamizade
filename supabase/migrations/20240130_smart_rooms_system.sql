-- Migration: Smart Rooms System with Auto-Scaling and Cleanup
-- Created: 2024-01-30
-- Description: Adds support for official rooms with auto-scaling instances and automatic cleanup

-- ============================================================================
-- 1. ALTER ROOMS TABLE - Add new columns for smart room system
-- ============================================================================

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instance_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS base_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS owner_last_visit TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_by VARCHAR(50) DEFAULT 'system';

-- Add comments for documentation
COMMENT ON COLUMN rooms.is_official IS 'True if room is site-managed official room (never deleted), false if user-created';
COMMENT ON COLUMN rooms.instance_number IS 'Instance number for official rooms (e.g., São Paulo #1, #2, #3)';
COMMENT ON COLUMN rooms.base_name IS 'Base name without instance number (e.g., "São Paulo" for "São Paulo #2")';
COMMENT ON COLUMN rooms.last_activity IS 'Last time someone sent a message or joined/left the room';
COMMENT ON COLUMN rooms.owner_last_visit IS 'Last time room owner visited the room (for cleanup logic)';
COMMENT ON COLUMN rooms.created_by IS 'Username of creator, or "system" for official rooms';

-- ============================================================================
-- 2. CREATE INDEXES for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_rooms_is_official ON rooms(is_official);
CREATE INDEX IF NOT EXISTS idx_rooms_base_name ON rooms(base_name) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity);
CREATE INDEX IF NOT EXISTS idx_rooms_owner_last_visit ON rooms(owner_last_visit) WHERE is_official = false;
CREATE INDEX IF NOT EXISTS idx_rooms_instance_number ON rooms(instance_number) WHERE is_official = true;

-- Composite index for finding available instances
CREATE INDEX IF NOT EXISTS idx_rooms_scaling ON rooms(base_name, is_official, instance_number, participants);

-- ============================================================================
-- 3. TRIGGER: Auto-populate base_name from room name
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_base_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract base name by removing instance number (e.g., "São Paulo #2" -> "São Paulo")
  IF NEW.is_official = true THEN
    NEW.base_name := REGEXP_REPLACE(NEW.name, ' #[0-9]+$', '');
  ELSE
    NEW.base_name := NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_extract_base_name
  BEFORE INSERT OR UPDATE OF name, is_official ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION extract_base_name();

-- ============================================================================
-- 4. FUNCTION: Auto-scale room when it reaches 93% capacity (28/30)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_scale_room(room_id_param UUID)
RETURNS JSON AS $$
DECLARE
  target_room RECORD;
  available_instance RECORD;
  max_instance_num INTEGER;
  new_room_id UUID;
  result JSON;
BEGIN
  -- Get the target room
  SELECT * INTO target_room FROM rooms WHERE id = room_id_param;

  -- Only auto-scale official rooms
  IF target_room.is_official = false THEN
    RETURN json_build_object('action', 'skip', 'reason', 'not_official_room');
  END IF;

  -- Check capacity threshold (93% = 28/30)
  IF (target_room.participants::float / target_room.max_users::float) < 0.93 THEN
    RETURN json_build_object('action', 'skip', 'reason', 'below_threshold', 'capacity', ROUND((target_room.participants::float / target_room.max_users::float) * 100, 2));
  END IF;

  -- Check if there's already an available instance (< 20 participants)
  SELECT * INTO available_instance
  FROM rooms
  WHERE base_name = target_room.base_name
    AND is_official = true
    AND participants < 20
    AND id != room_id_param
  ORDER BY instance_number ASC
  LIMIT 1;

  IF available_instance IS NOT NULL THEN
    RETURN json_build_object(
      'action', 'skip',
      'reason', 'available_instance_exists',
      'available_room_id', available_instance.id,
      'available_room_name', available_instance.name,
      'available_room_participants', available_instance.participants
    );
  END IF;

  -- Find max instance number for this base_name
  SELECT COALESCE(MAX(instance_number), 0) INTO max_instance_num
  FROM rooms
  WHERE base_name = target_room.base_name AND is_official = true;

  -- Create new instance
  new_room_id := gen_random_uuid();

  INSERT INTO rooms (
    id,
    name,
    description,
    category,
    subcategory,
    theme,
    sub_theme,
    max_users,
    is_official,
    instance_number,
    base_name,
    is_private,
    requires_subscription,
    owner_id,
    created_by,
    created_at,
    last_activity
  )
  VALUES (
    new_room_id,
    target_room.base_name || ' #' || (max_instance_num + 1),
    target_room.description,
    target_room.category,
    target_room.subcategory,
    target_room.theme,
    target_room.sub_theme,
    target_room.max_users,
    true,
    max_instance_num + 1,
    target_room.base_name,
    target_room.is_private,
    target_room.requires_subscription,
    target_room.owner_id,
    'system',
    NOW(),
    NOW()
  );

  RETURN json_build_object(
    'action', 'created',
    'new_room_id', new_room_id,
    'new_room_name', target_room.base_name || ' #' || (max_instance_num + 1),
    'instance_number', max_instance_num + 1,
    'trigger_room', target_room.name,
    'trigger_capacity', ROUND((target_room.participants::float / target_room.max_users::float) * 100, 2)
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_scale_room IS 'Auto-creates new room instance when official room reaches 93% capacity';

-- ============================================================================
-- 5. FUNCTION: Smart join - find best available instance or create new
-- ============================================================================

CREATE OR REPLACE FUNCTION smart_join_room(base_name_param VARCHAR, user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  best_room RECORD;
  all_instances RECORD;
  new_room_result JSON;
BEGIN
  -- Find best available instance (most participants but not full)
  SELECT * INTO best_room
  FROM rooms
  WHERE base_name = base_name_param
    AND is_official = true
    AND participants < max_users
    AND is_active = true
  ORDER BY participants DESC, instance_number ASC
  LIMIT 1;

  IF best_room IS NOT NULL THEN
    RETURN json_build_object(
      'action', 'join_existing',
      'room_id', best_room.id,
      'room_name', best_room.name,
      'instance_number', best_room.instance_number,
      'participants', best_room.participants,
      'max_users', best_room.max_users
    );
  END IF;

  -- No available instance found - check if any instance exists
  SELECT * INTO all_instances
  FROM rooms
  WHERE base_name = base_name_param AND is_official = true
  LIMIT 1;

  IF all_instances IS NULL THEN
    RETURN json_build_object('action', 'error', 'reason', 'no_official_room_exists');
  END IF;

  -- All instances are full - trigger auto-scale on instance #1
  SELECT auto_scale_room(
    (SELECT id FROM rooms WHERE base_name = base_name_param AND instance_number = 1 LIMIT 1)
  ) INTO new_room_result;

  RETURN json_build_object(
    'action', 'created_and_join',
    'auto_scale_result', new_room_result,
    'message', 'All instances full - created new instance'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION smart_join_room IS 'Finds best available room instance or triggers auto-scaling if all full';

-- ============================================================================
-- 6. FUNCTION: Daily cleanup - remove empty/inactive rooms
-- ============================================================================

CREATE OR REPLACE FUNCTION daily_cleanup_rooms()
RETURNS JSON AS $$
DECLARE
  deleted_community_inactive INTEGER;
  deleted_community_empty INTEGER;
  deleted_official_instances INTEGER;
  total_deleted INTEGER;
  current_hour INTEGER;
  empty_threshold_hours INTEGER;
BEGIN
  -- Get current hour (0-23)
  current_hour := EXTRACT(HOUR FROM NOW());

  -- Aggressive cleanup at night (3AM-6AM): 6 hours empty
  -- Normal cleanup during day (6AM-11PM): 24 hours empty
  -- Light cleanup late night (11PM-3AM): 48 hours empty
  IF current_hour >= 3 AND current_hour < 6 THEN
    empty_threshold_hours := 6;
  ELSIF current_hour >= 6 AND current_hour < 23 THEN
    empty_threshold_hours := 24;
  ELSE
    empty_threshold_hours := 48;
  END IF;

  -- 1. Delete community rooms where owner hasn't visited in 7 days
  WITH deleted AS (
    DELETE FROM rooms
    WHERE is_official = false
      AND owner_last_visit < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_community_inactive FROM deleted;

  -- 2. Delete community rooms that are empty for threshold hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE is_official = false
      AND participants = 0
      AND last_activity < NOW() - (empty_threshold_hours || ' hours')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_community_empty FROM deleted;

  -- 3. Delete official room instances (NOT #1) that are empty for threshold hours
  WITH deleted AS (
    DELETE FROM rooms
    WHERE is_official = true
      AND instance_number > 1
      AND participants = 0
      AND last_activity < NOW() - (empty_threshold_hours || ' hours')::INTERVAL
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_official_instances FROM deleted;

  total_deleted := deleted_community_inactive + deleted_community_empty + deleted_official_instances;

  RETURN json_build_object(
    'timestamp', NOW(),
    'hour', current_hour,
    'empty_threshold_hours', empty_threshold_hours,
    'deleted_community_inactive', deleted_community_inactive,
    'deleted_community_empty', deleted_community_empty,
    'deleted_official_instances', deleted_official_instances,
    'total_deleted', total_deleted
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION daily_cleanup_rooms IS 'Removes inactive/empty rooms based on time-of-day thresholds';

-- ============================================================================
-- 7. SCHEDULE: Daily cleanup at 3AM using pg_cron
-- ============================================================================

-- Enable pg_cron extension (requires superuser - run this manually in Supabase dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 3:00 AM (actually runs every hour but uses smart thresholds)
-- Uncomment after enabling pg_cron:
-- SELECT cron.schedule(
--   'daily-room-cleanup',
--   '0 * * * *', -- Every hour at minute 0
--   $$SELECT daily_cleanup_rooms();$$
-- );

-- ============================================================================
-- 8. TRIGGER: Update last_activity on participant changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_room_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_activity when participants join/leave
  IF NEW.participants != OLD.participants THEN
    NEW.last_activity := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_activity
  BEFORE UPDATE OF participants ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_activity();

-- ============================================================================
-- 9. POPULATE INITIAL OFFICIAL ROOMS (30 rooms)
-- ============================================================================

-- Clear existing rooms (be careful in production!)
-- DELETE FROM rooms;

-- Insert 30 official rooms across all categories
INSERT INTO rooms (id, name, description, category, subcategory, theme, sub_theme, max_users, is_official, instance_number, is_private, requires_subscription, created_by, participants, is_active)
VALUES
  -- Geral Brasil (most popular - start with 3 instances)
  (gen_random_uuid(), '🔥 Geral Brasil', 'Sala principal - papo sobre tudo!', 'objetivo', 'diversao', 'Networking', 'Geral', 30, true, 1, false, 'free', 'system', 30, true),
  (gen_random_uuid(), '🔥 Geral Brasil #2', 'Sala principal - papo sobre tudo!', 'objetivo', 'diversao', 'Networking', 'Geral', 30, true, 2, false, 'free', 'system', 28, true),
  (gen_random_uuid(), '🔥 Geral Brasil #3', 'Sala principal - papo sobre tudo!', 'objetivo', 'diversao', 'Networking', 'Geral', 30, true, 3, false, 'free', 'system', 18, true),

  -- Por Idade
  (gen_random_uuid(), '👶 18-25 anos (Gen Z)', 'Zoomer squad - memes, TikTok e caos', 'idade', '18-25', 'Idade', '18-25', 30, true, 1, false, 'free', 'system', 25, true),
  (gen_random_uuid(), '🧑 26-35 anos (Millennials)', 'Nostalgia, carreira e crise existencial', 'idade', '26-35', 'Idade', '26-35', 30, true, 1, false, 'free', 'system', 22, true),
  (gen_random_uuid(), '👨 36-45 anos', 'Experiência, família e projetos', 'idade', '36-45', 'Idade', '36-45', 30, true, 1, false, 'free', 'system', 18, true),
  (gen_random_uuid(), '👴 46+ anos', 'Sabedoria e boas histórias', 'idade', '46+', 'Idade', '46+', 30, true, 1, false, 'free', 'system', 15, true),

  -- Por Localização (top 5 states)
  (gen_random_uuid(), '🏙️ São Paulo', 'Paulistanos e paulistas reunidos', 'localizacao', 'sp', 'Localização', 'São Paulo', 30, true, 1, false, 'free', 'system', 30, true),
  (gen_random_uuid(), '🏙️ São Paulo #2', 'Paulistanos e paulistas reunidos', 'localizacao', 'sp', 'Localização', 'São Paulo', 30, true, 2, false, 'free', 'system', 25, true),
  (gen_random_uuid(), '🏙️ São Paulo #3', 'Paulistanos e paulistas reunidos', 'localizacao', 'sp', 'Localização', 'São Paulo', 30, true, 3, false, 'free', 'system', 12, true),
  (gen_random_uuid(), '🏖️ Rio de Janeiro', 'Cariocas e fluminenses', 'localizacao', 'rj', 'Localização', 'Rio de Janeiro', 30, true, 1, false, 'free', 'system', 24, true),
  (gen_random_uuid(), '🏖️ Rio de Janeiro #2', 'Cariocas e fluminenses', 'localizacao', 'rj', 'Localização', 'Rio de Janeiro', 30, true, 2, false, 'free', 'system', 16, true),
  (gen_random_uuid(), '⛰️ Minas Gerais', 'Trem bão, sô!', 'localizacao', 'mg', 'Localização', 'Minas Gerais', 30, true, 1, false, 'free', 'system', 20, true),
  (gen_random_uuid(), '🌾 Rio Grande do Sul', 'Tchê, bah!', 'localizacao', 'rs', 'Localização', 'Rio Grande do Sul', 30, true, 1, false, 'free', 'system', 18, true),
  (gen_random_uuid(), '🏝️ Bahia', 'Axé e energia baiana', 'localizacao', 'ba', 'Localização', 'Bahia', 30, true, 1, false, 'free', 'system', 14, true),

  -- Por Interesse (top 10)
  (gen_random_uuid(), '💻 Tech & Programação', 'Devs, startups e inovação', 'interesse', 'tech', 'Interesse', 'Tech', 30, true, 1, false, 'free', 'system', 28, true),
  (gen_random_uuid(), '🎵 Música', 'Shows, bandas, playlists e karaokê', 'interesse', 'musica', 'Interesse', 'Música', 30, true, 1, false, 'free', 'system', 22, true),
  (gen_random_uuid(), '⚽ Esportes', 'Futebol, lutas, olimpíadas', 'interesse', 'esportes', 'Interesse', 'Esportes', 30, true, 1, false, 'free', 'system', 26, true),
  (gen_random_uuid(), '🎨 Arte & Design', 'Criatividade sem limites', 'interesse', 'arte', 'Interesse', 'Arte', 30, true, 1, false, 'free', 'system', 15, true),
  (gen_random_uuid(), '🍳 Culinária', 'Receitas, restaurantes e food porn', 'interesse', 'culinaria', 'Interesse', 'Culinária', 30, true, 1, false, 'free', 'system', 18, true),
  (gen_random_uuid(), '✈️ Viagens', 'Destinos, dicas e aventuras', 'interesse', 'viagens', 'Interesse', 'Viagens', 30, true, 1, false, 'free', 'system', 20, true),
  (gen_random_uuid(), '🎮 Games', 'PC, console, mobile - todas as plataformas', 'interesse', 'games', 'Interesse', 'Games', 30, true, 1, false, 'free', 'system', 24, true),
  (gen_random_uuid(), '📺 Séries & Filmes', 'Netflix, Prime, HBO e tudo mais', 'interesse', 'series', 'Interesse', 'Séries', 30, true, 1, false, 'free', 'system', 21, true),

  -- Por Idioma
  (gen_random_uuid(), '🇧🇷 Português', 'Galera brasileira', 'idioma', 'pt', 'Idioma', 'Português', 30, true, 1, false, 'free', 'system', 30, true),
  (gen_random_uuid(), '🇺🇸 English Practice', 'Practice your English!', 'idioma', 'en', 'Idioma', 'English', 30, true, 1, false, 'free', 'system', 19, true),
  (gen_random_uuid(), '🇪🇸 Español', '¡Hablemos español!', 'idioma', 'es', 'Idioma', 'Español', 30, true, 1, false, 'free', 'system', 12, true),

  -- Por Vibe
  (gen_random_uuid(), '😌 Chill Vibes', 'Relaxa e vem prosear', 'vibe', 'chill', 'Vibe', 'Chill', 30, true, 1, false, 'free', 'system', 16, true),
  (gen_random_uuid(), '⚡ Energia Alta', 'Galera animada e extrovertida', 'vibe', 'energetico', 'Vibe', 'Energético', 30, true, 1, false, 'free', 'system', 23, true),
  (gen_random_uuid(), '🧠 Papo Cabeça', 'Filosofia, ciência e debates', 'vibe', 'intelectual', 'Vibe', 'Intelectual', 30, true, 1, false, 'free', 'system', 14, true),

  -- Trending
  (gen_random_uuid(), '🔥 BBB 25 - Ao Vivo', 'Comentando o reality em tempo real', 'trending', 'reality', 'Trending', 'Reality', 30, true, 1, false, 'free', 'system', 29, true)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION auto_scale_room TO authenticated;
GRANT EXECUTE ON FUNCTION smart_join_room TO authenticated;
GRANT EXECUTE ON FUNCTION daily_cleanup_rooms TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Added 6 new columns to rooms table
-- ✅ Created 5 indexes for performance
-- ✅ Created trigger for auto-populating base_name
-- ✅ Created auto_scale_room function (creates new instances at 93% capacity)
-- ✅ Created smart_join_room function (finds best available instance)
-- ✅ Created daily_cleanup_rooms function (removes inactive/empty rooms)
-- ✅ Created trigger to update last_activity
-- ✅ Populated 30 official rooms with multiple instances for popular ones
-- ✅ Ready for pg_cron scheduling (requires manual setup in Supabase dashboard)
