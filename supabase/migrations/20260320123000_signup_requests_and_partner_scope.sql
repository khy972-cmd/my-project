-- Approval-based signup flow for internal + partner users
-- - Partner company names are collected privately and never exposed as a suggestion list.
-- - Approved partner access is limited by organizations/org_members/sites.org_id.
-- - site_members remains available for manual site exceptions.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
  ON public.profiles (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_role_unique
  ON public.user_roles (user_id, role);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_user_org_unique
  ON public.org_members (user_id, org_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_members_user_site_unique
  ON public.site_members (user_id, site_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE user_id = _user_id
      AND org_id = _org_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_site_member(_user_id UUID, _site_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_members
    WHERE user_id = _user_id
      AND site_id = _site_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_site(_site_id UUID, _user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.has_role(_user_id, 'admin')
     OR public.has_role(_user_id, 'manager')
     OR public.has_role(_user_id, 'worker') THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE s.id = _site_id
      AND (
        (s.org_id IS NOT NULL AND public.is_org_member(_user_id, s.org_id))
        OR public.is_site_member(_user_id, s.id)
      )
  );
END;
$$;

CREATE TABLE IF NOT EXISTS public.signup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NULL,
  requested_role public.app_role NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('internal', 'partner')),
  requested_company_name TEXT NULL,
  job_title TEXT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_org_id UUID NULL REFERENCES public.organizations(id) ON DELETE SET NULL,
  admin_note TEXT NULL,
  reviewed_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT signup_requests_partner_company_required CHECK (
    request_type <> 'partner'
    OR NULLIF(BTRIM(COALESCE(requested_company_name, '')), '') IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_signup_requests_user_id_unique
  ON public.signup_requests (user_id);

CREATE INDEX IF NOT EXISTS idx_signup_requests_status_created_at
  ON public.signup_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signup_requests_request_type_status
  ON public.signup_requests (request_type, status);

CREATE INDEX IF NOT EXISTS idx_signup_requests_assigned_org_id
  ON public.signup_requests (assigned_org_id);

CREATE OR REPLACE FUNCTION public.set_signup_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_signup_requests_updated_at ON public.signup_requests;

CREATE TRIGGER trg_signup_requests_updated_at
BEFORE UPDATE ON public.signup_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_signup_requests_updated_at();

CREATE OR REPLACE FUNCTION public.handle_signup_request_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_type TEXT := LOWER(
    COALESCE(
      NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'signup_request_type'), ''),
      CASE
        WHEN NEW.raw_user_meta_data ->> 'affiliation' = 'partner_company' THEN 'partner'
        ELSE 'internal'
      END
    )
  );
  v_name TEXT := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    NULLIF(BTRIM(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), ''),
    '사용자'
  );
  v_phone TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'phone'), '');
  v_job_title TEXT := NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'job_title'), '');
  v_requested_company_name TEXT := NULLIF(
    BTRIM(
      COALESCE(
        NEW.raw_user_meta_data ->> 'requested_company_name',
        NEW.raw_user_meta_data ->> 'partner_name',
        ''
      )
    ),
    ''
  );
  v_requested_role public.app_role := CASE
    WHEN v_request_type = 'partner' THEN 'partner'::public.app_role
    ELSE 'worker'::public.app_role
  END;
