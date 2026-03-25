import { HOME_DRAFT_KEY } from "@/constants/storageKeys";
import type { AttachmentRef } from "@/lib/attachmentStore";
import type { ManpowerItem, MaterialItem, WorkSet } from "@/lib/worklogStore";
import type { WorklogMutationInput } from "@/hooks/useSupabaseWorklogs";

export const HOME_IFRAME_BRIDGE_MESSAGE_TYPE = "inopnc:home-bridge";
export const HOME_IFRAME_BRIDGE_PROTOCOL_VERSION = 1;
export const HOME_IFRAME_BRIDGE_IFRAME_SOURCE = "home-v2-bridge";
export const HOME_IFRAME_BRIDGE_PARENT_SOURCE = "home-react-parent";

export type HomeIframeBridgePhase =
  | "draft-changed"
  | "save-requested"
  | "save-succeeded"
  | "save-failed"
  | "storage-save-failed"
  | "draft-cleared";

export type HomeIframeBridgeMessage = {
  type: typeof HOME_IFRAME_BRIDGE_MESSAGE_TYPE;
  phase: HomeIframeBridgePhase;
  source?: string;
  protocolVersion?: number;
  requestId?: string;
  raw?: string;
  code?: string;
  message?: string;
  reason?: string;
  timestamp?: string;
};

type HomeDraftBridgeState = {
  selectedSite?: unknown;
  siteSearch?: unknown;
  dept?: unknown;
  workDate?: unknown;
  manpowerList?: unknown;
  workSets?: unknown;
  materials?: unknown;
  photos?: unknown;
  drawings?: unknown;
};

type HomeDraftMaterial = MaterialItem & {
  receiptFile?: string;
};

export type ParsedHomeDraft = {
  selectedSite: string;
  siteSearch: string;
  dept: string;
  workDate: string;
  manpowerList: ManpowerItem[];
  workSets: WorkSet[];
  materials: HomeDraftMaterial[];
  photos: Array<AttachmentRef & { url?: string; img?: string }>;
  drawings: Array<AttachmentRef & { url?: string; img?: string }>;
};

export type HomeDraftParseErrorCode =
  | "empty-draft"
  | "invalid-json"
  | "invalid-shape"
  | "missing-site"
  | "missing-work-date";

type HomeDraftFailure = {
  ok: false;
  code: HomeDraftParseErrorCode;
  userMessage: string;
  devMessage: string;
  raw?: string;
};

type HomeDraftSuccess<T> = {
  ok: true;
  value: T;
};

export type HomeDraftParseResult<T> = HomeDraftSuccess<T> | HomeDraftFailure;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function failure(code: HomeDraftParseErrorCode, userMessage: string, devMessage: string, raw?: string): HomeDraftFailure {
  return {
    ok: false,
    code,
    userMessage,
    devMessage,
    raw,
  };
}

export function normalizeHomeDraftPhotoStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "before" || value === "보수전") return "before";
  if (value === "receipt" || value === "확인서" || value === "confirm" || value === "confirmation") return "receipt";
  return "after";
}

export function normalizeHomeDraftDrawingStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "done" || value === "완료도면" || value === "완료") return "done";
  return "progress";
}

export function readHomeDraftRaw(storage?: Pick<Storage, "getItem">): string {
  if (storage) return storage.getItem(HOME_DRAFT_KEY) || "";
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(HOME_DRAFT_KEY) || "";
}

