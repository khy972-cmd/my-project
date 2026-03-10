
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  HardHat,
  Image as ImageIcon,
  Loader2,
  Package,
  Pin,
  PinOff,
  Plus,
  ScanLine,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SiteCombobox, { type SiteComboboxOption } from "@/components/site/SiteCombobox";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteList } from "@/hooks/useSiteList";
import { useOperationalWorkerNames } from "@/hooks/useOperationalWorkerNames";
import { rememberRecentSiteValue } from "@/lib/siteList";
import {
  useSaveWorklog,
  useUpdateWorklog,
  useUpdateWorklogStatus,
  useWorklogs,
  type WorklogMutationInput,
} from "@/hooks/useSupabaseWorklogs";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  getSiteDrawingBuckets,
  type ManpowerItem,
  type MaterialItem,
  type WorkSet,
  type WorklogEntry,
  type WorklogStatus,
} from "@/lib/worklogStore";
import {
  deleteRef,
  getObjectUrl,
  isAttachmentRef,
  revokeObjectUrl,
  saveFiles,
  type AttachmentRef,
  type AttachmentType,
} from "@/lib/attachmentStore";
import DocumentViewer from "@/components/viewer/DocumentViewer";
import PartnerWorklogPage from "@/components/partner/PartnerWorklogPage";
import DrawingMarkingOverlay from "@/components/overlays/DrawingMarkingOverlay";
import DrawingSelectSheet from "@/components/media/DrawingSelectSheet";
import {
  appendSiteWorklogSnapshot,
  buildSnapshotRowsFromLogs,
  deriveSiteStatusFromLogs,
  getSiteWorklogDraft,
  listSiteWorklogDrafts,
  toSiteDraftKey,
  upsertSiteWorklogDraft,
  type SiteWorklogDraft,
  type SiteWorklogSnapshotRow,
} from "@/lib/siteWorklogDraftStore";
import { HOME_DRAFT_KEY, MEMO_AUTOSAVE_KEY } from "@/constants/storageKeys";
import { getTodayYYYYMMDD } from "@/lib/dateFormat";
import { getLegacyMediaUrl } from "@/lib/legacyMedia";

const MEMBER_CHIPS = ["슬라브", "거더", "기둥", "기타"];
const PROCESS_CHIPS = ["균열", "면", "마감", "기타"];
const TYPE_CHIPS = ["지하", "지상", "지붕", "기타"];
const MATERIAL_OPTIONS = ["NPC-1000", "NPC-3000Q", "EP-3020", "무수축몰탈", "프라이머", "기타"];

type SheetType = "manpower" | "work" | "material" | "media" | null;
type SaveIntent = "draft" | "pending";
type WorklogTab = "write" | "view";
type GalleryKind = AttachmentType | "receipt" | null;
type LegacyMedia = AttachmentRef & { url?: string; img?: string };
type SiteCardFilter = "all" | "pending" | "rejected" | "approved";
type ReplaceMediaTarget = {
  type: AttachmentType;
  index: number;
  status: string;
};

const STATUS_META: Record<
  WorklogStatus,
  {
    label: string;
    chipClass: string;
    cornerClass: string;
  }
> = {
  draft: {
    label: "작성중",
    chipClass: "bg-blue-50 text-blue-600 border-blue-200",
    cornerClass: "bg-blue-500 text-white",
  },
  pending: {
    label: "요청",
    chipClass: "bg-indigo-50 text-indigo-600 border-indigo-200",
    cornerClass: "bg-indigo-500 text-white",
  },
  approved: {
    label: "완료",
    chipClass: "bg-emerald-50 text-emerald-600 border-emerald-200",
    cornerClass: "bg-muted-foreground text-white",
  },
  rejected: {
    label: "반려",
    chipClass: "bg-red-50 text-red-600 border-red-200",
    cornerClass: "bg-red-500 text-white",
  },
};

interface WorklogFormState {
  siteValue: string;
  siteName: string;
  workDate: string;
  dept: string;
  memo: string;
  manpower: ManpowerItem[];
  workSets: WorkSet[];
  materials: MaterialItem[];
  photos: LegacyMedia[];
  drawings: LegacyMedia[];
  status: WorklogStatus;
}

interface HomeDraftState {
  selectedSite?: unknown;
  siteSearch?: unknown;
  dept?: unknown;
  workDate?: unknown;
  manpowerList?: unknown;
  workSets?: unknown;
  materials?: unknown;
  photos?: unknown;
  drawings?: unknown;
}

interface SiteDailyRow {
  date: string;
  workSets: WorkSet[];
  manpower: ManpowerItem[];
  manpowerHistory: ManpowerItem[];
  materials: MaterialItem[];
  assets: {
    photos: LegacyMedia[];
    drawings: LegacyMedia[];
  };
  status: WorklogStatus;
  versions: number;
  memo: string;
}

interface SiteDailyModel {
  baseInfo: {
    siteName: string;
    dept: string;
    contractor: string;
  };
  dailyData: Record<string, SiteDailyRow>;
}

interface SiteMediaRow {
  key: string;
  date: string;
  type: AttachmentType;
  item: LegacyMedia;
  title: string;
}

interface SiteCardSummary {
  siteKey: string;
  siteValue: string;
  siteName: string;
  dept: string;
  status: WorklogStatus;
  dateCount: number;
  photoCount: number;
  drawingCount: number;
  receiptCount: number;
  lastUpdatedAt: string;
  latestVersion: number;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function makeRowId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function createManpower(defaultWorker?: string): ManpowerItem {
  return {
    id: makeRowId(),
    worker: defaultWorker || "",
    workHours: 1,
    isCustom: !defaultWorker,
    locked: false,
  };
}

function createWorkSet(): WorkSet {
  return {
    id: makeRowId(),
    member: "",
    process: "",
    type: "",
    location: {
      block: "",
      dong: "",
      floor: "",
    },
    customMemberValue: "",
    customProcessValue: "",
    customTypeValue: "",
  };
}

function createMaterial(): MaterialItem {
  return {
    id: makeRowId(),
    name: "",
    qty: 0,
  };
}

function cloneLocation(location: WorkSet["location"] | undefined): WorkSet["location"] {
  return {
    block: location?.block || "",
    dong: location?.dong || "",
    floor: location?.floor || "",
  };
}

function createDefaultForm(today: string): WorklogFormState {
  return {
    siteValue: "",
    siteName: "",
    workDate: today,
    dept: "",
    memo: "",
    manpower: [createManpower()],
    workSets: [createWorkSet()],
    materials: [],
    photos: [],
    drawings: [],
    status: "draft",
  };
}

function cloneManpowerRows(rows: ManpowerItem[]) {
  return rows.map((item) => ({
    ...item,
    id: makeRowId(),
    worker: asString(item.worker),
    workHours: asNumber(item.workHours, 0),
  }));
}

function cloneWorkSets(rows: WorkSet[]) {
  return rows.map((item) => ({
    ...item,
    id: makeRowId(),
    member: asString(item.member),
    process: asString(item.process),
    type: asString(item.type),
    location: cloneLocation(item.location),
    customMemberValue: asString(item.customMemberValue),
    customProcessValue: asString(item.customProcessValue),
    customTypeValue: asString(item.customTypeValue),
  }));
}

function cloneMaterials(rows: MaterialItem[]) {
  return rows.map((item) => ({
    ...item,
    id: makeRowId(),
    name: asString(item.name),
    qty: Math.max(0, asNumber(item.qty, 0)),
  }));
}

function normalizePhotoStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "before" || value === "보수전") return "before";
  if (value === "receipt" || value === "확인서" || value === "confirm" || value === "confirmation") return "receipt";
  return "after";
}

function normalizeDrawingStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "done" || value === "완료도면" || value === "완료") return "done";
  return "progress";
}

function normalizeMediaStatus(type: AttachmentType, status: string) {
  return type === "photo" ? normalizePhotoStatus(status) : normalizeDrawingStatus(status);
}

