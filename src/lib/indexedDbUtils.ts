/**
 * 공통 IndexedDB 유틸리티
 * attachmentStore, myDocsStore 등에서 재사용
 */

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

export function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export interface OpenDbOptions {
  dbName: string;
  version: number;
  storeName: string;
  onUpgrade?: (db: IDBDatabase) => void;
}

export function openDb(options: OpenDbOptions): Promise<IDBDatabase> {
  const { dbName, version, storeName, onUpgrade } = options;
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("indexeddb_unavailable"));
      return;
    }

    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (onUpgrade) {
        onUpgrade(db);
      } else if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
