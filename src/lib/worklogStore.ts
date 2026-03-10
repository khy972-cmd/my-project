/**
 * Shared worklog data store - localStorage based
 * Used by HomePage (write), WorklogPage (read/manage), OutputPage (read), SitePage (read)
 */
import type { AttachmentRef, AttachmentType } from "@/lib/attachmentStore";
import { isAttachmentRef } from "@/lib/attachmentStore";
import {
  ADMIN_DRAWING_DRAFTS_KEY,
  ADMIN_DRAWING_FINALS_KEY,
  CONSTRUCTION_DRAWINGS_KEY,
  SITE_DRAWINGS_KEY,
  SITE_PHOTOS_KEY,
  SITE_WORKLOGS_KEY,
  WORKLOG_INDEX_V4_KEY,
  WORKLOGS_KEY,
} from "@/constants/storageKeys";
import { getLegacyMediaUrl } from "@/lib/legacyMedia";

export type WorklogStatus = "draft" | "pending" | "approved" | "rejected";

export interface ManpowerItem {
  id: number;
  worker: string;
  workHours: number;
  isCustom: boolean;
  locked: boolean;
}

export interface WorkSet {
  id: number;
  member: string;
  process: string;
  type: string;
  location: { block: string; dong: string; floor: string };
  customMemberValue: string;
  customProcessValue: string;
  customTypeValue: string;
}

export interface MaterialItem {
  id: number;
  name: string;
  qty: number;
}

export interface WorklogEntry {
  id: string;
  siteValue: string;
  siteName: string;
  createdBy?: string;
  dept: string;
  workDate: string;
  manpower: ManpowerItem[];
  workSets: WorkSet[];
  materials: MaterialItem[];
  photos: AttachmentRef[];
  drawings: AttachmentRef[];
  photoCount: number;
  drawingCount: number;
  status: WorklogStatus;
  createdAt: string;
  updatedAt?: string;
  version: number;
  weather?: string;
}

export interface SaveWorklogInput
  extends Omit<WorklogEntry, "id" | "createdAt" | "updatedAt" | "version" | "photoCount" | "drawingCount"> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  photoCount?: number;
  drawingCount?: number;
  status?: WorklogStatus;
}

export interface PhotoEntry {
  id: number;
  url: string;
  badge: "사진" | "보수" | "완료";
  type: "photo" | "drawing";
  version: number;
  timestamp: string;
  siteName: string;
  workDate: string;
}

export interface DrawingEntry {
  img: string;
  version: number;
  timestamp: string;
  siteName: string;
  workDate: string;
}

export interface SiteDrawingBucketEntry {
  id: string;
  name: string;
  img: string;
  timestamp: string;
  siteName: string;
  workDate: string;
  source: "construction" | "worklog" | "admin";
  adminStage?: "draft" | "final";
  sourceDrawingId?: string;
  worklogId?: string;
  worklogStatus?: WorklogStatus;
}

export interface SiteDrawingBuckets {
  construction: SiteDrawingBucketEntry[];
  progress: SiteDrawingBucketEntry[];
  completion: SiteDrawingBucketEntry[];
}

const PHOTOS_KEY = SITE_PHOTOS_KEY;
const DRAWINGS_KEY = SITE_DRAWINGS_KEY;

function toStatus(raw: unknown): WorklogStatus {
  const value = String(raw || "").toLowerCase();
  if (value === "pending" || value === "approved" || value === "rejected" || value === "draft") {
    return value;
  }
  if (value === "submitted") return "pending";
  if (value === "reject") return "rejected";
  return "draft";
}

