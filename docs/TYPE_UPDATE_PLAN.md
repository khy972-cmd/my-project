# TypeScript 타입 업데이트 계획서

## 📋 개요

DB 스키마 대규모 리팩토링으로 인해 프론트엔드 TypeScript 타입이 완전히 변경됩니다.
이 문서는 타입 업데이트 절차와 예상되는 에러 수정 방법을 정리합니다.

---

## 1. 타입 재생성 절차

### A. Supabase CLI로 타입 생성

```bash
# 방법 1: Supabase CLI 사용 (권장)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# 방법 2: Supabase Dashboard에서 수동 복사
# 1. Supabase Dashboard → Project Settings → API
# 2. "Generate Types" 클릭
# 3. TypeScript 선택
# 4. 복사하여 src/integrations/supabase/types.ts에 붙여넣기
```

### B. 타입 파일 위치

```
src/integrations/supabase/types.ts (기존 파일 덮어쓰기)
```

---

## 2. 주요 변경 사항

### A. 삭제된 테이블 (타입 에러 발생 예상)

```typescript
// ❌ 더 이상 존재하지 않는 테이블
- documents (→ site_documents로 대체)
- worklog_manpower (→ worklog_workers로 대체)
- punch_groups (→ punch_lists로 대체)
- *_orphans 테이블 9개 (완전 삭제)
```

### B. 새로 생성된 테이블

```typescript
// ✅ 새로운 테이블
+ site_documents
+ worklog_workers
+ drawing_markings
+ punch_lists
+ site_wages
```

### C. 변경된 테이블 구조

```typescript
// worklogs 테이블
interface Worklogs {
  // 기존 필드
  id: string;
  site_id: string;
  work_date: string;
  created_by: string;
  status: string;
  
  // 새로 추가된 필드
  memo: string | null; // ✅ 선택값
  approved_by: string | null; // ✅ 승인자
  approved_at: string | null; // ✅ 승인 시각
  rejected_reason: string | null; // ✅ 반려 사유
  
  // 삭제된 필드
  // site_name: string; // ❌ 제거 (JOIN으로 해결)
}

// profiles 테이블
interface Profiles {
  // 기존 필드
  user_id: string;
  name: string;
  phone: string | null;
  affiliation: string | null;
  job_title: string | null;
  
  // 새로 추가된 필드
  daily_wage: number; // ✅ 일당
  is_active: boolean; // ✅ 활성 상태
}
```

---

## 3. 예상되는 타입 에러 및 수정 방법

### A. `documents` → `site_documents` 변경

#### 에러 발생 위치
```typescript
// ❌ 기존 코드
const { data: documents } = await supabase
  .from('documents')
  .select('*')
  .eq('site_id', siteId);
```

#### 수정 방법
```typescript
// ✅ 수정 코드
const { data: documents } = await supabase
  .from('site_documents')
  .select('*')
  .eq('site_id', siteId);

// 타입도 변경
type Document = Database['public']['Tables']['site_documents']['Row'];
```

### B. `worklog_manpower` → `worklog_workers` 변경

#### 에러 발생 위치
```typescript
// ❌ 기존 코드
const { data: manpower } = await supabase
  .from('worklog_manpower')
  .insert({
    worklog_id: worklogId,
    worker_name: '홍길동',
    work_hours: 8,
  });
```

#### 수정 방법
```typescript
// ✅ 수정 코드 (FK 기반)
const { data: workers } = await supabase
  .from('worklog_workers')
  .insert({
    worklog_id: worklogId,
    user_id: userId, // ✅ FK 추가!
    worker_name: '홍길동', // denormalized
    work_hours: 8,
    daily_wage: 150000, // ✅ 스냅샷
    is_primary: false,
  });

// 타입도 변경
type WorklogWorker = Database['public']['Tables']['worklog_workers']['Row'];
```

### C. `punch_groups` → `punch_lists` 변경

#### 에러 발생 위치
```typescript
// ❌ 기존 코드
const { data: punchGroup } = await supabase
  .from('punch_groups')
  .select('*')
  .eq('site_id', siteId);
```

#### 수정 방법
```typescript
// ✅ 수정 코드
const { data: punchList } = await supabase
  .from('punch_lists')
  .select('*')
  .eq('site_id', siteId);

// 타입도 변경
type PunchList = Database['public']['Tables']['punch_lists']['Row'];
```

