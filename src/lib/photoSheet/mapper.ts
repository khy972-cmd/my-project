import {
  normalizeDateString,
  normalizePhotoSheetDraft,
  normalizePhotoSheetDraftItem,
  normalizePhotoSheetItemStatus,
  normalizePhotoSheetSourcePhoto,
  normalizeText,
} from "@/lib/photoSheet/normalize";
import type {
  BuildPhotoSheetDraftParams,
  BuildPhotoSheetFinalParams,
  PhotoSheetDraft,
  PhotoSheetDraftItem,
  PhotoSheetDraftPayload,
  PhotoSheetFinal,
  PhotoSheetFinalPayload,
  PhotoSheetSourcePhoto,
} from "@/lib/photoSheet/types";

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toSource(input: PhotoSheetSourcePhoto, index: number) {
  return normalizePhotoSheetSourcePhoto(input, index);
}

export function mapSourcePhotoToDraftItem(
  source: PhotoSheetSourcePhoto,
  index: number,
): PhotoSheetDraftItem {
  const normalizedSource = toSource(source, index);
  if (!normalizedSource) {
    return {
      id: makeId("psi"),
      attachmentRefId: `unknown_${index + 1}`,
      title: `사진 ${index + 1}`,
      status: "after",
      note: "",
      order: index + 1,
      sourceType: "photo_ref",
    };
  }

  return {
    id: makeId("psi"),
    attachmentRefId: normalizedSource.attachmentRefId,
    title: normalizeText(normalizedSource.title) || `사진 ${index + 1}`,
    status: normalizePhotoSheetItemStatus(normalizedSource.status, "after"),
    note: normalizeText(normalizedSource.note),
    order: Number.isFinite(Number(normalizedSource.order))
      ? Number(normalizedSource.order)
      : index + 1,
    sourceType: "photo_ref",
  };
}

export function mergeDraftItemsFromSources(
  sources: PhotoSheetSourcePhoto[],
  existing?: PhotoSheetDraft | null,
) {
  const existingByRef = new Map(
    (existing?.items || []).map((item) => [item.attachmentRefId, item]),
  );

  return sources
    .map((source, index) => {
      const normalizedSource = toSource(source, index);
      if (!normalizedSource) return null;

      const existingItem = existingByRef.get(normalizedSource.attachmentRefId);
      const mapped = mapSourcePhotoToDraftItem(normalizedSource, index);
      const merged = normalizePhotoSheetDraftItem(
        existingItem
          ? {
              ...mapped,
              ...existingItem,
              attachmentRefId: normalizedSource.attachmentRefId,
              title: existingItem.title || mapped.title,
              status: existingItem.status || mapped.status,
              note: existingItem.note || mapped.note,
              order: Number.isFinite(Number(existingItem.order))
                ? Number(existingItem.order)
                : mapped.order,
            }
          : mapped,
        index,
      );
      return merged;
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 })) as PhotoSheetDraftItem[];
}

export function buildPhotoSheetDraftFromSources(
  params: BuildPhotoSheetDraftParams,
): PhotoSheetDraft {
  const now = new Date().toISOString();
  const normalizedWorkDate = normalizeDateString(params.workDate);
  const existing = params.existing ? normalizePhotoSheetDraft(params.existing) : null;

  const normalizedSources = (params.sources || [])
    .map((source, index) => toSource(source, index))
    .filter(Boolean) as PhotoSheetSourcePhoto[];
  const items = mergeDraftItemsFromSources(normalizedSources, existing);

  return {
    id: existing?.id || makeId("psd"),
    siteId: normalizeText(params.siteId || existing?.siteId),
    siteValue: normalizeText(params.siteValue || existing?.siteValue),
    siteName: normalizeText(params.siteName || existing?.siteName),
    workDate: normalizedWorkDate,
    status: existing?.status || "draft",
    memo: normalizeText(params.memo ?? existing?.memo),
    createdBy: normalizeText(params.createdBy || existing?.createdBy) || undefined,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    items,
    localOnly: existing?.localOnly ?? true,
    lastSyncedAt: existing?.lastSyncedAt,
  };
}

export function buildPhotoSheetFinalFromDraft(
  params: BuildPhotoSheetFinalParams,
): PhotoSheetFinal {
  const now = new Date().toISOString();
  const draft = normalizePhotoSheetDraft(params.draft);
  const safeDraft = draft || params.draft;

  return {
    id: makeId("psf"),
    draftId: safeDraft.id,
    siteId: safeDraft.siteId,
    siteValue: safeDraft.siteValue,
    siteName: safeDraft.siteName,
    workDate: normalizeDateString(safeDraft.workDate),
    memo: safeDraft.memo || "",
    finalizedBy: params.finalizedBy,
    finalizedAt: now,
    createdAt: now,
    updatedAt: now,
    items: (safeDraft.items || [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({ ...item, order: index + 1 })),
  };
}

export function toPhotoSheetDraftPayload(draft: PhotoSheetDraft): PhotoSheetDraftPayload {
  return {
    memo: normalizeText(draft.memo),
    items: (draft.items || []).map((item, index) => ({
      id: item.id || makeId("psi"),
      attachmentRefId: item.attachmentRefId,
      title: normalizeText(item.title) || `사진 ${index + 1}`,
      status: normalizePhotoSheetItemStatus(item.status, "after"),
      note: normalizeText(item.note),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
      sourceType: "photo_ref",
    })),
  };
}

export function toPhotoSheetFinalPayload(finalDoc: PhotoSheetFinal): PhotoSheetFinalPayload {
  return {
    memo: normalizeText(finalDoc.memo),
    items: (finalDoc.items || []).map((item, index) => ({
      id: item.id || makeId("psi"),
      attachmentRefId: item.attachmentRefId,
      title: normalizeText(item.title) || `사진 ${index + 1}`,
      status: normalizePhotoSheetItemStatus(item.status, "after"),
      note: normalizeText(item.note),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
      sourceType: "photo_ref",
    })),
  };
}