function defaultMediaStatus(type: AttachmentType) {
  return type === "photo" ? "after" : "progress";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function normalizeAttachmentList(raw: unknown, type: AttachmentType, seed: string): AttachmentRef[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();

  return raw
    .map((row, index) => {
      if (isAttachmentRef(row)) {
        return { ...row, type };
      }
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;

      if (typeof item.id === "string") {
        const normalized: AttachmentRef & { url?: string } = {
          id: item.id,
          type,
          status: String(item.status || defaultMediaStatus(type)),
          timestamp: typeof item.timestamp === "string" ? item.timestamp : now,
        };
        if (typeof item.name === "string" && item.name.trim()) normalized.name = item.name;
        if (typeof item.mime === "string" && item.mime.trim()) normalized.mime = item.mime;
        if (typeof item.ext === "string" && item.ext.trim()) normalized.ext = item.ext;
        if (Number.isFinite(Number(item.size))) normalized.size = Number(item.size);
        if (item.drawingType === "drawing_file" || item.drawingType === "drawing_markup") {
          normalized.drawingType = item.drawingType;
        }
        if (typeof item.siteValue === "string" && item.siteValue.trim()) normalized.siteValue = item.siteValue;
        if (typeof item.siteName === "string" && item.siteName.trim()) normalized.siteName = item.siteName;
        if (typeof item.workDate === "string" && item.workDate.trim()) normalized.workDate = item.workDate;
        if (typeof item.source === "string" && item.source.trim()) normalized.source = item.source;
        const legacyUrl =
          typeof item.url === "string" && item.url.trim()
            ? item.url
            : typeof item.img === "string" && item.img.trim()
              ? item.img
              : "";
        if (legacyUrl) {
          normalized.url = legacyUrl;
        }
        return normalized;
      }

      // Legacy URL payload fallback (render only, no new URL save)
      const legacyUrl =
        typeof item.url === "string" && item.url.trim()
          ? item.url
          : typeof item.img === "string" && item.img.trim()
            ? item.img
            : "";
      if (legacyUrl) {
        return {
          id: `legacy_${seed}_${type}_${index}`,
          type,
          status: String(item.status || defaultMediaStatus(type)),
          timestamp: typeof item.timestamp === "string" ? item.timestamp : now,
          name: typeof item.name === "string" ? item.name : undefined,
          mime: typeof item.mime === "string" ? item.mime : undefined,
          ext: typeof item.ext === "string" ? item.ext : undefined,
          size: Number.isFinite(Number(item.size)) ? Number(item.size) : undefined,
          drawingType:
            item.drawingType === "drawing_file" || item.drawingType === "drawing_markup"
              ? item.drawingType
              : undefined,
          siteValue: typeof item.siteValue === "string" ? item.siteValue : undefined,
          siteName: typeof item.siteName === "string" ? item.siteName : undefined,
          workDate: typeof item.workDate === "string" ? item.workDate : undefined,
          source: typeof item.source === "string" ? item.source : undefined,
          url: legacyUrl,
        } as AttachmentRef;
      }
      return null;
    })
    .filter(Boolean) as AttachmentRef[];
}

function normalizeWorklogEntry(raw: unknown): WorklogEntry | null {
  const row = asRecord(raw);
  if (!row) return null;
  const id = typeof row.id === "string" ? row.id : `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const photos = normalizeAttachmentList(row.photos, "photo", id);
  const drawings = normalizeAttachmentList(row.drawings, "drawing", id);

  const photoCount = Math.max(Number(row.photoCount || 0), photos.length);
  const drawingCount = Math.max(Number(row.drawingCount || 0), drawings.length);

  return {
    id,
    siteValue: String(row.siteValue || row.site_id || row.siteName || row.site_name || ""),
    siteName: String(row.siteName || row.site_name || ""),
    createdBy: typeof row.createdBy === "string" ? row.createdBy : undefined,
    dept: String(row.dept || ""),
    workDate: String(row.workDate || row.work_date || ""),
    manpower: Array.isArray(row.manpower) ? (row.manpower as ManpowerItem[]) : [],
    workSets: Array.isArray(row.workSets) ? (row.workSets as WorkSet[]) : [],
    materials: Array.isArray(row.materials) ? (row.materials as MaterialItem[]) : [],
    photos,
    drawings,
    photoCount,
    drawingCount,
    status: toStatus(row.status),
    createdAt: String(row.createdAt || row.created_at || new Date().toISOString()),
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    version: Math.max(1, Number(row.version || 1)),
    weather: typeof row.weather === "string" ? row.weather : "",
  };
}

function toSiteKey(siteValue: string, siteName: string) {
  return (siteValue || siteName || "").trim().toLowerCase();
}

function readStorageEntries() {
  try {
    const raw = JSON.parse(localStorage.getItem(WORKLOGS_KEY) || "[]");
    if (!Array.isArray(raw)) return [] as WorklogEntry[];
    return raw.map(normalizeWorklogEntry).filter(Boolean) as WorklogEntry[];
  } catch {
    return [] as WorklogEntry[];
  }
}

function writeStorageEntries(entries: WorklogEntry[]) {
  localStorage.setItem(WORKLOGS_KEY, JSON.stringify(entries));
}

function timestampFromUnknown(item: unknown, fallback: string) {
  const row = asRecord(item);
  if (!row) return fallback;
  return typeof row.timestamp === "string" ? row.timestamp : fallback;
}

function normalizeSiteLookup(value: string) {
  return String(value || "").trim().toLowerCase();
}

function compactSiteLookup(value: string) {
  return normalizeSiteLookup(value).replace(/\s+/g, "");
}

function resolvePrimarySiteKey(siteValue: string, siteName?: string) {
  return normalizeSiteLookup(siteValue) || normalizeSiteLookup(siteName || "");
}

function collectLookupKeys(siteValue: string, siteName?: string) {
  const keys = new Set<string>();
  const addLookupKey = (raw: string) => {
    const normalized = normalizeSiteLookup(raw);
    const compact = compactSiteLookup(raw);
    if (normalized) keys.add(normalized);
    if (compact) keys.add(compact);
  };
  addLookupKey(siteValue);
  addLookupKey(siteName || "");
  return keys;
}

function dedupeAndSortSiteDrawings(rows: SiteDrawingBucketEntry[]) {
  const seen = new Set<string>();
  return rows
    .filter((row) => !!row?.img)
    .filter((row) => {
      const key = `${row.source}:${row.adminStage || ""}:${row.worklogId || ""}:${row.img}:${row.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function dedupePhotoEntries(rows: PhotoEntry[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = [row.url, row.workDate, row.timestamp, row.siteName, row.badge, row.type].join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeDrawingEntries(rows: DrawingEntry[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = [row.img, row.workDate, row.timestamp, row.siteName].join("::");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

type ConstructionDrawingStore = Record<string, SiteDrawingBucketEntry[]>;
type AdminDrawingStore = Record<string, SiteDrawingBucketEntry[]>;

function readConstructionDrawingStore(): ConstructionDrawingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(CONSTRUCTION_DRAWINGS_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    const map: ConstructionDrawingStore = {};

    Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      const normalizedKey = normalizeSiteLookup(key);
      if (!normalizedKey) return;

      const rows = value
        .map((row, index) => {
          const item = asRecord(row);
          if (!item) return null;
          const img = typeof item.img === "string" ? item.img : typeof item.url === "string" ? item.url : "";
          if (!img) return null;
          const timestamp = typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString();
          const siteName = typeof item.siteName === "string" ? item.siteName : "";
          const workDate = typeof item.workDate === "string" ? item.workDate : timestamp.slice(0, 10);
          const name = typeof item.name === "string" && item.name.trim() ? item.name : `공사도면 ${index + 1}`;
          const id =
            typeof item.id === "string"
              ? item.id
              : `construction_${normalizedKey}_${index}_${Math.random().toString(36).slice(2, 8)}`;

          return {
            id,
            name,
            img,
            timestamp,
            siteName,
            workDate,
            source: "construction" as const,
          };
        })
        .filter(Boolean) as SiteDrawingBucketEntry[];

      if (rows.length > 0) map[normalizedKey] = rows;
    });

    return map;
  } catch {
    return {};
  }
}

function writeConstructionDrawingStore(store: ConstructionDrawingStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSTRUCTION_DRAWINGS_KEY, JSON.stringify(store));
}

function readAdminDrawingStore(storageKey: string, stage: "draft" | "final"): AdminDrawingStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (!raw || typeof raw !== "object") return {};
    const map: AdminDrawingStore = {};

    Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      const normalizedKey = normalizeSiteLookup(key);
      if (!normalizedKey) return;

      const rows = value
        .map((row, index) => {
          const item = asRecord(row);
          if (!item) return null;
          const img = typeof item.img === "string" ? item.img : typeof item.url === "string" ? item.url : "";
          if (!img) return null;
          const timestamp = typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString();
          const siteName = typeof item.siteName === "string" ? item.siteName : "";
          const workDate = typeof item.workDate === "string" ? item.workDate : timestamp.slice(0, 10);
          const name =
            typeof item.name === "string" && item.name.trim()
              ? item.name
              : stage === "final"
                ? `최종도면 ${index + 1}`
                : `관리도면 ${index + 1}`;
          const id =
            typeof item.id === "string"
              ? item.id
              : `admin_${stage}_${normalizedKey}_${index}_${Math.random().toString(36).slice(2, 8)}`;

          return {
            id,
            name,
            img,
            timestamp,
            siteName,
            workDate,
            source: "admin" as const,
            adminStage: stage,
            sourceDrawingId: typeof item.sourceDrawingId === "string" ? item.sourceDrawingId : undefined,
          };
        })
        .filter(Boolean) as SiteDrawingBucketEntry[];

      if (rows.length > 0) map[normalizedKey] = rows;
    });

    return map;
  } catch {
    return {};
  }
}

