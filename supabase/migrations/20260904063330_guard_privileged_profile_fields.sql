-- Own-row RLS authorizes editing a profile, not awarding administrative/paid status.
-- Keep ordinary profile edits and legacy initial 50-credit inserts compatible.
CREATE OR REPLACE FUNCTION public.guard_privileged_profile_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.is_admin IS DISTINCT FROM false
        OR NEW.is_vip IS DISTINCT FROM false
        OR NEW.is_elite IS DISTINCT FROM false
        OR NEW.saldo_fichas IS NULL OR NEW.saldo_fichas NOT IN (0, 50)
        OR NEW.total_earned IS DISTINCT FROM 0
        OR NEW.hidden_until IS NOT NULL THEN
        RAISE EXCEPTION 'privileged_profile_fields' USING ERRCODE = '42501';
      END IF;
    ELSE
      IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
        OR NEW.is_vip IS DISTINCT FROM OLD.is_vip
        OR NEW.is_elite IS DISTINCT FROM OLD.is_elite
        OR NEW.saldo_fichas IS DISTINCT FROM OLD.saldo_fichas
        OR NEW.total_earned IS DISTINCT FROM OLD.total_earned
        OR NEW.hidden_until IS DISTINCT FROM OLD.hidden_until THEN
        RAISE EXCEPTION 'privileged_profile_fields' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_privileged_profile_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_privileged_profile_fields ON public.profiles;
CREATE TRIGGER guard_privileged_profile_fields BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_privileged_profile_fields();
