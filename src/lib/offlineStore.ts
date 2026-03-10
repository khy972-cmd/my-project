/**
 * Offline data store using IndexedDB
 * Queues operations when offline (underground parking, tunnels, etc.)
 * Auto-syncs when connection is restored
 */
import { SITE_DRAWINGS_KEY, SITE_PHOTOS_KEY } from "@/constants/storageKeys";
import { saveWorklog } from "@/lib/worklogStore";

const DB_NAME = "inopnc_offline";
const DB_VERSION = 1;
const QUEUE_STORE = "syncQueue";
const MEDIA_STORE = "offlineMedia";

export type SyncAction = "save_worklog" | "upload_photo" | "upload_drawing";

export interface QueueItem {
  id?: number;
  action: SyncAction;
  payload: any;
  createdAt: string;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
}

export interface OfflineMedia {
  id?: number;
  type: "photo" | "drawing";
  dataUrl: string;
  siteValue: string;
  siteName: string;
  workDate: string;
  badge?: string;
  createdAt: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getMediaIdentity(raw: unknown): string | null {
  const item = asRecord(raw);
  if (!item) return null;

  const workDate = typeof item.workDate === "string" ? item.workDate : "";
  const siteName = typeof item.siteName === "string" ? item.siteName : "";
  const version = Number.isFinite(Number(item.version)) ? String(item.version) : "";
  const timestamp = typeof item.timestamp === "string" ? item.timestamp : "";
  const badge = typeof item.badge === "string" ? item.badge : "";
  const url =
    typeof item.url === "string" && item.url
      ? item.url
      : typeof item.img === "string" && item.img
        ? item.img
        : typeof item.dataUrl === "string" && item.dataUrl
          ? item.dataUrl
          : "";

  if (!url) return null;
  return [url, workDate, siteName, version, timestamp, badge].join("::");
}

function hasStoredMedia(existingItems: unknown[], candidate: unknown): boolean {
  const candidateId = getMediaIdentity(candidate);
  if (!candidateId) return false;
  return existingItems.some((entry) => getMediaIdentity(entry) === candidateId);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        const store = db.createObjectStore(MEDIA_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("siteDate", ["siteValue", "workDate"]);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Queue Operations ───
export async function addToQueue(item: Omit<QueueItem, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllQueued(): Promise<QueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateQueueItem(id: number, updates: Partial<QueueItem>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    const store = tx.objectStore(QUEUE_STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.put({ ...getReq.result, ...updates });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Media Cache ───
export async function saveMediaOffline(media: Omit<OfflineMedia, "id">): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const req = tx.objectStore(MEDIA_STORE).add(media);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineMedia(siteValue: string, workDate: string): Promise<OfflineMedia[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    const index = tx.objectStore(MEDIA_STORE).index("siteDate");
    const req = index.getAll([siteValue, workDate]);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearOfflineMedia(siteValue: string, workDate: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const store = tx.objectStore(MEDIA_STORE);
    const index = store.index("siteDate");
    const req = index.openCursor([siteValue, workDate]);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Sync Engine ───
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getAllQueued();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    if (item.status === "syncing") continue;

    try {
      await updateQueueItem(item.id!, { status: "syncing" });

      // Process based on action type - for now save to localStorage
      // In future, this will POST to Supabase
      switch (item.action) {
        case "save_worklog": {
          saveWorklog(item.payload);
          break;
        }
        case "upload_photo":
        case "upload_drawing": {
          // Save photo/drawing data to localStorage
          const key = item.action === "upload_photo" ? SITE_PHOTOS_KEY : SITE_DRAWINGS_KEY;
          const existing = JSON.parse(localStorage.getItem(key) || "{}");
          const { siteValue, workDate, data } = item.payload;
          if (!existing[siteValue]) existing[siteValue] = {};
          if (!existing[siteValue][workDate]) existing[siteValue][workDate] = [];
          const bucket = Array.isArray(existing[siteValue][workDate]) ? existing[siteValue][workDate] : [];
          if (!hasStoredMedia(bucket, data)) {
            bucket.push(data);
          }
          existing[siteValue][workDate] = bucket;
          localStorage.setItem(key, JSON.stringify(existing));
          break;
        }
      }

      await removeFromQueue(item.id!);
      synced++;
    } catch (e) {
      console.error("Sync failed for item:", item.id, e);
      await updateQueueItem(item.id!, {
        status: "failed",
        retryCount: (item.retryCount || 0) + 1,
      });
      failed++;
    }
  }

  return { synced, failed };
}
