# Admin Console Parity – 구현 요약

## 변경 파일 목록

### 수정
- **src/pages/AdminPage.tsx**
  - `ADMIN_TABS` 확장: 가입요청, 소속관리, 급여관리, 필수서류, 공지사항, 시스템설정, 작업옵션, 이노피앤씨 탭 추가
  - 탭 그룹: 운영관리 | 계정/조직 | 정산/서류 | 시스템/공지
  - `TAB_TONES` 확장, `renderContent` 분기 추가
  - 데스크톱/모바일 사이드바에 그룹 라벨 표시

### 추가
- **src/components/admin/AdminSignupRequestsManager.tsx** – 가입 요청 관리 (pending_role_assignments, 승인/거절)
- **src/components/admin/AdminOrganizationsManager.tsx** – 소속(시공사) 관리 (organizations CRUD)
- **src/components/admin/AdminSalaryManager.tsx** – 급여관리 읽기 전용 플레이스홀더
- **src/components/admin/AdminRequiredDocsManager.tsx** – 필수서류 관리 (documents doc_type 집계)
- **src/components/admin/AdminCommunicationManager.tsx** – 공지사항 관리 (테이블 미연동 시 빈 상태)
- **src/components/admin/AdminSystemSettings.tsx** – 시스템 설정 (사용자/현장/문서/일지 수, 앱 버전)
- **src/components/admin/AdminWorkOptionsManager.tsx** – 작업 옵션 관리 (플레이스홀더)
- **src/components/admin/AdminCompanySettings.tsx** – 이노피앤씨 설정 (플레이스홀더)
- **docs/ADMIN_PARITY_GAP_ANALYSIS.md** – 갭 분석
- **docs/ADMIN_PARITY_IMPLEMENTATION.md** – 본 문서

## 마이그레이션 요약
- **추가 DB 마이그레이션 없음.** 기존 테이블만 사용 (pending_role_assignments, organizations, documents, user_roles, sites, worklogs).
- 추후 선택적 추가 시: admin_announcements, admin_work_options, company_doc_types 등 additive 마이그레이션만 사용.

## 권한
- **본사관리자(admin) 전용:** 가입요청, 소속관리, 급여관리, 필수서류, 공지사항, 시스템설정, 작업옵션, 이노피앤씨, 대시보드, 문서관리, 파트너
- **관리자(manager) 포함:** 일지관리, 현장관리, 인력관리, 사진·도면, 탈퇴요청

## 수동 QA 체크리스트
- [ ] 관리자 콘솔 진입 (admin / manager 각각)
- [ ] 기존 탭: 대시보드, 일지관리, 현장관리, 인력관리, 사진·도면, 탈퇴요청, 파트너, 문서관리 동작 유지
- [ ] 가입요청: 목록·검색·상태 필터, 승인/거절 (pending → linked / cancelled)
- [ ] 소속관리: 목록·검색·상태 필터, 추가/수정
- [ ] 급여관리·필수서류·공지·시스템설정·작업옵션·이노피앤씨: 빈 상태 또는 읽기 전용 표시, 오류 없음
- [ ] 모바일: 탭 칩 스크롤, 사이드바 오버레이, 그룹 라벨
- [ ] manager 로그인 시 admin 전용 탭 비노출

## 회귀 위험 체크리스트
- [ ] AdminDashboard 카드 클릭 시 해당 탭으로 이동
- [ ] AdminUserManager 기존 기능 (디렉터리, 권한 예약) 유지
- [ ] AdminDeletionRequestManager 계속 동작 (account_deletion_requests)
- [ ] 로그인/역할 부여 플로우 변경 없음
