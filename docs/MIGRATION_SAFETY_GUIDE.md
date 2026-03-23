# Migration 안전 가이드

## 📋 개요

이 문서는 Site-Centric Architecture Refactoring의 안전한 실행을 위한 가이드입니다.
파괴적 작업을 최소화하고, 언제든지 롤백 가능하도록 설계되었습니다.

---

## 🎯 Migration 전략

### 3단계 안전 Migration

```
Stage 1: Additive Only (안전, 즉시 실행 가능)
├─ 기존 테이블 유지
├─ 새 테이블 추가
├─ profiles 확장
├─ orphans 삭제
└─ RLS 정책 (새 테이블만)

Stage 2: Frontend Update (프론트엔드 수정)
├─ 타입 재생성
├─ 코드 수정
├─ 빌드 및 테스트
└─ 배포

Stage 3: Cleanup (선택사항, 나중에)
├─ 기존 테이블 삭제
└─ 백업 테이블 삭제
```

---

## ⚠️ 실행 전 필수 체크리스트

### Stage 1 실행 전

- [ ] 백업 완료 확인 (`scripts/backup_master_data.sql` 실행)
- [ ] 백업 완료 확인 (`scripts/backup_transaction_data.sql` 실행)
- [ ] 롤백 스크립트 준비 (`scripts/rollback_migration.sql` 확인)
- [ ] 중복 데이터 사전 점검 (아래 SQL 실행)
  ```sql
  SELECT site_id, work_date, created_by, COUNT(*) as cnt
  FROM public.worklogs
  GROUP BY site_id, work_date, created_by
  HAVING COUNT(*) > 1;
  ```
- [ ] 현재 서비스 정상 동작 확인
- [ ] 사용자 승인 획득

### Stage 2 실행 전

- [ ] Stage 1 Migration 정상 완료 확인
- [ ] 타입 재생성 완료
- [ ] 빌드 성공 확인
- [ ] 로컬 테스트 완료
- [ ] 사용자 승인 획득

### Stage 3 실행 전

- [ ] Stage 2 배포 완료
- [ ] 모든 기능 정상 동작 확인 (최소 1주일)
- [ ] 사용자 피드백 수집
- [ ] 사용자 승인 획득

---

## 🔧 실행 방법

### Stage 1: Additive Only Migration

#### 방법 1: Supabase Dashboard (권장)

1. Supabase Dashboard 접속
2. Project → Database → Migrations
3. "New Migration" 클릭
4. `20260325000001_site_centric_additive_only.sql` 내용 복사/붙여넣기
5. "Run Migration" 클릭
6. 실행 결과 확인

#### 방법 2: Supabase CLI

```bash
# 1. Supabase 로그인
npx supabase login

# 2. 프로젝트 연결
npx supabase link --project-ref YOUR_PROJECT_ID

# 3. Migration 실행
npx supabase db push

# 4. 실행 결과 확인
npx supabase db diff
```

#### 실행 후 검증

```sql
-- 1. 새 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'worklog_workers',
    'site_documents',
    'drawing_markings',
    'punch_lists',
    'punch_items_new',
    'site_wages'
  );
-- 예상 결과: 6개 테이블 모두 존재

-- 2. profiles 컬럼 추가 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('daily_wage', 'is_active');
-- 예상 결과: 2개 컬럼 모두 존재

-- 3. orphans 테이블 삭제 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%_orphans';
-- 예상 결과: 0개 (모두 삭제됨)

-- 4. UNIQUE 제약 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'worklogs'
  AND indexname = 'idx_worklogs_unique_site_date_creator';
-- 예상 결과: 1개 인덱스 존재

-- 5. Trigger 생성 확인
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trg_auto_create_wages',
    'trg_site_documents_updated_at',
    'trg_drawing_markings_updated_at'
  );
-- 예상 결과: 3개 이상 Trigger 존재
```

---

## 🔄 롤백 방법

### Stage 1 롤백 (Migration 실행 후 문제 발생 시)

#### 방법 1: 롤백 스크립트 실행

```bash
# Supabase Dashboard에서 실행
# 또는
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/rollback_migration.sql
```

#### 방법 2: 수동 롤백

```sql
-- 1. 새 테이블 삭제
DROP TABLE IF EXISTS public.worklog_workers CASCADE;
DROP TABLE IF EXISTS public.site_documents CASCADE;
DROP TABLE IF EXISTS public.drawing_markings CASCADE;
DROP TABLE IF EXISTS public.punch_lists CASCADE;
DROP TABLE IF EXISTS public.punch_items_new CASCADE;
DROP TABLE IF EXISTS public.site_wages CASCADE;

-- 2. profiles 컬럼 제거
ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_wage;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_active;

-- 3. UNIQUE 제약 제거
DROP INDEX IF EXISTS idx_worklogs_unique_site_date_creator;

-- 4. Trigger 제거
DROP TRIGGER IF EXISTS trg_auto_create_wages ON public.worklogs;
DROP TRIGGER IF EXISTS trg_site_documents_updated_at ON public.site_documents;
DROP TRIGGER IF EXISTS trg_drawing_markings_updated_at ON public.drawing_markings;
DROP FUNCTION IF EXISTS auto_create_wages();

-- 5. orphans 테이블 복원 (백업에서)
-- 필요 시 백업 테이블에서 복원
```

