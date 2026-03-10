-- Admin system configs (additive-only)
-- Simple key/value store for admin console settings.

CREATE TABLE IF NOT EXISTS public.admin_system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_system_configs_key ON public.admin_system_configs(key);

ALTER TABLE public.admin_system_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_system_configs' AND policyname='admin_system_configs select admin_only'
  ) THEN
    CREATE POLICY "admin_system_configs select admin_only"
    ON public.admin_system_configs
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_system_configs' AND policyname='admin_system_configs write admin_only'
  ) THEN
    CREATE POLICY "admin_system_configs write admin_only"
    ON public.admin_system_configs
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin system configs (additive-only)
-- Simple key/value store for admin console settings.

CREATE TABLE IF NOT EXISTS public.admin_system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_system_configs_key ON public.admin_system_configs(key);

ALTER TABLE public.admin_system_configs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_system_configs' AND policyname='admin_system_configs select admin_only'
  ) THEN
    CREATE POLICY "admin_system_configs select admin_only"
    ON public.admin_system_configs
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_system_configs' AND policyname='admin_system_configs write admin_only'
  ) THEN
    CREATE POLICY "admin_system_configs write admin_only"
    ON public.admin_system_configs
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

