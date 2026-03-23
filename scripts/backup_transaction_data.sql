-- ============================================================================
-- Transaction Data 백업 스크립트
-- ============================================================================
-- 목적: Migration 실행 전 Transaction Data 백업
-- 실행 시점: Stage 1 Migration 실행 직전
-- 백업 대상: worklogs, worklog_manpower, documents, punch_groups 등
-- 주의: 데이터 크기가 클 수 있으므로 실행 시간이 오래 걸릴 수 있음
-- ============================================================================

-- 백업 시작 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Transaction Data 백업 시작';
  RAISE NOTICE '백업 일시: %', now();
  RAISE NOTICE '⚠️  데이터 크기에 따라 시간이 오래 걸릴 수 있습니다.';
  RAISE NOTICE '============================================================================';
END $$;

-- 1. worklogs 백업
CREATE TABLE IF NOT EXISTS public.worklogs_backup_20260325 AS
SELECT * FROM public.worklogs;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.worklogs_backup_20260325;
  RAISE NOTICE '✅ worklogs 백업 완료: % 건', v_count;
END $$;

-- 2. worklog_manpower 백업
CREATE TABLE IF NOT EXISTS public.worklog_manpower_backup_20260325 AS
SELECT * FROM public.worklog_manpower;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.worklog_manpower_backup_20260325;
  RAISE NOTICE '✅ worklog_manpower 백업 완료: % 건', v_count;
END $$;

-- 3. worklog_materials 백업
CREATE TABLE IF NOT EXISTS public.worklog_materials_backup_20260325 AS
SELECT * FROM public.worklog_materials;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.worklog_materials_backup_20260325;
  RAISE NOTICE '✅ worklog_materials 백업 완료: % 건', v_count;
END $$;

-- 4. worklog_worksets 백업
CREATE TABLE IF NOT EXISTS public.worklog_worksets_backup_20260325 AS
SELECT * FROM public.worklog_worksets;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.worklog_worksets_backup_20260325;
  RAISE NOTICE '✅ worklog_worksets 백업 완료: % 건', v_count;
END $$;

-- 5. documents 백업
CREATE TABLE IF NOT EXISTS public.documents_backup_20260325 AS
SELECT * FROM public.documents;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.documents_backup_20260325;
  RAISE NOTICE '✅ documents 백업 완료: % 건', v_count;
END $$;

-- 6. punch_groups 백업
CREATE TABLE IF NOT EXISTS public.punch_groups_backup_20260325 AS
SELECT * FROM public.punch_groups;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.punch_groups_backup_20260325;
  RAISE NOTICE '✅ punch_groups 백업 완료: % 건', v_count;
END $$;

-- 7. punch_items 백업
CREATE TABLE IF NOT EXISTS public.punch_items_backup_20260325 AS
SELECT * FROM public.punch_items;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.punch_items_backup_20260325;
  RAISE NOTICE '✅ punch_items 백업 완료: % 건', v_count;
END $$;

-- 8. partner_deployments 백업
CREATE TABLE IF NOT EXISTS public.partner_deployments_backup_20260325 AS
SELECT * FROM public.partner_deployments;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.partner_deployments_backup_20260325;
  RAISE NOTICE '✅ partner_deployments 백업 완료: % 건', v_count;
END $$;

-- 9. site_lodgings 백업 (존재하는 경우)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'site_lodgings'
  ) THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.site_lodgings_backup_20260325 AS SELECT * FROM public.site_lodgings';
    RAISE NOTICE '✅ site_lodgings 백업 완료';
  ELSE
    RAISE NOTICE '⚠️  site_lodgings 테이블 없음 (건너뜀)';
  END IF;
END $$;

-- 백업 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Transaction Data 백업 완료';
  RAISE NOTICE '백업 테이블: 8-9개';
  RAISE NOTICE '백업 완료 일시: %', now();
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '백업 확인 SQL:';
  RAISE NOTICE 'SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass))';
  RAISE NOTICE 'FROM information_schema.tables';
  RAISE NOTICE 'WHERE table_schema = ''public'' AND table_name LIKE ''%%_backup_20260325''';
  RAISE NOTICE 'ORDER BY pg_total_relation_size(quote_ident(table_name)::regclass) DESC;';
  RAISE NOTICE '============================================================================';
END $$;
