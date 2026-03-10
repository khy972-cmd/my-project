import { SITE_DRAFT_STORE_KEY } from "@/constants/storageKeys";
import type { WorklogEntry, WorklogStatus } from "@/lib/worklogStore";

export type SiteDraftStatus = WorklogStatus;

export interface SiteWorklogSnapshotRow {
  worklogId: string;
  date: string;
  version: number;
  status: WorklogStatus;
  updatedAt: string;
}

export interface SiteWorklogSnapshot {
  id: string;
  version: number;
  status: SiteDraftStatus;
  memo: string;
  includedDates: string[];
  rows: SiteWorklogSnapshotRow[];
  createdAt: string;
}

export interface SiteWorklogDraft {
  id: string;
  siteKey: string;
  siteId: string;
  siteName: string;
  dept: string;
  memo: string;
  status: SiteDraftStatus;
  latestVersion: number;
  includedDates: string[];
  lastUpdatedAt: string;
  snapshots: SiteWorklogSnapshot[];
  rejectedReason?: string;
}

function asStatus(value: unknown): SiteDraftStatus {
  const raw = String(value || "").toLowerCase();
  if (raw === "pending" || raw === "approved" || raw === "rejected" || raw === "draft") return raw;
  return "draft";
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeRows(value: unknown): SiteWorklogSnapshotRow[] {
  return toArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const date = typeof row.date === "string" ? row.date : "";
      if (!date) return null;
      return {
        worklogId: typeof row.worklogId === "string" ? row.worklogId : `virtual_${date}`,
        date,
        version: Math.max(1, Number(row.version || 1)),
        status: asStatus(row.status),
        updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : new Date().toISOString(),
      } satisfies SiteWorklogSnapshotRow;
    })
    .filter(Boolean) as SiteWorklogSnapshotRow[];
}

function normalizeSnapshots(value: unknown): SiteWorklogSnapshot[] {
  return toArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : makeId("site_snapshot");
      return {
        id,
        version: Math.max(1, Number(row.version || 1)),
        status: asStatus(row.status),
        memo: typeof row.memo === "string" ? row.memo : "",
        includedDates: toArray(row.includedDates).map((date) => String(date || "")).filter(Boolean),
        rows: normalizeRows(row.rows),
        createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString(),
      } satisfies SiteWorklogSnapshot;
    })
    .filter(Boolean) as SiteWorklogSnapshot[];
}

function normalizeDraft(value: unknown): SiteWorklogDraft | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const siteKey = typeof row.siteKey === "string" ? row.siteKey : "";
  if (!siteKey) return null;

  const snapshots = normalizeSnapshots(row.snapshots);

  return {
    id: typeof row.id === "string" ? row.id : makeId("site_draft"),
    siteKey,
    siteId: typeof row.siteId === "string" ? row.siteId : "",
    siteName: typeof row.siteName === "string" ? row.siteName : "",
    dept: typeof row.dept === "string" ? row.dept : "",
    memo: typeof row.memo === "string" ? row.memo : "",
    status: asStatus(row.status),
    latestVersion: Math.max(0, Number(row.latestVersion || snapshots.length || 0)),
    includedDates: toArray(row.includedDates).map((date) => String(date || "")).filter(Boolean),
    lastUpdatedAt: typeof row.lastUpdatedAt === "string" ? row.lastUpdatedAt : new Date().toISOString(),
    snapshots,
    rejectedReason: typeof row.rejectedReason === "string" ? row.rejectedReason : undefined,
  };
}