### D. `site_name` 필드 제거 (JOIN 필요)

#### 에러 발생 위치
```typescript
// ❌ 기존 코드
const { data: worklogs } = await supabase
  .from('worklogs')
  .select('id, site_name, work_date')
  .eq('site_id', siteId);

console.log(worklogs[0].site_name); // ❌ 타입 에러!
```

#### 수정 방법
```typescript
// ✅ 수정 코드 (JOIN 사용)
const { data: worklogs } = await supabase
  .from('worklogs')
  .select(`
    id,
    work_date,
    site:sites(name)
  `)
  .eq('site_id', siteId);

console.log(worklogs[0].site.name); // ✅ OK
```

### E. `status` 값 변경

#### 에러 발생 위치
```typescript
// ❌ 기존 코드 (status 값이 다를 수 있음)
if (worklog.status === 'submitted') {
  // ...
}
```

#### 수정 방법
```typescript
// ✅ 수정 코드 (새로운 status 값)
type WorklogStatus = 'draft' | 'pending' | 'approved' | 'rejected';

if (worklog.status === 'pending') {
  // ...
}
```

---

## 4. 컴포넌트별 수정 예상 목록

### A. 작업일지 관련 (`WorklogPage`, `HomePage`)

**예상 에러:**
- `worklog_manpower` → `worklog_workers` 타입 에러
- `site_name` 필드 접근 에러
- `status` 값 불일치

**수정 방법:**
1. `worklog_workers` 테이블로 변경
2. JOIN으로 `site.name` 가져오기
3. `status` 값 업데이트 ('draft', 'pending', 'approved', 'rejected')

### B. 문서 관련 (`DocPage`, `DocumentViewer`)

**예상 에러:**
- `documents` → `site_documents` 타입 에러
- `doc_type` 값 변경

**수정 방법:**
1. `site_documents` 테이블로 변경
2. `doc_type` 값 확인 ('photo', 'drawing', 'confirmation', 'other')

### C. 도면 마킹 (`DrawingMarkingOverlay`)

**예상 에러:**
- 마킹 데이터 저장 위치 불명확

**수정 방법:**
1. `drawing_markings` 테이블 사용
2. JSONB 형식으로 마킹 데이터 저장

### D. 지적사항 (`PunchPage`)

**예상 에러:**
- `punch_groups` → `punch_lists` 타입 에러
- `punch_items.assignee` 타입 변경 (string → UUID FK)

**수정 방법:**
1. `punch_lists` 테이블로 변경
2. `assignee`를 user_id FK로 변경

### E. 급여 관련 (새로운 기능)

**새로 추가:**
- `site_wages` 테이블 조회
- 개인 급여 내역 확인 UI

---

## 5. 단계별 타입 에러 수정 전략

### Phase 1: 타입 재생성
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### Phase 2: 빌드 시도 및 에러 확인
```bash
npm run build
```

### Phase 3: 에러 수정 우선순위

1. **Critical (앱 실행 불가):**
   - `documents` → `site_documents`
   - `worklog_manpower` → `worklog_workers`
   - `punch_groups` → `punch_lists`

2. **High (주요 기능 오류):**
   - `site_name` JOIN 처리
   - `status` 값 변경
   - `assignee` FK 변경

3. **Medium (부가 기능):**
   - 도면 마킹 연동
   - 급여 조회 기능 추가

4. **Low (최적화):**
   - 검색 벡터 활용
   - 썸네일 경로 활용

### Phase 4: 컴포넌트별 수정

```
1. src/hooks/useSupabaseWorklogs.ts
   - worklog_manpower → worklog_workers
   - site_name JOIN 추가

2. src/pages/WorklogPage.tsx
   - 타입 import 변경
   - 작업자 선택 로직 수정 (FK 기반)

3. src/pages/DocPage.tsx
   - documents → site_documents
   - doc_type 값 확인

4. src/features/drawingMarking/DrawingMarkingOverlay.tsx
   - drawing_markings 테이블 연동
   - JSONB 마킹 데이터 저장/로드

5. src/pages/PunchPage.tsx (있다면)
   - punch_groups → punch_lists
   - assignee FK 처리
```

---

## 6. 타입 안전성 검증 체크리스트