BEGIN
  INSERT INTO public.signup_requests (
    user_id,
    email,
    name,
    phone,
    requested_role,
    request_type,
    requested_company_name,
    job_title,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_name,
    v_phone,
    v_requested_role,
    CASE WHEN v_request_type = 'partner' THEN 'partner' ELSE 'internal' END,
    v_requested_company_name,
    v_job_title,
    'pending'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        requested_role = EXCLUDED.requested_role,
        request_type = EXCLUDED.request_type,
        requested_company_name = EXCLUDED.requested_company_name,
        job_title = EXCLUDED.job_title,
        status = 'pending',
        assigned_org_id = NULL,
        admin_note = NULL,
        reviewed_by = NULL,
        reviewed_at = NULL,
        updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_signup_request ON auth.users;

CREATE TRIGGER on_auth_user_created_signup_request
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_signup_request_from_auth_user();

CREATE OR REPLACE FUNCTION public.admin_approve_signup_request(
  _request_id UUID,
  _assigned_role public.app_role DEFAULT NULL,
  _assigned_org_id UUID DEFAULT NULL,
  _admin_note TEXT DEFAULT NULL
)
RETURNS public.signup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.signup_requests%ROWTYPE;
  v_role public.app_role;
  v_affiliation TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  SELECT *
  INTO v_request
  FROM public.signup_requests
  WHERE id = _request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'signup_request_not_found';
  END IF;

  v_role := COALESCE(
    _assigned_role,
    CASE
      WHEN v_request.request_type = 'partner' THEN 'partner'::public.app_role
      ELSE v_request.requested_role
    END
  );

  IF v_request.request_type = 'partner' THEN
    IF v_role <> 'partner' THEN
      RAISE EXCEPTION 'partner_request_must_use_partner_role';
    END IF;

    IF _assigned_org_id IS NULL THEN
      RAISE EXCEPTION 'assigned_org_id_required';
    END IF;

    SELECT name
    INTO v_affiliation
    FROM public.organizations
    WHERE id = _assigned_org_id;

    IF v_affiliation IS NULL THEN
      RAISE EXCEPTION 'organization_not_found';
    END IF;

    DELETE FROM public.org_members
    WHERE user_id = v_request.user_id;

    INSERT INTO public.org_members (user_id, org_id, role)
    VALUES (v_request.user_id, _assigned_org_id, 'partner')
    ON CONFLICT (user_id, org_id) DO UPDATE
      SET role = EXCLUDED.role;
  ELSE
    v_affiliation := '이노피앤씨';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_request.user_id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (user_id, name, phone, affiliation, job_title)
  VALUES (
    v_request.user_id,
    v_request.name,
    NULLIF(v_request.phone, ''),
    v_affiliation,
    NULLIF(v_request.job_title, '')
  )
  ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        affiliation = EXCLUDED.affiliation,
        job_title = COALESCE(EXCLUDED.job_title, public.profiles.job_title),
        updated_at = now();

  UPDATE public.signup_requests
  SET status = 'approved',
      assigned_org_id = CASE WHEN v_request.request_type = 'partner' THEN _assigned_org_id ELSE NULL END,
      admin_note = _admin_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id
  RETURNING *
  INTO v_request;

  RETURN v_request;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_signup_request(
  _request_id UUID,
  _admin_note TEXT DEFAULT NULL
)
RETURNS public.signup_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.signup_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  UPDATE public.signup_requests
  SET status = 'rejected',
      admin_note = _admin_note,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _request_id
  RETURNING *
  INTO v_request;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'signup_request_not_found';
  END IF;

  RETURN v_request;
END;
$$;

ALTER TABLE public.signup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sites'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.sites', v_policy.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organizations'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.organizations', v_policy.policyname);
  END LOOP;
END $$;

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'signup_requests'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.signup_requests', v_policy.policyname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles select own_or_admin'
  ) THEN
    CREATE POLICY "user_roles select own_or_admin"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles write admin_only'
  ) THEN
    CREATE POLICY "user_roles write admin_only"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'org_members' AND policyname = 'org_members select own_or_admin'
  ) THEN
    CREATE POLICY "org_members select own_or_admin"
    ON public.org_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'org_members' AND policyname = 'org_members write admin_only'
  ) THEN
    CREATE POLICY "org_members write admin_only"
    ON public.org_members
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_members' AND policyname = 'site_members select own_or_admin'
  ) THEN
    CREATE POLICY "site_members select own_or_admin"
    ON public.site_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_members' AND policyname = 'site_members write admin_only'
  ) THEN
    CREATE POLICY "site_members write admin_only"
    ON public.site_members
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE POLICY "organizations select scoped"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.is_org_member(auth.uid(), id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'organizations write admin_only'
  ) THEN
    CREATE POLICY "organizations write admin_only"
    ON public.organizations
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE POLICY "sites select scoped"
ON public.sites
FOR SELECT
TO authenticated
USING (public.can_access_site(id, auth.uid()));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'sites' AND policyname = 'sites write admin_manager'
  ) THEN
    CREATE POLICY "sites write admin_manager"
    ON public.sites
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles select own_or_admin'
  ) THEN
    CREATE POLICY "profiles select own_or_admin"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles insert own_or_admin'
  ) THEN
    CREATE POLICY "profiles insert own_or_admin"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles update own_or_admin'
  ) THEN
    CREATE POLICY "profiles update own_or_admin"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE POLICY "signup_requests select own_or_admin"
ON public.signup_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "signup_requests insert own"
ON public.signup_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "signup_requests update admin_only"
ON public.signup_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "signup_requests delete admin_only"
ON public.signup_requests
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'list_signup_partner_companies'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.list_signup_partner_companies() FROM anon, authenticated';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_approve_signup_request(UUID, public.app_role, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_signup_request(UUID, TEXT) TO authenticated;
