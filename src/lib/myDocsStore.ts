export type MyDocStoredFile = {
  id: string;
  name: string;
  type: "img" | "file";
  size: string;
  ext: string;
  mime?: string;
  refId: string;
  docType?: string;
  version?: string;
};

export type MyDocStoredEntry = {
  id: string;
  title: string;
  author: string;
  date: string;
  time: string;
  files: MyDocStoredFile[];
  version?: string;
  contractor?: string;
  affiliation?: string;
  status?: string;
};

type MyDocsState = {
  docs: MyDocStoredEntry[];
  hiddenIds: string[];
};

const DB_NAME = "inopnc_my_docs_v1";
const STORE_NAME = "my_doc_files";
const DB_VERSION = 1;
import { MY_DOCS_INDEX_PREFIX } from "@/constants/storageKeys";
import { isBrowser, txDone, openDb as openDbUtil } from "@/lib/indexedDbUtils";

const objectUrlCache = new Map<string, string>();

function storageKey(scope: string) {
  return `${MY_DOCS_INDEX_PREFIX}${scope || "anonymous"}`;
}

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

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractExt(fileName: string) {
  const ext = String(fileName || "").split(".").pop()?.toLowerCase() || "";
  return ext.replace(/[^a-z0-9]/g, "");
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
  if (ext === "doc") return "application/msword";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "xls") return "application/vnd.ms-excel";
  if (ext === "xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (ext === "ppt") return "application/vnd.ms-powerpoint";
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (ext === "hwp") return "application/x-hwp";
  return "application/octet-stream";
}

function toSizeLabel(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0MB";
  return `${(size / 1024 / 1024).toFixed(2)}MB`;
}

function normalizeStoredFile(raw: unknown): MyDocStoredFile | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string" || typeof row.refId !== "string") return null;
  const type = row.type === "img" ? "img" : "file";
  return {
    id: row.id,
    name: row.name,
    type,
    size: typeof row.size === "string" ? row.size : "0MB",
    ext: typeof row.ext === "string" ? row.ext : "",
    mime: typeof row.mime === "string" ? row.mime : undefined,
    refId: row.refId,
    docType: typeof row.docType === "string" ? row.docType : undefined,
    version: typeof row.version === "string" ? row.version : undefined,
  };
}

function normalizeStoredDoc(raw: unknown): MyDocStoredEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.title !== "string" ||
    typeof row.author !== "string" ||
    typeof row.date !== "string" ||
    typeof row.time !== "string"
  ) {
    return null;
  }

  const files = Array.isArray(row.files)
    ? row.files.map(normalizeStoredFile).filter((file): file is MyDocStoredFile => !!file)
    : [];

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    date: row.date,
    time: row.time,
    files,
    version: typeof row.version === "string" ? row.version : undefined,
    contractor: typeof row.contractor === "string" ? row.contractor : undefined,
    affiliation: typeof row.affiliation === "string" ? row.affiliation : undefined,
    status: typeof row.status === "string" ? row.status : undefined,
  };
}

function readState(scope: string): MyDocsState {
  if (typeof window === "undefined") return { docs: [], hiddenIds: [] };
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(scope)) || "{}") as unknown;
    if (!raw || typeof raw !== "object") return { docs: [], hiddenIds: [] };
    const row = raw as Record<string, unknown>;
    const docs = Array.isArray(row.docs)
      ? row.docs.map(normalizeStoredDoc).filter((doc): doc is MyDocStoredEntry => !!doc)
      : [];
    const hiddenIds = Array.isArray(row.hiddenIds)
      ? row.hiddenIds.filter((id): id is string => typeof id === "string")
      : [];
    return { docs, hiddenIds: Array.from(new Set(hiddenIds)) };
  } catch {
    return { docs: [], hiddenIds: [] };
  }
}

function writeState(scope: string, state: MyDocsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey(scope),
    JSON.stringify({
      docs: state.docs,
      hiddenIds: Array.from(new Set(state.hiddenIds.filter(Boolean))),
    }),
  );
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

export function loadMyDocsState(scope: string) {
  return readState(scope);
}

export function saveMyDocsHiddenIds(scope: string, hiddenIds: string[]) {
  const state = readState(scope);
  state.hiddenIds = Array.from(new Set(hiddenIds.filter(Boolean)));
  writeState(scope, state);
}

export async function addMyDocEntry(params: {
  scope: string;
  title: string;
  author: string;
  date: string;
  time: string;
  files: File[];
  version?: string;
  contractor?: string;
  affiliation?: string;
  status?: string;
}) {
  const { scope, title, author, date, time, files, version, contractor, affiliation, status } = params;
  if (!isBrowser()) return null;
  if (!Array.isArray(files) || files.length === 0) return null;

  const docId = createId("mydoc");
  const db = await openDb();

  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const storedFiles: MyDocStoredFile[] = [];

    files.forEach((file, index) => {
      const refId = `${docId}_file_${index}_${Math.random().toString(36).slice(2, 7)}`;
      const mime = normalizeMime(file.type, file.name);
      const ext = (extractExt(file.name) || "").toUpperCase();
      store.put(file, refId);
      storedFiles.push({
        id: createId("mydoc_file"),
        name: file.name,
        type: mime.startsWith("image/") ? "img" : "file",
        size: toSizeLabel(Number(file.size || 0)),
        ext,
        mime,
        refId,
        version: version || "v1",
      });
    });

    await txDone(tx);

    const nextEntry: MyDocStoredEntry = {
      id: docId,
      title,
      author,
      date,
      time,
      files: storedFiles,
      version,
      contractor,
      affiliation,
      status,
    };
    const state = readState(scope);
    state.docs = [nextEntry, ...state.docs.filter((doc) => doc.id !== docId)];
    state.hiddenIds = state.hiddenIds.filter((id) => id !== docId);
    writeState(scope, state);
    return nextEntry;
  } finally {
    db.close();
  }
}

export async function deleteMyDocEntries(scope: string, docIds: string[]) {
  const uniqueDocIds = Array.from(new Set(docIds.filter(Boolean)));
  if (uniqueDocIds.length === 0) return;

  const state = readState(scope);
  const removeSet = new Set(uniqueDocIds);
  const refsToDelete = state.docs
    .filter((doc) => removeSet.has(doc.id))
    .flatMap((doc) => doc.files.map((file) => file.refId));

  state.docs = state.docs.filter((doc) => !removeSet.has(doc.id));
  state.hiddenIds = state.hiddenIds.filter((id) => !removeSet.has(id));
  writeState(scope, state);

  if (!isBrowser() || refsToDelete.length === 0) return;

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    refsToDelete.forEach((refId) => {
      revokeMyDocObjectUrl(refId);
      store.delete(refId);
    });
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function getMyDocObjectUrl(refId: string) {
  if (!refId) return null;
  if (objectUrlCache.has(refId)) return objectUrlCache.get(refId) || null;
  const blob = await getBlob(refId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  objectUrlCache.set(refId, url);
  return url;
}

export function revokeMyDocObjectUrl(refId: string) {
  const url = objectUrlCache.get(refId);
  if (!url) return;
  URL.revokeObjectURL(url);
  objectUrlCache.delete(refId);
}
