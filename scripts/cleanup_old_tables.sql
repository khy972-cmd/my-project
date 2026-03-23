-- ============================================================================
-- Cleanup 스크립트 (Stage 3 - 선택사항)
-- ============================================================================
-- 목적: 기존 테이블 삭제 및 새 테이블로 완전 전환
-- 실행 시점: Stage 2 (프론트엔드 전환) 완료 + 배포 완료 + 모든 기능 정상 동작 확인 후
-- 주의: 파괴적 작업! 반드시 사용자 명시적 승인 필요
-- 전제 조건:
--   1. Stage 1 Migration 완료
--   2. Stage 2 프론트엔드 전환 완료
--   3. 배포 완료
--   4. 최소 1주일 이상 정상 동작 확인
--   5. 사용자 피드백 수집 완료
--   6. 백업 완료
-- ============================================================================

-- ⚠️⚠️⚠️ 경고 메시지 ⚠️⚠️⚠️
DO $$
BEGIN
  RAISE WARNING '============================================================================';
  RAISE WARNING '⚠️⚠️⚠️ 경고: 파괴적 작업 ⚠️⚠️⚠️';
  RAISE WARNING '============================================================================';
  RAISE WARNING '이 스크립트는 기존 테이블을 영구 삭제합니다.';
  RAISE WARNING '실행 전 반드시 아래 사항을 확인하세요:';
  RAISE WARNING '';
  RAISE WARNING '1. ✅ Stage 1 Migration 완료';
  RAISE WARNING '2. ✅ Stage 2 프론트엔드 전환 완료';
  RAISE WARNING '3. ✅ 배포 완료';
  RAISE WARNING '4. ✅ 최소 1주일 이상 정상 동작 확인';
  RAISE WARNING '5. ✅ 사용자 피드백 수집 완료';
  RAISE WARNING '6. ✅ 백업 완료 (backup_transaction_data.sql 실행)';
  RAISE WARNING '7. ✅ 사용자 명시적 승인 획득';
  RAISE WARNING '';
  RAISE WARNING '위 조건을 모두 만족하지 않으면 절대 실행하지 마세요!';
  RAISE WARNING '============================================================================';
  RAISE WARNING '계속하려면 아래 주석을 해제하고 실행하세요.';
  RAISE WARNING '============================================================================';
END $$;

-- ⚠️ 아래 주석을 해제하면 실제로 삭제됩니다! ⚠️
-- DO $$
-- BEGIN
--   RAISE NOTICE '사용자 승인 확인됨. Cleanup 시작...';
-- END $$;

-- ============================================================================
-- STEP 1: 기존 테이블 삭제 (사용자 승인 후 주석 해제)
-- ============================================================================

-- -- 1. worklog_manpower 삭제 (→ worklog_workers로 대체)
-- DROP TABLE IF EXISTS public.worklog_manpower CASCADE;
-- RAISE NOTICE '✅ worklog_manpower 삭제 완료 (→ worklog_workers로 대체)';

-- -- 2. documents 삭제 (→ site_documents로 대체)
-- DROP TABLE IF EXISTS public.documents CASCADE;
-- RAISE NOTICE '✅ documents 삭제 완료 (→ site_documents로 대체)';

-- -- 3. punch_groups 삭제 (→ punch_lists로 대체)
-- DROP TABLE IF EXISTS public.punch_groups CASCADE;
-- RAISE NOTICE '✅ punch_groups 삭제 완료 (→ punch_lists로 대체)';

-- -- 4. punch_items 삭제 (→ punch_items_new로 대체)
-- DROP TABLE IF EXISTS public.punch_items CASCADE;
-- RAISE NOTICE '✅ punch_items 삭제 완료 (→ punch_items_new로 대체)';

-- ============================================================================
-- STEP 2: 새 테이블 이름 변경 (사용자 승인 후 주석 해제)
-- ============================================================================

-- -- punch_items_new → punch_items
-- ALTER TABLE IF EXISTS public.punch_items_new RENAME TO punch_items;
-- RAISE NOTICE '✅ punch_items_new → punch_items 이름 변경 완료';

