/**
 * localStorage / 저장소 키 통합 (3단계 데이터 흐름 통일)
 * 메인 앱 · 홈(iframe/legacy) · 작업일지 · 오프라인 동기화가 같은 키를 참조하므로
 * 여기서만 정의해 데이터 충돌과 오타를 방지합니다.
 */

/** 홈 iframe에 넘기는 현장 목록 (메인 앱 → iframe) */
export const HOME_SITE_STORAGE_KEY = "inopnc_live_site_options";
/** 홈 iframe에 넘기는 작업자 목록 (메인 앱 → iframe) */
export const HOME_WORKER_STORAGE_KEY = "inopnc_live_worker_options";
/** 홈/작업일지 드래프트 (legacy·iframe 저장 → WorklogPage parseHomeDraft) */
export const HOME_DRAFT_KEY = "inopnc_work_log";

/** 현장+날짜별 버전 worklog 본문 (HomePage.legacy, worklogStore 호환) */
export const SITE_WORKLOGS_KEY = "siteWorklogs";
/** 현장+날짜별 사진 (HomePage.legacy, worklogStore, offlineStore, DocPage) */
export const SITE_PHOTOS_KEY = "sitePhotos";
/** 현장+날짜별 도면 (HomePage.legacy, worklogStore, offlineStore, DocPage) */
export const SITE_DRAWINGS_KEY = "siteDrawings";
/** 작업일지 인덱스 v4 (HomePage.legacy, worklogStore 마이그레이션) */
export const WORKLOG_INDEX_V4_KEY = "inopnc_worklogs_v4_site_based";

/** 작업일지 통합 목록 (worklogStore read/write) */
export const WORKLOGS_KEY = "inopnc_worklogs_unified";
/** 현장별 공사도면 버킷 (worklogStore) */
export const CONSTRUCTION_DRAWINGS_KEY = "inopnc_site_construction_drawings_v1";
/** Admin 도면 드래프트 저장소 */
export const ADMIN_DRAWING_DRAFTS_KEY = "inopnc_admin_drawing_drafts_v1";
/** Admin 도면 최종본 저장소 */
export const ADMIN_DRAWING_FINALS_KEY = "inopnc_admin_drawing_finals_v1";

/** Admin 작업일지/콘솔 탭 고정 ID 목록 */
export const ADMIN_PINNED_IDS_KEY = "admin_pinned_ids";
/** 파트너 작업일지 고정 현장 목록 */
export const PARTNER_PINNED_SITES_KEY = "partner_pinned_sites";
/** 테스트 모드 (AuthContext) */
export const TEST_MODE_KEY = "inopnc_test_mode";
/** 테스트 역할 (AuthContext) */
export const TEST_ROLE_KEY = "inopnc_test_role";

/** 작업일지 메모 자동저장 (WorklogPage) */
export const MEMO_AUTOSAVE_KEY = "inopnc_worklog_memo_autosave_v1";
/** 첨부 인덱스 (attachmentStore) */
export const ATTACHMENT_INDEX_KEY = "inopnc_attachment_index_v1";
/** 작업일지 첨부 ref 매핑 (useSupabaseWorklogs) */
export const ATTACHMENT_MAP_KEY = "inopnc_worklog_attachment_refs_v1";
/** 사진대지 드래프트 로컬 저장소 */
export const PHOTO_SHEET_DRAFT_LOCAL_KEY = "inopnc_photo_sheet_drafts_v1";
/** 사진대지 최종본 로컬 저장소 */
export const PHOTO_SHEET_FINAL_LOCAL_KEY = "inopnc_photo_sheet_finals_v1";
/** 현장별 작업일지 드래프트 (siteWorklogDraftStore) */
export const SITE_DRAFT_STORE_KEY = "inopnc_site_worklog_draft_v1";
/** 출퇴근/펀치 데이터 (punchStore) */
export const PUNCH_KEY = "inopnc_punch_data";
/** 최근 선택 현장 목록 (siteList, SiteCombobox) */
export const RECENT_SITE_STORAGE_KEY = "inopnc_recent_sites";
/** 검색 최근어 (SearchOverlay) */
export const RECENT_SEARCHES_KEY = "INOPNC_RECENT_SEARCHES_v1";
/** 오늘 알림 숨김 (NotificationPanel, AppLayout) */
export const NOTIFICATIONS_HIDE_KEY = "hideNotifications";
/** 빌드 SHA 캐시 (main.tsx) */
export const LAST_BUILD_SHA_STORAGE_KEY = "__inopnc_last_build_sha";
/** 내 문서 인덱스 prefix (myDocsStore, scope별 키: `${MY_DOCS_INDEX_PREFIX}${scope}`) */
export const MY_DOCS_INDEX_PREFIX = "inopnc_my_docs_index_v1:";
/** 현장별 숙소 메모 prefix (useSiteLodging, 키: `${SITE_LODGE_KEY_PREFIX}${siteId}`) */
export const SITE_LODGE_KEY_PREFIX = "inopnc_site_lodge:";
