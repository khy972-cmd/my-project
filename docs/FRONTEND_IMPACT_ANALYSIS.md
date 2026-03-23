# 프론트엔드 영향도 분석

## 📋 개요

Site-Centric Architecture Refactoring이 프론트엔드에 미치는 영향을 상세히 분석합니다.
타입 재생성 후 발생할 에러와 수정 방법을 파일별로 정리했습니다.

---

## 🎯 전체 요약

### 영향받는 파일 수

| 카테고리 | 파일 수 | 영향도 |
|---------|--------|--------|
| **Hooks** | 2개 | 🔴 매우 높음 |
| **Admin 페이지** | 7개 | 🔴 높음 |
| **Partner 페이지** | 2개 | ⚠️ 중간 |
| **Worker 페이지** | 1개 | ⚠️ 낮음 |
| **총계** | **12개** | - |

### 주요 변경 사항

1. **테이블명 변경**
   - `worklog_manpower` → `worklog_workers` (새 테이블 사용)
   - `documents` → `site_documents` (새 테이블 사용)
   - `punch_groups` → `punch_lists` (새 테이블 사용)
   - `punch_items` → `punch_items_new` (새 테이블 사용)

2. **테이블 구조 변경**
   - `worklogs.site_name` 제거 (JOIN 필요)
   - `worklogs.memo` 추가
   - `worklogs.approved_by`, `approved_at`, `rejected_reason` 추가
   - `profiles.daily_wage`, `is_active` 추가

3. **FK 관계 변경**
   - `worklog_workers.user_id` → `auth.users(id)` FK 추가
   - `punch_items_new.assignee` → `auth.users(id)` FK
   - `punch_items_new.before_photo`, `after_photo` → `site_documents(id)` FK

---

## 📁 파일별 상세 분석

### 🔴 1. src/hooks/useSupabaseWorklogs.ts (매우 높음)

**영향도:** 🔴 매우 높음 (핵심 훅, 전면 수정 필요)

**사용 중인 테이블:**
- `worklogs` (구조 변경)
- `worklog_manpower` (→ `worklog_workers` 전환 필요)
- `worklog_materials` (유지)
- `worklog_worksets` (유지)
- `documents` (→ `site_documents` 전환 필요)

**예상 타입 에러:**

```typescript
// ❌ 에러 1: worklog_manpower 테이블 없음
const { error } = await supabase.from("worklog_manpower").insert(...);
// Type error: Table 'worklog_manpower' does not exist

// ❌ 에러 2: site_name 필드 없음
const { data: worklogs } = await supabase
  .from("worklogs")
  .select("id, site_name, work_date");
// Type error: Property 'site_name' does not exist

// ❌ 에러 3: documents 테이블 없음
const { data: docs } = await supabase.from("documents").select(...);
// Type error: Table 'documents' does not exist
```

**수정 방법:**

```typescript
// ✅ 수정 1: worklog_manpower → worklog_workers
// 기존 코드 (라인 410-420)
const { error } = await supabase.from("worklog_manpower").insert(
  entry.manpower.map((item) => ({
    worklog_id: worklogId,
    worker_name: item.worker,
    work_hours: item.hours || 8,
    is_custom: item.isCustom || false,
  }))
);

// 새 코드
const { error } = await supabase.from("worklog_workers").insert(
  entry.manpower.map((item) => ({
    worklog_id: worklogId,
    user_id: item.userId, // ✅ FK 추가 (profiles에서 조회 필요)
    worker_name: item.worker,
    work_hours: item.hours || 8,
    daily_wage: item.dailyWage || 0, // ✅ 스냅샷 저장
    is_primary: item.isPrimary || false, // ✅ 주 작성자 여부
  }))
);

// ✅ 수정 2: site_name → JOIN
// 기존 코드 (라인 533-540)
return supabase
  .from("worklogs")
  .select(`
    *,
    worklog_manpower(worker_name, work_hours),
    worklog_materials(name, qty),
    worklog_worksets(member, process, work_type, block, dong, floor)
  `);

// 새 코드
return supabase
  .from("worklogs")
  .select(`
    *,
    site:sites(id, name), // ✅ JOIN으로 site_name 가져오기
    worklog_workers(user_id, worker_name, work_hours, daily_wage), // ✅ 새 테이블
    worklog_materials(name, qty),
    worklog_worksets(member, process, work_type, block, dong, floor)
  `);

// ✅ 수정 3: documents → site_documents
// 기존 코드 (라인 638-642)
const { data: docs } = await supabase
  .from("documents")
  .select("worklog_id, doc_type")
  .in("worklog_id", worklogIds);

// 새 코드
const { data: docs } = await supabase
  .from("site_documents")
  .select("worklog_id, doc_type")
  .in("worklog_id", worklogIds);
```