### A. 컴파일 타임 검증
```bash
# TypeScript 타입 체크
npm run type-check

# 또는
npx tsc --noEmit
```

### B. 런타임 검증
```typescript
// Zod 스키마로 런타임 검증 (선택사항)
import { z } from 'zod';

const WorklogSchema = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  work_date: z.string(),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']),
  memo: z.string().nullable(),
});

// 사용
const validatedWorklog = WorklogSchema.parse(data);
```

### C. RLS 정책 테스트
```typescript
// 각 역할별로 테스트
// 1. admin: 모든 데이터 접근 가능
// 2. manager: 모든 현장 데이터 접근 가능
// 3. worker: 할당된 현장만 접근, 본인 일지만 수정
// 4. partner: 할당된 현장만 읽기 전용
```

---

## 7. 마이그레이션 후 즉시 수정이 필요한 파일 목록

### 우선순위 1 (즉시 수정 필요)
```
1. src/integrations/supabase/types.ts (타입 재생성)
2. src/hooks/useSupabaseWorklogs.ts (worklog_manpower → worklog_workers)
3. src/pages/WorklogPage.tsx (타입 변경)
4. src/pages/DocPage.tsx (documents → site_documents)
```

### 우선순위 2 (주요 기능)
```
5. src/features/drawingMarking/DrawingMarkingOverlay.tsx (마킹 연동)
6. src/hooks/useSupabasePunch.ts (punch_groups → punch_lists)
7. src/pages/HomePage.tsx (작업자 선택 로직)
```

### 우선순위 3 (신규 기능)
```
8. src/hooks/useSiteWages.ts (새로 생성)
9. src/pages/WagesPage.tsx (새로 생성, 선택사항)
10. src/components/CalendarPersonalized.tsx (개인화 캘린더)
```

---

## 8. 롤백 계획

만약 타입 에러가 너무 많아 수정이 어려운 경우:

```bash
# 1. 브랜치 되돌리기
git checkout main

# 2. 또는 마이그레이션 롤백 (Supabase Dashboard에서)
# - Supabase Dashboard → Database → Migrations
# - 해당 마이그레이션 롤백

# 3. 단계별 마이그레이션 재시도
# - Phase 2-1: DB만 먼저 변경
# - Phase 2-2: 타입 재생성 및 최소한의 수정
# - Phase 2-3: 점진적 기능 추가
```

---

## 9. 완료 후 검증 항목

### A. 빌드 성공
```bash
npm run build
# ✅ 에러 없이 빌드 완료
```

### B. 타입 체크 통과
```bash
npx tsc --noEmit
# ✅ 타입 에러 0개
```

### C. 주요 기능 테스트
```
✅ 작업일지 생성/조회/수정/삭제
✅ 작업자 선택 (FK 기반)
✅ 사진/도면 업로드
✅ 도면 마킹
✅ 지적사항 생성
✅ 급여 조회 (본인 또는 admin)
```

### D. RLS 정책 검증
```
✅ admin: 모든 데이터 CRUD
✅ manager: 모든 현장 CRUD
✅ worker: 할당된 현장 R, 본인 일지 CUD
✅ partner: 할당된 현장 R only
```

---

## 10. 참고 자료

### Supabase 공식 문서
- [TypeScript Support](https://supabase.com/docs/guides/api/generating-types)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

### 내부 문서
- `supabase/migrations/20260325000000_site_centric_refactoring.sql` (마이그레이션 SQL)
- `docs/PHASE1_ARCHITECTURE_DESIGN.md` (설계안, 생성 예정)

---

## ✅ 체크리스트

마이그레이션 완료 후 다음 항목을 순서대로 체크하세요:

- [ ] 1. Supabase 마이그레이션 실행 완료
- [ ] 2. TypeScript 타입 재생성 완료
- [ ] 3. `npm run build` 성공
- [ ] 4. `npx tsc --noEmit` 타입 에러 0개
- [ ] 5. 작업일지 CRUD 테스트 통과
- [ ] 6. 작업자 선택 (FK 기반) 테스트 통과
- [ ] 7. 문서 업로드 테스트 통과
- [ ] 8. 도면 마킹 테스트 통과
- [ ] 9. RLS 정책 검증 완료
- [ ] 10. 급여 조회 기능 추가 (선택사항)

---

**작성일:** 2026-03-25  
**작성자:** AI Assistant  
**버전:** 1.0
