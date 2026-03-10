import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, MapPin, ChevronDown, ChevronUp, Pin, PinOff, Phone, Ruler,
  Camera, FileCheck2, ClipboardList, CheckCircle2, X, Map as MapIcon, Copy, Pencil, Upload, Eye, Download, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWorklogs } from "@/hooks/useSupabaseWorklogs";
import { usePunchGroups } from "@/hooks/useSupabasePunch";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteLodging } from "@/hooks/useSiteLodging";
import { useOperationalSites } from "@/hooks/useOperationalSites";
import SiteCombobox, { type SiteComboboxOption } from "@/components/site/SiteCombobox";
import {
  getPhotosForSite,
  getSiteDrawingBuckets,
  saveConstructionDrawingsForSite,
  type SiteDrawingBucketEntry,
} from "@/lib/worklogStore";
import { getObjectUrl } from "@/lib/attachmentStore";
import type { PunchGroup } from "@/lib/punchStore";
import DocumentViewer, { WorklogDocument, PhotoGrid, A4Page } from "@/components/viewer/DocumentViewer";
import { copyText, openAddressInMaps } from "@/lib/mapLinks";
import { canViewLodgingAddress } from "@/lib/rbac";

type SiteStatus = "all" | "ing" | "wait" | "done";
type SortType = "latest" | "name";

interface SiteData {
  id: number;
  siteDbId?: string | null;
  name: string;
  addr: string;
  lodge: string;
  status: "ing" | "wait" | "done";
  affil: string;
  manager: string;
  safety: string;
  phoneM: string;
  phoneS: string;
  days: number;
  mp: number;
  pinned: boolean;
  lastDate: string;
  lastTime: string;
  hasDraw: boolean;
  hasPhoto: boolean;
  hasPTW: boolean;
  hasLog: boolean;
  hasPunch: boolean;
  ptw?: { title: string; status: string; pages: number };
  workLog?: { title: string; status: string; pages: number };
  punch?: { title: string; status: string; pages: number };
  images: string[];
  drawings: { construction: any[]; progress: any[]; completion: any[] };
}


const INITIAL_SITES: SiteData[] = [];
const STATUS_CONFIG = {
  ing: { label: "\uC9C4\uD589\uC911", className: "bg-blue-500 text-white" },
  wait: { label: "\uC608\uC815", className: "bg-indigo-500 text-white" },
  done: { label: "\uC644\uB8CC", className: "bg-muted-foreground text-white" },
};

const FILTERS: { key: SiteStatus; label: string; chipClass: string }[] = [
  { key: "all", label: "\uC804\uCCB4", chipClass: "status-all" },
  { key: "ing", label: "\uC9C4\uD589\uC911", chipClass: "status-ing" },
  { key: "wait", label: "\uC608\uC815", chipClass: "status-wait" },
  { key: "done", label: "\uC644\uB8CC", chipClass: "status-done" },
];
function toCardStatus(status: string): SiteData["status"] {
  if (status === "예정") return "wait";
  if (status === "완료") return "done";
  return "ing";
}

function toDatePart(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toTimePart(value: string | null | undefined) {
  return value ? value.slice(11, 16) : "";
}

function daysFromCreatedAt(value: string | null | undefined) {
  if (!value) return 0;
  const createdAt = new Date(value);
  if (Number.isNaN(createdAt.getTime())) return 0;
  return Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}
type SiteDrawingKind = "original" | "marked" | "final";
type SiteDrawingSource = "linked" | "upload" | "approved";

interface SiteDrawingAsset {
  id: string;
  name: string;
  url: string;
  kind: SiteDrawingKind;
  source: SiteDrawingSource;
  createdAt: string;
}

interface SitePhotoAsset {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

declare global {
  interface Window {
    daum?: any;
  }
}

let postcodeLoader: Promise<void> | null = null;

function loadDaumPostcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.daum?.Postcode) return Promise.resolve();
  if (postcodeLoader) return postcodeLoader;
  postcodeLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("postcode load failed"));
    document.head.appendChild(script);
  });
  return postcodeLoader;
}

async function openDaumPostcode(): Promise<string> {
  await loadDaumPostcode();
  return await new Promise((resolve) => {
    if (!window.daum?.Postcode) return resolve("");
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        resolve(data?.roadAddress || data?.address || data?.jibunAddress || "");
      },
      onclose: () => resolve(""),
    }).open();
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(String(ev.target?.result || ""));
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function buildDrawingPlaceholder(name: string) {
  const safe = encodeURIComponent(name || "도면 샘플");
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1000' height='700'%3E%3Crect width='1000' height='700' fill='%23ffffff'/%3E%3Crect x='18' y='18' width='964' height='664' fill='none' stroke='%231a254f' stroke-width='4'/%3E%3Ctext x='500' y='350' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%231a254f'%3E${safe}%3C/text%3E%3C/svg%3E`;
}

function buildPhotoPlaceholder(name: string) {
  const safe = encodeURIComponent(name || "사진");
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='700'%3E%3Crect width='900' height='700' fill='%23f3f4f6'/%3E%3Crect x='18' y='18' width='864' height='664' fill='none' stroke='%231a254f' stroke-width='3'/%3E%3Ctext x='450' y='350' text-anchor='middle' font-family='sans-serif' font-size='30' fill='%231a254f'%3E${safe}%3C/text%3E%3C/svg%3E`;
}

function toKoreanAffiliation(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "미지정";
  const normalized = raw.toLowerCase();
  if (normalized === "hq") return "본사";
  if (normalized === "direct") return "직영";
  return raw;
}

