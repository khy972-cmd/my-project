-- Audit table for worklog_materials changes (additive-only)

CREATE TABLE IF NOT EXISTS public.admin_worklog_material_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  material_id BIGINT NULL,
  worklog_id UUID NULL,
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  before JSONB NULL,
  after JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_worklog_material_audit_created_at ON public.admin_worklog_material_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_worklog_material_audit_worklog_id ON public.admin_worklog_material_audit(worklog_id);

ALTER TABLE public.admin_worklog_material_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_worklog_material_audit' AND policyname='admin_worklog_material_audit select admin_only'
  ) THEN
    CREATE POLICY "admin_worklog_material_audit select admin_only"
    ON public.admin_worklog_material_audit
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_worklog_material_audit' AND policyname='admin_worklog_material_audit insert admin_only'
  ) THEN
    CREATE POLICY "admin_worklog_material_audit insert admin_only"
    ON public.admin_worklog_material_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin materials audit (additive-only)
-- Tracks admin edits on worklog_materials for accountability.

CREATE TABLE IF NOT EXISTS public.admin_worklog_material_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NULL,
  worklog_id UUID NULL,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  before JSONB NULL,
  after JSONB NULL,
  note TEXT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_worklog_material_audit_worklog_id ON public.admin_worklog_material_audit(worklog_id);
CREATE INDEX IF NOT EXISTS idx_admin_worklog_material_audit_created_at ON public.admin_worklog_material_audit(created_at DESC);

ALTER TABLE public.admin_worklog_material_audit ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_worklog_material_audit' AND policyname='admin_worklog_material_audit select admin_only'
  ) THEN
    CREATE POLICY "admin_worklog_material_audit select admin_only"
    ON public.admin_worklog_material_audit
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_worklog_material_audit' AND policyname='admin_worklog_material_audit insert admin_only'
  ) THEN
    CREATE POLICY "admin_worklog_material_audit insert admin_only"
    ON public.admin_worklog_material_audit
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

