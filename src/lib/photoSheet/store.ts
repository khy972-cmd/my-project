import {
  PHOTO_SHEET_DRAFT_LOCAL_KEY,
  PHOTO_SHEET_FINAL_LOCAL_KEY,
} from "@/constants/storageKeys";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPhotoSheetFinalFromDraft,
  toPhotoSheetDraftPayload,
  toPhotoSheetFinalPayload,
} from "@/lib/photoSheet/mapper";
import {
  normalizeDateString,
  normalizePhotoSheetDraft,
  normalizePhotoSheetFinal,
  normalizeText,
  toPhotoSheetDraftKey,
} from "@/lib/photoSheet/normalize";
import type {
  PhotoSheetDraft,
  PhotoSheetDraftRow,
  PhotoSheetFinal,
  PhotoSheetFinalRow,
  PhotoSheetListParams,
} from "@/lib/photoSheet/types";

export { PHOTO_SHEET_DRAFT_LOCAL_KEY, PHOTO_SHEET_FINAL_LOCAL_KEY };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readLocalMap<T>(key: string, normalizer: (raw: unknown) => T | null) {
  if (typeof window === "undefined") return {} as Record<string, T>;
  try {
    const raw = JSON.parse(window.localStorage.getItem(key) || "{}");
    if (!raw || typeof raw !== "object") return {} as Record<string, T>;

    const map: Record<string, T> = {};
    Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
      const normalized = normalizer(value);
      if (normalized) map[id] = normalized;
    });
    return map;
  } catch {
    return {} as Record<string, T>;
  }
}

function writeLocalMap<T>(key: string, map: Record<string, T>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(map));
}

function mapDraftRowToDomain(row: PhotoSheetDraftRow): PhotoSheetDraft {
  const payload = row.payload || {};
  const normalized = normalizePhotoSheetDraft({
    id: row.id,
    site_id: row.site_id,
    site_value: row.site_value,
    site_name: row.site_name,
    work_date: row.work_date,
    status: row.status,
    memo: payload.memo,
    items: payload.items || [],
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    localOnly: false,
    lastSyncedAt: row.updated_at,
  });
  if (!normalized) {
    throw new Error("photo_sheet_draft_normalization_failed");
  }
  return normalized;
}

