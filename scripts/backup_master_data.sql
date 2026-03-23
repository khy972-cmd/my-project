-- ============================================================================
-- Master Data 백업 스크립트
-- ============================================================================
-- 목적: Migration 실행 전 Master Data 백업
-- 실행 시점: Stage 1 Migration 실행 직전
-- 백업 대상: sites, profiles, user_roles, organizations 등
-- ============================================================================

-- 백업 시작 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Master Data 백업 시작';
  RAISE NOTICE '백업 일시: %', now();
  RAISE NOTICE '============================================================================';
END $$;

-- 1. sites 백업 (절대 삭제 금지)
CREATE TABLE IF NOT EXISTS public.sites_backup_20260325 AS
SELECT * FROM public.sites;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.sites_backup_20260325;
  RAISE NOTICE '✅ sites 백업 완료: % 건', v_count;
END $$;

-- 2. profiles 백업 (절대 삭제 금지)
CREATE TABLE IF NOT EXISTS public.profiles_backup_20260325 AS
SELECT * FROM public.profiles;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.profiles_backup_20260325;
  RAISE NOTICE '✅ profiles 백업 완료: % 건', v_count;
END $$;

-- 3. user_roles 백업 (절대 삭제 금지)
CREATE TABLE IF NOT EXISTS public.user_roles_backup_20260325 AS
SELECT * FROM public.user_roles;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.user_roles_backup_20260325;
  RAISE NOTICE '✅ user_roles 백업 완료: % 건', v_count;
END $$;

-- 4. organizations 백업 (절대 삭제 금지)
CREATE TABLE IF NOT EXISTS public.organizations_backup_20260325 AS
SELECT * FROM public.organizations;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.organizations_backup_20260325;
  RAISE NOTICE '✅ organizations 백업 완료: % 건', v_count;
END $$;

-- 5. org_members 백업
CREATE TABLE IF NOT EXISTS public.org_members_backup_20260325 AS
SELECT * FROM public.org_members;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.org_members_backup_20260325;
  RAISE NOTICE '✅ org_members 백업 완료: % 건', v_count;
END $$;

-- 6. site_members 백업
CREATE TABLE IF NOT EXISTS public.site_members_backup_20260325 AS
SELECT * FROM public.site_members;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.site_members_backup_20260325;
  RAISE NOTICE '✅ site_members 백업 완료: % 건', v_count;
END $$;

-- 7. admin_user_directory 백업
CREATE TABLE IF NOT EXISTS public.admin_user_directory_backup_20260325 AS
SELECT * FROM public.admin_user_directory;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.admin_user_directory_backup_20260325;
  RAISE NOTICE '✅ admin_user_directory 백업 완료: % 건', v_count;
END $$;

-- 8. signup_requests 백업
CREATE TABLE IF NOT EXISTS public.signup_requests_backup_20260325 AS
SELECT * FROM public.signup_requests;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.signup_requests_backup_20260325;
  RAISE NOTICE '✅ signup_requests 백업 완료: % 건', v_count;
END $$;

-- 9. pending_role_assignments 백업
CREATE TABLE IF NOT EXISTS public.pending_role_assignments_backup_20260325 AS
SELECT * FROM public.pending_role_assignments;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.pending_role_assignments_backup_20260325;
  RAISE NOTICE '✅ pending_role_assignments 백업 완료: % 건', v_count;
END $$;

-- 백업 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Master Data 백업 완료';
  RAISE NOTICE '백업 테이블: 9개';
  RAISE NOTICE '백업 완료 일시: %', now();
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '백업 확인 SQL:';
  RAISE NOTICE 'SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass))';
  RAISE NOTICE 'FROM information_schema.tables';
  RAISE NOTICE 'WHERE table_schema = ''public'' AND table_name LIKE ''%%_backup_20260325'';';
  RAISE NOTICE '============================================================================';
END $$;
