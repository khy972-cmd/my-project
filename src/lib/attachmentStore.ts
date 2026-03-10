import { ATTACHMENT_INDEX_KEY } from "@/constants/storageKeys";
import { isBrowser, txDone, openDb as openDbUtil } from "@/lib/indexedDbUtils";

export type AttachmentType = "photo" | "drawing";
export type DrawingAttachmentType = "drawing_file" | "drawing_markup";

export interface AttachmentRef {
  id: string;
  type: AttachmentType;
  status: string;
  timestamp: string;
  name?: string;
  mime?: string;
  ext?: string;
  size?: number;
  drawingType?: DrawingAttachmentType;
  siteValue?: string;
  siteName?: string;
  workDate?: string;
  source?: string;
  url?: string;
  img?: string;
}

const DB_NAME = "inopnc_blobs_v1";
const STORE_NAME = "blobs";
const DB_VERSION = 1;

const objectUrlCache = new Map<string, string>();

function openDb() {
  return openDbUtil({
    dbName: DB_NAME,
    version: DB_VERSION,
    storeName: STORE_NAME,
    onUpgrade: (db) => {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

function makeRefId(worklogId: string, type: AttachmentType, index: number) {
  return `att_${worklogId}_${type}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMime(inputMime: string, fileName: string) {
  const mime = String(inputMime || "").toLowerCase().trim();
  if (mime) return mime;
  const ext = extractExt(fileName);
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "application/octet-stream";
}

function extractExt(fileName: string) {
  const parsed = String(fileName || "").split(".").pop()?.toLowerCase() || "";
  return parsed.replace(/[^a-z0-9]/g, "");
}

function extFromMime(mime: string) {
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "";
}

function normalizeSiteLookup(value: string) {
  return String(value || "").trim().toLowerCase();
}

function compactSiteLookup(value: string) {
  return normalizeSiteLookup(value).replace(/\s+/g, "");
}

function collectLookupKeys(siteValue?: string, siteName?: string) {
  const keys = new Set<string>();
  const add = (raw?: string) => {
    const normalized = normalizeSiteLookup(raw || "");
    const compact = compactSiteLookup(raw || "");
    if (normalized) keys.add(normalized);
    if (compact) keys.add(compact);
  };
  add(siteValue);
  add(siteName);
  return keys;
}

function normalizeAttachmentRef(raw: unknown): AttachmentRef | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const type = row.type === "photo" || row.type === "drawing" ? row.type : null;
  if (!type || typeof row.id !== "string") return null;
  const status = typeof row.status === "string" ? row.status : type === "photo" ? "after" : "progress";
  const timestamp = typeof row.timestamp === "string" ? row.timestamp : new Date().toISOString();
  const drawingType =
    row.drawingType === "drawing_file" || row.drawingType === "drawing_markup"
      ? row.drawingType
      : undefined;
  const size = Number(row.size);
  return {
    id: row.id,
    type,
    status,
    timestamp,
    name: typeof row.name === "string" ? row.name : undefined,
    mime: typeof row.mime === "string" ? row.mime : undefined,
    ext: typeof row.ext === "string" ? row.ext : undefined,
    size: Number.isFinite(size) ? size : undefined,
    drawingType,
    siteValue: typeof row.siteValue === "string" ? row.siteValue : undefined,
    siteName: typeof row.siteName === "string" ? row.siteName : undefined,
    workDate: typeof row.workDate === "string" ? row.workDate : undefined,
    source: typeof row.source === "string" ? row.source : undefined,
    url: typeof row.url === "string" ? row.url : undefined,
    img: typeof row.img === "string" ? row.img : undefined,
  };
}

function readAttachmentIndex() {
  if (typeof window === "undefined") return {} as Record<string, AttachmentRef>;
  try {
    const raw = JSON.parse(localStorage.getItem(ATTACHMENT_INDEX_KEY) || "{}") as unknown;
    if (!raw || typeof raw !== "object") return {} as Record<string, AttachmentRef>;
    const map: Record<string, AttachmentRef> = {};
    Object.entries(raw as Record<string, unknown>).forEach(([id, value]) => {
      const normalized = normalizeAttachmentRef(value);
      if (!normalized || normalized.id !== id) return;
      map[id] = normalized;
    });
    return map;
  } catch {
    return {} as Record<string, AttachmentRef>;
  }
}

function writeAttachmentIndex(map: Record<string, AttachmentRef>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ATTACHMENT_INDEX_KEY, JSON.stringify(map));
}

export function upsertAttachmentRefs(refs: AttachmentRef[]) {
  if (!Array.isArray(refs) || refs.length === 0) return;
  const map = readAttachmentIndex();
  refs.forEach((ref) => {
    if (!ref?.id) return;
    const normalized = normalizeAttachmentRef(ref);
    if (!normalized) return;
    map[normalized.id] = normalized;
  });
  writeAttachmentIndex(map);
}

export function listAttachmentRefs(params?: {
  type?: AttachmentType;
  siteValue?: string;
  siteName?: string;
  workDate?: string;
  source?: string;
  drawingType?: DrawingAttachmentType;
}) {
  const { type, siteValue, siteName, workDate, source, drawingType } = params || {};
  const siteLookup = collectLookupKeys(siteValue, siteName);
  return Object.values(readAttachmentIndex())
    .filter((row) => {
      if (type && row.type !== type) return false;
      if (source && row.source !== source) return false;
      if (workDate && row.workDate !== workDate) return false;
      if (drawingType && row.drawingType !== drawingType) return false;
      if (siteLookup.size === 0) return true;
      const rowKeys = collectLookupKeys(row.siteValue, row.siteName);
      for (const key of rowKeys) {
        if (siteLookup.has(key)) return true;
      }
      return false;
    })
    .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
}

async function getBlob(refId: string) {
  if (!isBrowser()) return null;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(refId);
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    await txDone(tx);
    return blob;
  } finally {
    db.close();
  }
}

export function isAttachmentRef(value: unknown): value is AttachmentRef {
  return !!normalizeAttachmentRef(value);
}

export async function saveFiles(params: {
  worklogId: string;
  type: AttachmentType;
  files: File[];
  defaultStatus: string;
  siteValue?: string;
  siteName?: string;
  workDate?: string;
  source?: string;
}) {
  const { worklogId, type, files, defaultStatus, siteValue, siteName, workDate, source } = params;
  if (!isBrowser()) return [] as AttachmentRef[];
  if (!Array.isArray(files) || files.length === 0) return [] as AttachmentRef[];

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const refs: AttachmentRef[] = [];

    files.forEach((file, index) => {
      const id = makeRefId(worklogId || "temp", type, index);
      const mime = normalizeMime(file.type, file.name);
      const ext = extractExt(file.name) || extFromMime(mime);
      const drawingType =
        type === "drawing" ? (mime.startsWith("image/") ? "drawing_markup" : "drawing_file") : undefined;
      const ref: AttachmentRef = {
        id,
        type,
        status: defaultStatus,
        timestamp: new Date().toISOString(),
        name: file.name,
        mime,
        ext,
        size: Number(file.size || 0),
        drawingType,
        siteValue,
        siteName,
        workDate,
        source,
      };
      refs.push(ref);
      store.put(file, id);
    });

    await txDone(tx);
    upsertAttachmentRefs(refs);
    return refs;
  } finally {
    db.close();
  }
}

export async function getObjectUrl(refId: string) {
  if (!refId) return null;
  if (objectUrlCache.has(refId)) return objectUrlCache.get(refId) || null;

  const blob = await getBlob(refId);
  if (!blob) return null;

  const url = URL.createObjectURL(blob);
  objectUrlCache.set(refId, url);
  return url;
}

export function revokeObjectUrl(refId: string) {
  const url = objectUrlCache.get(refId);
  if (!url) return;
  URL.revokeObjectURL(url);
  objectUrlCache.delete(refId);
}

export function revokeAllObjectUrls() {
  objectUrlCache.forEach((url) => URL.revokeObjectURL(url));
  objectUrlCache.clear();
}

export async function deleteRef(refId: string) {
  if (!isBrowser() || !refId) return;
  revokeObjectUrl(refId);

  const indexMap = readAttachmentIndex();
  if (indexMap[refId]) {
    delete indexMap[refId];
    writeAttachmentIndex(indexMap);
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(refId);
    await txDone(tx);
  } finally {
    db.close();
  }
}