function mapFinalRowToDomain(row: PhotoSheetFinalRow): PhotoSheetFinal {
  const payload = row.payload || {};
  const normalized = normalizePhotoSheetFinal({
    id: row.id,
    draft_id: row.draft_id,
    site_id: row.site_id,
    site_value: row.site_value,
    site_name: row.site_name,
    work_date: row.work_date,
    memo: payload.memo,
    items: payload.items || [],
    finalized_by: row.finalized_by,
    finalized_at: row.finalized_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
  if (!normalized) {
    throw new Error("photo_sheet_final_normalization_failed");
  }
  return normalized;
}

function asDb() {
  return supabase as any;
}

export function listLocalPhotoSheetDrafts() {
  return Object.values(readLocalMap(PHOTO_SHEET_DRAFT_LOCAL_KEY, normalizePhotoSheetDraft)).sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getLocalPhotoSheetDraft(siteValue: string, siteName: string, workDate: string) {
  const key = toPhotoSheetDraftKey(siteValue, siteName, workDate);
  return (
    listLocalPhotoSheetDrafts().find(
      (draft) => toPhotoSheetDraftKey(draft.siteValue, draft.siteName, draft.workDate) === key,
    ) || null
  );
}

export function upsertLocalPhotoSheetDraft(draft: PhotoSheetDraft) {
  const normalized = normalizePhotoSheetDraft(draft);
  if (!normalized) throw new Error("invalid_photo_sheet_draft");
  const map = readLocalMap(PHOTO_SHEET_DRAFT_LOCAL_KEY, normalizePhotoSheetDraft);
  map[normalized.id] = normalized;
  writeLocalMap(PHOTO_SHEET_DRAFT_LOCAL_KEY, map);
  return normalized;
}

export function removeLocalPhotoSheetDraft(draftId: string) {
  const map = readLocalMap(PHOTO_SHEET_DRAFT_LOCAL_KEY, normalizePhotoSheetDraft);
  if (!map[draftId]) return;
  delete map[draftId];
  writeLocalMap(PHOTO_SHEET_DRAFT_LOCAL_KEY, map);
}

export function listLocalPhotoSheetFinals() {
  return Object.values(readLocalMap(PHOTO_SHEET_FINAL_LOCAL_KEY, normalizePhotoSheetFinal)).sort(
    (a, b) => b.finalizedAt.localeCompare(a.finalizedAt),
  );
}

export function upsertLocalPhotoSheetFinal(finalDoc: PhotoSheetFinal) {
  const normalized = normalizePhotoSheetFinal(finalDoc);
  if (!normalized) throw new Error("invalid_photo_sheet_final");
  const map = readLocalMap(PHOTO_SHEET_FINAL_LOCAL_KEY, normalizePhotoSheetFinal);
  map[normalized.id] = normalized;
  writeLocalMap(PHOTO_SHEET_FINAL_LOCAL_KEY, map);
  return normalized;
}

export function removeLocalPhotoSheetFinalByDraftId(draftId: string) {
  const map = readLocalMap(PHOTO_SHEET_FINAL_LOCAL_KEY, normalizePhotoSheetFinal);
  let changed = false;
  Object.entries(map).forEach(([id, item]) => {
    if (item.draftId === draftId) {
      delete map[id];
      changed = true;
    }
  });
  if (changed) writeLocalMap(PHOTO_SHEET_FINAL_LOCAL_KEY, map);
}

export async function listRemotePhotoSheetDrafts(params?: PhotoSheetListParams) {
  let query = asDb().from("photo_sheet_drafts").select("*").order("updated_at", { ascending: false });

  if (params?.siteId && isUuid(params.siteId)) query = query.eq("site_id", params.siteId);
  if (params?.siteValue) query = query.eq("site_value", normalizeText(params.siteValue));
  if (params?.siteName) query = query.eq("site_name", normalizeText(params.siteName));
  if (params?.workDate) query = query.eq("work_date", normalizeDateString(params.workDate));

  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as PhotoSheetDraftRow[]).map(mapDraftRowToDomain);
}

export async function listRemotePhotoSheetFinals(params?: PhotoSheetListParams) {
  let query = asDb().from("photo_sheet_finals").select("*").order("finalized_at", { ascending: false });

  if (params?.siteId && isUuid(params.siteId)) query = query.eq("site_id", params.siteId);
  if (params?.siteValue) query = query.eq("site_value", normalizeText(params.siteValue));
  if (params?.siteName) query = query.eq("site_name", normalizeText(params.siteName));
  if (params?.workDate) query = query.eq("work_date", normalizeDateString(params.workDate));

  const { data, error } = await query;
  if (error) throw error;
  return ((data || []) as PhotoSheetFinalRow[]).map(mapFinalRowToDomain);
}

export async function saveRemotePhotoSheetDraft(draft: PhotoSheetDraft, userId: string) {
  const normalized = normalizePhotoSheetDraft(draft);
  if (!normalized) throw new Error("invalid_photo_sheet_draft");

  const rowPayload = {
    site_id: isUuid(normalized.siteId) ? normalized.siteId : null,
    site_value: normalized.siteValue,
    site_name: normalized.siteName,
    work_date: normalizeDateString(normalized.workDate),
    status: normalized.status,
    payload: toPhotoSheetDraftPayload(normalized),
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const db = asDb();
  const isRemoteId = isUuid(normalized.id);
  const { data, error } = isRemoteId
    ? await db.from("photo_sheet_drafts").update(rowPayload).eq("id", normalized.id).select("*").single()
    : await db.from("photo_sheet_drafts").insert(rowPayload).select("*").single();

  if (error) throw error;
  const saved = mapDraftRowToDomain(data as PhotoSheetDraftRow);
  upsertLocalPhotoSheetDraft({ ...saved, localOnly: false, lastSyncedAt: saved.updatedAt });
  return saved;
}

export async function finalizeRemotePhotoSheetDraft(draft: PhotoSheetDraft, userId: string) {
  const draftSaved = await saveRemotePhotoSheetDraft({ ...draft, status: "finalized" }, userId);
  const finalDoc = buildPhotoSheetFinalFromDraft({ draft: draftSaved, finalizedBy: userId });

  const payload = {
    draft_id: draftSaved.id,
    site_id: isUuid(draftSaved.siteId) ? draftSaved.siteId : null,
    site_value: draftSaved.siteValue,
    site_name: draftSaved.siteName,
    work_date: normalizeDateString(draftSaved.workDate),
    payload: toPhotoSheetFinalPayload(finalDoc),
    finalized_by: userId,
    finalized_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await asDb()
    .from("photo_sheet_finals")
    .upsert(payload, { onConflict: "draft_id" })
    .select("*")
    .single();
  if (error) throw error;

  const savedFinal = mapFinalRowToDomain(data as PhotoSheetFinalRow);
  upsertLocalPhotoSheetDraft({ ...draftSaved, status: "finalized", localOnly: false });
  upsertLocalPhotoSheetFinal(savedFinal);

  return {
    draft: draftSaved,
    final: savedFinal,
  };
}

export async function reopenRemotePhotoSheetDraft(draft: PhotoSheetDraft, userId: string) {
  const normalized = normalizePhotoSheetDraft(draft);
  if (!normalized) throw new Error("invalid_photo_sheet_draft");
  if (!isUuid(normalized.id)) {
    const reopened = upsertLocalPhotoSheetDraft({ ...normalized, status: "draft", updatedAt: new Date().toISOString() });
    removeLocalPhotoSheetFinalByDraftId(reopened.id);
    return reopened;
  }

  const { data, error } = await asDb()
    .from("photo_sheet_drafts")
    .update({
      status: "draft",
      payload: toPhotoSheetDraftPayload({ ...normalized, status: "draft" }),
      updated_at: new Date().toISOString(),
      created_by: userId,
    })
    .eq("id", normalized.id)
    .select("*")
    .single();
  if (error) throw error;

  await asDb().from("photo_sheet_finals").delete().eq("draft_id", normalized.id);

  const reopened = mapDraftRowToDomain(data as PhotoSheetDraftRow);
  upsertLocalPhotoSheetDraft({ ...reopened, status: "draft", localOnly: false });
  removeLocalPhotoSheetFinalByDraftId(reopened.id);
  return reopened;
}