export function parseHomeDraftRaw(raw: string, today: string): HomeDraftParseResult<ParsedHomeDraft> {
  if (!raw.trim()) {
    return failure("empty-draft", "홈 저장 초안이 없습니다.", "HOME_DRAFT_KEY is empty.", raw);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return failure("invalid-json", "홈 저장 초안을 읽지 못했습니다.", "HOME_DRAFT_KEY contains invalid JSON.", raw);
  }

  const parsed = asObject(parsedJson);
  if (!parsed) {
    return failure("invalid-shape", "홈 저장 초안 형식이 올바르지 않습니다.", "HOME_DRAFT_KEY root is not an object.", raw);
  }

  const nowIso = new Date().toISOString();
  const idSeed = Date.now();

  const manpowerList: ManpowerItem[] = Array.isArray(parsed.manpowerList)
    ? parsed.manpowerList
        .map((item, index) => {
          const row = asObject(item);
          if (!row) return null;
          return {
            id: asNumber(row.id, idSeed + index),
            worker: asString(row.worker).trim(),
            workHours: asNumber(row.workHours, 1),
            isCustom: !!row.isCustom,
            locked: !!row.locked,
          } satisfies ManpowerItem;
        })
        .filter(Boolean)
    : [];

  const workSets: WorkSet[] = Array.isArray(parsed.workSets)
    ? parsed.workSets
        .map((item, index) => {
          const row = asObject(item);
          if (!row) return null;
          const location = asObject(row.location) || {};
          return {
            id: asNumber(row.id, idSeed + index),
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
          } satisfies WorkSet;
        })
        .filter(Boolean)
    : [];

  const materials: HomeDraftMaterial[] = Array.isArray(parsed.materials)
    ? parsed.materials
        .map((item, index) => {
          const row = asObject(item);
          if (!row) return null;
          const name = asString(row.name).trim();
          if (!name) return null;
          return {
            id: asNumber(row.id, idSeed + index),
            name,
            qty: Math.max(0, asNumber(row.qty, 0)),
            receiptFile: asString(row.receiptFile).trim() || undefined,
          } satisfies HomeDraftMaterial;
        })
        .filter(Boolean)
    : [];

  const photos: Array<AttachmentRef & { url?: string; img?: string }> = Array.isArray(parsed.photos)
    ? parsed.photos
        .map((item, index) => {
          const row = asObject(item);
          if (!row) return null;
          const url = asString(row.url || row.img).trim();
          if (!url) return null;
          const name = asString(row.fileName).trim();
          return {
            id: `home_bridge_photo_${idSeed}_${index}`,
            type: "photo",
            status: normalizeHomeDraftPhotoStatus(asString(row.status || row.desc || row.badge, "after")),
            timestamp: nowIso,
            url,
            img: url,
            name: name || undefined,
          } satisfies AttachmentRef & { url?: string; img?: string };
        })
        .filter(Boolean)
    : [];

  const drawings: Array<AttachmentRef & { url?: string; img?: string }> = Array.isArray(parsed.drawings)
    ? parsed.drawings
        .map((item, index) => {
          const row = asObject(item);
          const url = asString(row?.url || row?.img || item).trim();
          if (!url) return null;
          return {
            id: `home_bridge_drawing_${idSeed}_${index}`,
            type: "drawing",
            status: normalizeHomeDraftDrawingStatus(asString(row?.status || row?.desc || row?.stage, "progress")),
            timestamp: nowIso,
            url,
            img: url,
          } satisfies AttachmentRef & { url?: string; img?: string };
        })
        .filter(Boolean)
    : [];

  return {
    ok: true,
    value: {
      selectedSite: asString(parsed.selectedSite).trim(),
      siteSearch: asString(parsed.siteSearch).trim(),
      dept: asString(parsed.dept).trim(),
      workDate: asString(parsed.workDate, today).trim() || today,
      manpowerList,
      workSets,
      materials,
      photos,
      drawings,
    },
  };
}

export function parseHomeDraftFromStorage(today: string, storage?: Pick<Storage, "getItem">): HomeDraftParseResult<ParsedHomeDraft> {
  return parseHomeDraftRaw(readHomeDraftRaw(storage), today);
}

export function toWorklogMutationInputFromParsedHomeDraft(
  draft: ParsedHomeDraft,
): HomeDraftParseResult<WorklogMutationInput> {
  if (!draft.siteSearch.trim()) {
    return failure(
      "missing-site",
      "홈 저장 내용에 현장 정보가 없어 작업일지에 반영하지 못했습니다.",
      "Parsed home draft is missing siteSearch.",
    );
  }

  if (!draft.workDate.trim()) {
    return failure(
      "missing-work-date",
      "홈 저장 내용에 작업일자가 없어 작업일지에 반영하지 못했습니다.",
      "Parsed home draft is missing workDate.",
    );
  }

  const photos = draft.photos.map((item) => ({
    ...item,
    type: "photo" as const,
  }));
  const drawings = draft.drawings.map((item) => ({
    ...item,
    type: "drawing" as const,
  }));

  return {
    ok: true,
    value: {
      siteValue: draft.selectedSite,
      siteName: draft.siteSearch,
      dept: draft.dept,
      workDate: draft.workDate,
      manpower: draft.manpowerList,
      workSets: draft.workSets,
      materials: draft.materials.map(({ receiptFile: _receiptFile, ...item }) => item),
      photos,
      drawings,
      photoCount: photos.filter((item) => item.status !== "receipt").length,
      drawingCount: drawings.length,
      status: "draft",
      version: 1,
    },
  };
}

export function parseHomeDraftToWorklogInput(raw: string, today: string): HomeDraftParseResult<WorklogMutationInput> {
  const parsed = parseHomeDraftRaw(raw, today);
  if (!parsed.ok) return parsed;
  return toWorklogMutationInputFromParsedHomeDraft(parsed.value);
}