function writeAdminDrawingStore(storageKey: string, store: AdminDrawingStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(store));
}

function getAdminDrawingStorageKey(stage: "draft" | "final"): string {
  return stage === "final" ? ADMIN_DRAWING_FINALS_KEY : ADMIN_DRAWING_DRAFTS_KEY;
}

function readLegacyDrawingsByLookup(siteValue: string, siteName?: string): SiteDrawingBucketEntry[] {
  const lookupKeys = collectLookupKeys(siteValue, siteName);
  if (lookupKeys.size === 0) return [];

  try {
    const raw = JSON.parse(localStorage.getItem(DRAWINGS_KEY) || "{}");
    if (!raw || typeof raw !== "object") return [];
    const rows: SiteDrawingBucketEntry[] = [];

    Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => {
      const normalizedKey = normalizeSiteLookup(key);
      const compactKey = compactSiteLookup(key);
      if (!lookupKeys.has(normalizedKey) && !lookupKeys.has(compactKey)) return;
      const dateMap = asRecord(value);
      if (!dateMap) return;

      Object.values(dateMap).forEach((list) => {
        if (!Array.isArray(list)) return;
        list.forEach((item, index) => {
          const row = asRecord(item);
          if (!row) return;
          const img = typeof row.img === "string" ? row.img : typeof row.url === "string" ? row.url : "";
          if (!img) return;
          const timestamp = typeof row.timestamp === "string" ? row.timestamp : new Date().toISOString();
          rows.push({
            id: `legacy_construction_${key}_${index}_${timestamp}`,
            name: typeof row.name === "string" && row.name.trim() ? row.name : `공사도면 ${index + 1}`,
            img,
            timestamp,
            siteName: typeof row.siteName === "string" ? row.siteName : siteName || "",
            workDate: typeof row.workDate === "string" ? row.workDate : timestamp.slice(0, 10),
            source: "construction",
          });
        });
      });
    });

    return rows;
  } catch {
    return [];
  }
}