**추가 수정 필요:**

1. **작업자 선택 로직 변경**
   ```typescript
   // profiles에서 작업자 목록 가져오기
   const { data: workers } = await supabase
     .from('profiles')
     .select('user_id, name, phone, daily_wage')
     .eq('is_active', true)
     .order('name');
   
   // worklog_workers에 저장 시 user_id 포함
   ```

2. **타입 정의 업데이트**
   ```typescript
   // 기존
   type WorklogManpower = Database['public']['Tables']['worklog_manpower']['Row'];
   
   // 새로운
   type WorklogWorker = Database['public']['Tables']['worklog_workers']['Row'];
   ```

---

### 🔴 2. src/hooks/useSupabasePunch.ts (높음)

**영향도:** 🔴 높음

**사용 중인 테이블:**
- `punch_groups` (→ `punch_lists` 전환 필요)
- `punch_items` (→ `punch_items_new` 전환 필요)

**예상 타입 에러:**

```typescript
// ❌ 에러: punch_groups 테이블 없음
const { data, error } = await supabase
  .from("punch_groups")
  .select(`*, punch_items(*)`);
// Type error: Table 'punch_groups' does not exist
```

**수정 방법:**

```typescript
// ✅ 수정: punch_groups → punch_lists
const { data, error } = await supabase
  .from("punch_lists")
  .select(`
    *,
    punch_items_new(
      id,
      issue,
      location,
      assignee,
      priority,
      status,
      due_date,
      before_photo,
      after_photo
    )
  `)
  .order("punch_date", { ascending: false });
```

---

### ⚠️ 3. Admin 페이지 (7개 파일)

#### 3-1. src/components/admin/AdminDashboard.tsx

**영향도:** ⚠️ 중간

**수정 필요:**
```typescript
// 기존 (라인 68)
supabase.from("documents").select("*", { count: "exact", head: true }),

// 새로운
supabase.from("site_documents").select("*", { count: "exact", head: true }),
```

#### 3-2. src/components/admin/AdminWorklogManager.tsx

**영향도:** ⚠️ 중간

**수정 필요:**
```typescript
// 기존 (라인 69-72)
const { data: worklogs, error } = await supabase
  .from("worklogs")
  .select(`
    id, site_name, site_id, work_date, status, created_by, created_at, dept, weather,
    worklog_manpower(worker_name, work_hours),
    worklog_materials(name, qty),
    worklog_worksets(member, process, work_type)
  `);

// 새로운
const { data: worklogs, error } = await supabase
  .from("worklogs")
  .select(`
    id, site_id, work_date, status, created_by, created_at, dept, weather,
    site:sites(name), // ✅ JOIN
    worklog_workers(user_id, worker_name, work_hours, daily_wage), // ✅ 새 테이블
    worklog_materials(name, qty),
    worklog_worksets(member, process, work_type)
  `);

// 타입 변경
type Worklog = {
  // ...
  site: { name: string }; // ✅ site_name 대신
  worklog_workers: Array<{ // ✅ worklog_manpower 대신
    user_id: string;
    worker_name: string;
    work_hours: number;
    daily_wage: number;
  }>;
};

// 사용 시
worklog.site.name // ✅ worklog.site_name 대신
```

#### 3-3. src/components/admin/AdminDocManager.tsx