function readMap() {
  if (typeof window === "undefined") return {} as Record<string, SiteWorklogDraft>;
  try {
    const raw = JSON.parse(window.localStorage.getItem(SITE_DRAFT_STORE_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {} as Record<string, SiteWorklogDraft>;
    const map: Record<string, SiteWorklogDraft> = {};
    Object.entries(raw).forEach(([key, value]) => {
      const normalized = normalizeDraft(value);
      if (normalized) map[key] = normalized;
    });
    return map;
  } catch {
    return {} as Record<string, SiteWorklogDraft>;
  }
}

function writeMap(map: Record<string, SiteWorklogDraft>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SITE_DRAFT_STORE_KEY, JSON.stringify(map));
}

export function toSiteDraftKey(siteValue: string, siteName: string) {
  return (siteValue || siteName || "").trim().toLowerCase();
}

export function listSiteWorklogDrafts() {
  return Object.values(readMap()).sort((a, b) => b.lastUpdatedAt.localeCompare(a.lastUpdatedAt));
}

export function getSiteWorklogDraft(siteKey: string) {
  if (!siteKey) return null;
  return readMap()[siteKey] || null;
}

export function upsertSiteWorklogDraft(input: {
  siteKey: string;
  siteId: string;
  siteName: string;
  dept: string;
  memo?: string;
  status?: SiteDraftStatus;
  includedDates?: string[];
  latestVersion?: number;
  snapshots?: SiteWorklogSnapshot[];
  rejectedReason?: string;
}) {
  const map = readMap();
  const existing = map[input.siteKey];
  const now = new Date().toISOString();
  const next: SiteWorklogDraft = {
    id: existing?.id || makeId("site_draft"),
    siteKey: input.siteKey,
    siteId: input.siteId || existing?.siteId || "",
    siteName: input.siteName || existing?.siteName || "",
    dept: input.dept || existing?.dept || "",
    memo: typeof input.memo === "string" ? input.memo : existing?.memo || "",
    status: input.status || existing?.status || "draft",
    latestVersion: Math.max(0, Number(input.latestVersion || existing?.latestVersion || 0)),
    includedDates: input.includedDates || existing?.includedDates || [],
    lastUpdatedAt: now,
    snapshots: input.snapshots || existing?.snapshots || [],
    rejectedReason: input.rejectedReason,
  };
  map[input.siteKey] = next;
  writeMap(map);
  return next;
}

export function appendSiteWorklogSnapshot(params: {
  draft: SiteWorklogDraft;
  status: SiteDraftStatus;
  memo: string;
  includedDates: string[];
  rows: SiteWorklogSnapshotRow[];
  rejectedReason?: string;
}) {
  const now = new Date().toISOString();
  const version = Math.max(1, Number(params.draft.latestVersion || 0) + 1);
  const snapshot: SiteWorklogSnapshot = {
    id: makeId("site_snapshot"),
    version,
    status: params.status,
    memo: params.memo,
    includedDates: params.includedDates,
    rows: params.rows,
    createdAt: now,
  };

  return upsertSiteWorklogDraft({
    siteKey: params.draft.siteKey,
    siteId: params.draft.siteId,
    siteName: params.draft.siteName,
    dept: params.draft.dept,
    memo: params.memo,
    status: params.status,
    includedDates: params.includedDates,
    latestVersion: version,
    snapshots: [snapshot, ...params.draft.snapshots],
    rejectedReason: params.rejectedReason,
  });
}

export function deriveSiteStatusFromLogs(logs: WorklogEntry[]): SiteDraftStatus {
  if (!Array.isArray(logs) || logs.length === 0) return "draft";
  if (logs.some((log) => log.status === "rejected")) return "rejected";
  if (logs.some((log) => log.status === "pending")) return "pending";
  if (logs.every((log) => log.status === "approved")) return "approved";
  return "draft";
}

export function buildSnapshotRowsFromLogs(logs: WorklogEntry[]): SiteWorklogSnapshotRow[] {
  return logs
    .filter((log) => !!log.workDate)
    .map((log) => ({
      worklogId: log.id,
      date: log.workDate,
      version: Math.max(1, Number(log.version || 1)),
      status: asStatus(log.status),
      updatedAt: log.updatedAt || log.createdAt || new Date().toISOString(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

