import type { AttachmentRef } from "@/lib/attachmentStore";

export const PHOTO_SHEET_ITEM_STATUSES = ["before", "after", "receipt"] as const;
export type PhotoSheetItemStatus = (typeof PHOTO_SHEET_ITEM_STATUSES)[number];

export const PHOTO_SHEET_DRAFT_STATUSES = ["draft", "finalized"] as const;
export type PhotoSheetDraftStatus = (typeof PHOTO_SHEET_DRAFT_STATUSES)[number];

export type PhotoSheetSourceType = "photo_ref";

export interface PhotoSheetSourcePhoto {
  attachmentRefId: string;
  title?: string;
  status?: string;
  note?: string;
  order?: number;
  timestamp?: string;
  url?: string;
}

export type PhotoSheetAttachmentSource = Pick<
  AttachmentRef,
  "id" | "name" | "status" | "timestamp" | "siteValue" | "siteName" | "workDate" | "url" | "img"
>;

export interface PhotoSheetDraftItem {
  id: string;
  attachmentRefId: string;
  title: string;
  status: PhotoSheetItemStatus;
  note: string;
  order: number;
  sourceType: PhotoSheetSourceType;
}

export interface PhotoSheetDraft {
  id: string;
  siteId: string;
  siteValue: string;
  siteName: string;
  workDate: string;
  status: PhotoSheetDraftStatus;
  memo: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  items: PhotoSheetDraftItem[];
  localOnly?: boolean;
  lastSyncedAt?: string;
}

export interface PhotoSheetFinal {
  id: string;
  draftId: string;
  siteId: string;
  siteValue: string;
  siteName: string;
  workDate: string;
  memo: string;
  finalizedBy?: string;
  finalizedAt: string;
  createdAt: string;
  updatedAt: string;
  items: PhotoSheetDraftItem[];
}

export interface PhotoSheetDraftPayload {
  memo?: string;
  items?: PhotoSheetDraftItem[];
}

export interface PhotoSheetFinalPayload {
  memo?: string;
  items?: PhotoSheetDraftItem[];
}

export interface PhotoSheetDraftRow {
  id: string;
  site_id: string | null;
  site_value: string;
  site_name: string;
  work_date: string;
  status: string;
  payload: PhotoSheetDraftPayload | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoSheetFinalRow {
  id: string;
  draft_id: string;
  site_id: string | null;
  site_value: string;
  site_name: string;
  work_date: string;
  payload: PhotoSheetFinalPayload | null;
  finalized_by: string;
  finalized_at: string;
  created_at: string;
  updated_at: string;
}

export interface PhotoSheetListParams {
  siteId?: string;
  siteValue?: string;
  siteName?: string;
  workDate?: string;
}

export interface BuildPhotoSheetDraftParams {
  siteId?: string;
  siteValue: string;
  siteName: string;
  workDate: string;
  memo?: string;
  createdBy?: string;
  sources: PhotoSheetSourcePhoto[];
  existing?: PhotoSheetDraft | null;
}

export interface BuildPhotoSheetFinalParams {
  draft: PhotoSheetDraft;
  finalizedBy?: string;
}

export interface PhotoSheetQueryData {
  drafts: PhotoSheetDraft[];
  finals: PhotoSheetFinal[];
}

