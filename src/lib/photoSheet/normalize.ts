import {
  PHOTO_SHEET_DRAFT_STATUSES,
  PHOTO_SHEET_ITEM_STATUSES,
  type PhotoSheetDraft,
  type PhotoSheetDraftItem,
  type PhotoSheetDraftStatus,
  type PhotoSheetFinal,
  type PhotoSheetItemStatus,
  type PhotoSheetSourcePhoto,
} from "@/lib/photoSheet/types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeDateString(value: unknown, fallback = "") {
  const raw = normalizeText(value, fallback);
  if (!raw) return fallback;

  const shortMatched = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (shortMatched) return `${shortMatched[1]}-${shortMatched[2]}-${shortMatched[3]}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return fallback;
  const yy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function normalizePhotoSheetItemStatus(
  value: unknown,
  fallback: PhotoSheetItemStatus = "after",
): PhotoSheetItemStatus {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return fallback;

  if (
    raw === "before" ||
    raw === "보수전" ||
    raw === "pre" ||
    raw === "repair_before"
  ) {
    return "before";
  }
  // PhotoSheet status policy: keep only before/after for editing and persistence.
  // Legacy "receipt/confirm/확인서" values are normalized to "after".
  if (
    raw === "receipt" ||
    raw === "confirm" ||
    raw === "confirmation" ||
    raw === "확인서"
  ) {
    return "after";
  }
  if (
    raw === "after" ||
    raw === "보수후" ||
    raw === "post" ||
    raw === "repair_after"
  ) {
    return "after";
  }

  return fallback;
}

export function normalizePhotoSheetDraftStatus(
  value: unknown,
  fallback: PhotoSheetDraftStatus = "draft",
): PhotoSheetDraftStatus {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return fallback;
  if (raw === "final" || raw === "approved" || raw === "finalized") return "finalized";
  return "draft";
}

export function normalizePhotoSheetSourcePhoto(
  raw: unknown,
  index = 0,
): PhotoSheetSourcePhoto | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const attachmentRefId =
    normalizeText(row.attachmentRefId) || normalizeText(row.id) || normalizeText(row.refId);
  if (!attachmentRefId) return null;

  return {
    attachmentRefId,
    title: normalizeText(row.title) || normalizeText(row.name) || `photo ${index + 1}`,
    status: normalizeText(row.status),
    note: normalizeText(row.note),
    order: Number.isFinite(Number(row.order)) ? Number(row.order) : index + 1,
    timestamp: normalizeText(row.timestamp),
    url: normalizeText(row.url) || normalizeText(row.img),
  };
}

export function normalizePhotoSheetDraftItem(
  raw: unknown,
  index = 0,
): PhotoSheetDraftItem | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const attachmentRefId =
    normalizeText(row.attachmentRefId) || normalizeText(row.attachment_ref_id);
  if (!attachmentRefId) return null;

  const title = normalizeText(row.title) || `사진 ${index + 1}`;
  const status = normalizePhotoSheetItemStatus(row.status, "after");

  return {
    id: normalizeText(row.id) || makeId("psi"),
    attachmentRefId,
    title,
    status,
    note: normalizeText(row.note),
    order: Number.isFinite(Number(row.order)) ? Number(row.order) : index + 1,
    sourceType: "photo_ref",
  };
}

export function normalizePhotoSheetDraft(raw: unknown): PhotoSheetDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const workDate = normalizeDateString(row.workDate || row.work_date);
  if (!workDate) return null;

  const items = Array.isArray(row.items)
    ? row.items
        .map((item, index) => normalizePhotoSheetDraftItem(item, index))
        .filter(Boolean) as PhotoSheetDraftItem[]
    : [];

  const normalizedStatus = normalizePhotoSheetDraftStatus(row.status, "draft");
  const normalizedItems = items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));

  const createdAt = normalizeText(row.createdAt || row.created_at) || new Date().toISOString();
  const updatedAt = normalizeText(row.updatedAt || row.updated_at) || createdAt;

  return {
    id: normalizeText(row.id) || makeId("psd"),
    siteId: normalizeText(row.siteId || row.site_id),
    siteValue: normalizeText(row.siteValue || row.site_value),
    siteName: normalizeText(row.siteName || row.site_name),
    workDate,
    status: normalizedStatus,
    memo: normalizeText(row.memo),
    createdBy: normalizeText(row.createdBy || row.created_by) || undefined,
    createdAt,
    updatedAt,
    items: normalizedItems,
    localOnly: Boolean(row.localOnly),
    lastSyncedAt: normalizeText(row.lastSyncedAt) || undefined,
  };
}

export function normalizePhotoSheetFinal(raw: unknown): PhotoSheetFinal | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const draftId = normalizeText(row.draftId || row.draft_id);
  const workDate = normalizeDateString(row.workDate || row.work_date);
  if (!draftId || !workDate) return null;

  const items = Array.isArray(row.items)
    ? row.items
        .map((item, index) => normalizePhotoSheetDraftItem(item, index))
        .filter(Boolean) as PhotoSheetDraftItem[]
    : [];

  const createdAt = normalizeText(row.createdAt || row.created_at) || new Date().toISOString();
  const finalizedAt = normalizeText(row.finalizedAt || row.finalized_at) || createdAt;
  const updatedAt = normalizeText(row.updatedAt || row.updated_at) || finalizedAt;

  return {
    id: normalizeText(row.id) || makeId("psf"),
    draftId,
    siteId: normalizeText(row.siteId || row.site_id),
    siteValue: normalizeText(row.siteValue || row.site_value),
    siteName: normalizeText(row.siteName || row.site_name),
    workDate,
    memo: normalizeText(row.memo),
    finalizedBy: normalizeText(row.finalizedBy || row.finalized_by) || undefined,
    finalizedAt,
    createdAt,
    updatedAt,
    items: items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index + 1 })),
  };
}

export function toPhotoSheetDraftKey(siteValue: string, siteName: string, workDate: string) {
  const normalizedSite = `${normalizeText(siteValue).toLowerCase()}|${normalizeText(siteName).toLowerCase()}`;
  return `${normalizedSite}|${normalizeDateString(workDate)}`;
}

export function isPhotoSheetItemStatus(value: unknown): value is PhotoSheetItemStatus {
  return PHOTO_SHEET_ITEM_STATUSES.includes(value as PhotoSheetItemStatus);
}

export function isPhotoSheetDraftStatus(value: unknown): value is PhotoSheetDraftStatus {
  return PHOTO_SHEET_DRAFT_STATUSES.includes(value as PhotoSheetDraftStatus);
}