**영향도:** ⚠️ 중간

**수정 필요:**
```typescript
// 기존 (라인 43-47)
const { data, error } = await supabase
  .from("documents")
  .select("id, title, doc_type, file_ext, site_name, work_date, created_at, file_url")
  .order("created_at", { ascending: false })
  .limit(200);

// 새로운
const { data, error } = await supabase
  .from("site_documents")
  .select(`
    id, title, doc_type, file_ext, work_date, created_at, file_url,
    site:sites(name)
  `)
  .order("created_at", { ascending: false })
  .limit(200);
```

#### 3-4. src/components/admin/AdminMaterialsManager.tsx

**영향도:** ⚠️ 낮음

**수정 필요:**
```typescript
// 기존 (라인 114)
supabase.from("worklogs").select("id, site_name, work_date").in("id", worklogIds)

// 새로운
supabase.from("worklogs").select("id, work_date, site:sites(name)").in("id", worklogIds)
```

#### 3-5. src/components/admin/AdminUserManager.tsx

**영향도:** ⚠️ 낮음 (worklogs 조회만)

**수정 필요:** 없음 (created_by만 조회)

#### 3-6. src/components/admin/AdminSalaryManager.tsx

**영향도:** ⚠️ 중간

**수정 필요:**
```typescript
// 기존 (라인 76-78)
let q = supabase
  .from("worklogs")
  .select("id, work_date, site_name, worklog_manpower(worker_name, work_hours)")
  .order("work_date", { ascending: false })
  .limit(1200);

// 새로운
let q = supabase
  .from("worklogs")
  .select(`
    id, work_date,
    site:sites(name),
    worklog_workers(user_id, worker_name, work_hours, daily_wage)
  `)
  .order("work_date", { ascending: false })
  .limit(1200);
```

#### 3-7. src/components/admin/AdminSystemSettings.tsx

**영향도:** ⚠️ 낮음

**수정 필요:**
```typescript
// 기존 (라인 41-42)
supabase.from("documents").select("*", { count: "exact", head: true }),
supabase.from("worklogs").select("*", { count: "exact", head: true }),

// 새로운
supabase.from("site_documents").select("*", { count: "exact", head: true }),
supabase.from("worklogs").select("*", { count: "exact", head: true }),
```

---

### ⚠️ 4. Partner 페이지 (2개 파일)

#### 4-1. src/components/partner/PartnerHomePage.tsx

**영향도:** ⚠️ 낮음

**수정 필요:**
```typescript
// 기존 (라인 88)
const { data, error } = await supabase
  .from("documents")
  .select("site_id, doc_type")
  .limit(500);

// 새로운
const { data, error } = await supabase
  .from("site_documents")
  .select("site_id, doc_type")
  .limit(500);
```

#### 4-2. src/components/partner/PartnerWorklogPage.tsx

**영향도:** ⚠️ 중간

**수정 필요:**
```typescript
// 기존 (라인 83-86)
const { data: worklogs, error: wlErr } = await supabase
  .from("worklogs")
  .select(`
    id, site_id, site_name, work_date, status, dept,
    worklog_manpower(worker_name, work_hours),
    worklog_materials(name, qty),
    worklog_worksets(member, process)
  `);

// 새로운
const { data: worklogs, error: wlErr } = await supabase
  .from("worklogs")
  .select(`
    id, site_id, work_date, status, dept,
    site:sites(name),
    worklog_workers(worker_name, work_hours),
    worklog_materials(name, qty),
    worklog_worksets(member, process)
  `);

// 기존 (라인 96-98)
const { data: docs } = await supabase
  .from("documents")
  .select("id, title, doc_type, file_ext, site_id, work_date, created_at")
  .in("site_id", siteIds);

// 새로운
const { data: docs } = await supabase
  .from("site_documents")
  .select("id, title, doc_type, file_ext, site_id, work_date, created_at")
  .in("site_id", siteIds);
```

---

## 🔧 수정 우선순위

### Phase 1: 핵심 훅 수정 (필수)