function sanitizeFileName(name: string, fallback: string) {
  const trimmed = String(name || "").trim();
  const base = (trimmed || fallback || "file").replace(/[\\/:*?"<>|]+/g, "_");
  return base || "file";
}

function extFromMime(mime: string) {
  const value = (mime || "").toLowerCase();
  if (!value) return "";
  if (value.includes("png")) return "png";
  if (value.includes("jpeg") || value.includes("jpg")) return "jpg";
  if (value.includes("webp")) return "webp";
  if (value.includes("gif")) return "gif";
  if (value.includes("bmp")) return "bmp";
  if (value.includes("svg")) return "svg";
  if (value.includes("pdf")) return "pdf";
  return "";
}

async function blobFromUrl(url: string): Promise<Blob | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

function downloadBlobAsFile(blob: Blob, name: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1200);
}

export default function SitePage() {
  const { isPartner, isAdmin } = useUserRole();
  return <WorkerSitePage isPartner={isPartner} isAdmin={isAdmin} />;
}

function WorkerSitePage({ isPartner, isAdmin }: { isPartner: boolean; isAdmin: boolean }) {
  const { data: operationalSites = [] } = useOperationalSites();
  const [sites, setSites] = useState<SiteData[]>(() => INITIAL_SITES.slice(0, 0));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SiteStatus>("all");
  const [sort, setSort] = useState<SortType>("latest");
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerContent, setViewerContent] = useState<React.ReactNode>(null);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSiteId, setSheetSiteId] = useState<number | null>(null);
  const drawingInputRef = useRef<HTMLInputElement | null>(null);
  const [drawingReloadToken, setDrawingReloadToken] = useState(0);
  const [resolvedDrawingUrls, setResolvedDrawingUrls] = useState<Record<string, string>>({});
  const [drawingSelectMode, setDrawingSelectMode] = useState(false);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<Set<string>>(new Set());
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [photoSheetSiteId, setPhotoSheetSiteId] = useState<number | null>(null);
  const [photoSelectMode, setPhotoSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Live worklog & punch data from Supabase
  const { data: worklogs = [] } = useWorklogs();
  const { data: allPunchGroups = [] } = usePunchGroups();
  const canUploadConstruction = isPartner || isAdmin;

  useEffect(() => {
    setSites((prev) => {
      const pinnedMap = new Map(prev.map((site) => [site.siteDbId || site.name, site.pinned]));
      return operationalSites.map((site, index) => {
        const timestamp = site.updated_at || site.created_at || "";
        return {
          id: index + 1,
          siteDbId: site.id,
          name: site.name || "\uBBF8\uC9C0\uC815 \uD604\uC7A5",
          addr: site.address || "",
          lodge: "",
          status: toCardStatus(site.status || ""),
          affil: site.company_name || site.builder || "\uBBF8\uC9C0\uC815",
          manager: site.manager_name || "\uBBF8\uC9C0\uC815",
          safety: site.builder || site.company_name || "\uBBF8\uC9C0\uC815",
          phoneM: site.manager_phone || "",
          phoneS: "",
          days: daysFromCreatedAt(site.created_at),
          mp: 0,
          pinned: pinnedMap.get(site.id) ?? false,
          lastDate: toDatePart(timestamp),
          lastTime: toTimePart(timestamp),
          hasDraw: false,
          hasPhoto: false,
          hasPTW: false,
          hasLog: false,
          hasPunch: false,
          images: [],
          drawings: { construction: [], progress: [], completion: [] },
        };
      });
    });
  }, [operationalSites]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const unresolvedIds = Array.from(
      new Set(
        worklogs
          .filter((log) => log.status === "pending" || log.status === "approved")
          .flatMap((log) =>
            (log.drawings || [])
              .map((row) => {
                const item = row as { id?: string; url?: string; img?: string };
                if (!item?.id) return "";
                const legacy = (typeof item.url === "string" && item.url) || (typeof item.img === "string" && item.img) || "";
                if (legacy) return "";
                if (resolvedDrawingUrls[item.id]) return "";
                return item.id;
              })
              .filter(Boolean) as string[],
          ),
      ),
    );

    if (unresolvedIds.length === 0) return;

    const resolve = async () => {
      const entries: Array<[string, string]> = [];
      for (const refId of unresolvedIds) {
        const url = await getObjectUrl(refId);
        if (url) entries.push([refId, url]);
      }

      if (cancelled || entries.length === 0) return;

      setResolvedDrawingUrls((prev) => {
        const next = { ...prev };
        entries.forEach(([id, url]) => {
          if (!next[id]) next[id] = url;
        });
        return next;
      });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [resolvedDrawingUrls, worklogs]);

  // Enrich sites with live worklog data
  const enrichedSites = useMemo(() => {
    return sites.map(site => {
      const siteName = site.name || "";
      const siteKey = siteName.split(" ")[0] || siteName;
      const siteLogs = worklogs.filter(w => {
        const logSiteName = (w.siteName || "").trim();
        if (!logSiteName) return false;
        return logSiteName === siteName || logSiteName.includes(siteKey) || siteName.includes(logSiteName);
      });
      const approvedLogs = siteLogs.filter(w => w.status === "approved");
      const sitePunch = allPunchGroups.filter(g => {
        const groupTitle = (g.title || "").trim();
        if (!groupTitle) return false;
        return groupTitle === siteName || groupTitle.includes(siteKey) || siteName.includes(groupTitle);
      });
      const punchItems = sitePunch.flatMap(g => g.punchItems || []);
      const openPunch = punchItems.filter(i => i.status !== 'done').length;
      const siteDbId = siteLogs[0]?.siteValue || null;
      return {
        ...site,
        siteDbId,
        hasLog: site.hasLog || siteLogs.length > 0,
        hasPhoto: site.hasPhoto || siteLogs.some(l => l.photoCount > 0),
        hasDraw: site.hasDraw || siteLogs.some(l => l.drawingCount > 0),
        hasPunch: site.hasPunch || sitePunch.length > 0,
        mp: openPunch || site.mp,
        liveLogs: siteLogs,
        approvedLogs,
        sitePunchGroups: sitePunch,
      };
    });
  }, [sites, worklogs, allPunchGroups]);

  const siteSearchOptions = useMemo<SiteComboboxOption[]>(() => {
    return [...enrichedSites]
      .sort((left, right) => {
        const leftKey = `${left.lastDate || ""} ${left.lastTime || ""}`;
        const rightKey = `${right.lastDate || ""} ${right.lastTime || ""}`;
        return rightKey.localeCompare(leftKey) || left.name.localeCompare(right.name, "ko");
      })
      .map((site) => ({
        value: site.name,
        label: site.name,
        description: site.addr || undefined,
        keywords: [site.addr, site.manager, site.safety].filter(Boolean),
      }));
  }, [enrichedSites]);

  const filtered = enrichedSites
    .filter(s => filter === "all" || s.status === filter)
    .filter(s => !search || s.name === search)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === "name") return a.name.localeCompare(b.name, "ko");
      return b.id - a.id;
    });

  const refreshDrawingSheet = useCallback(() => {
    setDrawingReloadToken((prev) => prev + 1);
  }, []);

  const buildSiteDrawingAssets = useCallback((site: SiteData): SiteDrawingAsset[] => {
    const now = new Date().toISOString();
    const siteLookupKey = site.siteDbId || site.name;
    const siteName = site.name || "";
    const siteKey = siteName.split(" ")[0] || siteName;
    const buckets = getSiteDrawingBuckets(siteLookupKey, site.name);

    const toAsset = (
      entry: SiteDrawingBucketEntry,
      kind: SiteDrawingKind,
      source: SiteDrawingSource,
      index: number,
      fallbackName: string,
    ): SiteDrawingAsset => ({
      id: `${kind}_${entry.id || `${site.id}_${index}`}`,
      name: entry.name || fallbackName,
      url: entry.img,
      kind,
      source,
      createdAt: entry.timestamp || now,
    });

    const matchesSiteLog = (log: { siteValue?: string; siteName?: string }) => {
      if (site.siteDbId && log.siteValue === site.siteDbId) return true;
      const logSiteName = (log.siteName || "").trim();
      if (!logSiteName) return false;
      return logSiteName === siteName || logSiteName.includes(siteKey) || siteName.includes(logSiteName);
    };

    const mapWorklogDrawingAssets = (
      status: "pending" | "approved",
      kind: SiteDrawingKind,
      source: SiteDrawingSource,
      labelPrefix: string,
    ) =>
      worklogs
        .filter((log) => log.status === status && matchesSiteLog(log))
        .flatMap((log) =>
          (log.drawings || [])
            .map((item, index) => {
              const row = item as { id?: string; url?: string; img?: string; timestamp?: string; name?: string };
              const legacy = (typeof row.url === "string" && row.url) || (typeof row.img === "string" && row.img) || "";
              const url = legacy || (row.id ? resolvedDrawingUrls[row.id] : "");
              if (!url) return null;
              const createdAt = typeof row.timestamp === "string" ? row.timestamp : log.createdAt || now;
              const fallbackName = `${log.workDate || createdAt.slice(0, 10)} ${labelPrefix} ${index + 1}`;
              return {
                id: `${kind}_${log.id}_${row.id || index}`,
                name: row.name?.trim() || fallbackName,
                url,
                kind,
                source,
                createdAt,
              } as SiteDrawingAsset;
            })
            .filter(Boolean) as SiteDrawingAsset[],
        );

    const construction =
      buckets.construction.length > 0
        ? buckets.construction.map((entry, index) => toAsset(entry, "original", "linked", index, `공사도면 ${index + 1}`))
        : (site.drawings?.construction || []).map((row: any, index: number) => ({
            id: `original_fallback_${site.id}_${index}`,
            name: row?.name || `공사도면 ${index + 1}`,
            url: buildDrawingPlaceholder(row?.name || `공사도면 ${index + 1}`),
            kind: "original" as const,
            source: "linked" as const,
            createdAt: now,
          }));

    const progressFromWorklogs = mapWorklogDrawingAssets("pending", "marked", "linked", "진행도면");
    const progressFromBuckets = buckets.progress.map((entry, index) => toAsset(entry, "marked", "linked", index, `진행도면 ${index + 1}`));
    const mergedProgress = [...progressFromBuckets, ...progressFromWorklogs].filter(
      (asset, index, array) => array.findIndex((row) => row.url === asset.url) === index,
    );
    const progress =
      mergedProgress.length > 0
        ? mergedProgress
        : (site.drawings?.progress || []).map((row: any, index: number) => ({
            id: `marked_fallback_${site.id}_${index}`,
            name: row?.name || `진행도면 ${index + 1}`,
            url: buildDrawingPlaceholder(row?.name || `진행도면 ${index + 1}`),
            kind: "marked" as const,
            source: "linked" as const,
            createdAt: now,
          }));

    const completionFromWorklogs = mapWorklogDrawingAssets("approved", "final", "approved", "완료도면");
    const completionFromBuckets = buckets.completion.map((entry, index) =>
      toAsset(entry, "final", "approved", index, `완료도면 ${index + 1}`),
    );
    const mergedCompletion = [...completionFromBuckets, ...completionFromWorklogs].filter(
      (asset, index, array) => array.findIndex((row) => row.url === asset.url) === index,
    );
    const completion =
      mergedCompletion.length > 0
        ? mergedCompletion
        : (site.drawings?.completion || []).map((row: any, index: number) => ({
            id: `final_fallback_${site.id}_${index}`,
            name: row?.name || `완료도면 ${index + 1}`,
            url: buildDrawingPlaceholder(row?.name || `완료도면 ${index + 1}`),
            kind: "final" as const,
            source: "approved" as const,
            createdAt: now,
          }));

    const merged = [...construction, ...progress, ...completion];
    const seen = new Set<string>();
    return merged.filter((asset) => {
      if (!asset.url) return false;
      const dedupeKey = `${asset.kind}:${asset.url}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
  }, [resolvedDrawingUrls, worklogs]);

  const displayed = filtered.slice(0, visibleCount);
  const sheetSite = useMemo(() => (sheetSiteId ? enrichedSites.find((s) => s.id === sheetSiteId) || null : null), [enrichedSites, sheetSiteId]);
  const sheetDrawings = useMemo(
    () => (sheetSite ? buildSiteDrawingAssets(sheetSite) : []),
    [sheetSite, buildSiteDrawingAssets, drawingReloadToken],
  );
  const originalDrawings = useMemo(() => sheetDrawings.filter((d) => d.kind === "original"), [sheetDrawings]);
  const markedDrawings = useMemo(() => sheetDrawings.filter((d) => d.kind === "marked"), [sheetDrawings]);
  const finalDrawings = useMemo(() => sheetDrawings.filter((d) => d.kind === "final"), [sheetDrawings]);
  const selectedDrawingAssets = useMemo(
    () => sheetDrawings.filter((asset) => selectedDrawingIds.has(asset.id)),
    [sheetDrawings, selectedDrawingIds],
  );
  const buildSitePhotoAssets = useCallback((site: SiteData): SitePhotoAsset[] => {
    const linked = site.siteDbId ? getPhotosForSite(site.siteDbId) : [];
    const linkedAssets = linked
      .filter((row) => !!row?.url)
      .map((row, idx) => ({
        id: `photo_${row.timestamp || Date.now()}_${idx}_${row.id}`,
        name: `사진 ${idx + 1}`,
        url: row.url,
        createdAt: row.timestamp || new Date().toISOString(),
      }));

    if (linkedAssets.length > 0) return linkedAssets;

    return (site.images || []).map((img, idx) => ({
      id: `photo_fallback_${site.id}_${idx}`,
      name: img || `사진 ${idx + 1}`,
      url: buildPhotoPlaceholder(img || `사진 ${idx + 1}`),
      createdAt: new Date().toISOString(),
    }));
  }, []);
  const photoSheetSite = useMemo(
    () => (photoSheetSiteId ? enrichedSites.find((s) => s.id === photoSheetSiteId) || null : null),
    [enrichedSites, photoSheetSiteId],
  );
  const photoSheetAssets = useMemo(
    () => (photoSheetSite ? buildSitePhotoAssets(photoSheetSite) : []),
    [photoSheetSite, buildSitePhotoAssets],
  );
  const selectedPhotoAssets = useMemo(
    () => photoSheetAssets.filter((asset) => selectedPhotoIds.has(asset.id)),
    [photoSheetAssets, selectedPhotoIds],
  );

  useEffect(() => {
    if (!sheetOpen) {
      setDrawingSelectMode(false);
      setSelectedDrawingIds(new Set());
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (!photoSheetOpen) {
      setPhotoSelectMode(false);
      setSelectedPhotoIds(new Set());
    }
  }, [photoSheetOpen]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePin = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSites(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
    toast.success(sites.find(s => s.id === id)?.pinned ? "상단 고정을 해제했습니다." : "상단에 고정했습니다.");
  };

  const handlePhone = (num: string) => {
    if (!num || num.length < 5) { toast.error("전화번호가 없습니다."); return; }
    window.location.href = `tel:${num.replace(/[^0-9+]/g, "")}`;
  };

  const handleLoadMore = () => {
    if (visibleCount >= filtered.length) {
      setVisibleCount(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setVisibleCount(v => v + 5);
    }
  };

  // Viewer handlers
  const openDrawSheet = (siteId: number) => {
    setSheetSiteId(siteId);
    setDrawingSelectMode(false);
    setSelectedDrawingIds(new Set());
    setSheetOpen(true);
  };

  const openPhotoSheet = useCallback((siteId: number) => {
    setPhotoSheetSiteId(siteId);
    setPhotoSelectMode(false);
    setSelectedPhotoIds(new Set());
    setPhotoSheetOpen(true);
  }, []);

  const toggleDrawingSelect = useCallback((id: string) => {
    setSelectedDrawingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const togglePhotoSelect = useCallback((id: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllPhotos = useCallback(() => {
    const ids = photoSheetAssets.map((row) => row.id);
    if (ids.length === 0) return;
    setSelectedPhotoIds((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }, [photoSheetAssets]);

  const prepareFiles = useCallback(async (assets: Array<{ name: string; url: string }>) => {
    const files: File[] = [];
    let skipped = 0;

    for (let idx = 0; idx < assets.length; idx += 1) {
      const asset = assets[idx];
      const blob = await blobFromUrl(asset.url);
      if (!blob) {
        skipped += 1;
        continue;
      }

      const safeName = sanitizeFileName(asset.name, `asset_${idx + 1}`);
      const hasExt = /\.[a-z0-9]{2,5}$/i.test(safeName);
      const ext = extFromMime(blob.type);
      const fileName = hasExt ? safeName : `${safeName}.${ext || "bin"}`;
      files.push(new File([blob], fileName, { type: blob.type || "application/octet-stream" }));
    }

    return { files, skipped };
  }, []);

  const downloadPreparedFiles = useCallback((files: File[]) => {
    files.forEach((file, idx) => {
      window.setTimeout(() => downloadBlobAsFile(file, file.name), idx * 140);
    });
  }, []);

  const sharePreparedFiles = useCallback(async (files: File[], title: string) => {
    if (files.length === 0) return false;
    const shareApi = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data?: ShareData) => boolean;
    };

    if (shareApi.share && shareApi.canShare?.({ files })) {
      try {
        await shareApi.share({ title, files });
        return true;
      } catch (error: any) {
        if (error?.name === "AbortError") return false;
        toast.error("공유에 실패했습니다. 다운로드로 전환합니다.");
        downloadPreparedFiles(files);
        return false;
      }
    }

    toast("공유를 지원하지 않는 환경입니다. 다운로드로 전환합니다.");
    downloadPreparedFiles(files);
    return false;
  }, [downloadPreparedFiles]);
  const handleSaveSelectedDrawings = useCallback(async () => {
    if (selectedDrawingAssets.length === 0) return;
    const { files, skipped } = await prepareFiles(selectedDrawingAssets);
    if (files.length === 0) {
      toast.error("저장할 도면이 없습니다.");
      return;
    }
    downloadPreparedFiles(files);
    toast.success(`${files.length}개 저장 완료`);
    if (skipped > 0) toast.error(`${skipped}개 건너뜀`);
  }, [downloadPreparedFiles, prepareFiles, selectedDrawingAssets]);

  const handleShareSelectedDrawings = useCallback(async () => {
    if (selectedDrawingAssets.length === 0) return;
    const { files, skipped } = await prepareFiles(selectedDrawingAssets);
    if (files.length === 0) {
      toast.error("공유할 도면이 없습니다.");
      return;
    }
    const shared = await sharePreparedFiles(files, `${sheetSite?.name || "현장"} 도면`);
    toast.success(shared ? `${files.length}개 공유 준비 완료` : `${files.length}개 저장 완료`);
    if (skipped > 0) toast.error(`${skipped}개 건너뜀`);
  }, [prepareFiles, selectedDrawingAssets, sharePreparedFiles, sheetSite?.name]);

  const handleSaveSelectedPhotos = useCallback(async () => {
    if (selectedPhotoAssets.length === 0) return;
    const { files, skipped } = await prepareFiles(selectedPhotoAssets);
    if (files.length === 0) {
      toast.error("저장할 사진이 없습니다.");
      return;
    }
    downloadPreparedFiles(files);
    toast.success(`${files.length}개 저장 완료`);
    if (skipped > 0) toast.error(`${skipped}개 건너뜀`);
  }, [downloadPreparedFiles, prepareFiles, selectedPhotoAssets]);

  const handleShareSelectedPhotos = useCallback(async () => {
    if (selectedPhotoAssets.length === 0) return;
    const { files, skipped } = await prepareFiles(selectedPhotoAssets);
    if (files.length === 0) {
      toast.error("공유할 사진이 없습니다.");
      return;
    }
    const shared = await sharePreparedFiles(files, `${photoSheetSite?.name || "현장"} 사진`);
    toast.success(shared ? `${files.length}개 공유 준비 완료` : `${files.length}개 저장 완료`);
    if (skipped > 0) toast.error(`${skipped}개 건너뜀`);
  }, [photoSheetSite?.name, prepareFiles, selectedPhotoAssets, sharePreparedFiles]);
  const openA3Preview = (title: string) => {
    setViewerTitle(title);
    setViewerContent(
      <img
        src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='850' height='600'%3E%3Crect width='850' height='600' fill='%23fff'/%3E%3Crect x='12' y='12' width='826' height='576' fill='none' stroke='%231a254f' stroke-width='6'/%3E%3Ctext x='425' y='300' font-family='sans-serif' font-size='34' text-anchor='middle'%3EA3 Sample Drawing%3C/text%3E%3C/svg%3E"
        style={{ width: 850, height: "auto", display: "block" }}
        alt="도면 미리보기"
      />
    );
    setViewerOpen(true);
    setSheetOpen(false);
  };

  const openDrawingAssetPreview = useCallback((asset: SiteDrawingAsset) => {
    if (!sheetSite) return;
    const kindLabel = asset.kind === "original" ? "원본 도면(연결)" : asset.kind === "final" ? "완료 도면(확정)" : "진행 도면";
    setViewerTitle(`${sheetSite.name} · ${kindLabel}`);
    setViewerContent(
      <img
        src={asset.url}
        style={{ width: 850, height: "auto", display: "block" }}
        alt={asset.name || "도면 미리보기"}
      />
    );
    setViewerOpen(true);
    setSheetOpen(false);
  }, [sheetSite]);

  const onDrawingUploadChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.currentTarget.value = "";
    if (!sheetSite || files.length === 0) return;
    if (!canUploadConstruction) {
      toast.error("공사도면 업로드 권한이 없습니다.");
      return;
    }

    try {
      const urls = await Promise.all(files.map((f) => fileToDataUrl(f)));
      const now = new Date().toISOString();
      const saved = saveConstructionDrawingsForSite({
        siteValue: sheetSite.siteDbId || sheetSite.name,
        siteName: sheetSite.name,
        drawings: urls.map((img, idx) => ({
          img,
          name: files[idx]?.name || `공사도면 ${idx + 1}`,
          timestamp: now,
        })),
      });
      if (saved.length === 0) {
        toast.error("저장 가능한 공사도면이 없습니다.");
        return;
      }
      refreshDrawingSheet();
      toast.success(`${saved.length}개 공사도면을 업로드했습니다.`);
    } catch {
      toast.error("도면 업로드 중 오류가 발생했습니다.");
    }
  }, [canUploadConstruction, refreshDrawingSheet, sheetSite]);

  const loadLinkedOriginalDrawings = useCallback(() => {
    if (!sheetSite) return;
    refreshDrawingSheet();
    const linkedCount = buildSiteDrawingAssets(sheetSite).filter((asset) => asset.kind === "original").length;
    if (linkedCount === 0) {
      toast.error("연결된 공사도면이 없습니다.");
      return;
    }
    toast.success(`공사도면 ${linkedCount}개를 불러왔습니다.`);
  }, [buildSiteDrawingAssets, refreshDrawingSheet, sheetSite]);
  const openCumulativeMarkedDrawings = useCallback(() => {
    if (!sheetSite) return;
    if (markedDrawings.length === 0) {
      toast.error("진행 도면이 없습니다.");
      return;
    }
    setViewerTitle(`${sheetSite.name} · 누적 진행도면`);
    setViewerContent(
      <PhotoGrid
        photos={markedDrawings.map((d) => ({ url: d.url, date: d.createdAt.slice(0, 10) }))}
        siteName={sheetSite.name}
      />
    );
    setViewerOpen(true);
    setSheetOpen(false);
  }, [markedDrawings, sheetSite]);

  const openLatestFinalDrawing = useCallback(() => {
    const latest = [...finalDrawings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (!latest) {
      toast.error("완료 도면이 없습니다.");
      return;
    }
    openDrawingAssetPreview(latest);
  }, [finalDrawings, openDrawingAssetPreview]);

  const openPhotoAssetPreview = useCallback((asset: SitePhotoAsset, siteName: string) => {
    setViewerTitle(`${siteName} · 사진 미리보기`);
    setViewerContent(
      <img
        src={asset.url}
        style={{ width: 850, height: "auto", display: "block" }}
        alt={asset.name || "사진 미리보기"}
      />
    );
    setViewerOpen(true);
    setPhotoSheetOpen(false);
  }, []);

  const openPhotoViewer = useCallback((site: SiteData) => {
    const photos = buildSitePhotoAssets(site).map((item) => ({
      url: item.url,
      date: item.createdAt?.slice(0, 10),
    }));
    if (photos.length === 0) {
      toast.error("등록된 사진이 없습니다.");
      return;
    }
    setViewerTitle(`${site.name} · 전체 사진`);
    setViewerContent(<PhotoGrid photos={photos} siteName={site.name} />);
    setViewerOpen(true);
    setPhotoSheetOpen(false);
  }, [buildSitePhotoAssets]);

  const openDocViewer = (site: typeof enrichedSites[0], docType: "ptw" | "workLog" | "punch") => {
    const doc = site[docType];
    if (!doc) {
      toast.error("문서를 찾을 수 없습니다.");
      return;
    }

    const typeLabels = {
      ptw: "PTW",
      workLog: "작업일지",
      punch: "조치 리포트",
    } as const;

    if (docType === "workLog" && site.approvedLogs.length > 0) {
      const log = site.approvedLogs[0];
      setViewerTitle(`${site.name} · 작업일지`);
      setViewerContent(<WorklogDocument entry={log} />);
      setViewerOpen(true);
      return;
    }

    if (docType === "punch" && site.sitePunchGroups && site.sitePunchGroups.length > 0) {
      const punchItems = site.sitePunchGroups.flatMap((g: PunchGroup) => g.punchItems || []);
      const openCount = punchItems.filter((i: any) => i.status !== "done").length;
      const doneCount = punchItems.filter((i: any) => i.status === "done").length;
      setViewerTitle(`${site.name} · 조치 리포트`);
      setViewerContent(
        <A4Page pageNum={1} totalPages={1}>
          <div className="text-center border-b-2 border-[#1a254f] pb-3 mb-4">
            <div className="text-[24px] font-[800] text-[#1a254f]">조치 요약 리포트</div>
            <div className="text-[14px] text-[#666] mt-1">{site.name}</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-sky-50 border border-sky-400 p-3 rounded-lg text-center">
              <div className="text-[20px] font-[900] text-sky-600">{punchItems.length}</div>
              <div className="text-[11px] font-bold text-sky-700">전체</div>
            </div>
            <div className="bg-red-50 border border-red-400 p-3 rounded-lg text-center">
              <div className="text-[20px] font-[900] text-red-600">{openCount}</div>
              <div className="text-[11px] font-bold text-red-700">미조치</div>
            </div>
            <div className="bg-slate-50 border border-slate-400 p-3 rounded-lg text-center">
              <div className="text-[20px] font-[900] text-slate-600">{doneCount}</div>
              <div className="text-[11px] font-bold text-slate-500">완료</div>
            </div>
          </div>
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 p-2 w-10">NO</th>
                <th className="border border-slate-300 p-2 w-20">위치</th>
                <th className="border border-slate-300 p-2">내용</th>
                <th className="border border-slate-300 p-2 w-16">우선순위</th>
                <th className="border border-slate-300 p-2 w-16">상태</th>
              </tr>
            </thead>
            <tbody>
              {punchItems.map((item: any, idx: number) => (
                <tr key={item.id || idx}>
                  <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-slate-300 p-2 text-center">{item.location || "-"}</td>
                  <td className="border border-slate-300 p-2">{item.issue || "-"}</td>
                  <td className="border border-slate-300 p-2 text-center">{item.priority || "-"}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold">
                    {item.status === "done" ? "완료" : item.status === "ing" ? "진행중" : "미조치"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </A4Page>
      );
      setViewerOpen(true);
      return;
    }

    setViewerTitle(`${site.name} · ${typeLabels[docType]}`);
    setViewerContent(
      <A4Page pageNum={1} totalPages={doc.pages || 1}>
        <div className="text-center border-b-2 border-[#1a254f] pb-3 mb-4">
          <div className="text-[24px] font-[800] text-[#1a254f]">{typeLabels[docType]}</div>
          <div className="text-[14px] text-[#666] mt-1">{site.name}</div>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-2 text-[14px] mb-6">
          <div className="font-bold text-[#1a254f]">문서번호</div>
          <div className="border-b border-[#ddd] py-1">DOC-2025-0001</div>
          <div className="font-bold text-[#1a254f]">상태</div>
          <div className="border-b border-[#ddd] py-1">{doc.status}</div>
          <div className="font-bold text-[#1a254f]">현장</div>
          <div className="border-b border-[#ddd] py-1">{site.name}</div>
        </div>
        <div className="flex-1 p-4 bg-[#f8fafc] rounded-lg flex items-center justify-center" style={{ minHeight: "100mm" }}>
          <span className="text-[#666]">문서 미리보기</span>
        </div>
      </A4Page>
    );
    setViewerOpen(true);
  };
  const checkData = (site: typeof enrichedSites[0], type: string) => {
    if (type === "images") { openPhotoViewer(site); return; }
    if (type === "ptw" || type === "workLog" || type === "punch") {
      openDocViewer(site, type as "ptw" | "workLog" | "punch");
      return;
    }
    toast.error("연결된 데이터가 없습니다.");
  };

  return (
    <div className="animate-fade-in">
      {/* Search + Sort */}
      <div className="flex gap-2 mb-3 mt-3">
        <SiteCombobox
          options={siteSearchOptions}
          value={search}
          onChange={(option) => setSearch(option?.label || "")}
          containerClassName="flex-1"
          inputClassName="text-base-app"
        />

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortType)}
          className="w-[95px] h-[50px] rounded-xl px-3 text-sm-app font-semibold bg-card border border-border text-foreground appearance-none cursor-pointer outline-none transition-all hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: "36px",
          }}
        >
          <option value="latest">최신순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* Status Filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setVisibleCount(5); }}
            className={cn(
              "h-10 px-3.5 rounded-full text-sm-app font-medium whitespace-nowrap flex-shrink-0 border transition-all cursor-pointer flex items-center justify-center",
              filter === f.key
                ? f.key === "all" ? "bg-primary text-white border-primary font-bold shadow-sm"
                : f.key === "ing" ? "bg-blue-500 text-white border-blue-500 font-bold shadow-sm"
                : f.key === "wait" ? "bg-indigo-500 text-white border-indigo-500 font-bold shadow-sm"
                : "bg-muted-foreground text-white border-muted-foreground font-bold shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-5">
            <Search className="w-8 h-8 text-muted-foreground opacity-60" />
          </div>
          <p className="text-base-app font-medium text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      )}

      {/* Site Cards */}
      <div className="space-y-4">
        {displayed.map(site => {
          const expanded = expandedIds.has(site.id);
          const statusConf = STATUS_CONFIG[site.status];
          const hasAddr = !!site.addr?.trim();
          const hasDraw = buildSiteDrawingAssets(site).length > 0 || canUploadConstruction;
          const hasPhoto = site.hasPhoto;
          const hasPTW = !!site.ptw;
          const hasLog = site.hasLog;
          const hasPunch = !!site.punch;

          return (
            <div
              key={site.id}
              className={cn(
                "bg-card rounded-2xl border border-border shadow-soft overflow-hidden transition-all hover:border-primary/40 hover:shadow-[0_0_0_1px_rgba(49,163,250,0.12)]",
                site.pinned && "border-2 border-primary shadow-[0_4px_12px_rgba(49,163,250,0.2)]"
              )}
            >
              {/* Card Header */}
              <div className="p-5 max-[640px]:p-4 border-b border-border relative">
                <span className={cn("absolute top-0 right-0 text-[11px] font-bold px-2.5 py-1 rounded-bl-xl z-10", statusConf.className)}>
                  {statusConf.label}
                </span>

                {site.lastDate && (
                  <div className="text-sm-app text-text-sub font-medium mb-1 max-[640px]:mb-0.5">
                    {site.lastDate} {site.lastTime ? `(최종 ${site.lastTime})` : ""}
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[20px] max-[640px]:text-[18px] font-[800] text-header-navy flex-1 leading-snug" style={{ wordBreak: "keep-all" }}>{site.name}</h3>
                  <button onClick={e => togglePin(site.id, e)} className="bg-transparent border-none p-1 cursor-pointer ml-2">
                    {site.pinned ? <PinOff className="w-[22px] h-[22px] text-primary" /> : <Pin className="w-[22px] h-[22px] text-border" />}
                  </button>
                </div>

                {/* Sub info */}
                <div className="flex items-center justify-between mb-3 max-[640px]:mb-2">
                  <div className="flex gap-2 max-[640px]:gap-1.5 items-center flex-wrap min-w-0">
                    {/* only show contractor/company tag when not a direct-registration entry */}
                    {site.affil !== "direct" && (
                      <span className="text-[14px] max-[640px]:text-[13px] px-3 max-[640px]:px-2.5 h-[34px] max-[640px]:h-[30px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-500 font-semibold flex items-center">시공사</span>
                    )}
                    <span className={cn(
                      "text-[14px] max-[640px]:text-[13px] px-3 max-[640px]:px-2.5 h-[34px] max-[640px]:h-[30px] rounded-lg border font-semibold flex items-center",
                      site.affil === "direct"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-sky-50 text-sky-600 border-sky-200"
                    )}>{toKoreanAffiliation(site.affil)}</span>
                  </div>
                  <div className="flex gap-1.5 max-[640px]:gap-1 items-center pl-2 border-l border-border ml-1">
                    <MapIcon className={cn("w-4 h-4 max-[640px]:w-[15px] max-[640px]:h-[15px] transition-colors", hasDraw ? "text-header-navy" : "text-border")} />
                    <Camera className={cn("w-4 h-4 max-[640px]:w-[15px] max-[640px]:h-[15px] transition-colors", hasPhoto ? "text-header-navy" : "text-border")} />
                    <FileCheck2 className={cn("w-4 h-4 max-[640px]:w-[15px] max-[640px]:h-[15px] transition-colors", hasPTW ? "text-header-navy" : "text-border")} />
                    <ClipboardList className={cn("w-4 h-4 max-[640px]:w-[15px] max-[640px]:h-[15px] transition-colors", hasLog ? "text-header-navy" : "text-border")} />
                    <CheckCircle2 className={cn("w-4 h-4 max-[640px]:w-[15px] max-[640px]:h-[15px] transition-colors", hasPunch ? "text-header-navy" : "text-border")} />
                  </div>
                </div>
                {/* Address */}
                <div className="flex items-center justify-between pt-1">
                  <div
                    className="flex items-center gap-1.5 flex-1 overflow-hidden cursor-pointer"
                    onClick={() => openAddressInMaps(site.addr, { label: "현장 주소" })}
                  >
                    <MapPin className="w-4 h-4 text-text-sub flex-shrink-0" />
                    <span className={cn("text-base-app font-bold truncate", hasAddr ? "text-text-sub" : "text-muted-foreground")}>
                      {hasAddr ? site.addr : "주소 없음"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      disabled={!hasAddr}
                      className={cn(
                        "w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center transition-all active:scale-95",
                        hasAddr
                          ? "bg-muted border border-border text-text-sub"
                          : "border border-dashed border-muted-foreground/40 text-muted-foreground bg-transparent opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => copyText(site.addr, "현장 주소")}
                    >
                      <Copy className="w-[16px] h-[16px]" />
                    </button>
                    <button
                      disabled={!hasAddr}
                      className={cn(
                        "w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center transition-all active:scale-95",
                        hasAddr
                          ? "bg-[hsl(219_100%_95%)] border border-[hsl(219_100%_90%)] text-[hsl(230_60%_30%)]"
                          : "border border-dashed border-muted-foreground/40 text-muted-foreground bg-transparent opacity-60 cursor-not-allowed"
                      )}
                      onClick={() => openAddressInMaps(site.addr, { label: "현장 주소" })}
                    >
                      <MapPin className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expanded && (
                <div className="p-5 max-[640px]:p-4 animate-slide-down bg-card">
                  {/* Manager + Safety */}
                  {[
                    { label: "현장소장", value: site.manager, phone: site.phoneM },
                    { label: "안전담당", value: site.safety, phone: site.phoneS },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-3 max-[640px]:py-2.5 border-b border-dashed border-border">
                      <span className="text-base-app text-text-sub font-bold w-20">{row.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-right text-base-app font-semibold text-foreground truncate pr-3">{row.value || "미입력"}</span>
                        <button
                          className={cn(
                            "w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all active:scale-95",
                            row.phone ? "bg-[hsl(219_100%_95%)] border border-[hsl(219_100%_90%)] text-[hsl(230_60%_30%)]" : "border border-dashed border-border bg-transparent text-muted-foreground"
                          )}
                          onClick={() => handlePhone(row.phone)}
                        >
                          <Phone className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Lodge */}
                  <LodgeRow site={site} isOnline={isOnline} />

                  {/* Stats */}
                  <div className="flex py-3 max-[640px]:py-2.5">
                    <div className="flex-1 text-center relative">
                      <span className="block text-base-app text-text-sub font-bold mb-2">작업일수</span>
                      <span className="text-lg-app font-[800] text-header-navy">{site.days}일</span>
                      <div className="absolute right-0 top-[10%] h-[80%] w-px bg-border" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="block text-base-app text-text-sub font-bold mb-2">미조치</span>
                      <span className={cn("text-[20px] font-[800]", site.mp > 0 ? "text-destructive" : "text-header-navy")}>{site.mp}건</span>
                    </div>
                  </div>
                  {/* Action Grid */}
                  <div className="grid grid-cols-5 gap-1.5 max-[640px]:gap-1 mt-0">
                    {[
                      { icon: Ruler, label: "도면", active: hasDraw, color: "bg-primary-bg text-primary border-sky-200", onClick: () => hasDraw ? openDrawSheet(site.id) : toast.error("등록된 도면이 없습니다.") },
                      { icon: Camera, label: "사진", active: hasPhoto, color: "bg-indigo-50 text-indigo-500 border-indigo-200", onClick: () => checkData(site, "images") },
                      { icon: FileCheck2, label: "PTW", active: hasPTW, color: "bg-blue-50 text-blue-600 border-blue-200", onClick: () => checkData(site, "ptw") },
                      { icon: ClipboardList, label: "일지", active: hasLog, color: "bg-emerald-50 text-emerald-700 border-emerald-200", onClick: () => checkData(site, "workLog") },
                      { icon: CheckCircle2, label: "조치", active: hasPunch, color: "bg-red-50 text-red-600 border-red-200", onClick: () => checkData(site, "punch") },
                    ].map(({ icon: Icon, label, active, color, onClick }) => (
                      <button
                        key={label}
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 max-[640px]:gap-1 h-[74px] max-[640px]:h-[64px] rounded-xl border cursor-pointer transition-all active:scale-95",
                          active ? color : "bg-muted border-border text-border opacity-60 cursor-not-allowed"
                        )}
                        onClick={onClick}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-[14px] font-bold tracking-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Toggle */}
              <button
                onClick={() => toggleExpand(site.id)}
                className={cn(
                  "w-full h-12 flex items-center justify-center gap-1.5 text-text-sub text-[14px] font-semibold cursor-pointer bg-transparent border-none transition-colors",
                  expanded && "bg-background border-t border-border"
                )}
              >
                {!expanded && <span>상세보기</span>}
                {expanded ? <ChevronUp className="w-[18px] h-[18px]" /> : <ChevronDown className="w-[18px] h-[18px]" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {filtered.length > 5 && (
        <button
          onClick={handleLoadMore}
          className="w-full h-[50px] bg-card border border-border rounded-full text-text-sub font-semibold text-sm-app cursor-pointer mt-3 flex items-center justify-center gap-1.5 transition-all hover:bg-muted"
        >
          <span>{visibleCount >= filtered.length ? "접기" : "더보기"}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", visibleCount >= filtered.length && "rotate-180")} />
        </button>
      )}

            {/* Drawing Bottom Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 bg-black/50 z-[2000]" onClick={() => setSheetOpen(false)}>
          <div
            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-6 z-[2100] max-w-[600px] mx-auto animate-[slideDown_0.3s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative mb-5">
              <div className="text-center text-lg font-bold text-foreground">도면함</div>
              <button type="button" onClick={() => setSheetOpen(false)} className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg border border-border text-muted-foreground">
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-3 gap-1.5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-center text-[11px] font-bold text-blue-700">
                공사 {originalDrawings.length}
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-center text-[11px] font-bold text-indigo-700">
                진행 {markedDrawings.length}
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-[11px] font-bold text-emerald-700">
                완료 {finalDrawings.length}
              </div>
            </div>

            {canUploadConstruction ? (
              <>
                <input ref={drawingInputRef} type="file" multiple accept="image/*" className="hidden" onChange={onDrawingUploadChange} />
                <button
                  type="button"
                  onClick={() => drawingInputRef.current?.click()}
                  className="mb-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/10 text-[14px] font-bold text-primary hover:bg-primary/15"
                >
                  <Upload className="h-4 w-4" /> 공사도면 업로드
                </button>
              </>
            ) : (
              <div className="mb-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-center text-[12px] font-semibold text-text-sub">
                업로드는 파트너사/본사 관리자만 가능합니다.
              </div>
            )}

            <button
              type="button"
              onClick={loadLinkedOriginalDrawings}
              className="mb-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-input text-[14px] font-bold text-foreground hover:bg-accent"
            >
              <MapIcon className="h-4 w-4" /> 연결 도면 불러오기
            </button>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={openCumulativeMarkedDrawings}
                className="h-[40px] rounded-lg border border-sky-200 bg-sky-50 text-[12px] font-bold text-sky-700 hover:bg-sky-100"
              >
                진행도면 보기
              </button>
              <button
                type="button"
                onClick={openLatestFinalDrawing}
                className="h-[40px] rounded-lg border border-emerald-200 bg-emerald-50 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
              >
                완료도면 보기
              </button>
            </div>

            <div className="max-h-[54vh] overflow-y-auto">
              {sheetDrawings.length === 0 ? (
                <div className="rounded-xl border border-border bg-bg-input px-4 py-10 text-center text-sm text-muted-foreground">
                  도면이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {sheetDrawings
                    .slice()
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((asset) => {
                      const selected = selectedDrawingIds.has(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={drawingSelectMode ? () => toggleDrawingSelect(asset.id) : undefined}
                          className={cn(
                            "rounded-xl border border-border bg-bg-input p-2.5",
                            drawingSelectMode && selected && "border-primary/50 bg-primary/10",
                            drawingSelectMode && "cursor-pointer",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-bold",
                                asset.kind === "original"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : asset.kind === "final"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200",
                              )}
                            >
                              {asset.kind === "original" ? "원본" : asset.kind === "final" ? "완료" : "진행"}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-semibold text-foreground">{asset.name}</div>
                              <div className="text-[11px] text-muted-foreground">{asset.createdAt.slice(0, 10)}</div>
                            </div>

                            {drawingSelectMode ? null : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openDrawingAssetPreview(asset)}
                                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-bold text-text-sub hover:bg-muted"
                                >
                                  <Eye className="h-3.5 w-3.5" /> 보기
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {drawingSelectMode && selectedDrawingIds.size > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-2">
                <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text-sub">{selectedDrawingIds.size}개 선택</div>
                <button
                  type="button"
                  onClick={handleSaveSelectedDrawings}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm-app font-semibold text-text-sub hover:border-primary/50"
                >
                  <Download className="h-4 w-4" /> 저장
                </button>
                <button
                  type="button"
                  onClick={handleShareSelectedDrawings}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-primary/40 bg-primary-bg px-3 text-sm-app font-bold text-primary"
                >
                  <Share2 className="h-4 w-4" /> 공유
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer */}
      <DocumentViewer open={viewerOpen} onClose={() => setViewerOpen(false)} title={viewerTitle}>
        {viewerContent}
      </DocumentViewer>
    </div>
  );
}

function LodgeRow({ site, isOnline }: { site: SiteData; isOnline: boolean }) {
  const { role } = useUserRole();
  const { lodge, canView, canEdit, isSaving, saveLodge } = useSiteLodging(site.siteDbId);
  const canFallbackRender = !site.siteDbId;
  if (!canView && !canFallbackRender) return null;

  const [localLodge, setLocalLodge] = useState(site.lodge || "");
  useEffect(() => {
    setLocalLodge((lodge || site.lodge || "").trim());
  }, [lodge, site.id, site.lodge]);

  const canPersistEdit = canEdit && !!site.siteDbId;
  const canEditInUi = canPersistEdit || canFallbackRender;
  const canViewLodge = canViewLodgingAddress(role);
  const lodgeValue = (localLodge || "").trim();
  const hasLodge = canViewLodge && !!lodgeValue.trim();
  const displayLodgeValue = canViewLodge ? localLodge : "비공개";

  const commitLodge = async (value: string) => {
    const next = value.trim();
    if (!next) return;
    setLocalLodge(next);
    if (canPersistEdit) {
      await saveLodge(next);
      return;
    }
  };

  const handleManualCommit = async () => {
    if (!canViewLodge) return;
    if (!canEditInUi || (canPersistEdit && isSaving)) return;
    if (!localLodge.trim()) return;
    try {
      await commitLodge(localLodge);
    } catch {
      // hook handles toast
    }
  };

  const handleSearch = async () => {
    if (!canViewLodge) return;
    if (!isOnline) {
      toast.error("주소 검색은 온라인에서만 가능합니다.");
      return;
    }
    if (!canEditInUi || (canPersistEdit && isSaving)) return;
    try {
      const addr = await openDaumPostcode();
      if (!addr) return;
      setLocalLodge(addr);
      try {
        await commitLodge(addr);
        toast.success("숙소 주소를 저장했습니다.");
      } catch {
        // handled in hook
      }
    } catch {
      toast.error("주소 검색에 실패했습니다.");
    }
  };

  return (
    <div className="flex justify-between items-center py-3 max-[640px]:py-2.5 border-b border-dashed border-border">
      <span className="text-base-app text-text-sub font-bold w-16 shrink-0 whitespace-nowrap">숙소</span>
      <div className="flex items-center gap-1.5 max-[640px]:gap-1 flex-1 min-w-0 justify-start">
        <input
          value={displayLodgeValue}
          readOnly={!canEditInUi || !canViewLodge}
          placeholder={isOnline ? "주소를 입력하거나 주소 찾기" : "오프라인"}
          onChange={(e) => setLocalLodge(e.target.value)}
          onBlur={handleManualCommit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleManualCommit();
            }
          }}
          onClick={() => {
            if (!canEditInUi && hasLodge) openAddressInMaps(lodgeValue, { label: "숙소 주소" });
          }}
          className={cn(
            "flex-1 min-w-0 text-base-app font-semibold truncate pr-2 text-left bg-transparent border-none outline-none",
            hasLodge ? "text-foreground" : "text-muted-foreground",
            !canEditInUi && hasLodge && "cursor-pointer",
          )}
        />

        {hasLodge && (
          <button
            className="w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all active:scale-95 bg-muted border border-border text-text-sub"
            onClick={() => copyText(lodgeValue, "숙소 주소")}
          >
            <Copy className="w-[16px] h-[16px]" />
          </button>
        )}

        <button
          disabled={(!isOnline && !hasLodge) || !canEditInUi || (canPersistEdit && isSaving) || !canViewLodge}
            className={cn(
              "w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all active:scale-95",
              hasLodge ? "bg-[hsl(219_100%_95%)] border border-[hsl(219_100%_90%)] text-[hsl(230_60%_30%)]" : "border border-dashed border-primary text-primary bg-transparent",
              ((!isOnline && !hasLodge) || !canEditInUi || (canPersistEdit && isSaving) || !canViewLodge) && "opacity-50 cursor-not-allowed"
            )}
          onClick={() => {
            if (!canViewLodge) return;
            if (hasLodge) {
              openAddressInMaps(lodgeValue, { label: "숙소 주소" });
              return;
            }
            handleSearch();
          }}
        >
          <MapPin className="w-[18px] h-[18px]" />
        </button>

        {canViewLodge && canEditInUi && (
          <button
            type="button"
            disabled={canPersistEdit && isSaving}
            onClick={handleSearch}
            aria-label="숙소 주소 찾기"
            className={cn(
              "w-9 h-9 max-[640px]:w-8 max-[640px]:h-8 rounded-[10px] flex items-center justify-center border",
              (canPersistEdit && isSaving) ? "opacity-50 cursor-not-allowed border-border text-muted-foreground" : "border-border text-text-sub bg-muted"
            )}
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