function cloneMediaRows(rows: LegacyMedia[], forcedType?: AttachmentType) {
  return rows.map((item, index) => {
    const type = forcedType || (item.type === "drawing" ? "drawing" : "photo");
    const defaultStatus = type === "drawing" ? "progress" : "after";
    const legacyUrl = asString((item as { url?: unknown; img?: unknown }).url ?? (item as { url?: unknown; img?: unknown }).img).trim();
    return {
      ...item,
      id: asString(item.id) || `legacy_${type}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      status: normalizeMediaStatus(type, asString(item.status, defaultStatus)),
      timestamp: asString(item.timestamp, new Date().toISOString()),
      ...(legacyUrl ? { url: legacyUrl } : {}),
    };
  });
}

function sanitizeMediaArrays(photos: LegacyMedia[], drawings: LegacyMedia[]) {
  const safePhotos = Array.isArray(photos) ? photos : [];
  const safeDrawings = Array.isArray(drawings) ? drawings : [];

  // Only fix explicit type mismatch; avoid heuristic re-classification.
  const promotedDrawings = safePhotos.filter((item) => asString(item?.type, "").toLowerCase() === "drawing");
  const demotedPhotos = safeDrawings.filter((item) => asString(item?.type, "").toLowerCase() === "photo");
  const basePhotos = safePhotos.filter((item) => asString(item?.type, "").toLowerCase() !== "drawing");
  const baseDrawings = safeDrawings.filter((item) => asString(item?.type, "").toLowerCase() !== "photo");

  return {
    photos: cloneMediaRows([...basePhotos, ...demotedPhotos], "photo"),
    drawings: cloneMediaRows([...baseDrawings, ...promotedDrawings], "drawing"),
  };
}

function getRowPhotos(row: SiteDailyRow) {
  return Array.isArray(row.assets?.photos) ? row.assets.photos : [];
}

function getRowDrawings(row: SiteDailyRow) {
  return Array.isArray(row.assets?.drawings) ? row.assets.drawings : [];
}

function isReceiptPhoto(item: LegacyMedia) {
  return normalizePhotoStatus(asString(item.status, "after")) === "receipt";
}

function getPhotoOnlyItems(rows: LegacyMedia[]) {
  return rows.filter((item) => !isReceiptPhoto(item));
}

function getReceiptItems(rows: LegacyMedia[]) {
  return rows.filter((item) => isReceiptPhoto(item));
}

function rowPhotoCount(row: SiteDailyRow) {
  return getPhotoOnlyItems(getRowPhotos(row)).length;
}

function rowReceiptCount(row: SiteDailyRow) {
  return getReceiptItems(getRowPhotos(row)).length;
}

function summarizeDailyRow(row: SiteDailyRow) {
  return `투입 ${row.manpower.length} · 작업 ${row.workSets.length} · 사진 ${rowPhotoCount(row)} · 도면 ${getRowDrawings(row).length} · 확인서 ${rowReceiptCount(row)}`;
}

function summarizeWorkSetBadge(workSets: WorkSet[]) {
  const first = workSets[0];
  if (!first) return "-";
  const member = resolvedValue(first.member || "", first.customMemberValue || "") || "-";
  const process = resolvedValue(first.process || "", first.customProcessValue || "") || "-";
  const type = resolvedValue(first.type || "", first.customTypeValue || "") || "-";
  return `${member}/${process}/${type}`;
}

function photoStatusLabel(status: string) {
  const value = normalizePhotoStatus(status);
  if (value === "before") return "보수전";
  if (value === "receipt") return "확인서";
  return "보수후";
}

function drawingStatusLabel(status: string) {
  return normalizeDrawingStatus(status) === "done" ? "완료도면" : "진행도면";
}
function parseHomeDraft(today: string): WorklogFormState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOME_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as HomeDraftState;
    if (!parsed || typeof parsed !== "object") return null;

    const nowIso = new Date().toISOString();
    const base = createDefaultForm(today);

    const manpower: ManpowerItem[] = Array.isArray(parsed.manpowerList)
      ? parsed.manpowerList
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            return {
              id: makeRowId(),
              worker: asString(row.worker),
              workHours: asNumber(row.workHours, 1),
              isCustom: !!row.isCustom,
              locked: !!row.locked,
            } as ManpowerItem;
          })
          .filter(Boolean) as ManpowerItem[]
      : [];

    const workSets: WorkSet[] = Array.isArray(parsed.workSets)
      ? parsed.workSets
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const location =
              row.location && typeof row.location === "object" ? (row.location as Record<string, unknown>) : {};
            return {
              id: makeRowId(),
              member: asString(row.member),
              process: asString(row.process),
              type: asString(row.type),
              location: {
                block: asString(location.block),
                dong: asString(location.dong),
                floor: asString(location.floor),
              },
              customMemberValue: asString(row.customMemberValue),
              customProcessValue: asString(row.customProcessValue),
              customTypeValue: asString(row.customTypeValue),
            } as WorkSet;
          })
          .filter(Boolean) as WorkSet[]
      : [];

    const materials: MaterialItem[] = Array.isArray(parsed.materials)
      ? parsed.materials
          .map((item) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const name = asString(row.name).trim();
            if (!name) return null;
            return {
              id: makeRowId(),
              name,
              qty: Math.max(0, asNumber(row.qty, 0)),
            } as MaterialItem;
          })
          .filter(Boolean) as MaterialItem[]
      : [];

    const photos: LegacyMedia[] = Array.isArray(parsed.photos)
      ? parsed.photos
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const img = asString(row?.img || row?.url).trim();
            if (!img) return null;
            const statusRaw = asString(row.status || row.desc || row.badge, "after");
            return {
              id: `home_photo_${Date.now()}_${index}`,
              type: "photo",
              status: normalizePhotoStatus(statusRaw),
              timestamp: nowIso,
              url: img,
            } as LegacyMedia;
          })
          .filter(Boolean) as LegacyMedia[]
      : [];

    const drawings: LegacyMedia[] = Array.isArray(parsed.drawings)
      ? parsed.drawings
          .map((item, index) => {
            const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
            const url = asString(row?.img || row?.url || item).trim();
            if (!url) return null;
            const statusRaw = asString(row?.status || row?.desc || row?.stage, "progress");
            return {
              id: `home_drawing_${Date.now()}_${index}`,
              type: "drawing",
              status: normalizeDrawingStatus(statusRaw),
              timestamp: nowIso,
              url,
            } as LegacyMedia;
          })
          .filter(Boolean) as LegacyMedia[]
      : [];

    return {
      ...base,
      siteValue: asString(parsed.selectedSite),
      siteName: asString(parsed.siteSearch),
      dept: asString(parsed.dept),
      workDate: asString(parsed.workDate, today),
      manpower: manpower.length > 0 ? manpower : base.manpower,
      workSets: workSets.length > 0 ? workSets : base.workSets,
      materials,
      photos,
      drawings,
      status: "draft",
    };
  } catch {
    return null;
  }
}

function toFormState(log: WorklogEntry): WorklogFormState {
  const manpower = Array.isArray(log.manpower)
    ? log.manpower.map((item) => ({
        ...item,
        id: Number(item.id) || makeRowId(),
        worker: item.worker || "",
        workHours: Number(item.workHours || 0),
      }))
    : [];

  const workSets = Array.isArray(log.workSets)
    ? log.workSets.map((item) => ({
        ...item,
        id: Number(item.id) || makeRowId(),
        member: item.member || "",
        process: item.process || "",
        type: item.type || "",
        location: cloneLocation(item.location),
        customMemberValue: item.customMemberValue || "",
        customProcessValue: item.customProcessValue || "",
        customTypeValue: item.customTypeValue || "",
      }))
    : [];

  const materials = Array.isArray(log.materials)
    ? log.materials.map((item) => ({
        ...item,
        id: Number(item.id) || makeRowId(),
        name: item.name || "",
        qty: Number(item.qty || 0),
      }))
    : [];

  const normalizedMedia = sanitizeMediaArrays(
    (log.photos || []) as LegacyMedia[],
    (log.drawings || []) as LegacyMedia[],
  );

  return {
    siteValue: log.siteValue || "",
    siteName: log.siteName || "",
    workDate: log.workDate,
    dept: log.dept || "",
    memo: log.weather || "",
    manpower: manpower.length > 0 ? manpower : [createManpower()],
    workSets: workSets.length > 0 ? workSets : [createWorkSet()],
    materials,
    photos: normalizedMedia.photos,
    drawings: normalizedMedia.drawings,
    status: log.status,
  };
}

function siteKey(siteValue: string, siteName: string) {
  return (siteValue || siteName || "").trim().toLowerCase();
}

function isSameSite(log: WorklogEntry, siteValue: string, siteName: string) {
  const left = siteKey(log.siteValue, log.siteName);
  const right = siteKey(siteValue, siteName);
  return !!left && !!right && left === right;
}

function resolvedValue(value: string, customValue: string) {
  const trimmed = value.trim();
  if (trimmed === "기타") return customValue.trim();
  return trimmed;
}

function hasFilledManpower(rows: ManpowerItem[]) {
  return rows.some((row) => row.worker.trim() && Number(row.workHours) > 0);
}

function hasFilledWorkSets(rows: WorkSet[]) {
  return rows.some(
    (row) => resolvedValue(row.member || "", row.customMemberValue || "") && resolvedValue(row.process || "", row.customProcessValue || ""),
  );
}

function hasFilledMaterials(rows: MaterialItem[]) {
  return rows.some((row) => row.name.trim() && Number(row.qty) > 0);
}

function mergeMissingFormValues(primary: WorklogFormState, fallback: WorklogFormState | null | undefined): WorklogFormState {
  if (!fallback) return primary;

  return {
    ...primary,
    siteValue: primary.siteValue || fallback.siteValue,
    siteName: primary.siteName || fallback.siteName,
    workDate: primary.workDate || fallback.workDate,
    dept: primary.dept || fallback.dept,
    memo: primary.memo || fallback.memo,
    manpower: hasFilledManpower(primary.manpower) ? primary.manpower : cloneManpowerRows(fallback.manpower),
    workSets: hasFilledWorkSets(primary.workSets) ? primary.workSets : cloneWorkSets(fallback.workSets),
    materials: hasFilledMaterials(primary.materials) ? primary.materials : cloneMaterials(fallback.materials),
    photos: primary.photos.length > 0 ? cloneMediaRows(primary.photos, "photo") : cloneMediaRows(fallback.photos, "photo"),
    drawings: primary.drawings.length > 0 ? cloneMediaRows(primary.drawings, "drawing") : cloneMediaRows(fallback.drawings, "drawing"),
  };
}

function statusProgressStep(status: WorklogStatus) {
  if (status === "rejected") return 3;
  if (status === "approved") return 4;
  if (status === "pending") return 2;
  return 1;
}

function mediaItemKey(item: LegacyMedia, index: number) {
  return item.id || `legacy_${index}`;
}

function countTotalHours(rows: ManpowerItem[]) {
  return rows.reduce((sum, row) => sum + (Number(row.workHours) || 0), 0);
}

function summarizeWork(workSets: WorkSet[]) {
  if (workSets.length === 0) return "입력된 작업이 없습니다.";
  const first = workSets[0];
  const member = resolvedValue(first.member, first.customMemberValue) || "-";
  const process = resolvedValue(first.process, first.customProcessValue) || "-";
  const area = [first.location.block, first.location.dong, first.location.floor]
    .map((row) => row.trim())
    .filter(Boolean)
    .join(" ");

  const base = area ? `${member} / ${process} (${area})` : `${member} / ${process}`;
  return workSets.length > 1 ? `${base} 외 ${workSets.length - 1}건` : base;
}

function summarizeMaterials(materials: MaterialItem[]) {
  if (materials.length === 0) return "입력된 자재가 없습니다.";
  const first = materials[0];
  const base = `${first.name || "-"} (${Number(first.qty || 0)})`;
  return materials.length > 1 ? `${base} 외 ${materials.length - 1}건` : base;
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function formatCompactDateTimeLabel(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${min}`;
}

function formatShortDateLabel(value: string) {
  if (!value) return "-";
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matched) {
    return `${matched[1].slice(2)}.${matched[2]}.${matched[3]}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

function siteCardActionHint(status: WorklogStatus) {
  if (status === "pending") return "승인 대기중 · 통합요청 취소 후 수정";
  if (status === "rejected") return "반려됨 · 반려 날짜부터 수정";
  if (status === "approved") return "완료 · 변경 시 날짜 선택 후 수정";
  return "날짜 수정은 버튼 클릭";
}

function toKoreanAffiliation(value: string) {
  const raw = (value || "").trim();
  if (!raw) return "미지정";
  const normalized = raw.toLowerCase();
  if (normalized === "hq") return "본사";
  if (normalized === "direct") return "직영";
  return raw;
}

function buildMemoStorageKey(siteValue: string, siteName: string, date: string) {
  return `${siteKey(siteValue, siteName)}|${date}`;
}

function readMemoAutosaveMap() {
  if (typeof window === "undefined") return {} as Record<string, string>;
  try {
    const raw = JSON.parse(window.localStorage.getItem(MEMO_AUTOSAVE_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {} as Record<string, string>;
    return raw as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function writeMemoAutosaveMap(next: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEMO_AUTOSAVE_KEY, JSON.stringify(next));
}

function getMemoAutosave(siteValue: string, siteName: string, date: string) {
  if (!date) return "";
  const key = buildMemoStorageKey(siteValue, siteName, date);
  return readMemoAutosaveMap()[key] || "";
}

function setMemoAutosave(siteValue: string, siteName: string, date: string, memo: string) {
  if (!date) return;
  const key = buildMemoStorageKey(siteValue, siteName, date);
  const map = readMemoAutosaveMap();
  const trimmed = memo.trim();
  if (trimmed) {
    map[key] = memo;
  } else {
    delete map[key];
  }
  writeMemoAutosaveMap(map);
}

function clearMemoAutosave(siteValue: string, siteName: string, date: string) {
  if (!date) return;
  const key = buildMemoStorageKey(siteValue, siteName, date);
  const map = readMemoAutosaveMap();
  if (key in map) {
    delete map[key];
    writeMemoAutosaveMap(map);
  }
}

function buildSiteDailyRow(log: WorklogEntry): SiteDailyRow {
  const manpowerRows = cloneManpowerRows(Array.isArray(log.manpower) ? log.manpower : []);
  const normalizedMedia = sanitizeMediaArrays(
    (log.photos || []) as LegacyMedia[],
    (log.drawings || []) as LegacyMedia[],
  );
  return {
    date: log.workDate,
    workSets: cloneWorkSets(Array.isArray(log.workSets) ? log.workSets : []),
    manpower: manpowerRows,
    manpowerHistory: cloneManpowerRows(manpowerRows),
    materials: cloneMaterials(Array.isArray(log.materials) ? log.materials : []),
    assets: {
      photos: normalizedMedia.photos,
      drawings: normalizedMedia.drawings,
    },
    status: log.status,
    versions: Math.max(1, Number(log.version || 1)),
    memo: log.weather || "",
  };
}

function buildSiteDailyModel(params: {
  siteName: string;
  dept: string;
  contractor: string;
  logs: WorklogEntry[];
}): SiteDailyModel {
  const { siteName, dept, contractor, logs } = params;
  const dailyData: Record<string, SiteDailyRow> = {};

  logs.forEach((log) => {
    const date = log.workDate;
    if (!date) return;
    const existing = dailyData[date];
    if (!existing || Number(log.version || 0) >= Number(existing.versions || 0)) {
      dailyData[date] = buildSiteDailyRow(log);
    }
  });

  return {
    baseInfo: {
      siteName: siteName || "",
      dept: dept || "",
      contractor: contractor || dept || "",
    },
    dailyData,
  };
}

function toFormStateFromSiteDaily(params: {
  siteValue: string;
  siteName: string;
  dept: string;
  row: SiteDailyRow;
}): WorklogFormState {
  const { siteValue, siteName, dept, row } = params;
  const manpowerSeed =
    Array.isArray(row.manpower) && row.manpower.length > 0
      ? row.manpower
      : Array.isArray(row.manpowerHistory)
        ? row.manpowerHistory
        : [];

  const normalizedMedia = sanitizeMediaArrays(getRowPhotos(row), getRowDrawings(row));

  return {
    siteValue,
    siteName,
    workDate: row.date,
    dept,
    memo: row.memo || "",
    manpower: manpowerSeed.length > 0 ? cloneManpowerRows(manpowerSeed) : [createManpower()],
    workSets: row.workSets.length > 0 ? cloneWorkSets(row.workSets) : [createWorkSet()],
    materials: cloneMaterials(row.materials || []),
    photos: normalizedMedia.photos,
    drawings: normalizedMedia.drawings,
    status: row.status || "draft",
  };
}

export default function WorklogPage() {
  const { isPartner, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-text-sub">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isPartner) return <PartnerWorklogPage />;
  return <WorkerWorklogPage />;
}

function WorkerWorklogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => getTodayYYYYMMDD(), []);

  const { data: logs = [], isLoading } = useWorklogs();
  const { data: siteList = [] } = useSiteList();
  const { data: workerNames = [] } = useOperationalWorkerNames();

  const saveMutation = useSaveWorklog();
  const updateMutation = useUpdateWorklog();
  const statusMutation = useUpdateWorklogStatus();

  const [form, setForm] = useState<WorklogFormState>(() => mergeMissingFormValues(createDefaultForm(today), parseHomeDraft(today)));
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [activeTab, setActiveTab] = useState<WorklogTab>("write");
  const [galleryKind, setGalleryKind] = useState<GalleryKind>(null);
  const [logListOpen, setLogListOpen] = useState(false);

  const [isSiteSearchCompact, setIsSiteSearchCompact] = useState(() => !!parseHomeDraft(today)?.siteName);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [materialSelect, setMaterialSelect] = useState(MATERIAL_OPTIONS[0]);
  const [materialQty, setMaterialQty] = useState("");
  const [isMaterialDirect, setIsMaterialDirect] = useState(false);
  const [customMaterialValue, setCustomMaterialValue] = useState("");
  const [viewer, setViewer] = useState<{
    open: boolean;
    url: string;
    title: string;
  }>({ open: false, url: "", title: "" });
  const [marking, setMarking] = useState<{
    open: boolean;
    index: number;
    imageSrc: string;
  }>({ open: false, index: -1, imageSrc: "" });
  const [drawingSheetOpen, setDrawingSheetOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceMediaTarget | null>(null);
  const [siteDraft, setSiteDraft] = useState<SiteWorklogDraft | null>(null);
  const [siteMemo, setSiteMemo] = useState("");
  const [draftTick, setDraftTick] = useState(0);
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [focusDateKey, setFocusDateKey] = useState<string | null>(null);
  const [highlightDateKey, setHighlightDateKey] = useState<string | null>(null);
  const [siteCardFilter, setSiteCardFilter] = useState<SiteCardFilter>("all");
  const [pinnedSiteCardKeys, setPinnedSiteCardKeys] = useState<string[]>([]);

  const loadKeyRef = useRef("");
  const activeMediaIdsRef = useRef<string[]>([]);
  const writeDateCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const siteDefaultMapRef = useRef<Record<string, WorklogFormState>>({});

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const receiptInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  const busy = isSaving || saveMutation.isPending || updateMutation.isPending || statusMutation.isPending;

  const sortedLogs = useMemo(
    () =>
      [...logs].sort((a, b) => {
        if (a.workDate !== b.workDate) return b.workDate.localeCompare(a.workDate);
        const aUpdated = a.updatedAt || a.createdAt;
        const bUpdated = b.updatedAt || b.createdAt;
        if (aUpdated !== bUpdated) return bUpdated.localeCompare(aUpdated);
        return b.version - a.version;
      }),
    [logs],
  );
  const siteDraftMap = useMemo(() => {
    const map = new Map<string, SiteWorklogDraft>();
    listSiteWorklogDrafts().forEach((item) => map.set(item.siteKey, item));
    return map;
  }, [draftTick]);

  const siteCards = useMemo(() => {
    const map = new Map<
      string,
      {
        base: SiteCardSummary;
        dates: Set<string>;
      }
    >();

    siteList.forEach((site) => {
      const key = toSiteDraftKey(site.site_id, site.site_name);
      if (!key) return;
      const draft = siteDraftMap.get(key);
      map.set(key, {
        base: {
          siteKey: key,
          siteValue: site.site_id,
          siteName: site.site_name,
          dept: site.dept || "",
          status: draft?.status || "draft",
          dateCount: draft?.includedDates.length || 0,
          photoCount: 0,
          drawingCount: 0,
          receiptCount: 0,
          lastUpdatedAt: draft?.lastUpdatedAt || "",
          latestVersion: draft?.latestVersion || 0,
        },
        dates: new Set(draft?.includedDates || []),
      });
    });

    sortedLogs.forEach((log) => {
      const key = toSiteDraftKey(log.siteValue, log.siteName);
      if (!key) return;
      const draft = siteDraftMap.get(key);
      const existing = map.get(key) || {
        base: {
          siteKey: key,
          siteValue: log.siteValue,
          siteName: log.siteName,
          dept: log.dept || "",
          status: draft?.status || deriveSiteStatusFromLogs([log]),
          dateCount: 0,
          photoCount: 0,
          drawingCount: 0,
          receiptCount: 0,
          lastUpdatedAt: "",
          latestVersion: 0,
        },
        dates: new Set<string>(),
      };
      const logReceiptCount = Array.isArray(log.photos)
        ? log.photos.filter((item) => isReceiptPhoto(item as LegacyMedia)).length
        : 0;

      if (log.workDate) existing.dates.add(log.workDate);
      existing.base = {
        ...existing.base,
        siteValue: existing.base.siteValue || log.siteValue,
        siteName: existing.base.siteName || log.siteName,
        dept: existing.base.dept || log.dept || "",
        status: draft?.status || existing.base.status,
        photoCount: existing.base.photoCount + Number(log.photoCount || 0),
        drawingCount: existing.base.drawingCount + Number(log.drawingCount || 0),
        receiptCount: existing.base.receiptCount + logReceiptCount,
        lastUpdatedAt:
          existing.base.lastUpdatedAt && existing.base.lastUpdatedAt > (log.updatedAt || log.createdAt)
            ? existing.base.lastUpdatedAt
            : log.updatedAt || log.createdAt,
        latestVersion: Math.max(existing.base.latestVersion || 0, Number(log.version || 0), draft?.latestVersion || 0),
        dateCount: existing.dates.size,
      };
      map.set(key, existing);
    });

    return [...map.values()]
      .map((item) => ({ ...item.base, dateCount: item.dates.size || item.base.dateCount }))
      .filter((item) => !!item.siteName)
      .sort((a, b) => {
        if (a.lastUpdatedAt !== b.lastUpdatedAt) return b.lastUpdatedAt.localeCompare(a.lastUpdatedAt);
        return a.siteName.localeCompare(b.siteName);
      });
  }, [siteList, sortedLogs, siteDraftMap]);
  const filteredSiteCards = useMemo(() => {
    if (siteCardFilter === "all") return siteCards;
    return siteCards.filter((card) => card.status === siteCardFilter);
  }, [siteCardFilter, siteCards]);
  const displayedSiteCards = useMemo(() => {
    if (pinnedSiteCardKeys.length === 0) return filteredSiteCards;
    return [...filteredSiteCards].sort((a, b) => {
      const aPinned = pinnedSiteCardKeys.includes(a.siteKey);
      const bPinned = pinnedSiteCardKeys.includes(b.siteKey);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return 0;
    });
  }, [filteredSiteCards, pinnedSiteCardKeys]);

  const siteSelectionOptions = useMemo<SiteComboboxOption[]>(
    () =>
      siteList.map((site) => ({
        value: site.site_name,
        label: site.site_name,
        siteId: site.site_id,
        description: site.dept ? toKoreanAffiliation(site.dept) : undefined,
        keywords: site.dept ? [site.dept, toKoreanAffiliation(site.dept)] : undefined,
      })),
    [siteList],
  );

  const selectedSite = useMemo(() => {
    if (!form.siteValue && !form.siteName) return undefined;
    return (
      siteList.find((site) => site.site_id === form.siteValue) ||
      siteList.find((site) => site.site_name === form.siteName)
    );
  }, [siteList, form.siteValue, form.siteName]);
  const currentSiteKey = useMemo(() => siteKey(form.siteValue, form.siteName), [form.siteValue, form.siteName]);

  const selectedSiteLogs = useMemo(
    () => sortedLogs.filter((log) => isSameSite(log, form.siteValue, form.siteName)),
    [sortedLogs, form.siteValue, form.siteName],
  );

  const selectedSiteLogMap = useMemo(() => {
    const map = new Map<string, WorklogEntry>();
    selectedSiteLogs.forEach((entry) => {
      if (!entry.workDate) return;
      if (!map.has(entry.workDate)) map.set(entry.workDate, entry);
    });
    return map;
  }, [selectedSiteLogs]);

  const matchingLog = useMemo(() => {
    if (!form.workDate) return undefined;
    return selectedSiteLogMap.get(form.workDate);
  }, [selectedSiteLogMap, form.workDate]);

  const previousSiteLog = useMemo(() => {
    if (!form.workDate) return undefined;
    return selectedSiteLogs.find((entry) => entry.workDate < form.workDate);
  }, [selectedSiteLogs, form.workDate]);

  const homeDraftSnapshot = useMemo(() => parseHomeDraft(today), [today]);

  const affiliationLabel = (selectedSite?.dept || form.dept || "").trim() || "미지정";
  const hasSiteName = !!form.siteName.trim();
  const hasDate = !!form.workDate;
  const manpowerValidCount = form.manpower.filter((row) => row.worker.trim() && Number(row.workHours) > 0).length;
  const workValidCount = form.workSets.filter(
    (row) => resolvedValue(row.member, row.customMemberValue) && resolvedValue(row.process, row.customProcessValue),
  ).length;
  const receiptCount = form.photos.filter((item) => isReceiptPhoto(item)).length;
  const photoCount = form.photos.length - receiptCount;
  const mediaRequiredCount = photoCount + form.drawings.length;
  const isReadyToSubmit = hasSiteName && hasDate && manpowerValidCount > 0 && workValidCount > 0 && mediaRequiredCount > 0;

  const manpowerSummary =
    manpowerValidCount > 0
      ? `${manpowerValidCount}명 / 총 ${countTotalHours(form.manpower).toFixed(1)}공수`
      : "입력된 투입이 없습니다.";
  const workSummary = summarizeWork(form.workSets.filter((row) => resolvedValue(row.member, row.customMemberValue)));
  const materialSummary = summarizeMaterials(form.materials.filter((row) => row.name.trim() && Number(row.qty) > 0));
  const mediaSummary =
    mediaRequiredCount > 0 || receiptCount > 0
      ? `사진 ${photoCount}건 · 도면 ${form.drawings.length}건 · 확인서 ${receiptCount}건`
      : "사진 또는 도면을 등록하세요.";
  const photoRowsForEdit = useMemo(
    () => form.photos.map((item, index) => ({ item, index })),
    [form.photos],
  );
  const normalPhotoRowsForEdit = useMemo(
    () => photoRowsForEdit.filter((row) => !isReceiptPhoto(row.item)),
    [photoRowsForEdit],
  );
  const receiptRowsForEdit = useMemo(
    () => photoRowsForEdit.filter((row) => isReceiptPhoto(row.item)),
    [photoRowsForEdit],
  );

  const currentStatus = matchingLog?.status || form.status;

  const siteDailyModel = useMemo(() => {
    const model = buildSiteDailyModel({
      siteName: form.siteName,
      dept: form.dept,
      contractor: affiliationLabel,
      logs: selectedSiteLogs,
    });

    if (hasSiteName && hasDate) {
      const manpowerRows = cloneManpowerRows(form.manpower);
      model.dailyData[form.workDate] = {
        date: form.workDate,
        workSets: cloneWorkSets(form.workSets),
        manpower: manpowerRows,
        manpowerHistory: cloneManpowerRows(manpowerRows),
        materials: cloneMaterials(form.materials),
        assets: {
          photos: cloneMediaRows(form.photos, "photo"),
          drawings: cloneMediaRows(form.drawings, "drawing"),
        },
        status: currentStatus,
        versions: matchingLog?.version || 1,
        memo: form.memo || "",
      };
    }

    return model;
  }, [
    affiliationLabel,
    currentStatus,
    form.dept,
    form.drawings,
    form.manpower,
    form.materials,
    form.memo,
    form.photos,
    form.siteName,
    form.workDate,
    form.workSets,
    hasDate,
    hasSiteName,
    matchingLog?.version,
    selectedSiteLogs,
  ]);
  const dailyRows = useMemo(
    () =>
      Object.values(siteDailyModel.dailyData).sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return Number(b.versions || 0) - Number(a.versions || 0);
      }),
    [siteDailyModel.dailyData],
  );
  const includedDates = useMemo(() => dailyRows.map((row) => row.date).filter(Boolean), [dailyRows]);
  const siteManpowerValidCount = useMemo(
    () =>
      dailyRows.reduce(
        (sum, row) => sum + row.manpower.filter((item) => item.worker.trim() && Number(item.workHours || 0) > 0).length,
        0,
      ),
    [dailyRows],
  );
  const siteWorkValidCount = useMemo(
    () =>
      dailyRows.reduce(
        (sum, row) =>
          sum +
          row.workSets.filter((item) => resolvedValue(item.member || "", item.customMemberValue || "") && resolvedValue(item.process || "", item.customProcessValue || "")).length,
        0,
      ),
    [dailyRows],
  );
  const sitePhotoValidCount = useMemo(
    () => dailyRows.reduce((sum, row) => sum + rowPhotoCount(row), 0),
    [dailyRows],
  );
  const siteDrawingValidCount = useMemo(
    () => dailyRows.reduce((sum, row) => sum + getRowDrawings(row).length, 0),
    [dailyRows],
  );
  const siteMediaValidCount = sitePhotoValidCount + siteDrawingValidCount;
  const siteReadyToSubmit = hasSiteName && siteManpowerValidCount > 0 && siteWorkValidCount > 0 && siteMediaValidCount > 0;
  const sitePendingInline = [
    !hasSiteName ? "현장" : "",
    siteManpowerValidCount === 0 ? "투입" : "",
    siteWorkValidCount === 0 ? "작업" : "",
    siteMediaValidCount === 0 ? "사진/도면" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (!hasSiteName) setIsSiteSearchCompact(false);
  }, [hasSiteName]);

  useEffect(() => {
    if (!currentSiteKey || !hasSiteName) {
      setSiteDraft(null);
      setSiteMemo("");
      return;
    }

    const existing = getSiteWorklogDraft(currentSiteKey);
    if (existing) {
      setSiteDraft(existing);
      setSiteMemo(existing.memo || "");
      return;
    }

    const bootstrap = upsertSiteWorklogDraft({
      siteKey: currentSiteKey,
      siteId: form.siteValue,
      siteName: form.siteName,
      dept: form.dept,
      memo: "",
      status: deriveSiteStatusFromLogs(selectedSiteLogs),
      includedDates,
      latestVersion: 0,
      snapshots: [],
    });

    const withSnapshot =
      selectedSiteLogs.length > 0
        ? appendSiteWorklogSnapshot({
            draft: bootstrap,
            status: deriveSiteStatusFromLogs(selectedSiteLogs),
            memo: "",
            includedDates,
            rows: buildSnapshotRowsFromLogs(selectedSiteLogs),
          })
        : bootstrap;

    setSiteDraft(withSnapshot);
    setSiteMemo(withSnapshot.memo || "");
    setDraftTick((prev) => prev + 1);
  }, [currentSiteKey, form.dept, form.siteName, form.siteValue, hasSiteName, includedDates, selectedSiteLogs]);

  const siteUnitStatus = useMemo(
    () => siteDraft?.status || deriveSiteStatusFromLogs(selectedSiteLogs),
    [siteDraft, selectedSiteLogs],
  );
  const siteUnitVersion = siteDraft?.latestVersion || 0;
  const siteUnitUpdatedAt = siteDraft?.lastUpdatedAt || selectedSiteLogs[0]?.updatedAt || selectedSiteLogs[0]?.createdAt || "";
  const latestSiteLogUpdatedAt = selectedSiteLogs[0]?.updatedAt || selectedSiteLogs[0]?.createdAt || "";
  const isPendingSite = siteUnitStatus === "pending";
  const canEditSite = siteUnitStatus !== "pending";
  const trimmedSiteMemo = siteMemo.trim();
  const nextActionGuide = useMemo(() => {
    if (siteUnitStatus === "pending") return "현재: 승인대기 | 다음: 통합요청 취소 후 수정";
    if (siteUnitStatus === "approved") return "현재: 완료 | 다음: 변경 시 수정 저장 후 통합승인요청";
    if (!siteReadyToSubmit) return `현재: 작성중 | 다음: ${sitePendingInline.replace(/ · /g, ".")}`;
    return "현재: 제출가능 | 다음: 통합승인요청";
  }, [sitePendingInline, siteReadyToSubmit, siteUnitStatus]);
  const pulseRequest = !busy && !isPendingSite && siteReadyToSubmit;
  const pulseCancel = !busy && isPendingSite;

  useEffect(() => {
    if (!siteDraft || !currentSiteKey) return;
    if (!latestSiteLogUpdatedAt) return;
    if (latestSiteLogUpdatedAt <= siteDraft.lastUpdatedAt) return;
    const derived = deriveSiteStatusFromLogs(selectedSiteLogs);
    if (derived === siteDraft.status) return;
    const next = upsertSiteWorklogDraft({
      siteKey: siteDraft.siteKey,
      siteId: siteDraft.siteId,
      siteName: siteDraft.siteName,
      dept: siteDraft.dept,
      memo: siteDraft.memo,
      status: derived,
      includedDates: siteDraft.includedDates,
      latestVersion: siteDraft.latestVersion,
      snapshots: siteDraft.snapshots,
      rejectedReason: derived === "rejected" ? siteDraft.rejectedReason || "반려됨" : undefined,
    });
    setSiteDraft(next);
    setDraftTick((prev) => prev + 1);
  }, [currentSiteKey, latestSiteLogUpdatedAt, selectedSiteLogs, siteDraft]);

  const sitePhotoRows = useMemo(() => {
    const list: SiteMediaRow[] = [];
    dailyRows.forEach((row) => {
      getPhotoOnlyItems(getRowPhotos(row)).forEach((item, index) => {
        list.push({
          key: `site_photo_${row.date}_${mediaItemKey(item, index)}`,
          date: row.date,
          type: "photo",
          item,
          title: `${form.siteName || row.date} 사진 ${index + 1}`,
        });
      });
    });
    return list;
  }, [dailyRows, form.siteName]);

  const siteDrawingRows = useMemo(() => {
    const list: SiteMediaRow[] = [];
    dailyRows.forEach((row) => {
      getRowDrawings(row).forEach((item, index) => {
        list.push({
          key: `site_drawing_${row.date}_${mediaItemKey(item, index)}`,
          date: row.date,
          type: "drawing",
          item,
          title: `${form.siteName || row.date} 도면 ${index + 1}`,
        });
      });
    });
    return list;
  }, [dailyRows, form.siteName]);
  const siteReceiptRows = useMemo(() => {
    const list: SiteMediaRow[] = [];
    dailyRows.forEach((row) => {
      getReceiptItems(getRowPhotos(row)).forEach((item, index) => {
        list.push({
          key: `site_receipt_${row.date}_${mediaItemKey(item, index)}`,
          date: row.date,
          type: "photo",
          item,
          title: `${form.siteName || row.date} 확인서 ${index + 1}`,
        });
      });
    });
    return list;
  }, [dailyRows, form.siteName]);

  const photoGroups = useMemo(() => {
    const map = new Map<string, SiteMediaRow[]>();
    sitePhotoRows.forEach((row) => {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date)!.push(row);
    });
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({ date, items }));
  }, [sitePhotoRows]);

  const drawingGroups = useMemo(() => {
    const map = new Map<string, SiteMediaRow[]>();
    siteDrawingRows.forEach((row) => {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date)!.push(row);
    });
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({ date, items }));
  }, [siteDrawingRows]);
  const receiptGroups = useMemo(() => {
    const map = new Map<string, SiteMediaRow[]>();
    siteReceiptRows.forEach((row) => {
      if (!map.has(row.date)) map.set(row.date, []);
      map.get(row.date)!.push(row);
    });
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({ date, items }));
  }, [siteReceiptRows]);

  const formMediaEntries = useMemo(
    () => [
      ...form.photos.map((item, index) => ({ key: `photo_${mediaItemKey(item, index)}`, item })),
      ...form.drawings.map((item, index) => ({ key: `drawing_${mediaItemKey(item, index)}`, item })),
    ],
    [form.photos, form.drawings],
  );

  const previewTargets = useMemo(
    () => [
      ...formMediaEntries,
      ...sitePhotoRows.map((row) => ({ key: row.key, item: row.item })),
      ...siteDrawingRows.map((row) => ({ key: row.key, item: row.item })),
      ...siteReceiptRows.map((row) => ({ key: row.key, item: row.item })),
    ],
    [formMediaEntries, sitePhotoRows, siteDrawingRows, siteReceiptRows],
  );

  useEffect(() => {
    const focusId = (searchParams.get("focus") || "").trim();
    if (!focusId) return;
    if (isLoading) return;

    const target = sortedLogs.find((log) => log.id === focusId);
    if (target) {
      const next = toFormState(target);
      const memoDraft = getMemoAutosave(target.siteValue, target.siteName, target.workDate);
      if (!next.memo && memoDraft) next.memo = memoDraft;
      setForm(next);
      setEditingLogId(target.id);
      setSiteSearch(target.siteName || target.siteValue);
      setActiveTab("write");
      setOpenDates((prev) => ({ ...prev, [target.workDate]: true }));
      setFocusDateKey(target.workDate);
      setHighlightDateKey(target.workDate);
    } else {
      toast.error("연결된 일지를 찾을 수 없습니다.");
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("focus");
    setSearchParams(nextParams, { replace: true });
  }, [isLoading, searchParams, setSearchParams, sortedLogs]);

  useEffect(() => {
    if (!focusDateKey) return;
    if (activeTab !== "write") return;

    const targetEl = writeDateCardRefs.current[focusDateKey];
    if (!targetEl) return;

    const timer = window.setTimeout(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusDateKey(null);
    }, 60);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeTab, dailyRows, focusDateKey]);

  useEffect(() => {
    if (!highlightDateKey) return;
    const timer = window.setTimeout(() => {
      setHighlightDateKey(null);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [highlightDateKey]);

  useEffect(() => {
    if (!hasSiteName || !hasDate) return;

    const key = `${form.siteValue}|${form.siteName}|${form.workDate}|${matchingLog?.id || "new"}|${matchingLog?.version || 0}`;
    if (loadKeyRef.current === key) return;
    loadKeyRef.current = key;

    const currentSiteKey = siteKey(form.siteValue, form.siteName);
    const draftSiteKey = homeDraftSnapshot ? siteKey(homeDraftSnapshot.siteValue, homeDraftSnapshot.siteName) : "";
    const draftMatchesSite = !!currentSiteKey && !!draftSiteKey && currentSiteKey === draftSiteKey;

    if (matchingLog) {
      const next = toFormState(matchingLog);
      const memoDraft = getMemoAutosave(form.siteValue, form.siteName, form.workDate);
      if (!next.memo && memoDraft) next.memo = memoDraft;
      setForm(next);
      setEditingLogId(matchingLog.id);
      setSiteSearch(matchingLog.siteName || matchingLog.siteValue);
      return;
    }

    let seeded = {
      ...createDefaultForm(today),
      siteValue: form.siteValue,
      siteName: form.siteName,
      workDate: form.workDate,
      dept: form.dept,
    };

    if (draftMatchesSite) seeded = mergeMissingFormValues(seeded, homeDraftSnapshot);
    const stickyDefaults = siteDefaultMapRef.current[currentSiteKey];
    if (stickyDefaults) seeded = mergeMissingFormValues(seeded, stickyDefaults);
    if (previousSiteLog) seeded = mergeMissingFormValues(seeded, toFormState(previousSiteLog));

    const memoDraft = getMemoAutosave(form.siteValue, form.siteName, form.workDate);
    if (!seeded.memo && memoDraft) seeded.memo = memoDraft;

    seeded.status = "draft";
    setForm(seeded);
    setEditingLogId(null);
  }, [
    form.dept,
    form.siteName,
    form.siteValue,
    form.workDate,
    hasDate,
    hasSiteName,
    homeDraftSnapshot,
    matchingLog,
    previousSiteLog,
    today,
  ]);

  useEffect(() => {
    if (!hasSiteName || !currentSiteKey || !canEditSite) return;
    siteDefaultMapRef.current[currentSiteKey] = {
      ...createDefaultForm(today),
      siteValue: form.siteValue,
      siteName: form.siteName,
      workDate: today,
      dept: form.dept,
      memo: "",
      manpower: cloneManpowerRows(form.manpower),
      workSets: cloneWorkSets(form.workSets),
      materials: cloneMaterials(form.materials),
      photos: [],
      drawings: [],
      status: "draft",
    };
  }, [canEditSite, currentSiteKey, form.dept, form.manpower, form.materials, form.siteName, form.siteValue, form.workSets, hasSiteName, today]);

  useEffect(() => {
    if (!hasSiteName || !hasDate) return;
    const timer = window.setTimeout(() => {
      setMemoAutosave(form.siteValue, form.siteName, form.workDate, form.memo || "");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form.memo, form.siteName, form.siteValue, form.workDate, hasDate, hasSiteName]);

  useEffect(() => {
    let cancelled = false;

    async function loadPreviewMap() {
      const next: Record<string, string> = {};
      const ids = new Set<string>();

      for (const row of previewTargets) {
        const legacy = getLegacyMediaUrl(row.item);
        if (legacy) {
          next[row.key] = legacy;
          continue;
        }

        if (!row.item.id) continue;
        ids.add(row.item.id);
        const url = await getObjectUrl(row.item.id);
        if (url) {
          next[row.key] = url;
        }
      }

      if (!cancelled) {
        activeMediaIdsRef.current = [...ids];
        setPreviewMap(next);
      }
    }

    loadPreviewMap();

    return () => {
      cancelled = true;
    };
  }, [previewTargets]);

  useEffect(
    () => () => {
      activeMediaIdsRef.current.forEach((id) => revokeObjectUrl(id));
    },
    [],
  );

  const selectSite = (siteId: string, siteName: string, dept?: string) => {
    setForm((prev) => ({
      ...prev,
      siteValue: siteId,
      siteName,
      dept: dept || prev.dept,
    }));
    setIsSiteSearchCompact(true);
    loadKeyRef.current = "";
  };

  const enterSiteFromCard = (card: SiteCardSummary) => {
    const draft = getSiteWorklogDraft(card.siteKey);
    const latest = sortedLogs.find((log) => isSameSite(log, card.siteValue, card.siteName));
    const targetDate = latest?.workDate || draft?.includedDates?.[0] || today;
    setForm((prev) => ({
      ...prev,
      siteValue: card.siteValue,
      siteName: card.siteName,
      dept: card.dept || latest?.dept || prev.dept,
      workDate: targetDate,
    }));
    setIsSiteSearchCompact(true);
    setActiveTab("write");
    if (targetDate) {
      setOpenDates((prev) => ({ ...prev, [targetDate]: true }));
    }
    loadKeyRef.current = "";
    rememberRecentSiteValue(card.siteName);
  };
  const toggleSiteCardPin = (siteKey: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setPinnedSiteCardKeys((prev) => {
      const exists = prev.includes(siteKey);
      toast.success(exists ? "상단 고정을 해제했습니다." : "상단에 고정했습니다.");
      return exists ? prev.filter((key) => key !== siteKey) : [siteKey, ...prev];
    });
  };

  const leaveSiteEditor = () => {
    setForm((prev) => ({ ...prev, siteValue: "", siteName: "", dept: "", memo: "" }));
    setSiteDraft(null);
    setSiteMemo("");
    setOpenDates({});
    setIsSiteSearchCompact(false);
    setActiveTab("write");
    setLogListOpen(false);
    setGalleryKind(null);
    loadKeyRef.current = "";
  };

  const resetCurrentForm = () => {
    setForm((prev) => ({
      ...createDefaultForm(today),
      siteValue: prev.siteValue,
      siteName: prev.siteName,
      workDate: prev.workDate,
      dept: prev.dept,
      memo: "",
    }));
    setEditingLogId(null);
    loadKeyRef.current = "";
  };

  const loadEntryToForm = (entry: WorklogEntry) => {
    const next = toFormState(entry);
    const memoDraft = getMemoAutosave(entry.siteValue, entry.siteName, entry.workDate);
    if (!next.memo && memoDraft) next.memo = memoDraft;

    setForm(next);
    setEditingLogId(entry.id);
    setSiteSearch(entry.siteName || entry.siteValue);
    setActiveTab("write");
    setLogListOpen(false);
    setGalleryKind(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const moveToDate = (date: string) => {
    const existing = selectedSiteLogMap.get(date);
    if (existing) {
      loadEntryToForm(existing);
      return;
    }

    const row = siteDailyModel.dailyData[date];
    if (!row) return;

    const next = toFormStateFromSiteDaily({
      siteValue: form.siteValue,
      siteName: form.siteName,
      dept: form.dept,
      row,
    });

    const memoDraft = getMemoAutosave(form.siteValue, form.siteName, date);
    if (!next.memo && memoDraft) next.memo = memoDraft;

    setForm(next);
    setEditingLogId(null);
    setActiveTab("write");
    setLogListOpen(false);
    setGalleryKind(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ensureEditableSite = () => {
    if (canEditSite) return true;
    toast.error("승인대기 상태입니다. 하단 [통합요청 취소] 후 수정할 수 있습니다.");
    return false;
  };

  const openSheetWithGuard = (next: Exclude<SheetType, null>) => {
    if (!ensureEditableSite()) return;
    setSheet(next);
  };

  const normalizeMediaForSave = (
    list: LegacyMedia[],
    type: AttachmentType,
    defaultStatus: string,
  ): AttachmentRef[] => {
    const now = new Date().toISOString();

    return list
      .map((item) => {
        if (!item?.id) return null;

        const normalized: LegacyMedia = {
          id: item.id,
          type,
          status: item.status || defaultStatus,
          timestamp: item.timestamp || now,
        };

        const legacy = getLegacyMediaUrl(item);
        if (legacy) normalized.url = legacy;
        return normalized as AttachmentRef;
      })
      .filter(Boolean) as AttachmentRef[];
  };
  const prepareMediaRefsForSave = async (
    list: LegacyMedia[],
    type: AttachmentType,
    defaultStatus: string,
  ): Promise<AttachmentRef[]> => {
    const stableRefs = normalizeMediaForSave(
      list.filter((item) => !getLegacyMediaUrl(item)),
      type,
      defaultStatus,
    );

    const legacyItems = list.filter((item) => !!getLegacyMediaUrl(item));
    if (legacyItems.length === 0) return stableRefs;

    const files: File[] = [];
    const fallbackLegacyRefs: AttachmentRef[] = [];

    for (let i = 0; i < legacyItems.length; i += 1) {
      const row = legacyItems[i];
      const legacyUrl = getLegacyMediaUrl(row);
      if (!legacyUrl) continue;

      try {
        const response = await fetch(legacyUrl);
        const blob = await response.blob();
        const ext = blob.type.includes("png")
          ? "png"
          : blob.type.includes("webp")
            ? "webp"
            : blob.type.includes("gif")
              ? "gif"
              : "jpg";
        files.push(
          new File([blob], `${type}_${Date.now()}_${i}.${ext}`, {
            type: blob.type || "application/octet-stream",
          }),
        );
      } catch {
        fallbackLegacyRefs.push(...normalizeMediaForSave([row], type, defaultStatus));
      }
    }

    if (files.length === 0) {
      return [...stableRefs, ...fallbackLegacyRefs];
    }

    try {
      const converted = await saveFiles({
        worklogId: editingLogId || `${form.siteValue || form.siteName}_${form.workDate}`,
        type,
        files,
        defaultStatus,
      });
      return [...stableRefs, ...converted, ...fallbackLegacyRefs];
    } catch {
      return [...stableRefs, ...fallbackLegacyRefs];
    }
  };

  const buildPayload = (
    intent: SaveIntent,
    version: number,
    photos: AttachmentRef[],
    drawings: AttachmentRef[],
  ): WorklogMutationInput => {
    const manpower = form.manpower
      .map((row) => ({
        ...row,
        worker: row.worker.trim(),
        workHours: Number(row.workHours || 0),
      }))
      .filter((row) => row.worker && row.workHours > 0);

    const workSets = form.workSets
      .map((row) => ({
        ...row,
        member: row.member || "",
        process: row.process || "",
        type: row.type || "",
        location: cloneLocation(row.location),
        customMemberValue: row.customMemberValue || "",
        customProcessValue: row.customProcessValue || "",
        customTypeValue: row.customTypeValue || "",
      }))
      .filter((row) => resolvedValue(row.member, row.customMemberValue) && resolvedValue(row.process, row.customProcessValue));

    const materials = form.materials
      .map((row) => ({
        ...row,
        name: row.name.trim(),
        qty: Number(row.qty || 0),
      }))
      .filter((row) => row.name && row.qty > 0);

    return {
      siteName: form.siteName.trim(),
      siteValue: form.siteValue,
      dept: form.dept,
      workDate: form.workDate,
      weather: form.memo,
      manpower,
      workSets,
      materials,
      photos,
      drawings,
      photoCount: photos.filter((item) => normalizePhotoStatus(item.status) !== "receipt").length,
      drawingCount: drawings.length,
      status: intent,
      version,
    };
  };

  const handleSave = async (intent: SaveIntent, options?: { silent?: boolean }): Promise<WorklogEntry | null> => {
    if (busy) return null;

    if (!hasSiteName) {
      toast.error("현장명을 선택해주세요.");
      return null;
    }

    if (!hasDate) {
      toast.error("작업일자를 선택해주세요.");
      return null;
    }

    if (intent === "pending" && !isReadyToSubmit) {
      toast.error("승인요청 조건(현장/투입/작업/사진·도면)을 확인해주세요.");
      return null;
    }

    setIsSaving(true);

    try {
      const existing = selectedSiteLogMap.get(form.workDate);

      const [preparedPhotos, preparedDrawings] = await Promise.all([
        prepareMediaRefsForSave(form.photos, "photo", "after"),
        prepareMediaRefsForSave(form.drawings, "drawing", "progress"),
      ]);

      const payload = buildPayload(intent, existing ? existing.version + 1 : 1, preparedPhotos, preparedDrawings);
      let savedEntry: WorklogEntry;

      if (existing) {
        savedEntry = await updateMutation.mutateAsync({ id: existing.id, entry: payload });
      } else {
        savedEntry = await saveMutation.mutateAsync(payload);
      }
      setEditingLogId(savedEntry.id);

      setForm((prev) => ({
        ...prev,
        status: intent,
        photos: cloneMediaRows(preparedPhotos as LegacyMedia[], "photo"),
        drawings: cloneMediaRows(preparedDrawings as LegacyMedia[], "drawing"),
      }));
      clearMemoAutosave(form.siteValue, form.siteName, form.workDate);
      loadKeyRef.current = "";
      if (!options?.silent) {
        toast.success(intent === "pending" ? "승인요청이 완료되었습니다." : "임시저장되었습니다.");
      }
      return savedEntry;
    } catch (error) {
      toast.error(errorMessage(error, "저장에 실패했습니다."));
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const buildSiteSnapshotRows = (options?: {
    requested?: boolean;
    dateEntryMap?: Map<string, WorklogEntry>;
    requestedIds?: Set<string>;
  }): SiteWorklogSnapshotRow[] => {
    const now = new Date().toISOString();
    const requested = !!options?.requested;
    return dailyRows.map((row) => {
      const linked = options?.dateEntryMap?.get(row.date) || selectedSiteLogMap.get(row.date);
      const shouldPending =
        requested &&
        !!linked &&
        ((options?.requestedIds && options.requestedIds.has(linked.id)) ||
          linked.status === "draft" ||
          linked.status === "rejected");
      const nextStatus = shouldPending ? "pending" : linked?.status || row.status;
      return {
        worklogId: linked?.id || `virtual_${currentSiteKey}_${row.date}`,
        date: row.date,
        version: Math.max(1, Number(linked?.version || row.versions || 1)),
        status: nextStatus,
        updatedAt: shouldPending ? now : linked?.updatedAt || linked?.createdAt || now,
      };
    });
  };

  const ensureSiteDraftBase = () => {
    const key = currentSiteKey;
    if (!key) return null;
    const existing = siteDraft || getSiteWorklogDraft(key);
    if (existing) return existing;
    return upsertSiteWorklogDraft({
      siteKey: key,
      siteId: form.siteValue,
      siteName: form.siteName,
      dept: form.dept,
      memo: siteMemo,
      status: deriveSiteStatusFromLogs(selectedSiteLogs),
      includedDates,
      latestVersion: 0,
      snapshots: [],
    });
  };

  const saveSiteDraftSnapshot = (
    nextStatus: WorklogStatus,
    options?: {
      dateEntryMap?: Map<string, WorklogEntry>;
      requestedIds?: Set<string>;
    },
  ) => {
    const base = ensureSiteDraftBase();
    if (!base) return null;
    const snapshotDates = [...new Set(includedDates)].sort((a, b) => b.localeCompare(a));
    const next = appendSiteWorklogSnapshot({
      draft: base,
      status: nextStatus,
      memo: siteMemo,
      includedDates: snapshotDates,
      rows: buildSiteSnapshotRows({
        requested: nextStatus === "pending",
        dateEntryMap: options?.dateEntryMap,
        requestedIds: options?.requestedIds,
      }),
      rejectedReason: nextStatus === "rejected" ? siteDraft?.rejectedReason : undefined,
    });
    setSiteDraft(next);
    setDraftTick((prev) => prev + 1);
    return next;
  };

  const handleUnifiedDraftSave = async () => {
    if (!hasSiteName) {
      toast.error("현장을 먼저 선택해주세요.");
      return;
    }
    if (isPendingSite) {
      toast.error("승인대기 상태입니다. 통합요청 취소 후 임시저장할 수 있습니다.");
      return;
    }

    const saved = await handleSave("draft", { silent: true });
    if (!saved) return;

    const dateEntryMap = new Map<string, WorklogEntry>();
    selectedSiteLogs.forEach((entry) => {
      if (entry.workDate && !dateEntryMap.has(entry.workDate)) dateEntryMap.set(entry.workDate, entry);
    });
    if (saved.workDate) dateEntryMap.set(saved.workDate, saved);

    saveSiteDraftSnapshot("draft", { dateEntryMap });
    toast.success("현장 누적 임시저장이 완료되었습니다.");
  };

  const handleUnifiedCancelRequest = async () => {
    if (!hasSiteName) {
      toast.error("현장을 먼저 선택해주세요.");
      return;
    }
    if (!isPendingSite) {
      toast.error("현재 승인대기 상태가 아닙니다.");
      return;
    }

    try {
      const dateEntryMap = new Map<string, WorklogEntry>();
      selectedSiteLogs.forEach((entry) => {
        if (entry.workDate && !dateEntryMap.has(entry.workDate)) dateEntryMap.set(entry.workDate, entry);
      });
      const pendingTargets = [...dateEntryMap.values()].filter((entry) => entry.status === "pending");
      const now = new Date().toISOString();

      for (const entry of pendingTargets) {
        await statusMutation.mutateAsync({ id: entry.id, status: "draft" });
        if (entry.workDate) {
          dateEntryMap.set(entry.workDate, { ...entry, status: "draft", updatedAt: now });
        }
      }

      saveSiteDraftSnapshot("draft", { dateEntryMap });
      setForm((prev) => ({ ...prev, status: "draft" }));
      toast.success("통합승인요청이 취소되었습니다. 수정 후 다시 요청하세요.");
    } catch (error) {
      toast.error(errorMessage(error, "승인요청 취소에 실패했습니다."));
    }
  };

  const handleUnifiedRequest = async () => {
    if (isPendingSite) {
      toast.error("현재 승인대기 상태입니다. 필요 시 통합요청 취소를 이용하세요.");
      return;
    }
    if (!siteReadyToSubmit) {
      toast.error("통합승인요청 조건(현장/투입/작업/사진·도면)을 확인해주세요.");
      return;
    }

    try {
      const saved = await handleSave("draft", { silent: true });
      if (!saved) return;

      const dateEntryMap = new Map<string, WorklogEntry>();
      selectedSiteLogs.forEach((entry) => {
        if (entry.workDate && !dateEntryMap.has(entry.workDate)) dateEntryMap.set(entry.workDate, entry);
      });
      if (saved.workDate) dateEntryMap.set(saved.workDate, saved);

      const requestTargets = [...dateEntryMap.values()].filter((entry) => entry.status === "draft" || entry.status === "rejected");
      const requestIds = new Set<string>(requestTargets.map((entry) => entry.id));
      const now = new Date().toISOString();
      for (const entry of requestTargets) {
        await statusMutation.mutateAsync({ id: entry.id, status: "pending" });
        if (entry.workDate) {
          dateEntryMap.set(entry.workDate, { ...entry, status: "pending", updatedAt: now });
        }
      }

      saveSiteDraftSnapshot("pending", { dateEntryMap, requestedIds: requestIds });
      setForm((prev) => ({ ...prev, status: "pending" }));
      toast.success("현장 통합승인요청이 완료되었습니다.");
    } catch (error) {
      toast.error(errorMessage(error, "통합승인요청에 실패했습니다."));
    }
  };

  const openMediaViewer = async (item: LegacyMedia, title: string) => {
    const legacy = getLegacyMediaUrl(item);
    if (legacy) {
      setViewer({ open: true, url: legacy, title });
      return;
    }

    const url = await getObjectUrl(item.id);
    if (!url) {
      toast.error("미리보기를 불러오지 못했습니다.");
      return;
    }

    setViewer({ open: true, url, title });
  };

  const uploadMedia = async (
    type: AttachmentType,
    fileList: FileList | null,
    options?: {
      defaultStatus?: string;
      label?: string;
    },
  ): Promise<boolean> => {
    if (!ensureEditableSite()) return false;
    if (!fileList || fileList.length === 0) return false;

    if (!hasSiteName || !hasDate) {
      toast.error("현장과 작업일자를 먼저 선택해주세요.");
      return false;
    }

    try {
      const refs = await saveFiles({
        worklogId: editingLogId || `${form.siteValue || form.siteName}_${form.workDate}`,
        type,
        files: Array.from(fileList),
        defaultStatus: options?.defaultStatus || (type === "photo" ? "after" : "progress"),
      });

      if (type === "photo") {
        setForm((prev) => ({
          ...prev,
          photos: cloneMediaRows([...prev.photos, ...(refs as LegacyMedia[])], "photo"),
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          drawings: cloneMediaRows([...prev.drawings, ...(refs as LegacyMedia[])], "drawing"),
        }));
      }

      toast.success(`${options?.label || (type === "photo" ? "사진" : "도면")} ${refs.length}건이 추가되었습니다.`);
      return true;
    } catch {
      toast.error("파일 저장에 실패했습니다.");
      return false;
    }
  };

  const triggerReplaceMedia = useCallback((target: ReplaceMediaTarget) => {
    if (!ensureEditableSite()) return;
    setReplaceTarget(target);
    replaceInputRef.current?.click();
  }, [ensureEditableSite]);

  const replaceMediaItem = useCallback(
    async (fileList: FileList | null) => {
      if (!replaceTarget || !fileList || fileList.length === 0) {
        setReplaceTarget(null);
        return;
      }
      if (!ensureEditableSite()) {
        setReplaceTarget(null);
        return;
      }

      const file = fileList[0];
      if (!file || !file.type.startsWith("image/")) {
        toast.error("이미지 파일만 교체할 수 있습니다.");
        setReplaceTarget(null);
        return;
      }

      const source = replaceTarget.type === "photo" ? form.photos : form.drawings;
      const current = source[replaceTarget.index];
      if (!current) {
        setReplaceTarget(null);
        return;
      }

      try {
        if (isAttachmentRef(current) && !getLegacyMediaUrl(current)) {
          await deleteRef(current.id);
          revokeObjectUrl(current.id);
        }

        const refs = await saveFiles({
          worklogId: editingLogId || `${form.siteValue || form.siteName}_${form.workDate}`,
          type: replaceTarget.type,
          files: [file],
          defaultStatus:
            replaceTarget.status || (replaceTarget.type === "photo" ? "after" : "progress"),
        });
        const replaced = refs[0] as LegacyMedia | undefined;
        if (!replaced) {
          toast.error("이미지 교체에 실패했습니다.");
          setReplaceTarget(null);
          return;
        }

        const nextItem: LegacyMedia = {
          ...replaced,
          type: replaceTarget.type,
          status: replaceTarget.status || replaced.status,
          timestamp: replaced.timestamp || new Date().toISOString(),
        };

        if (replaceTarget.type === "photo") {
          setForm((prev) => ({
            ...prev,
            photos: cloneMediaRows(
              prev.photos.map((item, rowIndex) => (rowIndex === replaceTarget.index ? nextItem : item)),
              "photo",
            ),
          }));
        } else {
          setForm((prev) => ({
            ...prev,
            drawings: cloneMediaRows(
              prev.drawings.map((item, rowIndex) => (rowIndex === replaceTarget.index ? nextItem : item)),
              "drawing",
            ),
          }));
        }

        toast.success("이미지를 교체했습니다.");
      } catch {
        toast.error("이미지 교체에 실패했습니다.");
      } finally {
        setReplaceTarget(null);
      }
    },
    [editingLogId, ensureEditableSite, form.drawings, form.photos, form.siteName, form.siteValue, form.workDate, replaceTarget],
  );

  const loadSiteConstructionDrawings = useCallback(() => {
    if (!ensureEditableSite()) return;
    if (!hasSiteName) {
      toast.error("현장을 먼저 선택해주세요.");
      return;
    }

    const siteKeyValue = form.siteValue || form.siteName;
    const primaryBuckets = getSiteDrawingBuckets(siteKeyValue, form.siteName);
    const fallbackBuckets =
      primaryBuckets.construction.length === 0 && form.siteName
        ? getSiteDrawingBuckets(form.siteName, form.siteName)
        : primaryBuckets;
    const candidates = fallbackBuckets.construction || [];

    if (candidates.length === 0) {
      toast.error("불러올 현장 도면이 없습니다.");
      return;
    }

    const existingUrls = new Set(
      form.drawings
        .map((item) => getLegacyMediaUrl(item))
        .filter(Boolean),
    );

    const additions: LegacyMedia[] = candidates
      .map((row, index) => {
        const legacyUrl = asString((row as { img?: unknown; url?: unknown }).img ?? (row as { img?: unknown; url?: unknown }).url).trim();
        if (!legacyUrl || existingUrls.has(legacyUrl)) return null;
        return {
          id: `linked_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
          type: "drawing",
          status: "progress",
          timestamp: row.timestamp || new Date().toISOString(),
          url: legacyUrl,
        } as LegacyMedia;
      })
      .filter(Boolean) as LegacyMedia[];

    if (additions.length === 0) {
      toast("이미 불러온 현장 도면입니다.");
      return;
    }

    setForm((prev) => ({
      ...prev,
      drawings: cloneMediaRows([...prev.drawings, ...additions], "drawing"),
    }));
    setDrawingSheetOpen(false);
    toast.success(`현장 도면 ${additions.length}건을 불러왔습니다.`);
  }, [ensureEditableSite, form.drawings, form.siteName, form.siteValue, hasSiteName]);

  const handleDrawingSheetUpload = useCallback(
    async (files: FileList | null) => {
      const ok = await uploadMedia("drawing", files, { label: "도면" });
      if (ok) setDrawingSheetOpen(false);
    },
    [uploadMedia],
  );

  const removeMediaItem = async (type: AttachmentType, index: number) => {
    if (!ensureEditableSite()) return;
    const source = type === "photo" ? form.photos : form.drawings;
    const target = source[index];
    if (!target) return;

    if (isAttachmentRef(target) && !getLegacyMediaUrl(target)) {
      await deleteRef(target.id);
      revokeObjectUrl(target.id);
    }

    if (type === "photo") {
      setForm((prev) => ({
        ...prev,
        photos: cloneMediaRows(prev.photos.filter((_, rowIndex) => rowIndex !== index), "photo"),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        drawings: cloneMediaRows(prev.drawings.filter((_, rowIndex) => rowIndex !== index), "drawing"),
      }));
    }
  };

  const togglePhotoItemStatus = (index: number) => {
    if (!ensureEditableSite()) return;
    setForm((prev) => ({
      ...prev,
      photos: cloneMediaRows(
        prev.photos.map((item, rowIndex) => {
          if (rowIndex !== index) return item;
          if (isReceiptPhoto(item)) return item;
          const next = normalizePhotoStatus(item.status) === "before" ? "after" : "before";
          return { ...item, status: next };
        }),
        "photo",
      ),
    }));
  };

  const toggleDrawingItemStatus = (index: number) => {
    if (!ensureEditableSite()) return;
    setForm((prev) => ({
      ...prev,
      drawings: cloneMediaRows(
        prev.drawings.map((item, rowIndex) => {
          if (rowIndex !== index) return item;
          const next = normalizeDrawingStatus(item.status) === "done" ? "progress" : "done";
          return { ...item, status: next };
        }),
        "drawing",
      ),
    }));
  };

  const openDrawingMarking = async (item: LegacyMedia, index: number) => {
    if (!ensureEditableSite()) return;
    const previewKey = `drawing_${mediaItemKey(item, index)}`;
    const cachedPreview = previewMap[previewKey];
    if (cachedPreview) {
      setMarking({ open: true, index, imageSrc: cachedPreview });
      return;
    }

    const legacy = getLegacyMediaUrl(item);
    if (legacy) {
      setMarking({ open: true, index, imageSrc: legacy });
      return;
    }

    const url = await getObjectUrl(item.id);
    if (!url) {
      toast.error("마킹 이미지를 불러오지 못했습니다.");
      return;
    }

    setMarking({ open: true, index, imageSrc: url });
  };

  const saveMarkedDrawing = useCallback(
    (markedImage: string) => {
      if (!markedImage || marking.index < 0) {
        setMarking({ open: false, index: -1, imageSrc: "" });
        return;
      }

      const target = form.drawings[marking.index];
      if (!target) {
        setMarking({ open: false, index: -1, imageSrc: "" });
        return;
      }

      const nextTimestamp = new Date().toISOString();
      setForm((prev) => ({
        ...prev,
        drawings: cloneMediaRows(
          prev.drawings.map((item, rowIndex) =>
            rowIndex === marking.index
              ? {
                  ...item,
                  type: "drawing",
                  status: "done",
                  timestamp: nextTimestamp,
                  url: markedImage,
                }
              : item,
          ),
          "drawing",
        ),
      }));
      toast.success("도면 마킹을 저장했습니다.");
      setMarking({ open: false, index: -1, imageSrc: "" });
    },
    [form.drawings, marking.index],
  );

  const addMaterialFromPreset = () => {
    if (!ensureEditableSite()) return;
    const qty = Number(materialQty || 0);
    const name = (isMaterialDirect ? customMaterialValue : materialSelect).trim();
    if (!name || qty <= 0) {
      toast.error("자재명과 수량을 입력해주세요.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      materials: [...prev.materials, { id: makeRowId(), name, qty }],
    }));
    setMaterialQty("");
    if (isMaterialDirect) setCustomMaterialValue("");
  };
  const galleryTitle =
    galleryKind === "photo"
      ? `사진함 전체 (${sitePhotoRows.length})`
      : galleryKind === "drawing"
        ? `도면함 전체 (${siteDrawingRows.length})`
        : `확인서함 전체 (${siteReceiptRows.length})`;
  const galleryGroups = galleryKind === "photo" ? photoGroups : galleryKind === "drawing" ? drawingGroups : receiptGroups;

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-text-sub">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-[calc(env(safe-area-inset-bottom)+104px)]">
      <section className="sticky top-0 z-30 bg-background/95 px-0 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="space-y-2">
          <div className="relative">
            {isSiteSearchCompact && hasSiteName ? (
              <button
                type="button"
                onClick={() => setIsSiteSearchCompact(false)}
                className="w-full h-[50px] rounded-xl border border-border bg-card px-3 transition-all hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 inline-flex items-center gap-1.5">
                    <Search className="h-4 w-4 text-text-sub" />
                    <span className="truncate text-sm-app font-semibold text-foreground">{form.siteName}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-sub">
                    검색열기 <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ) : (
              <SiteCombobox
                options={siteSelectionOptions}
                value={form.siteName}
                onChange={(option) => {
                  if (!option) {
                    setForm((prev) => ({ ...prev, siteValue: "", siteName: "", dept: "" }));
                    setIsSiteSearchCompact(false);
                    return;
                  }
                  const matchedSite = siteList.find((site) => site.site_name === option.label);
                  selectSite(option.siteId || matchedSite?.site_id || option.label, option.label, matchedSite?.dept);
                }}
                inputClassName="h-[52px] pr-16 text-base-app font-semibold"
                dropdownClassName="shadow-soft"
              />
            )}
          </div>

          {hasSiteName ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={form.workDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, workDate: event.target.value }))}
                  className="h-[52px] min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-sm-app font-semibold text-foreground outline-none transition-all hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
                />

                <button
                  type="button"
                  onClick={() => setLogListOpen(true)}
                  className="inline-flex h-[52px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-sm-app font-semibold text-text-sub transition-all hover:border-primary/50 whitespace-nowrap"
                >
                  <ClipboardList className="h-4 w-4" />
                  일지목록
                </button>
                <button
                  type="button"
                  onClick={leaveSiteEditor}
                  className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-xl border border-border bg-card px-2.5 text-sm-app font-semibold text-text-sub transition-all hover:border-primary/50 whitespace-nowrap"
                >
                  현장목록
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={cn(
                    "h-10 rounded-lg text-[15px] font-bold transition-colors",
                    activeTab === "write" ? "bg-header-navy text-header-navy-foreground" : "text-text-sub hover:bg-muted",
                  )}
                >
                  누적작성
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("view")}
                  className={cn(
                    "h-10 rounded-lg text-[15px] font-bold transition-colors",
                    activeTab === "view" ? "bg-header-navy text-header-navy-foreground" : "text-text-sub hover:bg-muted",
                  )}
                >
                  날짜보기
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "all" as const, label: "전체" },
                { key: "pending" as const, label: "요청" },
                { key: "rejected" as const, label: "반려" },
                { key: "approved" as const, label: "완료" },
              ].map((chip) => (
                <button
                  key={`site_filter_${chip.key}`}
                  type="button"
                  onClick={() => setSiteCardFilter(chip.key)}
                  className={cn(
                    "h-10 px-3.5 rounded-full whitespace-nowrap flex-shrink-0 border transition-all cursor-pointer flex items-center justify-center",
                    siteCardFilter === chip.key
                      ? chip.key === "all"
                        ? "bg-primary text-white border-primary font-bold shadow-sm"
                        : chip.key === "pending"
                          ? "bg-indigo-500 text-white border-indigo-500 font-bold shadow-sm"
                          : chip.key === "rejected"
                            ? "bg-red-500 text-white border-red-500 font-bold shadow-sm"
                            : "bg-muted-foreground text-white border-muted-foreground font-bold shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 font-medium",
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      {!hasSiteName ? (
        <section className="space-y-2 pt-0">
          {displayedSiteCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center text-sm-app font-semibold text-text-sub">
              {siteCards.length === 0 ? "등록된 현장이 없습니다." : "선택한 상태의 현장이 없습니다."}
            </div>
          ) : (
            displayedSiteCards.map((card) => {
              const pinned = pinnedSiteCardKeys.includes(card.siteKey);
              return (
              <div
                key={card.siteKey}
                onClick={() => enterSiteFromCard(card)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    enterSiteFromCard(card);
                  }
                }}
                className={cn(
                  "relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 text-left shadow-soft transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(49,163,250,0.12)]",
                  pinned && "border-2 border-primary shadow-[0_4px_12px_rgba(49,163,250,0.2)]",
                )}
              >
                <span className={cn("absolute top-0 right-0 px-2.5 py-1 text-[11px] font-bold text-white whitespace-nowrap rounded-bl-xl", STATUS_META[card.status].cornerClass)}>
                  {STATUS_META[card.status].label}
                </span>
                <button
                  type="button"
                  onClick={(event) => toggleSiteCardPin(card.siteKey, event)}
                  className="absolute right-1.5 top-7 z-20 bg-transparent border-none p-1 cursor-pointer"
                >
                  {pinned ? <PinOff className="w-[22px] h-[22px] text-primary" /> : <Pin className="w-[22px] h-[22px] text-border" />}
                </button>
                <div className="mb-1 pr-14">
                  <p className="min-w-0 truncate text-[19px] font-[800] leading-snug text-header-navy">{card.siteName}</p>
                </div>
                <p className="mt-0.5 text-tiny font-semibold text-text-sub">
                  {formatCompactDateTimeLabel(card.lastUpdatedAt)} · {card.dateCount}일 · v{card.latestVersion || 1}
                </p>
                <MetaBadgeRow
                  className="mt-2"
                  dept={card.dept}
                  contractor={card.dept}
                  photoCount={Math.max(0, card.photoCount - card.receiptCount)}
                  drawingCount={card.drawingCount}
                  receiptCount={card.receiptCount}
                />
                {card.status !== "draft" ? (
                  <p className="mt-1 truncate text-[12px] font-semibold text-text-sub">{siteCardActionHint(card.status)}</p>
                ) : null}
              </div>
            )})
          )}
        </section>
      ) : (
        <>
      <div className="space-y-3 pt-3">
        {activeTab === "write" ? (
          <>
            <section className="relative overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <span className={cn("absolute top-0 right-0 z-10 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap rounded-bl-xl", STATUS_META[siteUnitStatus].cornerClass)}>
                {STATUS_META[siteUnitStatus].label}
              </span>
              <div className="min-w-0 pr-0">
                <div className="text-sm-app text-text-sub font-medium mb-1 max-[640px]:mb-0.5">{form.workDate || "-"}</div>
                <p className="truncate text-[19px] font-[800] leading-snug text-header-navy">
                  {form.siteName || "현장을 선택하세요"}
                </p>
                <p className="mt-0.5 text-tiny font-semibold text-text-sub">
                  {formatCompactDateTimeLabel(siteUnitUpdatedAt)} · {includedDates.length}일 · v{siteUnitVersion || 1}
                </p>
                <MetaBadgeRow
                  className="mt-1"
                  dept={form.dept}
                  contractor={affiliationLabel}
                  photoCount={sitePhotoRows.length}
                  drawingCount={siteDrawingRows.length}
                  receiptCount={siteReceiptRows.length}
                />
              </div>

              {trimmedSiteMemo ? <p className="mt-1 truncate text-tiny font-semibold text-text-sub">메모 {trimmedSiteMemo}</p> : null}
              <p className="mt-1 truncate text-tiny font-semibold text-text-sub">{nextActionGuide}</p>
              <div className="mt-2.5">
                <WorklogStatusProgress status={siteUnitStatus} />
              </div>
            </section>

            <section
              className={cn(
                "rounded-2xl border px-4 py-2.5",
                isPendingSite
                  ? "border-indigo-200 bg-indigo-50"
                  : siteReadyToSubmit
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border bg-white",
                    isPendingSite
                      ? "border-indigo-300 text-indigo-600"
                      : siteReadyToSubmit
                        ? "border-emerald-300 text-emerald-600"
                        : "border-rose-300 text-rose-600",
                  )}
                >
                  {(isPendingSite || siteReadyToSubmit) ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={cn(
                    "min-w-0 truncate whitespace-nowrap text-[13px] font-semibold leading-none",
                    isPendingSite ? "text-indigo-800" : siteReadyToSubmit ? "text-emerald-800" : "text-rose-800",
                  )}
                >
                  {isPendingSite
                    ? "입력 단계 안내: 승인대기중 · 하단 통합요청 취소 후 수정"
                    : siteReadyToSubmit
                      ? "입력 단계 안내: 완료 · 하단 통합승인요청"
                      : `입력 단계 안내: ${sitePendingInline} 입력`}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm-app font-bold text-header-navy">작업일지 편집</p>
                <span className="text-tiny font-semibold text-text-sub">{includedDates.length}건</span>
              </div>
              <div className="space-y-1.5">
                {dailyRows.map((row) => {
                  const expanded = !!openDates[row.date];
                  const isCurrent = row.date === form.workDate;
                  const isFocusHit = row.date === highlightDateKey;
                  return (
                    <div
                      key={`write_date_${row.date}`}
                      ref={(el) => {
                        writeDateCardRefs.current[row.date] = el;
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 transition-colors hover:border-primary/40",
                        isCurrent ? "border-primary/50 bg-primary-bg/40 ring-1 ring-primary/20" : "border-border bg-background",
                        isFocusHit && "border-sky-300 bg-sky-50/70 ring-2 ring-sky-300 shadow-[0_0_0_5px_rgba(14,165,233,0.13)]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenDates((prev) => ({ ...prev, [row.date]: !expanded }))}
                        className="flex w-full items-center justify-between gap-2"
                      >
                        <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 pr-1">
                          <p className="text-sm-app font-semibold text-header-navy whitespace-nowrap">{formatShortDateLabel(row.date)}</p>
                          {isCurrent && (
                            <span className="inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full border border-primary/30 bg-primary-bg px-2 text-[10px] font-bold text-primary">
                              현재
                            </span>
                          )}
                        </div>
                        {expanded ? <ChevronUp className="h-4 w-4 text-text-sub" /> : <ChevronDown className="h-4 w-4 text-text-sub" />}
                      </button>
                      {expanded && (
                        <div className="mt-1.5 flex items-center justify-between">
                          <p className="text-tiny font-medium text-text-sub">
                            {summarizeDailyRow(row)}
                          </p>
                          <button
                            type="button"
                            onClick={() => moveToDate(row.date)}
                            className="h-7 rounded-lg border border-primary/40 bg-primary-bg px-2 text-[11px] font-semibold text-primary"
                          >
                            불러오기
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {siteUnitStatus === "rejected" && (
              <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5">
                <p className="text-sm-app font-semibold text-red-700">
                  현장 통합반려 상태입니다. 반려 날짜 섹션을 우선 수정한 뒤 통합승인요청을 다시 진행하세요.
                </p>
                {siteDraft?.rejectedReason && <p className="mt-1 text-tiny font-medium text-red-600">{siteDraft.rejectedReason}</p>}
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-sm-app font-bold text-header-navy">통합 메모</p>
                <span className="text-tiny font-semibold text-text-sub">현장 단위</span>
              </div>
              <textarea
                rows={2}
                value={siteMemo}
                onChange={(event) => setSiteMemo(event.target.value)}
                placeholder="현장 통합 메모를 입력하세요."
                readOnly={!canEditSite}
                className={cn(
                  "min-h-[50px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm-app font-medium text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]",
                  !canEditSite && "bg-muted/40 text-text-sub",
                )}
              />
            </section>

            <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SummaryCard
                icon={<Users className="w-5 h-5 text-header-navy" />}
                title="투입"
                summary={manpowerSummary}
                onClick={() => openSheetWithGuard("manpower")}
                disabled={!canEditSite}
              />

              <SummaryCard
                icon={<HardHat className="w-5 h-5 text-header-navy" />}
                title="작업"
                summary={workSummary}
                onClick={() => openSheetWithGuard("work")}
                required
                missing={workValidCount === 0}
                disabled={!canEditSite}
              />

              <SummaryCard
                icon={<Package className="w-5 h-5 text-header-navy" />}
                title="자재"
                summary={materialSummary}
                onClick={() => openSheetWithGuard("material")}
                disabled={!canEditSite}
              />

              <SummaryCard
                icon={<Camera className="w-5 h-5 text-header-navy" />}
                title="사진 · 도면 · 확인서"
                summary={mediaSummary}
                onClick={() => openSheetWithGuard("media")}
                required
                missing={mediaRequiredCount === 0}
                disabled={!canEditSite}
              />
            </section>

            <section className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm-app font-bold text-header-navy">메모 (선택)</p>
                <span className="text-tiny font-semibold text-text-sub">자동저장</span>
              </div>
              <textarea
                rows={4}
                value={form.memo}
                onChange={(event) => {
                  if (!canEditSite) return;
                  setForm((prev) => ({ ...prev, memo: event.target.value }));
                }}
                onInput={(event) => {
                  if (!canEditSite) return;
                  const el = event.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.max(50, el.scrollHeight)}px`;
                }}
                placeholder="메모를 입력하면 자동으로 저장됩니다."
                readOnly={!canEditSite}
                className={cn(
                  "min-h-[50px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm-app font-medium text-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]",
                  !canEditSite && "bg-muted/40 text-text-sub",
                )}
              />
            </section>
          </>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-base-app font-bold text-header-navy">날짜별 누적</p>
                  <p className="text-tiny text-text-sub">카드를 누르면 작성 탭으로 바로 이동합니다.</p>
                </div>
                <span className="text-tiny font-semibold text-text-sub">{dailyRows.length}건</span>
              </div>

              {!hasSiteName ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-10 text-center text-sm-app font-semibold text-text-sub">
                  현장을 먼저 선택하세요.
                </div>
              ) : dailyRows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-10 text-center text-sm-app font-semibold text-text-sub">
                  작성된 일지가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {dailyRows.map((row, index) => {
                    const expanded = !!openDates[row.date];
                    const isRejectedRow = row.status === "rejected";
                    const isCurrent = row.date === form.workDate;
                    const isLatest = index === 0;
                    return (
                      <div key={`${row.date}_${row.versions}`} className="relative pl-7">
                        {index < dailyRows.length - 1 && (
                          <span
                            className={cn(
                              "absolute left-[9px] top-6 bottom-[-10px] w-[2px] rounded-full",
                              isRejectedRow ? "bg-red-200" : "bg-border",
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "absolute left-0 top-1 inline-flex h-[18px] w-[18px] rounded-full border-2 bg-card transition-all duration-300",
                            row.status === "approved"
                              ? "border-emerald-500"
                              : row.status === "pending"
                                ? "border-indigo-500"
                                : row.status === "rejected"
                                  ? "border-red-500"
                                  : "border-primary",
                            isCurrent && "scale-[1.04] ring-2 ring-primary/35 shadow-[0_0_0_6px_rgba(49,163,250,0.16),0_0_14px_rgba(49,163,250,0.28)]",
                          )}
                        />
                        <div
                          className={cn(
                            "relative overflow-hidden rounded-xl border bg-background px-3 py-3 transition-colors hover:border-primary/40",
                            isRejectedRow ? "border-red-200 bg-red-50/40" : "border-border",
                            isCurrent && "border-primary/40 ring-1 ring-primary/20",
                            isLatest && "shadow-[0_0_0_1px_rgba(49,163,250,0.12)]",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute right-0 top-0 z-10 inline-flex h-6 items-center whitespace-nowrap rounded-bl-xl px-2.5 text-[10px] font-bold text-white",
                              STATUS_META[row.status].cornerClass,
                            )}
                          >
                            {STATUS_META[row.status].label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOpenDates((prev) => ({ ...prev, [row.date]: !expanded }))}
                            className="w-full pr-0 text-left"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pr-0 no-scrollbar">
                                  <p className="text-sm-app font-bold text-header-navy whitespace-nowrap">
                                    {formatShortDateLabel(row.date)} · v{row.versions}
                                  </p>
                                  {isLatest && (
                                    <span className="inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full border border-primary/30 bg-primary-bg px-2 text-[10px] font-bold text-primary">
                                      최신
                                    </span>
                                  )}
                                  {isCurrent && (
                                    <span className="inline-flex h-5 shrink-0 items-center whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-2 text-[10px] font-bold text-indigo-700">
                                      현재
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                  <p className="min-w-0 flex-1 truncate text-tiny font-medium text-text-sub">
                                    투입 {row.manpower.length} · 작업 {summarizeWorkSetBadge(row.workSets)}
                                  </p>
                                  <div className="flex shrink-0 items-center">
                                    {expanded ? <ChevronUp className="h-4 w-4 text-text-sub" /> : <ChevronDown className="h-4 w-4 text-text-sub" />}
                                  </div>
                                </div>
                                <MetaBadgeRow
                                  className="mt-1"
                                  dept={form.dept}
                                  contractor={affiliationLabel}
                                  photoCount={rowPhotoCount(row)}
                                  drawingCount={getRowDrawings(row).length}
                                  receiptCount={rowReceiptCount(row)}
                                />
                              </div>
                            </div>
                          </button>
                          {expanded && (
                            <div className="mt-2 rounded-lg border border-border bg-card px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="min-w-0 truncate text-tiny font-medium text-text-sub">날짜 수정은 버튼 클릭</p>
                                <button
                                  type="button"
                                  onClick={() => moveToDate(row.date)}
                                  className={cn(
                                    "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg border border-primary/40 bg-primary-bg px-2.5 text-[11px] font-semibold leading-none text-primary transition-all hover:border-primary",
                                    isCurrent && "shadow-[0_0_0_2px_rgba(49,163,250,0.18)]",
                                  )}
                                >
                                  해당 날짜 수정
                                </button>
                              </div>
                              {row.memo.trim() ? <p className="mt-1 truncate text-[11px] font-medium text-text-sub">메모 {row.memo.trim()}</p> : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-base-app font-bold text-header-navy">사진함 (누적 {sitePhotoRows.length}건)</p>
                <button
                  type="button"
                  onClick={() => setGalleryKind("photo")}
                  className="h-8 rounded-full border border-border bg-background px-3 text-tiny font-semibold text-text-sub hover:bg-muted"
                >
                  전체보기
                </button>
              </div>

              {photoGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-medium text-text-sub">
                  자료가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {photoGroups.slice(0, 4).map((group) => (
                    <div key={`photo_group_${group.date}`} className="rounded-xl border border-border bg-background px-2.5 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-tiny font-semibold text-header-navy">{formatShortDateLabel(group.date)}</p>
                        <button type="button" onClick={() => moveToDate(group.date)} className="text-[11px] font-semibold text-primary">
                          해당 일지 이동
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                        {group.items.map((row) => {
                          const url = previewMap[row.key];
                          const status = normalizePhotoStatus(row.item.status);
                          return (
                            <button
                              key={row.key}
                              type="button"
                              onClick={() => openMediaViewer(row.item, row.title)}
                              className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5 text-left"
                            >
                              <span
                                className={cn(
                                  "absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white",
                                  status === "before" ? "bg-amber-500/90" : "bg-blue-500/90",
                                )}
                              >
                                {photoStatusLabel(row.item.status)}
                              </span>
                              {url ? (
                                <img src={url} alt={row.title} className="h-[104px] w-full rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="sticky top-[114px] z-20 rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-base-app font-bold text-header-navy">도면함 (누적 {siteDrawingRows.length}건)</p>
                <button
                  type="button"
                  onClick={() => setGalleryKind("drawing")}
                  className="h-8 rounded-full border border-border bg-background px-3 text-tiny font-semibold text-text-sub hover:bg-muted"
                >
                  전체보기
                </button>
              </div>

              {drawingGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-medium text-text-sub">
                  자료가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {drawingGroups.slice(0, 4).map((group) => (
                    <div key={`drawing_group_${group.date}`} className="rounded-xl border border-border bg-background px-2.5 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-tiny font-semibold text-header-navy">{formatShortDateLabel(group.date)}</p>
                        <button type="button" onClick={() => moveToDate(group.date)} className="text-[11px] font-semibold text-primary">
                          해당 일지 이동
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                        {group.items.map((row) => {
                          const url = previewMap[row.key];
                          const status = normalizeDrawingStatus(row.item.status);
                          return (
                            <button
                              key={row.key}
                              type="button"
                              onClick={() => openMediaViewer(row.item, row.title)}
                              className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5 text-left"
                            >
                              <span
                                className={cn(
                                  "absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white",
                                  status === "done" ? "bg-emerald-500/90" : "bg-sky-500/90",
                                )}
                              >
                                {drawingStatusLabel(row.item.status)}
                              </span>
                              {url ? (
                                <img src={url} alt={row.title} className="h-[104px] w-full rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card px-4 py-4 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-base-app font-bold text-header-navy">확인서함 (누적 {siteReceiptRows.length}건)</p>
                <button
                  type="button"
                  onClick={() => setGalleryKind("receipt")}
                  className="h-8 rounded-full border border-border bg-background px-3 text-tiny font-semibold text-text-sub hover:bg-muted"
                >
                  전체보기
                </button>
              </div>

              {receiptGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-medium text-text-sub">
                  자료가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {receiptGroups.slice(0, 4).map((group) => (
                    <div key={`receipt_group_${group.date}`} className="rounded-xl border border-border bg-background px-2.5 py-2.5">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-tiny font-semibold text-header-navy">{formatShortDateLabel(group.date)}</p>
                        <button type="button" onClick={() => moveToDate(group.date)} className="text-[11px] font-semibold text-primary">
                          해당 일지 이동
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                        {group.items.map((row) => {
                          const url = previewMap[row.key];
                          return (
                            <button
                              key={row.key}
                              type="button"
                              onClick={() => openMediaViewer(row.item, row.title)}
                              className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5 text-left"
                            >
                              <span className="absolute left-2 top-2 z-10 rounded-md bg-indigo-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
                                확인서
                              </span>
                              {url ? (
                                <img src={url} alt={row.title} className="h-[104px] w-full rounded-lg object-cover" />
                              ) : (
                                <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {activeTab === "write" && (
        <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[600px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
          <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <button
              type="button"
              onClick={handleUnifiedDraftSave}
              disabled={busy || !hasSiteName || isPendingSite}
              className={cn(
                "h-[52px] rounded-xl text-sm-app font-bold disabled:opacity-50",
                isPendingSite ? "bg-muted text-text-sub" : "bg-muted text-foreground",
              )}
            >
              {isPendingSite ? "승인대기중" : busy ? "저장중..." : "통합 임시저장"}
            </button>
            <button
              type="button"
              onClick={isPendingSite ? handleUnifiedCancelRequest : handleUnifiedRequest}
              disabled={isPendingSite ? busy || !hasSiteName : busy || !siteReadyToSubmit}
              className={cn(
                "h-[52px] rounded-xl text-sm-app font-bold disabled:opacity-50",
                isPendingSite ? "bg-red-600 text-white" : "bg-header-navy text-header-navy-foreground",
                (pulseRequest || pulseCancel) && "animate-pulse",
              )}
            >
              <span className="inline-flex items-center gap-1">
                {isPendingSite ? <X className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {isPendingSite ? "통합요청 취소" : "통합승인요청"}
              </span>
            </button>
          </div>
        </div>
      )}
        </>
      )}
      <Drawer open={logListOpen} onOpenChange={setLogListOpen}>
        <DrawerContent className="z-[80] mx-auto max-w-[600px] rounded-t-2xl border-t border-border bg-white">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle className="text-base-app font-bold">일지목록</DrawerTitle>
            <button type="button" onClick={() => setLogListOpen(false)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
              <X className="h-4 w-4 mx-auto" />
            </button>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto space-y-2">
            {!hasSiteName ? (
              <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-semibold text-text-sub">
                현장을 먼저 선택하세요.
              </div>
            ) : dailyRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-semibold text-text-sub">
                작성된 일지가 없습니다.
              </div>
            ) : (
              dailyRows.map((row) => (
                <button
                  key={`picker_${row.date}_${row.versions}`}
                  type="button"
                  onClick={() => moveToDate(row.date)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-left hover:bg-muted"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm-app font-bold text-header-navy whitespace-nowrap">
                      {formatShortDateLabel(row.date)} · v{row.versions}
                    </p>
                    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2 text-[11px] font-bold", STATUS_META[row.status].chipClass)}>
                      {STATUS_META[row.status].label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-tiny font-medium text-text-sub">
                    {summarizeDailyRow(row)}
                  </p>
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={galleryKind !== null} onOpenChange={(open) => !open && setGalleryKind(null)}>
        <DrawerContent className="mx-auto max-w-[600px] rounded-t-2xl border-t border-border bg-white">
          <DrawerHeader className="flex flex-row items-center justify-between">
            <DrawerTitle className="text-base-app font-bold">{galleryTitle}</DrawerTitle>
            <button type="button" onClick={() => setGalleryKind(null)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
              <X className="h-4 w-4 mx-auto" />
            </button>
          </DrawerHeader>
          <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto space-y-3">
            {galleryGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-semibold text-text-sub">
                자료가 없습니다.
              </div>
            ) : (
              galleryGroups.map((group) => (
                <div key={`gallery_${galleryKind}_${group.date}`} className="rounded-xl border border-border bg-background p-2.5">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-tiny font-semibold text-header-navy">{formatShortDateLabel(group.date)}</p>
                    <button
                      type="button"
                      onClick={() => moveToDate(group.date)}
                      className="text-[11px] font-semibold text-primary"
                    >
                      해당 일지 이동
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.map((row) => {
                      const url = previewMap[row.key];
                      return (
                        <button
                          key={`gallery_item_${row.key}`}
                          type="button"
                          onClick={() => openMediaViewer(row.item, row.title)}
                          className="overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <div className="aspect-square w-full">
                            {url ? (
                              <img src={url} alt={row.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)}>
        <DrawerContent className="mx-auto max-w-[600px] rounded-t-2xl border-t border-border bg-white">
          {sheet === "manpower" && (
            <>
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle className="text-base-app font-bold">투입 인원</DrawerTitle>
                <button type="button" onClick={() => setSheet(null)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </DrawerHeader>
              <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto space-y-3">
                {form.manpower.map((row, index) => {
                  const selectValue = row.isCustom || !workerNames.includes(row.worker) ? "custom" : row.worker;

                  return (
                    <div key={row.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectValue}
                          onChange={(event) => {
                            const value = event.target.value;
                            setForm((prev) => ({
                              ...prev,
                              manpower: prev.manpower.map((item) => {
                                if (item.id !== row.id) return item;
                                if (value === "custom") {
                                  return { ...item, worker: "", isCustom: true };
                                }
                                return { ...item, worker: value, isCustom: false };
                              }),
                            }));
                          }}
                          className="flex-1 h-11 rounded-lg border border-border bg-background px-3 pr-9 text-sm-app font-medium text-foreground outline-none appearance-none"
                          style={{
                            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364758b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 10px center",
                          }}
                        >
                          {workerNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                          <option value="custom">직접입력</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              manpower:
                                prev.manpower.length === 1
                                  ? [createManpower()]
                                  : prev.manpower.filter((item) => item.id !== row.id),
                            }));
                          }}
                          className="w-10 h-10 rounded-lg border border-red-200 bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>

                      {selectValue === "custom" && (
                        <input
                          value={row.worker}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              manpower: prev.manpower.map((item) =>
                                item.id === row.id ? { ...item, worker: event.target.value, isCustom: true } : item,
                              ),
                            }));
                          }}
                          placeholder="작업자 이름 입력"
                          className="w-full h-11 rounded-lg border border-border bg-background px-3 text-sm-app font-medium text-foreground outline-none"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              manpower: prev.manpower.map((item) =>
                                item.id === row.id
                                  ? { ...item, workHours: Math.max(0, Number(item.workHours || 0) - 0.5) }
                                  : item,
                              ),
                            }));
                          }}
                          className="h-10 w-10 rounded-lg border border-border bg-background text-sm-app font-bold text-foreground"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={row.workHours}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value || 0);
                            setForm((prev) => ({
                              ...prev,
                              manpower: prev.manpower.map((item) =>
                                item.id === row.id ? { ...item, workHours: nextValue } : item,
                              ),
                            }));
                          }}
                          className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-center text-sm-app font-semibold text-foreground outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              manpower: prev.manpower.map((item) =>
                                item.id === row.id
                                  ? { ...item, workHours: Math.min(24, Number(item.workHours || 0) + 0.5) }
                                  : item,
                              ),
                            }));
                          }}
                          className="h-10 w-10 rounded-lg border border-border bg-background text-sm-app font-bold text-foreground"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-tiny text-text-sub">#{index + 1} 투입 인원</p>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, manpower: [...prev.manpower, createManpower()] }))}
                  className="w-full h-11 rounded-xl border border-primary/40 bg-primary-bg text-sm-app font-bold text-primary inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 작업자 추가
                </button>
              </div>
            </>
          )}

          {sheet === "work" && (
            <>
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle className="text-base-app font-bold">작업 내용</DrawerTitle>
                <button type="button" onClick={() => setSheet(null)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </DrawerHeader>
              <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto space-y-3">
                {form.workSets.map((row, index) => (
                  <div key={row.id} className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <div>
                      <p className="text-tiny font-semibold text-text-sub mb-1">부재명 *필수입력</p>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {MEMBER_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                workSets: prev.workSets.map((item) =>
                                  item.id === row.id ? { ...item, member: chip } : item,
                                ),
                              }));
                            }}
                            className={cn(
                              "inline-flex h-8 min-w-[72px] items-center justify-center rounded-full border px-3 text-tiny font-semibold whitespace-nowrap shrink-0",
                              row.member === chip
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-text-sub border-border",
                            )}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      {row.member === "기타" && (
                        <input
                          value={row.customMemberValue}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              workSets: prev.workSets.map((item) =>
                                item.id === row.id ? { ...item, customMemberValue: event.target.value } : item,
                              ),
                            }));
                          }}
                          placeholder="부재명 직접입력"
                          className="mt-2 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm-app font-medium text-foreground outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-tiny font-semibold text-text-sub mb-1">작업공정 *필수입력</p>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {PROCESS_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                workSets: prev.workSets.map((item) =>
                                  item.id === row.id ? { ...item, process: chip } : item,
                                ),
                              }));
                            }}
                            className={cn(
                              "inline-flex h-8 min-w-[72px] items-center justify-center rounded-full border px-3 text-tiny font-semibold whitespace-nowrap shrink-0",
                              row.process === chip
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-text-sub border-border",
                            )}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      {row.process === "기타" && (
                        <input
                          value={row.customProcessValue}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              workSets: prev.workSets.map((item) =>
                                item.id === row.id ? { ...item, customProcessValue: event.target.value } : item,
                              ),
                            }));
                          }}
                          placeholder="작업공정 직접입력"
                          className="mt-2 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm-app font-medium text-foreground outline-none"
                        />
                      )}
                    </div>

                    <div>
                      <p className="text-tiny font-semibold text-text-sub mb-1">구분</p>
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {TYPE_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                workSets: prev.workSets.map((item) =>
                                  item.id === row.id ? { ...item, type: chip } : item,
                                ),
                              }));
                            }}
                            className={cn(
                              "h-8 px-3 rounded-full border text-tiny font-semibold whitespace-nowrap",
                              row.type === chip
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-text-sub border-border",
                            )}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                      {row.type === "기타" && (
                        <input
                          value={row.customTypeValue}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              workSets: prev.workSets.map((item) =>
                                item.id === row.id ? { ...item, customTypeValue: event.target.value } : item,
                              ),
                            }));
                          }}
                          placeholder="구분 직접입력"
                          className="mt-2 w-full h-10 rounded-lg border border-border bg-background px-3 text-sm-app font-medium text-foreground outline-none"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={row.location.block}
                        onChange={(event) => {
                          setForm((prev) => ({
                            ...prev,
                            workSets: prev.workSets.map((item) =>
                              item.id === row.id ? { ...item, location: { ...item.location, block: event.target.value } } : item,
                            ),
                          }));
                        }}
                        placeholder="블럭"
                        className="h-10 rounded-lg border border-border bg-background px-2 text-center text-sm-app font-medium text-foreground outline-none"
                      />
                      <input
                        value={row.location.dong}
                        onChange={(event) => {
                          setForm((prev) => ({
                            ...prev,
                            workSets: prev.workSets.map((item) =>
                              item.id === row.id ? { ...item, location: { ...item.location, dong: event.target.value } } : item,
                            ),
                          }));
                        }}
                        placeholder="동"
                        className="h-10 rounded-lg border border-border bg-background px-2 text-center text-sm-app font-medium text-foreground outline-none"
                      />
                      <input
                        value={row.location.floor}
                        onChange={(event) => {
                          setForm((prev) => ({
                            ...prev,
                            workSets: prev.workSets.map((item) =>
                              item.id === row.id ? { ...item, location: { ...item.location, floor: event.target.value } } : item,
                            ),
                          }));
                        }}
                        placeholder="층"
                        className="h-10 rounded-lg border border-border bg-background px-2 text-center text-sm-app font-medium text-foreground outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <p className="text-tiny text-text-sub">#{index + 1} 작업세트</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            workSets:
                              prev.workSets.length === 1
                                ? [createWorkSet()]
                                : prev.workSets.filter((item) => item.id !== row.id),
                          }));
                        }}
                        className="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-tiny font-semibold text-red-700 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> 항목삭제
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, workSets: [...prev.workSets, createWorkSet()] }))}
                  className="w-full h-11 rounded-xl border border-primary/40 bg-primary-bg text-sm-app font-bold text-primary inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> 작업 추가
                </button>
              </div>
            </>
          )}
          {sheet === "material" && (
            <>
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle className="text-base-app font-bold">자재 사용</DrawerTitle>
                <button type="button" onClick={() => setSheet(null)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </DrawerHeader>
              <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto space-y-3">
                <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                  <div className="grid grid-cols-[1fr_110px] gap-2">
                    <select
                      value={isMaterialDirect ? "기타" : materialSelect}
                      onChange={(event) => {
                        const value = event.target.value;
                        setMaterialSelect(value);
                        setIsMaterialDirect(value === "기타");
                      }}
                      className="h-10 rounded-lg border border-border bg-card px-3 pr-9 text-sm-app font-semibold text-foreground outline-none appearance-none"
                      style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364758b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                      }}
                    >
                      {MATERIAL_OPTIONS.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={materialQty}
                      onChange={(event) => setMaterialQty(event.target.value)}
                      placeholder="수량"
                      className="h-10 rounded-lg border border-border bg-card px-3 text-center text-sm-app font-semibold text-foreground outline-none"
                    />
                  </div>
                  {isMaterialDirect && (
                    <input
                      value={customMaterialValue}
                      onChange={(event) => setCustomMaterialValue(event.target.value)}
                      placeholder="자재명 직접입력"
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm-app font-medium text-foreground outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={addMaterialFromPreset}
                    className="w-full h-10 rounded-lg border border-primary/40 bg-primary-bg text-sm-app font-bold text-primary inline-flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> 자재 추가
                  </button>
                </div>

                {form.materials.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-background px-3 py-6 text-center text-sm-app font-medium text-text-sub">
                    등록된 자재가 없습니다.
                  </div>
                )}

                {form.materials.map((row) => (
                  <div key={row.id} className="rounded-xl border border-border bg-card p-3 grid grid-cols-[1fr_88px_44px] gap-2 items-center">
                    <input
                      value={row.name}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          materials: prev.materials.map((item) =>
                            item.id === row.id ? { ...item, name: event.target.value } : item,
                          ),
                        }));
                      }}
                      placeholder="자재명"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-sm-app font-medium text-foreground outline-none"
                    />
                    <input
                      type="number"
                      min={0}
                      value={row.qty}
                      onChange={(event) => {
                        setForm((prev) => ({
                          ...prev,
                          materials: prev.materials.map((item) =>
                            item.id === row.id ? { ...item, qty: Number(event.target.value || 0) } : item,
                          ),
                        }));
                      }}
                      className="h-10 rounded-lg border border-border bg-background px-2 text-center text-sm-app font-semibold text-foreground outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          materials: prev.materials.filter((item) => item.id !== row.id),
                        }));
                      }}
                      className="h-10 w-10 rounded-lg border border-red-200 bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}

              </div>
            </>
          )}

          {sheet === "media" && (
            <>
              <DrawerHeader className="flex flex-row items-center justify-between">
                <DrawerTitle className="text-base-app font-bold">사진 · 도면 · 확인서</DrawerTitle>
                <button type="button" onClick={() => setSheet(null)} className="h-8 w-8 rounded-lg border border-border text-muted-foreground">
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </DrawerHeader>
              <div className="px-4 pb-6 max-h-[72dvh] overflow-y-auto">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    uploadMedia("photo", event.target.files);
                    event.target.value = "";
                  }}
                />
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    uploadMedia("photo", event.target.files, { defaultStatus: "receipt", label: "확인서" });
                    event.target.value = "";
                  }}
                />
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void replaceMediaItem(event.target.files);
                    event.target.value = "";
                  }}
                />

                {(normalPhotoRowsForEdit.length > 0 || form.drawings.length > 0 || receiptRowsForEdit.length > 0) && (
                  <div className="mb-3 space-y-2">
                    {(normalPhotoRowsForEdit.length > 0 || form.drawings.length > 0) && (
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {normalPhotoRowsForEdit.map(({ item, index }, displayIndex) => {
                          const key = `photo_${mediaItemKey(item, index)}`;
                          const url = previewMap[key];
                          const photoStatus = normalizePhotoStatus(item.status);

                          return (
                            <div key={key} className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5">
                              <button
                                type="button"
                                onClick={() => togglePhotoItemStatus(index)}
                                className={cn(
                                  "absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white",
                                  photoStatus === "before" ? "bg-rose-500/90" : "bg-blue-500/90",
                                )}
                              >
                                {photoStatusLabel(item.status)}
                              </button>
                              <button
                                type="button"
                                onClick={() => openMediaViewer(item, `사진 ${displayIndex + 1}`)}
                                className="block w-full"
                                title={`사진 ${displayIndex + 1}`}
                              >
                                {url ? (
                                  <img src={url} alt={`photo-${displayIndex}`} className="h-[104px] w-full rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMediaItem("photo", index)}
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white"
                                title="삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerReplaceMedia({ type: "photo", index, status: item.status || "after" })}
                                className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-foreground/65 text-white transition-colors hover:bg-foreground/85"
                                title="교체"
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}

                        {form.drawings.map((item, index) => {
                          const key = `drawing_${mediaItemKey(item, index)}`;
                          const url = previewMap[key];
                          const drawingStatus = normalizeDrawingStatus(item.status);

                          return (
                            <div key={key} className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5">
                              <button
                                type="button"
                                onClick={() => toggleDrawingItemStatus(index)}
                                className={cn(
                                  "absolute left-2 top-2 z-10 rounded-md px-2 py-0.5 text-[11px] font-bold text-white",
                                  drawingStatus === "done" ? "bg-blue-500/90" : "bg-teal-500/90",
                                )}
                              >
                                {drawingStatusLabel(item.status)}
                              </button>
                              <button
                                type="button"
                                onClick={() => openDrawingMarking(item, index)}
                                className="block w-full"
                                title="다시 마킹"
                              >
                                {url ? (
                                  <img src={url} alt={`drawing-${index}`} className="h-[104px] w-full rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMediaItem("drawing", index)}
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white"
                                title="삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerReplaceMedia({ type: "drawing", index, status: item.status || "progress" })}
                                className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-foreground/65 text-white transition-colors hover:bg-foreground/85"
                                title="교체"
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {receiptRowsForEdit.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {receiptRowsForEdit.map(({ item, index }, displayIndex) => {
                          const key = `receipt_${mediaItemKey(item, index)}`;
                          const url = previewMap[`photo_${mediaItemKey(item, index)}`];

                          return (
                            <div key={key} className="relative w-28 shrink-0 rounded-xl border border-border bg-bg-input p-1.5">
                              <span className="absolute left-2 top-2 z-10 rounded-md bg-indigo-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
                                확인서
                              </span>
                              <button
                                type="button"
                                onClick={() => openMediaViewer(item, `확인서 ${displayIndex + 1}`)}
                                className="block w-full"
                                title={`확인서 ${displayIndex + 1}`}
                              >
                                {url ? (
                                  <img src={url} alt={`receipt-${displayIndex}`} className="h-[104px] w-full rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-[104px] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <ImageIcon className="h-5 w-5" />
                                  </div>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeMediaItem("photo", index)}
                                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/90 text-white"
                                title="삭제"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerReplaceMedia({ type: "photo", index, status: "receipt" })}
                                className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-[10px] bg-foreground/65 text-white transition-colors hover:bg-foreground/85"
                                title="교체"
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <div className="mb-2 text-[15px] font-bold text-text-sub">사진등록</div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 text-[15px] font-bold text-sky-700 transition-colors hover:bg-sky-100 sm:text-base"
                    >
                      <Camera className="h-5 w-5" /> 사진 등록
                    </button>
                  </div>
                  <div>
                    <div className="mb-2 text-[15px] font-bold text-text-sub">도면마킹</div>
                    <button
                      type="button"
                      onClick={() => setDrawingSheetOpen(true)}
                      className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 text-[15px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100 sm:text-base"
                    >
                      <ScanLine className="h-5 w-5" /> 도면마킹
                    </button>
                  </div>
                  <div>
                    <div className="mb-2 text-[17px] font-bold text-text-sub">확인서등록</div>
                    <button
                      type="button"
                      onClick={() => receiptInputRef.current?.click()}
                      className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-300 bg-violet-50 text-[15px] font-bold text-violet-700 transition-colors hover:bg-violet-100 sm:text-base"
                    >
                      <ClipboardList className="h-5 w-5" /> 확인서 등록
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-tiny text-text-sub">작성 탭 업로드는 현장 문서함에 자동 누적됩니다.</p>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      <DrawingSelectSheet
        open={drawingSheetOpen}
        onClose={() => setDrawingSheetOpen(false)}
        onUploadFiles={handleDrawingSheetUpload}
        onLoadSiteDrawings={loadSiteConstructionDrawings}
      />

      <DocumentViewer
        open={viewer.open}
        onClose={() => setViewer({ open: false, url: "", title: "" })}
        title={viewer.title}
      >
        <img src={viewer.url} alt={viewer.title} className="max-w-full max-h-full object-contain bg-white" />
      </DocumentViewer>

      <DrawingMarkingOverlay
        isOpen={marking.open}
        imageSrc={marking.imageSrc}
        onPrev={() => setMarking({ open: false, index: -1, imageSrc: "" })}
        onDeleteSelected={() => {
          if (marking.index >= 0) {
            void removeMediaItem("drawing", marking.index);
          }
          setMarking({ open: false, index: -1, imageSrc: "" });
        }}
        onSave={saveMarkedDrawing}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  summary,
  required = false,
  missing = false,
  disabled = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  required?: boolean;
  missing?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-2xl border bg-card px-4 py-3 shadow-soft text-left transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed",
        missing ? "border-red-200" : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <p className="text-sm-app font-bold text-header-navy">{title}</p>
        </div>

        {required && (
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-bold",
              missing
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-600",
            )}
          >
            {missing ? "필수" : "완료"}
          </span>
        )}
      </div>

      <p className="text-sm-app font-medium text-text-sub truncate">{summary}</p>
    </button>
  );
}

function MetaBadgeRow({
  dept,
  contractor,
  photoCount,
  drawingCount,
  receiptCount,
  className,
}: {
  dept: string;
  contractor: string;
  photoCount: number;
  drawingCount: number;
  receiptCount: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-block max-w-full overflow-x-auto overflow-y-hidden no-scrollbar", className)}>
      <div className="inline-flex min-w-max items-center gap-1.5 pl-0.5 pr-1.5 pb-0.5">
        <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-lg border border-sky-200 bg-sky-50 px-2 text-[12px] font-semibold text-sky-700">
          {toKoreanAffiliation(dept)}
        </span>
        <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-2 text-[12px] font-semibold text-indigo-700">
          {toKoreanAffiliation(contractor)}
        </span>
        <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-background px-2 text-[12px] font-semibold text-text-sub">
          사진 {photoCount}
        </span>
        <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-background px-2 text-[12px] font-semibold text-text-sub">
          도면 {drawingCount}
        </span>
        <span className="inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-lg border border-border bg-background px-2 text-[12px] font-semibold text-text-sub">
          확인서 {receiptCount}
        </span>
      </div>
    </div>
  );
}

function WorklogStatusProgress({ status }: { status: WorklogStatus }) {
  const rejected = status === "rejected";
  const active = statusProgressStep(status);
  const steps = ["작성", "요청", "반려", "완료"];
  const filledChipClass = rejected ? "border-red-500 bg-red-500 text-white" : "border-sky-500 bg-sky-500 text-white";
  const defaultChipClass = rejected ? "border-red-200 bg-white text-red-700" : "border-sky-200 bg-white text-sky-700";
  const lineFilledClass = rejected ? "bg-red-400" : "bg-sky-400";
  const lineDefaultClass = rejected ? "bg-red-200" : "bg-sky-200";
  const ringClass = rejected ? "ring-2 ring-red-200" : "ring-2 ring-sky-200";

  return (
    <div
      className={cn(
        "w-full rounded-xl border px-2.5 py-2",
        rejected ? "border-red-100 bg-red-50/70" : "border-sky-100 bg-sky-50/70",
      )}
    >
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const filled = stepIndex <= active;
          const current = stepIndex === active;
          return (
            <div key={step} className="relative w-1/4 min-w-0 flex items-center justify-center">
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-1/2 z-0 h-[3px] w-full -translate-y-1/2 rounded-full",
                    stepIndex < active ? lineFilledClass : lineDefaultClass,
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 inline-flex h-7 min-w-0 items-center justify-center whitespace-nowrap rounded-full border px-3 text-[11px] font-bold transition-colors",
                  filled ? filledChipClass : defaultChipClass,
                  current && ringClass,
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
