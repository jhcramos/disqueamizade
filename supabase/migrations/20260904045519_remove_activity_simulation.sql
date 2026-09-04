-- Remove discontinued activity settings without changing other admin configuration.
-- admin_settings is installed separately by database/admin-schema.sql in older deployments.
DO $$
BEGIN
  IF to_regclass('public.admin_settings') IS NOT NULL THEN
    UPDATE public.admin_settings
       SET value = value - 'bots_presence' - 'inflated_counters' - 'auto_chat',
           updated_at = now()
     WHERE key = 'cold_start';
  END IF;
END;
$$;