function isMatchedSiteLog(log: WorklogEntry, lookupKeys: Set<string>, siteName?: string) {
  const valueKey = normalizeSiteLookup(log.siteValue);
  const nameKey = normalizeSiteLookup(log.siteName);
  const valueCompact = compactSiteLookup(log.siteValue);
  const nameCompact = compactSiteLookup(log.siteName);
  if (
    (valueKey && lookupKeys.has(valueKey)) ||
    (nameKey && lookupKeys.has(nameKey)) ||
    (valueCompact && lookupKeys.has(valueCompact)) ||
    (nameCompact && lookupKeys.has(nameCompact))
  ) {
    return true;
  }

  const targetName = String(siteName || "").trim();
  const logName = String(log.siteName || "").trim();
  const targetCompact = compactSiteLookup(targetName);
  const logCompact = compactSiteLookup(logName);
  if (!targetCompact || !logCompact) return false;
  return logCompact === targetCompact || logCompact.includes(targetCompact) || targetCompact.includes(logCompact);
}

function collectWorklogDrawingsByStatus(siteValue: string, siteName: string | undefined, status: WorklogStatus) {
  const lookupKeys = collectLookupKeys(siteValue, siteName);
  if (lookupKeys.size === 0) return [];

  return getAllWorklogs()
    .filter((log) => log.status === status && isMatchedSiteLog(log, lookupKeys, siteName))
    .flatMap((log) =>
      (log.drawings || [])
        .map((item, index) => {
          const img = getLegacyMediaUrl(item);
          if (!img) return null;
          const row = asRecord(item);
          const timestamp = timestampFromUnknown(item, log.createdAt);
          return {
            id: `worklog_${log.id}_${index}`,
            name:
              (typeof row?.name === "string" && row.name.trim()) ||
              `${log.workDate || timestamp.slice(0, 10)} 도면 ${index + 1}`,
            img,
            timestamp,
            siteName: log.siteName || siteName || "",
            workDate: log.workDate || timestamp.slice(0, 10),
            source: "worklog" as const,
            worklogId: log.id,
            worklogStatus: log.status,
          };
        })
        .filter(Boolean) as SiteDrawingBucketEntry[],
    );
}

