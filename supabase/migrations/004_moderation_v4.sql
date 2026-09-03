-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 004 — Moderação (Plano V4, Fase 3)
-- Idempotente (IF NOT EXISTS). Complementa database/admin-schema.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- Bloqueios pessoais (o usuário não vê mais o bloqueado). Item 3.3.
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL,               -- identity (uuid do usuário OU guest-*)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "own blocks - manage" ON public.blocked_users
    FOR ALL USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Registro de confirmação de idade (18+) com IP. Item 3.6.
CREATE TABLE IF NOT EXISTS public.age_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.age_confirmations ENABLE ROW LEVEL SECURITY;
-- Sem policy de SELECT: só a service role (edge) escreve/lê.

-- Ocultação automática da câmera após denúncias. Item 3.2.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hidden_until TIMESTAMPTZ;

-- Trigger: 2+ denúncias pendentes do mesmo usuário em 10 min → oculta 30 min.
CREATE OR REPLACE FUNCTION public.auto_hide_on_reports() RETURNS TRIGGER AS $$
DECLARE recent INT;
BEGIN
  IF NEW.reported_user_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(DISTINCT reporter_id) INTO recent
  FROM public.reports
  WHERE reported_user_id = NEW.reported_user_id
    AND created_at > NOW() - INTERVAL '10 minutes';
  IF recent >= 2 THEN
    UPDATE public.profiles SET hidden_until = NOW() + INTERVAL '30 minutes'
    WHERE id = NEW.reported_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_hide_on_reports ON public.reports;
CREATE TRIGGER trg_auto_hide_on_reports
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_hide_on_reports();

CREATE INDEX IF NOT EXISTS idx_reports_reported_recent ON public.reports (reported_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_bans_user ON public.user_bans (user_id, expires_at);
