# Admin Console Parity – Gap Analysis

## Current state (target repo)

### Files inspected
- `src/pages/AdminPage.tsx` – single-page console, 8 tabs, sidebar + mobile chips
- `src/components/admin/*` – AdminDashboard, AdminWorklogManager, AdminSiteManager, AdminUserManager, AdminPartnerManager, AdminDocManager, AdminPhotoSheetManager, AdminDeletionRequestManager, AdminConsoleTab, WorkerRejectionTab, AdminDrawingManager
- `src/lib/roles.ts` – AppRole: admin | manager | partner | worker
- `src/hooks/useUserRole.ts` – useRole from RoleContext, isAdmin, isManager, etc.
- `src/contexts/RoleContext.tsx` – RoleProvider, getUserRole
- `src/integrations/supabase/client.ts`, `types.ts` – Supabase client and generated types

### Existing tabs (unchanged)
| Tab key    | Label     | Roles        | Component                  |
|-----------|-----------|-------------|----------------------------|
| dashboard | 대시보드  | admin       | AdminDashboard             |
| worklog   | 일지관리  | admin, manager | AdminWorklogManager     |
| site      | 현장관리  | admin, manager | AdminSiteManager        |
| user      | 인력관리  | admin, manager | AdminUserManager        |
| photosheet| 사진.도면 | admin, manager | AdminPhotoSheetManager  |
| deletion  | 탈퇴요청  | admin, manager | AdminDeletionRequestManager |
| partner   | 파트너    | admin       | AdminPartnerManager        |
| doc       | 문서관리  | admin       | AdminDocManager            |

### Overlap vs missing (vs reference feature set)

| Feature (reference)   | Target status        | Action |
|----------------------|----------------------|--------|
| 가입 요청 관리        | Missing as dedicated tab | Add tab + AdminSignupRequestsManager (reuse `pending_role_assignments`) |
| 사용자 관리 고도화    | Partial (AdminUserManager exists) | Extend only; no replace |
| 급여관리 도구         | Missing              | Add tab + read-only placeholder (no schema) |
| 필수서류 관리         | Missing              | Add tab + AdminRequiredDocsManager (reuse `documents` / doc_type) |
| 소속(시공사) 관리     | Table `organizations` exists | Add tab + AdminOrganizationsManager |
| 공지사항 관리         | Missing              | Add tab + AdminCommunicationManager (fallback empty / optional additive table) |
| 시스템 설정           | Missing              | Add tab + AdminSystemSettings (read-only stats) |
| 작업 옵션 관리        | Missing              | Add tab + AdminWorkOptionsManager (fallback / optional additive) |
| 이노피앤씨 설정       | Missing              | Add tab + AdminCompanySettings (company doc types fallback) |

### Schema risk notes
- **No destructive changes.** All new features use existing tables or additive-only patterns.
- **Existing tables reused:** `pending_role_assignments`, `organizations`, `documents`, `profiles`, `user_roles`, `sites`, `worklogs`, `admin_user_directory`.
- **Optional additive (later):** `admin_announcements`, `admin_work_options`, `company_doc_types` – only if needed; UI must work with empty/read-only fallback if table absent.
- **account_deletion_requests:** Used by AdminDeletionRequestManager via `(supabase as any)`; not in generated types. No change.

### Files to modify
- `src/pages/AdminPage.tsx` – extend ADMIN_TABS, TAB_TONES, renderContent with new tabs and grouping.

### Files to add
- `src/components/admin/AdminSignupRequestsManager.tsx`
- `src/components/admin/AdminOrganizationsManager.tsx`
- `src/components/admin/AdminSalaryManager.tsx` (placeholder)
- `src/components/admin/AdminRequiredDocsManager.tsx`
- `src/components/admin/AdminCommunicationManager.tsx`
- `src/components/admin/AdminSystemSettings.tsx`
- `src/components/admin/AdminWorkOptionsManager.tsx`
- `src/components/admin/AdminCompanySettings.tsx`

### Role visibility (new tabs)
- signup-requests, organizations, salary, required-docs, communication, system-settings, work-options, company-settings → **admin only** (manager keeps existing tabs only).