### Stage 2 롤백 (프론트엔드 배포 후 문제 발생 시)

```bash
# 1. Git 브랜치 되돌리기
git checkout main

# 2. 이전 버전 배포
npm run build
# 배포 프로세스 실행

# 3. 타입 재생성 (이전 버전)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

---

## 📊 백업 전략

### Master Data 백업 (필수)

**실행 시점:** Stage 1 실행 직전

**백업 대상:**
- `sites`
- `profiles`
- `user_roles`
- `organizations`
- `org_members`
- `site_members`

**실행 방법:**
```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/backup_master_data.sql
```

**백업 확인:**
```sql
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass))
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%_backup_20260325';
```

### Transaction Data 백업 (권장)

**실행 시점:** Stage 1 실행 직전

**백업 대상:**
- `worklogs`
- `worklog_manpower`
- `worklog_materials`
- `worklog_worksets`
- `documents`
- `punch_groups`
- `punch_items`

**실행 방법:**
```bash
psql -h YOUR_DB_HOST -U postgres -d postgres -f scripts/backup_transaction_data.sql
```

---

## 🚨 문제 발생 시 대응

### 시나리오 1: UNIQUE 제약 추가 실패

**증상:**
```
ERROR: could not create unique index "idx_worklogs_unique_site_date_creator"
DETAIL: Key (site_id, work_date, created_by)=(xxx, xxx, xxx) is duplicated.
```

**원인:** 기존 중복 데이터 존재

**해결:**
```sql
-- 1. 중복 데이터 확인
SELECT site_id, work_date, created_by, COUNT(*) as cnt, array_agg(id) as ids
FROM public.worklogs
GROUP BY site_id, work_date, created_by
HAVING COUNT(*) > 1;

-- 2. 중복 데이터 정리 (최신 것만 유지)
-- 주의: 수동으로 확인 후 실행
DELETE FROM public.worklogs
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY site_id, work_date, created_by
      ORDER BY created_at DESC
    ) as rn
    FROM public.worklogs
  ) t
  WHERE rn > 1
);

-- 3. UNIQUE 제약 재시도
CREATE UNIQUE INDEX idx_worklogs_unique_site_date_creator
ON public.worklogs(site_id, work_date, created_by);
```

### 시나리오 2: Trigger 실행 오류

**증상:**
```
ERROR: function auto_create_wages() does not exist
```

**원인:** Trigger 함수 생성 실패

**해결:**
```sql
-- 1. Trigger 함수 재생성
-- Migration SQL의 PHASE 4 부분 재실행

-- 2. Trigger 재생성
DROP TRIGGER IF EXISTS trg_auto_create_wages ON public.worklogs;
CREATE TRIGGER trg_auto_create_wages
AFTER INSERT OR UPDATE ON public.worklogs
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_wages();
```

### 시나리오 3: RLS 정책 오류

**증상:**
```
ERROR: new row violates row-level security policy
```

**원인:** RLS 정책 설정 오류

**해결:**
```sql
-- 1. RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('worklog_workers', 'site_documents', 'drawing_markings');

-- 2. 문제 정책 삭제 후 재생성
DROP POLICY IF EXISTS "정책명" ON public.테이블명;
-- Migration SQL의 PHASE 5 부분 재실행
```

---

## ✅ 검증 체크리스트

### Stage 1 완료 후

- [ ] 새 테이블 6개 생성 확인
- [ ] profiles 컬럼 2개 추가 확인
- [ ] orphans 테이블 9개 삭제 확인
- [ ] UNIQUE 제약 추가 확인
- [ ] Trigger 생성 확인
- [ ] RLS 정책 생성 확인
- [ ] 기존 테이블 유지 확인 (worklogs, worklog_manpower, documents, punch_groups)
- [ ] 기존 기능 정상 동작 확인

### Stage 2 완료 후

- [ ] 타입 재생성 완료
- [ ] 빌드 성공 (타입 에러 0개)
- [ ] 작업일지 CRUD 정상 동작
- [ ] 문서 업로드/조회 정상 동작
- [ ] 지적사항 CRUD 정상 동작
- [ ] 급여 자동 생성 정상 동작 (일지 승인 시)
- [ ] RLS 정책 정상 동작 (각 역할별 테스트)

### Stage 3 완료 후

- [ ] 기존 테이블 삭제 확인
- [ ] 새 테이블로 완전 전환 확인
- [ ] 모든 기능 정상 동작 확인
- [ ] 성능 저하 없음 확인

---

## 📞 지원

### 문제 발생 시

1. 롤백 스크립트 실행
2. 에러 로그 수집
3. 백업 데이터 확인
4. 개발팀에 문의

### 긴급 연락처

- 개발팀: [연락처]
- Supabase 지원: https://supabase.com/support

---

**작성일:** 2026-03-25  
**버전:** 1.0  
**작성자:** AI Assistant