1. **useSupabaseWorklogs.ts** (최우선)
   - worklog_manpower → worklog_workers
   - site_name → JOIN
   - documents → site_documents

2. **useSupabasePunch.ts**
   - punch_groups → punch_lists
   - punch_items → punch_items_new

### Phase 2: Admin 페이지 수정

1. AdminWorklogManager.tsx
2. AdminDocManager.tsx
3. AdminSalaryManager.tsx
4. AdminDashboard.tsx
5. AdminMaterialsManager.tsx
6. AdminSystemSettings.tsx
7. AdminUserManager.tsx (영향 최소)

### Phase 3: Partner 페이지 수정

1. PartnerWorklogPage.tsx
2. PartnerHomePage.tsx

---

## ✅ 테스트 체크리스트

### 기능 테스트

- [ ] **작업일지 CRUD**
  - [ ] 일지 생성 (작업자 선택 포함)
  - [ ] 일지 조회 (site_name JOIN 확인)
  - [ ] 일지 수정
  - [ ] 일지 삭제

- [ ] **작업자 관리**
  - [ ] 작업자 목록 조회 (profiles.is_active 필터링)
  - [ ] 작업자 추가 (worklog_workers.user_id FK)
  - [ ] 작업자 삭제

- [ ] **문서 관리**
  - [ ] 사진 업로드 (site_documents)
  - [ ] 도면 업로드 (site_documents)
  - [ ] 문서 조회
  - [ ] 문서 삭제

- [ ] **지적사항**
  - [ ] 지적사항 생성 (punch_lists)
  - [ ] 지적사항 항목 추가 (punch_items_new)
  - [ ] 지적사항 조회

- [ ] **급여 자동화**
  - [ ] 일지 승인 시 급여 자동 생성 확인
  - [ ] 중복 생성 방지 확인

### RLS 정책 테스트

- [ ] **admin 역할**
  - [ ] 모든 데이터 조회 가능
  - [ ] 모든 데이터 수정 가능
  - [ ] 모든 데이터 삭제 가능

- [ ] **manager 역할**
  - [ ] 모든 현장 데이터 조회 가능
  - [ ] 모든 현장 데이터 수정 가능

- [ ] **worker 역할**
  - [ ] 할당된 현장만 조회 가능
  - [ ] 본인 일지만 수정 가능 (draft/pending만)
  - [ ] 본인 일지만 삭제 가능 (draft만)

- [ ] **partner 역할**
  - [ ] 할당된 현장만 조회 가능
  - [ ] 수정/삭제 불가능

---

## 📊 예상 작업 시간

| 단계 | 작업 내용 | 예상 시간 |
|------|----------|----------|
| 1 | 타입 재생성 | 5분 |
| 2 | useSupabaseWorklogs.ts 수정 | 2시간 |
| 3 | useSupabasePunch.ts 수정 | 30분 |
| 4 | Admin 페이지 수정 (7개) | 3시간 |
| 5 | Partner 페이지 수정 (2개) | 1시간 |
| 6 | 빌드 및 타입 에러 수정 | 1시간 |
| 7 | 기능 테스트 | 2시간 |
| 8 | RLS 정책 테스트 | 1시간 |
| **총계** | | **약 10.5시간** |

---

## 🚨 주의사항

1. **site_name 제거**
   - 모든 `site_name` 접근을 `site.name` JOIN으로 변경
   - 타입 정의도 함께 변경 필요

2. **worklog_manpower → worklog_workers**
   - `user_id` FK 추가 필수
   - `daily_wage` 스냅샷 저장 필수
   - `is_primary` 주 작성자 표시 필요

3. **documents → site_documents**
   - 모든 `documents` 참조를 `site_documents`로 변경
   - `doc_type` 값 확인 ('photo', 'drawing', 'confirmation', 'other')

4. **punch_groups → punch_lists**
   - `punch_items` → `punch_items_new` 함께 변경
   - `assignee` FK 타입 변경 (string → UUID)

---

**작성일:** 2026-03-25  
**버전:** 1.0  
**작성자:** AI Assistant