// Read
export function getAllWorklogs(): WorklogEntry[] {
  return readStorageEntries();
}

export function getWorklogsBySite(siteValue: string): WorklogEntry[] {
  const key = toSiteKey(siteValue, "");
  return getAllWorklogs().filter((w) => toSiteKey(w.siteValue, w.siteName) === key);
}

export function getWorklogsBySiteName(siteName: string): WorklogEntry[] {
  const key = toSiteKey("", siteName);
  return getAllWorklogs().filter((w) => toSiteKey(w.siteValue, w.siteName) === key);
}

export function getWorklogsByDate(date: string): WorklogEntry[] {
  return getAllWorklogs().filter((w) => w.workDate === date);
}

export function getWorklogsByMonth(year: number, month: number): WorklogEntry[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return getAllWorklogs().filter((w) => w.workDate.startsWith(prefix));
}

export function getWorklogById(id: string): WorklogEntry | undefined {
  return getAllWorklogs().find((w) => w.id === id);
}

// Write
export function saveWorklog(entry: SaveWorklogInput): WorklogEntry {
  const logs = getAllWorklogs();
  const now = new Date().toISOString();
  const incomingSiteKey = toSiteKey(entry.siteValue, entry.siteName);

  const photos = normalizeAttachmentList(entry.photos || [], "photo", entry.id || "new");
  const drawings = normalizeAttachmentList(entry.drawings || [], "drawing", entry.id || "new");

  const nextPhotoCount = Math.max(Number(entry.photoCount || 0), photos.length);
  const nextDrawingCount = Math.max(Number(entry.drawingCount || 0), drawings.length);

  let index = -1;
  if (entry.id) {
    index = logs.findIndex((log) => log.id === entry.id);
  }

  if (index < 0) {
    index = logs.findIndex(
      (log) => toSiteKey(log.siteValue, log.siteName) === incomingSiteKey && log.workDate === entry.workDate,
    );
  }

  if (index >= 0) {
    const existing = logs[index];
    const nextVersion = Math.max(existing.version + 1, Number(entry.version || 0) || existing.version + 1);
    const updated: WorklogEntry = {
      ...existing,
      ...entry,
      id: existing.id,
      siteValue: entry.siteValue || existing.siteValue,
      siteName: entry.siteName || existing.siteName,
      createdAt: existing.createdAt,
      updatedAt: now,
      version: nextVersion,
      status: toStatus(entry.status || existing.status),
      photos: photos.length > 0 ? photos : existing.photos,
      drawings: drawings.length > 0 ? drawings : existing.drawings,
      photoCount: nextPhotoCount > 0 ? nextPhotoCount : existing.photoCount,
      drawingCount: nextDrawingCount > 0 ? nextDrawingCount : existing.drawingCount,
      weather: entry.weather || "",
    };
    logs[index] = updated;
    writeStorageEntries(logs);
    return updated;
  }

  const created: WorklogEntry = {
    ...entry,
    id: entry.id || `wl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: toStatus(entry.status || "draft"),
    createdAt: entry.createdAt || now,
    updatedAt: entry.updatedAt,
    version: Math.max(1, Number(entry.version || 1)),
    photos,
    drawings,
    photoCount: nextPhotoCount,
    drawingCount: nextDrawingCount,
    weather: entry.weather || "",
  };

  logs.unshift(created);
  writeStorageEntries(logs);
  return created;
}

export function updateWorklogStatus(id: string, status: WorklogStatus): boolean {
  const logs = getAllWorklogs();
  const idx = logs.findIndex((log) => log.id === id);
  if (idx < 0) return false;
  logs[idx].status = toStatus(status);
  logs[idx].updatedAt = new Date().toISOString();
  writeStorageEntries(logs);
  return true;
}

export function deleteWorklog(id: string): boolean {
  const logs = getAllWorklogs();
  const filtered = logs.filter((log) => log.id !== id);
  if (filtered.length === logs.length) return false;
  writeStorageEntries(filtered);
  return true;
}

// Legacy Photos
export function getPhotosForSite(siteValue: string, date?: string): PhotoEntry[] {
  const fromLegacy = (() => {
    try {
      const data = JSON.parse(localStorage.getItem(PHOTOS_KEY) || "{}");
      if (!data[siteValue]) return [];
      if (date) return data[siteValue][date] || [];
      return Object.values(data[siteValue]).flat() as PhotoEntry[];
    } catch {
      return [] as PhotoEntry[];
    }
  })();

  const fromWorklogs = getWorklogsBySite(siteValue)
    .filter((log) => !date || log.workDate === date)
    .flatMap((log) =>
      (log.photos || [])
        .map((item, index) => {
          const url = getLegacyMediaUrl(item);
          if (!url) return null;
          return {
            id: index,
            url,
            badge: "사진" as const,
            type: "photo" as const,
            version: log.version,
            timestamp: timestampFromUnknown(item, log.createdAt),
            siteName: log.siteName,
            workDate: log.workDate,
          };
        })
        .filter(Boolean) as PhotoEntry[],
    );

  return dedupePhotoEntries([...fromLegacy, ...fromWorklogs]);
}

// Legacy Drawings
export function getDrawingsForSite(siteValue: string, date?: string): DrawingEntry[] {
  const fromLegacy = (() => {
    try {
      const data = JSON.parse(localStorage.getItem(DRAWINGS_KEY) || "{}");
      if (!data[siteValue]) return [];
      if (date) return data[siteValue][date] || [];
      return Object.values(data[siteValue]).flat() as DrawingEntry[];
    } catch {
      return [] as DrawingEntry[];
    }
  })();

  const fromWorklogs = getWorklogsBySite(siteValue)
    .filter((log) => !date || log.workDate === date)
    .flatMap((log) =>
      (log.drawings || [])
        .map((item) => {
          const img = getLegacyMediaUrl(item);
          if (!img) return null;
          return {
            img,
            version: log.version,
            timestamp: timestampFromUnknown(item, log.createdAt),
            siteName: log.siteName,
            workDate: log.workDate,
          };
        })
        .filter(Boolean) as DrawingEntry[],
    );

  return dedupeDrawingEntries([...fromLegacy, ...fromWorklogs]);
}

export function saveConstructionDrawingsForSite(params: {
  siteValue: string;
  siteName?: string;
  drawings: Array<{
    img: string;
    name?: string;
    timestamp?: string;
    workDate?: string;
  }>;
}) {
  const key = resolvePrimarySiteKey(params.siteValue, params.siteName);
  if (!key) return [] as SiteDrawingBucketEntry[];
  if (!Array.isArray(params.drawings) || params.drawings.length === 0) return [] as SiteDrawingBucketEntry[];

  const now = new Date().toISOString();
  const store = readConstructionDrawingStore();
  const existing = store[key] || [];
  const created = params.drawings
    .filter((row) => !!row?.img)
    .map((row, index) => {
      const timestamp = row.timestamp || now;
      return {
        id: `construction_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
        name: row.name?.trim() || `공사도면 ${index + 1}`,
        img: row.img,
        timestamp,
        siteName: params.siteName || "",
        workDate: row.workDate || timestamp.slice(0, 10),
        source: "construction" as const,
      };
    });

  store[key] = dedupeAndSortSiteDrawings([...created, ...existing]);
  writeConstructionDrawingStore(store);
  return created;
}

