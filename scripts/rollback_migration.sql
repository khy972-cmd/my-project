-- ============================================================================
-- Migration 롤백 스크립트
-- ============================================================================
-- 목적: Stage 1 Migration 롤백 (Additive Only 취소)
-- 실행 시점: Migration 실행 후 문제 발생 시
-- 작업: 새 테이블 삭제, profiles 컬럼 제거, UNIQUE 제약 제거
-- 주의: 기존 테이블은 유지됨 (worklogs, worklog_manpower, documents 등)
-- ============================================================================

-- 롤백 시작 메시지
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration 롤백 시작';
  RAISE NOTICE '롤백 일시: %', now();
  RAISE NOTICE '⚠️  이 작업은 Stage 1 Migration을 완전히 취소합니다.';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- STEP 1: Trigger 제거
-- ============================================================================

DROP TRIGGER IF EXISTS trg_auto_create_wages ON public.worklogs;
DROP TRIGGER IF EXISTS trg_site_documents_updated_at ON public.site_documents;
DROP TRIGGER IF EXISTS trg_drawing_markings_updated_at ON public.drawing_markings;
DROP TRIGGER IF EXISTS trg_punch_lists_updated_at ON public.punch_lists;
DROP TRIGGER IF EXISTS trg_punch_items_new_updated_at ON public.punch_items_new;
DROP TRIGGER IF EXISTS trg_site_wages_updated_at ON public.site_wages;
DROP TRIGGER IF EXISTS trg_site_documents_search_vector ON public.site_documents;
DROP TRIGGER IF EXISTS trg_punch_lists_search_vector ON public.punch_lists;

RAISE NOTICE '✅ Trigger 제거 완료';

-- ============================================================================
-- STEP 2: Trigger 함수 제거
-- ============================================================================

DROP FUNCTION IF EXISTS public.auto_create_wages() CASCADE;
DROP FUNCTION IF EXISTS public.update_site_documents_search_vector() CASCADE;
DROP FUNCTION IF EXISTS public.update_punch_lists_search_vector() CASCADE;
-- set_updated_at 함수는 다른 곳에서도 사용할 수 있으므로 유지

RAISE NOTICE '✅ Trigger 함수 제거 완료';

-- ============================================================================
-- STEP 3: 새 테이블 삭제 (CASCADE로 RLS 정책도 함께 삭제)
-- ============================================================================

DROP TABLE IF EXISTS public.site_wages CASCADE;
RAISE NOTICE '✅ site_wages 테이블 삭제 완료';

DROP TABLE IF EXISTS public.punch_items_new CASCADE;
RAISE NOTICE '✅ punch_items_new 테이블 삭제 완료';

DROP TABLE IF EXISTS public.punch_lists CASCADE;
RAISE NOTICE '✅ punch_lists 테이블 삭제 완료';

DROP TABLE IF EXISTS public.drawing_markings CASCADE;
RAISE NOTICE '✅ drawing_markings 테이블 삭제 완료';

DROP TABLE IF EXISTS public.site_documents CASCADE;
RAISE NOTICE '✅ site_documents 테이블 삭제 완료';

DROP TABLE IF EXISTS public.worklog_workers CASCADE;
RAISE NOTICE '✅ worklog_workers 테이블 삭제 완료';

-- ============================================================================
-- STEP 4: UNIQUE 제약 제거
-- ============================================================================

DROP INDEX IF EXISTS public.idx_worklogs_unique_site_date_creator;
RAISE NOTICE '✅ UNIQUE 제약 제거 완료';

-- ============================================================================
-- STEP 5: profiles 컬럼 제거
-- ============================================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_wage;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_active;
RAISE NOTICE '✅ profiles 컬럼 제거 완료 (daily_wage, is_active)';

-- ============================================================================
-- STEP 6: orphans 테이블 복원 (선택사항)
-- ============================================================================

-- 주의: orphans 테이블은 백업이 없으므로 복원 불가
-- 필요 시 수동으로 재생성 필요
RAISE NOTICE '⚠️  orphans 테이블은 복원되지 않음 (백업 없음)';

-- ============================================================================
-- STEP 7: 롤백 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration 롤백 완료';
  RAISE NOTICE '롤백 완료 일시: %', now();
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '✅ 새 테이블 삭제: 6개';
  RAISE NOTICE '✅ profiles 컬럼 제거: 2개';
  RAISE NOTICE '✅ UNIQUE 제약 제거: 1개';
  RAISE NOTICE '✅ Trigger 제거: 8개';
  RAISE NOTICE '✅ Trigger 함수 제거: 3개';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '⚠️  기존 테이블 유지됨:';
  RAISE NOTICE '   - worklogs';
  RAISE NOTICE '   - worklog_manpower';
  RAISE NOTICE '   - worklog_materials';
  RAISE NOTICE '   - worklog_worksets';
  RAISE NOTICE '   - documents';
  RAISE NOTICE '   - punch_groups';
  RAISE NOTICE '   - punch_items';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 기존 기능 정상 동작 확인';
  RAISE NOTICE '2. 타입 재생성 (이전 버전): npx supabase gen types typescript';
  RAISE NOTICE '3. 프론트엔드 빌드 확인';
  RAISE NOTICE '============================================================================';
END $$;
