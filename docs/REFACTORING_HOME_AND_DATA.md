# 홈·통합 앱 리팩토링 검토 및 데이터 계약

이 문서는 `INOPNC_FN-main` 내 **홈(iframe + legacy)** 과 **통합 앱**이 데이터 충돌 없이, 수정 후에도 오류 없이 동작하도록 정리한 검토 결과와 가이드입니다.

---

## 1. 현재 구조 요약

### 1.1 홈 렌더 경로

| 경로 | 설명 |
|------|------|
| **Partner** | `PartnerHomePage` (파트너 전용) |
| **iframe-main / iframe-fallback** | `public/home-v2/main-v2-app` 정적 앱을 iframe으로 로드 |
| **legacy** | iframe 로드 실패 시 `WorkerHomePageLegacy` (HomePage.legacy) 로 폴백 |

### 1.2 데이터 흐름 (충돌 방지 포인트)

```
[메인 앱]
  useSiteList() ──┐
  useOperationalWorkerNames() ──┼── localStorage (inopnc_live_site_options, inopnc_live_worker_options)
                                │         ↑
[iframe home-v2]                 │    동일 키로 읽기 (same-origin)
  정적 앱이 위 키만 읽어서 현장/작업자 목록 표시
  저장 시 inopnc_work_log 에만 드래프트 저장

[WorkerHomePageLegacy]
  useSiteList() → 현장 목록
  저장 시: siteWorklogs, sitePhotos, siteDrawings, inopnc_worklogs_v4_site_based, inopnc_work_log 초기화
           + Supabase (saveWorklogMutation)

[WorklogPage]
  parseHomeDraft() → inopnc_work_log 읽어서 폼 초기값으로 사용
  worklogStore / Supabase 와 연동
```

- **같은 키를 쓰는 곳**이 여러 모듈에 있으므로, **키는 반드시 `src/constants/storageKeys.ts` 에만 정의**하고, 모든 읽기/쓰기는 이 상수를 import 해서 사용합니다.

---

## 2. 저장소 키 통합 (데이터 충돌 방지)

| 상수 | 용도 | 사용처 |
|------|------|--------|
| `HOME_SITE_STORAGE_KEY` | iframe용 현장 목록 | HomePage.tsx |
| `HOME_WORKER_STORAGE_KEY` | iframe용 작업자 목록 | HomePage.tsx |
| `HOME_DRAFT_KEY` | 홈 드래프트 (iframe/legacy 저장 → WorklogPage 읽기) | HomePage.legacy, WorklogPage |
| `SITE_WORKLOGS_KEY` | 현장+날짜별 worklog 본문 | HomePage.legacy, worklogStore |
| `SITE_PHOTOS_KEY` | 현장+날짜별 사진 | HomePage.legacy, worklogStore, offlineStore, DocPage |
| `SITE_DRAWINGS_KEY` | 현장+날짜별 도면 | HomePage.legacy, worklogStore, offlineStore, DocPage |
| `WORKLOG_INDEX_V4_KEY` | 작업일지 인덱스 v4 | HomePage.legacy, worklogStore |

- **새 키가 필요하면** `src/constants/storageKeys.ts` 에만 추가하고, 기존 문자열 리터럴을 사용하지 않습니다.
- **키 이름을 바꾸면** 반드시 `storageKeys.ts` 한 곳만 수정하고, 사용처는 상수 import 로만 참조합니다.

---

## 3. 홈(정적 앱)과의 계약

- **iframe (home-v2)** 은 **읽기 전용**으로 다음 키만 사용합니다.
  - `inopnc_live_site_options` (배열: `{ value, text, dept?, contractor? }[]`)
  - `inopnc_live_worker_options` (문자열 배열)
  - `inopnc_work_log` (드래프트 저장, WorklogPage 와 동일 스키마 유지)
- **쓰기**는 `inopnc_work_log` 만 합니다. `siteWorklogs` / `sitePhotos` / `siteDrawings` 는 메인 앱·legacy 전용이므로 iframe에서는 건드리지 않습니다.
- **네비게이션**: iframe은 `postMessage({ type: "inopnc:navigate", path })` 만 보내고, 메인 앱이 `HOME_ALLOWED_ROUTES` 로 검사해 `navigate(path)` 합니다. 허용 경로 변경 시 `HomePage.tsx` 의 `HOME_ALLOWED_ROUTES` 만 수정하면 됩니다.

이렇게 하면 **정적 앱(iframe)** 과 **메인 앱** 간 데이터 충돌 없이, 수정 후에도 통합 앱이 안정적으로 동작합니다.

---

## 4. 수정·배포 시 체크리스트

- [ ] **저장소 키**  
  새 키 추가/변경 시 `src/constants/storageKeys.ts` 만 수정하고, 전체 검색으로 문자열 리터럴이 남지 않았는지 확인.

- [ ] **홈 iframe**  
  `home-v2` 빌드 결과물을 갱신할 때, 위 계약(읽는 키·쓰는 키·postMessage)을 유지했는지 확인.

- [ ] **legacy 폴백**  
  `WorkerHomePageLegacy` (저장 로직, 사용하는 훅/스토어) 변경 시, `siteWorklogs` / `sitePhotos` / `siteDrawings` / `WORKLOG_INDEX_V4_KEY` / `HOME_DRAFT_KEY` 를 계속 `storageKeys` 상수로만 사용하는지 확인.

- [ ] **WorklogPage**  
  `parseHomeDraft` 가 기대하는 `inopnc_work_log` 스키마를 바꿀 때, iframe·legacy 저장 형식과 호환되는지 확인.

---

## 5. 요약

- **데이터 충돌 방지**: 모든 localStorage/저장소 키는 `src/constants/storageKeys.ts` 에만 정의하고, 홈(iframe/legacy)·작업일지·worklogStore·offlineStore·DocPage 는 이 상수만 사용합니다.
- **통합 앱 안정성**: 홈은 “iframe 우선 + 실패 시 legacy” 구조를 유지하고, iframe과 메인 앱 간에는 위 저장소·postMessage 계약만 지키면 수정 후에도 오류 없이 동작하도록 되어 있습니다.
- **향후 수정 시**: 키 추가/변경은 `storageKeys.ts` 중심으로 하고, 홈·작업일지·worklog 관련 변경 시 이 문서의 데이터 흐름과 체크리스트를 한 번만 점검하면 됩니다.