export function saveAdminDrawingsForSite(params: {
  siteValue: string;
  siteName?: string;
  stage: "draft" | "final";
  drawings: Array<{
    id?: string;
    img: string;
    name?: string;
    timestamp?: string;
    workDate?: string;
    sourceDrawingId?: string;
  }>;
}) {
  const key = resolvePrimarySiteKey(params.siteValue, params.siteName);
  if (!key) return [] as SiteDrawingBucketEntry[];
  if (!Array.isArray(params.drawings) || params.drawings.length === 0) return [] as SiteDrawingBucketEntry[];

  const storageKey = getAdminDrawingStorageKey(params.stage);
  const store = readAdminDrawingStore(storageKey, params.stage);
  const existing = store[key] || [];
  const now = new Date().toISOString();
  const next = [...existing];
  const saved: SiteDrawingBucketEntry[] = [];

  params.drawings.forEach((row, index) => {
    if (!row?.img) return;
    const timestamp = row.timestamp || now;
    const name =
      row.name?.trim() || (params.stage === "final" ? `최종도면 ${index + 1}` : `관리도면 ${index + 1}`);
    const id = row.id || `admin_${params.stage}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: SiteDrawingBucketEntry = {
      id,
      name,
      img: row.img,
      timestamp,
      siteName: params.siteName || "",
      workDate: row.workDate || timestamp.slice(0, 10),
      source: "admin",
      adminStage: params.stage,
      sourceDrawingId: row.sourceDrawingId,
    };

    const replaceIndex = next.findIndex((item) => item.id === id);
    if (replaceIndex >= 0) next[replaceIndex] = entry;
    else next.unshift(entry);
    saved.push(entry);
  });

  store[key] = dedupeAndSortSiteDrawings(next);
  writeAdminDrawingStore(storageKey, store);
  return saved;
}

export function removeAdminDrawingForSite(params: {
  siteValue: string;
  siteName?: string;
  stage: "draft" | "final";
  drawingId: string;
}) {
  const key = resolvePrimarySiteKey(params.siteValue, params.siteName);
  if (!key || !params.drawingId) return;

  const storageKey = getAdminDrawingStorageKey(params.stage);
  const store = readAdminDrawingStore(storageKey, params.stage);
  const next = (store[key] || []).filter((item) => item.id !== params.drawingId);
  if (next.length > 0) store[key] = next;
  else delete store[key];
  writeAdminDrawingStore(storageKey, store);
}

export function getConstructionDrawingsForSite(siteValue: string, siteName?: string) {
  const lookupKeys = collectLookupKeys(siteValue, siteName);
  if (lookupKeys.size === 0) return [] as SiteDrawingBucketEntry[];

  const store = readConstructionDrawingStore();
  const fromStore: SiteDrawingBucketEntry[] = [];
  Object.entries(store).forEach(([key, rows]) => {
    const normalizedKey = normalizeSiteLookup(key);
    const compactKey = compactSiteLookup(key);
    if (!lookupKeys.has(normalizedKey) && !lookupKeys.has(compactKey)) return;
    fromStore.push(...rows);
  });

  const merged = fromStore.length > 0 ? fromStore : readLegacyDrawingsByLookup(siteValue, siteName);
  return dedupeAndSortSiteDrawings(merged);
}

export function getAdminDrawingsForSite(siteValue: string, siteName: string | undefined, stage: "draft" | "final") {
  const lookupKeys = collectLookupKeys(siteValue, siteName);
  if (lookupKeys.size === 0) return [] as SiteDrawingBucketEntry[];

  const store = readAdminDrawingStore(getAdminDrawingStorageKey(stage), stage);
  const rows: SiteDrawingBucketEntry[] = [];
  Object.entries(store).forEach(([key, value]) => {
    const normalizedKey = normalizeSiteLookup(key);
    const compactKey = compactSiteLookup(key);
    if (!lookupKeys.has(normalizedKey) && !lookupKeys.has(compactKey)) return;
    rows.push(...value);
  });

  return dedupeAndSortSiteDrawings(rows);
}

export function getEditableDrawingsForSite(siteValue: string, siteName?: string) {
  return dedupeAndSortSiteDrawings([
    ...getConstructionDrawingsForSite(siteValue, siteName),
    ...getAdminDrawingsForSite(siteValue, siteName, "draft"),
    ...collectWorklogDrawingsByStatus(siteValue, siteName, "draft"),
    ...collectWorklogDrawingsByStatus(siteValue, siteName, "rejected"),
  ]);
}

export function getSiteDrawingBuckets(siteValue: string, siteName?: string): SiteDrawingBuckets {
  return {
    construction: getConstructionDrawingsForSite(siteValue, siteName),
    progress: dedupeAndSortSiteDrawings([
      ...getAdminDrawingsForSite(siteValue, siteName, "draft"),
      ...collectWorklogDrawingsByStatus(siteValue, siteName, "pending"),
    ]),
    completion: dedupeAndSortSiteDrawings([
      ...getAdminDrawingsForSite(siteValue, siteName, "final"),
      ...collectWorklogDrawingsByStatus(siteValue, siteName, "approved"),
    ]),
  };
}

// Migration: Convert old format to new unified format
export function migrateOldWorklogs(): void {
  const unified = getAllWorklogs();
  if (unified.length > 0) return;

  try {
    const oldDataRaw = JSON.parse(localStorage.getItem(SITE_WORKLOGS_KEY) || "{}") as unknown;
    const entries: WorklogEntry[] = [];

    const oldData = asRecord(oldDataRaw) || {};
    Object.entries(oldData).forEach(([siteValue, dates]) => {
      const dateRows = asRecord(dates);
      if (!dateRows) return;

      Object.entries(dateRows).forEach(([dateKey, data]) => {
        const dataRow = asRecord(data);
        const baseInfo = asRecord(dataRow?.baseInfo);
        if (!dataRow || !baseInfo) return;

        const versions = Array.isArray(dataRow.versions) ? (dataRow.versions as unknown[]) : [];
        const lastVersion = asRecord(versions[versions.length - 1]);
        entries.push({
          id: `wl_migrated_${siteValue}_${dateKey}`,
          siteValue: typeof baseInfo.siteValue === "string" ? baseInfo.siteValue : siteValue,
          siteName: typeof baseInfo.siteName === "string" ? baseInfo.siteName : "",
          dept: typeof baseInfo.dept === "string" ? baseInfo.dept : "",
          workDate: typeof baseInfo.workDate === "string" ? baseInfo.workDate : dateKey,
          manpower: Array.isArray(baseInfo.manpower) ? (baseInfo.manpower as ManpowerItem[]) : [],
          workSets: Array.isArray(baseInfo.workSets) ? (baseInfo.workSets as WorkSet[]) : [],
          materials: Array.isArray(lastVersion?.materials) ? (lastVersion.materials as MaterialItem[]) : [],
          photos: [],
          drawings: [],
          photoCount: Number(lastVersion?.photoCount || 0),
          drawingCount: Number(lastVersion?.drawingCount || 0),
          status: "draft",
          createdAt: typeof baseInfo.createdAt === "string" ? baseInfo.createdAt : new Date().toISOString(),
          updatedAt: typeof baseInfo.updatedAt === "string" ? baseInfo.updatedAt : undefined,
          version: Math.max(1, versions.length || 1),
          weather: "",
        });
      });
    });

    const v4DataRaw = JSON.parse(localStorage.getItem(WORKLOG_INDEX_V4_KEY) || "{}") as unknown;
    const v4Data = asRecord(v4DataRaw) || {};
    Object.entries(v4Data).forEach(([siteValue, logs]) => {
      if (!Array.isArray(logs)) return;
      logs.forEach((log) => {
        const row = asRecord(log);
        if (!row) return;

        const workDate = typeof row.workDate === "string" ? row.workDate : "";
        const exists = entries.find((entry) => entry.siteValue === siteValue && entry.workDate === workDate);
        if (exists) return;

        entries.push({
          id: `wl_v4_${siteValue}_${workDate}`,
          siteValue: typeof row.siteValue === "string" ? row.siteValue : siteValue,
          siteName: typeof row.site === "string" ? row.site : "",
          dept: typeof row.dept === "string" ? row.dept : "",
          workDate,
          manpower: Array.isArray(row.manpower) ? (row.manpower as ManpowerItem[]) : [],
          workSets: Array.isArray(row.workSets) ? (row.workSets as WorkSet[]) : [],
          materials: Array.isArray(row.materials) ? (row.materials as MaterialItem[]) : [],
          photos: [],
          drawings: [],
          photoCount: Number(row.photoCount || 0),
          drawingCount: 0,
          status: "draft",
          createdAt: typeof row.savedAt === "string" ? row.savedAt : new Date().toISOString(),
          version: 1,
          weather: "",
        });
      });
    });

    if (entries.length > 0) {
      writeStorageEntries(entries);
    }
  } catch {
    // no-op
  }
}