-- -- 인덱스 이름도 변경
-- ALTER INDEX IF EXISTS idx_punch_items_new_punch_list_id RENAME TO idx_punch_items_punch_list_id;
-- ALTER INDEX IF EXISTS idx_punch_items_new_assignee RENAME TO idx_punch_items_assignee;
-- ALTER INDEX IF EXISTS idx_punch_items_new_status RENAME TO idx_punch_items_status;
-- ALTER INDEX IF EXISTS idx_punch_items_new_priority RENAME TO idx_punch_items_priority;
-- ALTER INDEX IF EXISTS idx_punch_items_new_created_at RENAME TO idx_punch_items_created_at;
-- RAISE NOTICE '✅ punch_items 인덱스 이름 변경 완료';

-- -- RLS 정책 이름도 변경
-- ALTER POLICY IF EXISTS "punch_items_new_select_scoped" ON public.punch_items RENAME TO "punch_items_select_scoped";
-- ALTER POLICY IF EXISTS "punch_items_new_write_admin_manager" ON public.punch_items RENAME TO "punch_items_write_admin_manager";
-- RAISE NOTICE '✅ punch_items RLS 정책 이름 변경 완료';

-- ============================================================================
-- STEP 3: worklogs.site_name 컬럼 제거 (선택사항, 사용자 승인 후 주석 해제)
-- ============================================================================

-- -- 주의: 프론트엔드에서 완전히 제거된 것을 확인한 후에만 실행
-- -- ALTER TABLE public.worklogs DROP COLUMN IF EXISTS site_name;
-- -- RAISE NOTICE '✅ worklogs.site_name 컬럼 제거 완료 (선택사항)';

-- ============================================================================
-- STEP 4: 백업 테이블 삭제 (선택사항, 사용자 승인 후 주석 해제)
-- ============================================================================

-- -- 주의: 백업이 더 이상 필요 없다고 판단될 때만 실행
-- -- DROP TABLE IF EXISTS public.worklogs_backup_20260325;
-- -- DROP TABLE IF EXISTS public.worklog_manpower_backup_20260325;
-- -- DROP TABLE IF EXISTS public.documents_backup_20260325;
-- -- DROP TABLE IF EXISTS public.punch_groups_backup_20260325;
-- -- DROP TABLE IF EXISTS public.punch_items_backup_20260325;
-- -- RAISE NOTICE '✅ 백업 테이블 삭제 완료 (선택사항)';

-- ============================================================================
-- STEP 5: Cleanup 완료 메시지 (사용자 승인 후 주석 해제)
-- ============================================================================

-- DO $$
-- BEGIN
--   RAISE NOTICE '============================================================================';
--   RAISE NOTICE 'Cleanup 완료';
--   RAISE NOTICE '완료 일시: %', now();
--   RAISE NOTICE '============================================================================';
--   RAISE NOTICE '✅ 기존 테이블 삭제: 4개';
--   RAISE NOTICE '   - worklog_manpower (→ worklog_workers)';
--   RAISE NOTICE '   - documents (→ site_documents)';
--   RAISE NOTICE '   - punch_groups (→ punch_lists)';
--   RAISE NOTICE '   - punch_items (→ punch_items_new → punch_items)';
--   RAISE NOTICE '============================================================================';
--   RAISE NOTICE '✅ 새 테이블로 완전 전환 완료';
--   RAISE NOTICE '============================================================================';
--   RAISE NOTICE '다음 단계:';
--   RAISE NOTICE '1. 모든 기능 정상 동작 재확인';
--   RAISE NOTICE '2. 성능 모니터링';
--   RAISE NOTICE '3. 사용자 피드백 수집';
--   RAISE NOTICE '============================================================================';
-- END $$;

-- ============================================================================
-- 참고: 롤백 불가능
-- ============================================================================
-- 주의: 이 스크립트 실행 후에는 롤백이 불가능합니다.
-- 백업 테이블에서 복원하거나, 전체 데이터베이스 백업에서 복원해야 합니다.
-- ============================================================================
