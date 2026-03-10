-- Admin parity modules (additive-only)
-- Tables: admin_announcements, admin_work_options, company_doc_types

-- 공지사항
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_roles TEXT[] NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_announcements' AND policyname='admin_announcements select admin_only'
  ) THEN
    CREATE POLICY "admin_announcements select admin_only"
    ON public.admin_announcements
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_announcements' AND policyname='admin_announcements write admin_only'
  ) THEN
    CREATE POLICY "admin_announcements write admin_only"
    ON public.admin_announcements
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 작업 옵션
CREATE TABLE IF NOT EXISTS public.admin_work_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_work_options_category ON public.admin_work_options(category);
CREATE INDEX IF NOT EXISTS idx_admin_work_options_is_active ON public.admin_work_options(is_active);

ALTER TABLE public.admin_work_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_work_options' AND policyname='admin_work_options select admin_only'
  ) THEN
    CREATE POLICY "admin_work_options select admin_only"
    ON public.admin_work_options
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_work_options' AND policyname='admin_work_options write admin_only'
  ) THEN
    CREATE POLICY "admin_work_options write admin_only"
    ON public.admin_work_options
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 필수서류 타입(회사 설정)
CREATE TABLE IF NOT EXISTS public.company_doc_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_doc_types_is_active ON public.company_doc_types(is_active);

ALTER TABLE public.company_doc_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='company_doc_types' AND policyname='company_doc_types select admin_only'
  ) THEN
    CREATE POLICY "company_doc_types select admin_only"
    ON public.company_doc_types
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='company_doc_types' AND policyname='company_doc_types write admin_only'
  ) THEN
    CREATE POLICY "company_doc_types write admin_only"
    ON public.company_doc_types
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Admin parity modules (additive-only)
-- - admin_announcements: 공지사항 관리
-- - admin_work_options: 작업 옵션 관리
-- - company_doc_types: 회사(이노피앤씨) 문서 유형 설정
--
-- Safety:
-- - CREATE IF NOT EXISTS only
-- - No destructive edits
-- - RLS enabled; admin-only policies for write

-- 1) 공지사항
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  target_roles TEXT[] NULL, -- e.g. ['admin','manager','partner','worker']
  target_site_ids UUID[] NULL,
  starts_at TIMESTAMPTZ NULL,
  ends_at TIMESTAMPTZ NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_status ON public.admin_announcements(status);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_created_at ON public.admin_announcements(created_at DESC);

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_announcements' AND policyname='admin_announcements select admin_only'
  ) THEN
    CREATE POLICY "admin_announcements select admin_only"
    ON public.admin_announcements
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_announcements' AND policyname='admin_announcements write admin_only'
  ) THEN
    CREATE POLICY "admin_announcements write admin_only"
    ON public.admin_announcements
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 2) 작업 옵션
CREATE TABLE IF NOT EXISTS public.admin_work_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- member/process/work_type/etc
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, value)
);

CREATE INDEX IF NOT EXISTS idx_admin_work_options_category ON public.admin_work_options(category);
CREATE INDEX IF NOT EXISTS idx_admin_work_options_active ON public.admin_work_options(is_active);

ALTER TABLE public.admin_work_options ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_work_options' AND policyname='admin_work_options select admin_only'
  ) THEN
    CREATE POLICY "admin_work_options select admin_only"
    ON public.admin_work_options
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_work_options' AND policyname='admin_work_options write admin_only'
  ) THEN
    CREATE POLICY "admin_work_options write admin_only"
    ON public.admin_work_options
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 3) 회사 문서 유형(이노피앤씨 설정)
CREATE TABLE IF NOT EXISTS public.company_doc_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- stable identifier
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_doc_types_active ON public.company_doc_types(is_active);

ALTER TABLE public.company_doc_types ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='company_doc_types' AND policyname='company_doc_types select admin_only'
  ) THEN
    CREATE POLICY "company_doc_types select admin_only"
    ON public.company_doc_types
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='company_doc_types' AND policyname='company_doc_types write admin_only'
  ) THEN
    CREATE POLICY "company_doc_types write admin_only"
    ON public.company_doc_types
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

