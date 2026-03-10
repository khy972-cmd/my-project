import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, X, FileText, MapPin, Trash2, ArrowLeft, Check, Upload, FileUp, Calendar, User, Building, Wrench, Eye, Edit3, ChevronDown, ChevronUp, Download, Share2, Camera, Lock, MapPinIcon, Info
} from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SiteCombobox, { type SiteComboboxOption } from "@/components/site/SiteCombobox";
import PreviewModal from "@/components/preview/PreviewModal";
import FilePreviewModal, { type FilePreviewFile } from "@/components/viewer/FilePreviewModal";
import { usePreviewZoomPan } from "@/hooks/usePreviewZoomPan";
import { useWorklogs } from "@/hooks/useSupabaseWorklogs";
import { getObjectUrl, listAttachmentRefs, revokeObjectUrl, saveFiles, type AttachmentRef } from "@/lib/attachmentStore";
// PATCH START: shared site list + repo facade (no direct localStorage in UI)
import { useSiteList } from "@/hooks/useSiteList";
import {
  createOperationalSiteLookup,
  isOperationalSiteName,
  resolveOperationalSite,
  resolveOperationalSiteName,
  type SiteListItem,
} from "@/lib/siteList";
// PATCH END
import {
  addMyDocEntry,
  deleteMyDocEntries,
  getMyDocObjectUrl,
  loadMyDocsState,
  revokeMyDocObjectUrl,
  saveMyDocsHiddenIds,
} from "@/lib/myDocsStore";
import {
  usePunchGroups, useAddPunchItem, useUpdatePunchItem,
  useDeletePunchItem, useSavePunchGroups,
} from "@/hooks/useSupabasePunch";
import type { PunchGroup, PunchItem, PunchFile } from "@/lib/punchStore";
import { SITE_DRAWINGS_KEY, SITE_PHOTOS_KEY } from "@/constants/storageKeys";
import { getTodayYYYYMMDD } from "@/lib/dateFormat";
import { getLegacyMediaUrl } from "@/lib/legacyMedia";

// Blueprint Management Types
interface BlueprintHistoryItem {
  id: string;
  date: string;
  time: string;
  author: string;
  affiliation: string;
  contractor: string;
  component: string; // 부재명
  process: string; // 작업공정
  files: DocFile[];
  version: number;
}

type BlueprintSiteSource = "system" | "custom";

interface BlueprintSiteData {
  id: string; // storage key (prevents name collisions)
  siteName: string;
  siteSource: BlueprintSiteSource;
  affiliation: string;
  contractor: string;
  totalDrawings: number;
  currentVersion: number;
  lastUpdated: string;
  history: BlueprintHistoryItem[];
}

const blueprintStorage: Record<string, BlueprintSiteData> = {};

const DOC_TABS = ["내문서함", "회사서류", "도면함", "사진함", "조치"];

// Home(작업일지)와 동일한 부재명/작업공정 옵션 (도면 등록에도 동일 기준 적용)
const MEMBER_CHIPS = ["슬라브", "거더", "기둥", "기타"];
const PROCESS_CHIPS = ["철근", "형틀", "마감", "기타"];
type DocFile = {
  id: string;
  name: string;
  type: 'img' | 'file';
  url: string;
  size: string;
  ext: string;
  mime?: string;
  previewUrl?: string;
  docType?: string;
  version?: string;
  drawingState?: string;
  url_before?: string;
  url_after?: string;
  currentView?: string;
};
type Doc = {
  id: string;
  title: string;
  author: string;
  date: string;
  time: string;
  files: DocFile[];
  version?: string;
  contractor?: string;
  affiliation?: string;
  status?: string;
};

function compareDocsByLatest(left: Doc, right: Doc) {
  const leftKey = `${left.date || ""} ${left.time || ""}`;
  const rightKey = `${right.date || ""} ${right.time || ""}`;
  return rightKey.localeCompare(leftKey) || right.id.localeCompare(left.id);
}

type LegacyAttachmentRef = AttachmentRef & { url?: string; img?: string };
type Html2CanvasFn = (
  element: HTMLElement,
  options?: {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string;
    logging?: boolean;
    windowWidth?: number;
    windowHeight?: number;
  },
) => Promise<HTMLCanvasElement>;
type JsPdfInstance = {
  addPage: () => void;
  addImage: (imageData: string, format: string, x: number, y: number, width: number, height: number) => void;
  save: (filename: string) => void;
};
type JsPdfConstructor = new (
  orientation?: "p" | "portrait" | "l" | "landscape",
  unit?: "pt" | "mm" | "cm" | "m" | "in" | "px",
  format?: string | [number, number],
) => JsPdfInstance;
type ReportPdfWindow = Window & typeof globalThis & {
  html2canvas?: Html2CanvasFn;
  jspdf?: { jsPDF?: JsPdfConstructor };
};

function isAbortError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return "name" in error && (error as { name?: string }).name === "AbortError";
}

const STATIC_DOCS: Record<string, Doc[]> = {
  "내문서함": [],
  "회사서류": [],
  "도면함": [],
  "사진함": [],
  "조치": [],
};

const REQUIRED_DOCS = [
  { key: "safetyEdu", label: "기초안전보건교육이수증", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "bankbook", label: "통장사본", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "idCard", label: "신분증", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "medical", label: "배치전검진서", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "carReg", label: "차량등록증", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "carIns", label: "차량보험증", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
  { key: "senior", label: "고령자서류", acceptMime: "application/pdf,image/*", help: "미제출 시 업로드 필요" },
] as const;

type RequiredDocKey = typeof REQUIRED_DOCS[number]["key"];

const formatDateShort = (d: string) => {
  const parts = d.split('-');
  return parts.length === 3 ? `${parts[0].slice(2)}.${parts[1]}.${parts[2]}` : d;
};

// ─── Korean 초성 검색 유틸 (소속 검색용) ───
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'] as const;
const CHOSUNG_SET = new Set<string>(CHOSUNG as unknown as string[]);

function toChosung(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      out += CHOSUNG[idx] ?? ch;
      continue;
    }
    out += ch.toLowerCase();
  }
  return out;
}

function isChosungQuery(q: string): boolean {
  const t = q.replace(/\s+/g, '');
  if (!t) return false;
  for (const ch of t) if (!CHOSUNG_SET.has(ch)) return false;
  return true;
}

function matchKo(option: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (isChosungQuery(q)) {
    return toChosung(option).replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
  }
  return option.toLowerCase().includes(q.toLowerCase());
}

export default function DocPage() {
  const { isPartner } = useUserRole();
  // Partners see the same doc page but with restricted tabs (no company-docs tab)
  return <DocPageInner restrictCompanyDocs={isPartner} />;
}

function DocPageInner({ restrictCompanyDocs }: { restrictCompanyDocs: boolean }) {
  const navigate = useNavigate();
  const { user, isTestMode, testRole } = useAuth();
  const DOC_TABS_FILTERED = restrictCompanyDocs ? ["내문서함", "도면함", "사진함", "조치"] : DOC_TABS;
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(5);
  const [punchFilter, setPunchFilter] = useState<'all' | 'open' | 'done'>('all');
  const [siteFilter, setSiteFilter] = useState('');
  const [mediaSiteFilter, setMediaSiteFilter] = useState("");
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; file?: FilePreviewFile; title?: string }>({ isOpen: false });
  const [requiredDocOverrides, setRequiredDocOverrides] = useState<Partial<Record<RequiredDocKey, DocFile>>>({});
  const [requiredDocHiddenKeys, setRequiredDocHiddenKeys] = useState<Set<RequiredDocKey>>(new Set());
  const [requiredDocPulseKey, setRequiredDocPulseKey] = useState<RequiredDocKey | null>(null);
  const [pendingRequiredDocKey, setPendingRequiredDocKey] = useState<RequiredDocKey | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requiredDocInputRef = useRef<HTMLInputElement>(null);
  const uploadSubmitLockRef = useRef(false);

  // PATCH START: upload sheet site selection (autocomplete + strict selection)
  const today = useMemo(() => getTodayYYYYMMDD(), []);
  const { data: siteList = [] } = useSiteList();
  const [uploadSelectedSite, setUploadSelectedSite] = useState<SiteListItem | null>(null);
  const [uploadDate, setUploadDate] = useState(() => getTodayYYYYMMDD());
  const [uploadSiteError, setUploadSiteError] = useState<string | null>(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const myDocsScope = useMemo(
    () => user?.id || user?.email || (isTestMode ? `test:${testRole}` : "anonymous"),
    [isTestMode, testRole, user?.email, user?.id],
  );
  const currentUserLabel = useMemo(() => {
    const displayName = user?.user_metadata?.name;
    return typeof displayName === "string" && displayName.trim() ? displayName : user?.email || "사용자";
  }, [user?.email, user?.user_metadata?.name]);
  const [customMyDocs, setCustomMyDocs] = useState<Doc[]>([]);
  const [myDocsHiddenIds, setMyDocsHiddenIds] = useState<Set<string>>(new Set());
  const [myDocsHiddenLoaded, setMyDocsHiddenLoaded] = useState(false);
  const [myDocsRefreshTick, setMyDocsRefreshTick] = useState(0);
  const siteLookup = useMemo(() => createOperationalSiteLookup(siteList), [siteList]);

  const siteSelectionOptions = useMemo<SiteComboboxOption[]>(
    () =>
      siteList.map((site) => ({
        value: site.site_name,
        label: site.site_name,
        siteId: site.site_id,
        description: site.dept || undefined,
      })),
    [siteList],
  );
  const uploadIsMyDocs = DOC_TABS_FILTERED[activeTab] === "내문서함";
  const uploadIsMediaArchiveTab = DOC_TABS_FILTERED[activeTab] === "도면함" || DOC_TABS_FILTERED[activeTab] === "사진함";
  const liveSiteNames = siteLookup.liveSiteNames;
  const canSubmitUpload = useMemo(() => {
    if (uploadIsMediaArchiveTab) return false;
    if (uploadIsMyDocs) return selectedFiles.length > 0 && uploadDocName.trim().length > 0 && !!uploadDate;
    return selectedFiles.length > 0 && !!uploadSelectedSite && !!uploadDate;
  }, [uploadIsMediaArchiveTab, selectedFiles.length, uploadDocName, uploadDate, uploadIsMyDocs, uploadSelectedSite]);
  const uploadAccept = useMemo(() => {
    const currentTab = DOC_TABS_FILTERED[activeTab];
    if (currentTab === "사진함") return "image/*";
    if (currentTab === "도면함") return "image/*,.pdf,application/pdf";
    return "image/*,.pdf,.doc,.docx,.hwp,.xls,.xlsx,.ppt,.pptx";
  }, [DOC_TABS_FILTERED, activeTab]);
  // PATCH END

  // Blueprint-specific state
  const [blueprintDetailModal, setBlueprintDetailModal] = useState<{ isOpen: boolean; blueprintKey?: string }>({ isOpen: false });
  const [blueprintSelectedIds, setBlueprintSelectedIds] = useState<Set<string>>(new Set());
  const blueprintCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightBlueprintKey, setHighlightBlueprintKey] = useState<string | null>(null);
  const [blueprintUploadData, setBlueprintUploadData] = useState({
    siteName: '',
    siteIsCustom: false, // prevents collisions with admin/system sites
    affiliation: '',
    contractorPreset: '',
    contractorCustom: '',
    componentPreset: '',
    componentCustom: '',
    processPreset: '',
    processCustom: ''
  });
  const [bpAffOpen, setBpAffOpen] = useState(false);
  const [bpContractorOpen, setBpContractorOpen] = useState(false);

  // Punch detail state
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);

  // PATCH START: report editor overlay state (no localStorage)
  type PunchReportEdits = Record<string, Record<string, Partial<Pick<PunchItem, "location" | "issue">>>>;
  type PunchReportRow = Pick<PunchItem, "id" | "location" | "issue" | "status" | "beforePhoto" | "afterPhoto">;
  type PunchReportModel = {
    groupId: string;
    title: string;
    siteName: string;
    date: string;
    rows: PunchReportRow[];
  };

  const [reportEditorOpen, setReportEditorOpen] = useState(false);
  const [reportModel, setReportModel] = useState<PunchReportModel | null>(null);
  const [reportEdits, setReportEdits] = useState<PunchReportEdits>({});
  const reportContentRef = useRef<HTMLDivElement | null>(null);
  const reportTableBodyRef = useRef<HTMLTableSectionElement | null>(null);
  const reportPhotoInputRef = useRef<HTMLInputElement>(null);
  const [reportPhotoTarget, setReportPhotoTarget] = useState<{ itemId: string; field: "beforePhoto" | "afterPhoto" } | null>(null);
  const reportZoom = usePreviewZoomPan({ open: reportEditorOpen, defaultMinScale: 0.5, defaultMaxScale: 4 });
  const [reportEditorRenderKey, setReportEditorRenderKey] = useState(0);
  const [reportPanMode, setReportPanMode] = useState(false);
  const [reportFitMode, setReportFitMode] = useState<"page" | "width">("width");
  const REPORT_HEADER_PX = 56;
  const REPORT_TOOLBAR_PX = 76;
  // PATCH END

  // Supabase-backed punch data
  const { data: punchGroups = [] } = usePunchGroups();
  const { data: worklogs = [] } = useWorklogs();
  const addItemMutation = useAddPunchItem();
  const updateItemMutation = useUpdatePunchItem();
  const deleteItemMutation = useDeletePunchItem();
  const savePunchGroupsMutation = useSavePunchGroups();
  const linkedRefIdsRef = useRef<string[]>([]);
  const myDocRefIdsRef = useRef<string[]>([]);
  const [linkedMediaDocs, setLinkedMediaDocs] = useState<{ photos: Doc[]; drawings: Doc[] }>({
    photos: [],
    drawings: [],
  });
  const [mediaRefreshTick, setMediaRefreshTick] = useState(0);

  const tabKey = DOC_TABS_FILTERED[activeTab];
  const isPunch = tabKey === '조치';
  const isMyDocs = tabKey === '내문서함';
  const isMediaArchiveTab = tabKey === "도면함" || tabKey === "사진함";
  const isBlueprint = false;

  const bpAffiliationOptions = useMemo(() => {
    const base = ["포스코건설", "GS건설", "현대건설", "대보건설", "기타"];
    const fromBlueprint = Object.values(blueprintStorage).map(s => s.affiliation).filter(Boolean);
    const fromPunch = punchGroups.map(g => g.affiliation).filter(Boolean);
    return Array.from(new Set([...base, ...fromBlueprint, ...fromPunch]));
  }, [punchGroups]);

  const bpContractorOptions = useMemo(() => {
    const base = ["포스코건설", "GS건설", "현대건설", "대보건설", "기타"];
    const fromBlueprint = Object.values(blueprintStorage).map(s => s.contractor).filter(Boolean);
    const fromPunch = punchGroups.map(g => g.contractor).filter(Boolean);
    return Array.from(new Set([...base, ...fromBlueprint, ...fromPunch]));
  }, [punchGroups]);

  // 소속 -> 원청사 추천(기존 데이터 기반)
  const bpAutoContractorByAff = useMemo(() => {
    const counts = new Map<string, Map<string, number>>();
    const add = (affRaw?: string, contractorRaw?: string) => {
      const aff = (affRaw || "").trim();
      const contractor = (contractorRaw || "").trim();
      if (!aff || !contractor) return;
      if (!counts.has(aff)) counts.set(aff, new Map());
      const m = counts.get(aff)!;
      m.set(contractor, (m.get(contractor) || 0) + 1);
    };

    Object.values(blueprintStorage).forEach(s => add(s.affiliation, s.contractor));
    punchGroups.forEach(g => add(g.affiliation, g.contractor));

    const out: Record<string, string> = {};
    for (const [aff, m] of counts.entries()) {
      let best = "";
      let bestCount = -1;
      for (const [contractor, c] of m.entries()) {
        if (c > bestCount) {
          best = contractor;
          bestCount = c;
        }
      }
      if (best) out[aff] = best;
    }
    return out;
  }, [punchGroups]);

  // 소속 변경 시 원청사 자동 표기/입력 제한
  useEffect(() => {
    const aff = (blueprintUploadData.affiliation || "").trim();
    if (!aff) return;

    const autoContractorByAff: Record<string, string> = {
      "직영": "포스코건설",
      "본사": "포스코건설",
    };

    // "기타"는 직접 입력 모드
    if (aff === "기타") {
      setBlueprintUploadData(prev => (
        prev.contractorPreset === "기타"
          ? prev
          : { ...prev, contractorPreset: "기타", contractorCustom: "" }
      ));
      return;
    }

    const auto = autoContractorByAff[aff];
    if (auto) {
      setBlueprintUploadData(prev => (
        prev.contractorPreset === auto
          ? prev
          : { ...prev, contractorPreset: auto, contractorCustom: "" }
      ));
      return;
    }

    // 데이터 기반 자동 추천: 아직 원청사 선택 전이라면 채워줌
    const inferred = bpAutoContractorByAff[aff];
    if (inferred) {
      setBlueprintUploadData(prev => (
        prev.contractorPreset
          ? prev
          : { ...prev, contractorPreset: inferred, contractorCustom: "" }
      ));
    }
  }, [blueprintUploadData.affiliation, bpAutoContractorByAff]);

  // Punch stats from live data
  const punchStats = useMemo(() => {
    const items = punchGroups.flatMap(g => g.punchItems || []);
    return {
      total: items.length,
      open: items.filter(i => i.status !== 'done').length,
      done: items.filter(i => i.status === 'done').length,
    };
  }, [punchGroups]);

  useEffect(() => {
    let cancelled = false;

    const extFromName = (value: string) => String(value || "").split(".").pop()?.toLowerCase() || "";
    const mimeFromExt = (ext: string) => {
      if (ext === "pdf") return "application/pdf";
      if (ext === "png") return "image/png";
      if (ext === "webp") return "image/webp";
      if (ext === "gif") return "image/gif";
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
      return "";
    };
    const toSizeLabel = (size?: number) => {
      const numeric = Number(size);
      if (!Number.isFinite(numeric) || numeric <= 0) return "-";
      return `${(numeric / 1024 / 1024).toFixed(2)}MB`;
    };
    const resolveMime = (row: LegacyAttachmentRef, resolvedUrl: string) => {
      const fromMeta = String(row?.mime || "").toLowerCase().trim();
      if (fromMeta) return fromMeta;
      const fromName = mimeFromExt(extFromName(row?.name || ""));
      if (fromName) return fromName;
      const fromExt = mimeFromExt(extFromName(row?.ext || ""));
      if (fromExt) return fromExt;
      const fromUrl = mimeFromExt(extFromName((resolvedUrl || "").split("?")[0].split("#")[0]));
      if (fromUrl) return fromUrl;
      return "application/octet-stream";
    };
    const collectLookupKeys = (siteValue: string, siteName: string) => {
      const keys = new Set<string>();
      if (siteValue) keys.add(siteValue);
      if (siteName) keys.add(siteName);
      const resolvedSite = resolveOperationalSite(siteValue, siteName, siteLookup);
      if (resolvedSite?.site_id) keys.add(resolvedSite.site_id);
      if (resolvedSite?.site_name) keys.add(resolvedSite.site_name);
      return Array.from(keys).filter(Boolean);
    };
    const readLegacyRows = (storeKey: string, siteKeys: string[], workDate: string) => {
      if (!workDate || siteKeys.length === 0) return [] as LegacyAttachmentRef[];
      try {
        const raw = JSON.parse(localStorage.getItem(storeKey) || "{}") as Record<string, Record<string, unknown[]>>;
        const rows: LegacyAttachmentRef[] = [];
        siteKeys.forEach((key) => {
          const byDate = raw?.[key];
          const list = byDate?.[workDate];
          if (Array.isArray(list)) rows.push(...(list as LegacyAttachmentRef[]));
        });
        return rows;
      } catch {
        return [] as LegacyAttachmentRef[];
      }
    };
    const toLegacyFiles = (rows: LegacyAttachmentRef[], kind: "photo" | "drawing", seed: string) => {
      const files: DocFile[] = [];
      rows.forEach((row, index) => {
        const url = getLegacyMediaUrl(row);
        if (!url) return;
        const mime = resolveMime(row, url);
        const ext = (row.ext || extFromName(row.name || "") || extFromName(url) || "bin").toUpperCase();
        files.push({
          id: row.id || `${seed}_${index}`,
          name: row.name || `${kind === "photo" ? "사진" : "도면"}_${index + 1}.${ext.toLowerCase()}`,
          type: mime.startsWith("image/") ? "img" : "file",
          url,
          size: toSizeLabel(row.size),
          ext,
          mime,
          version: "v1",
          docType: kind,
        });
      });
      return files;
    };
    const mergeFiles = (primary: DocFile[], secondary: DocFile[]) => {
      const merged = [...primary];
      const seen = new Set(primary.map((file) => file.url || file.id));
      secondary.forEach((file) => {
        const key = file.url || file.id;
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(file);
      });
      return merged;
    };

    const toDocFiles = async (refs: LegacyAttachmentRef[], kind: "photo" | "drawing") => {
      const files: DocFile[] = [];
      const usedIds: string[] = [];

      for (let index = 0; index < refs.length; index += 1) {
        const row = refs[index];
        const legacyUrl = getLegacyMediaUrl(row);

        let url = legacyUrl;
        if (!url && row?.id) {
          url = (await getObjectUrl(row.id)) || "";
          if (url) usedIds.push(row.id);
        }

        if (!url) continue;
        const mime = resolveMime(row, url);
        const ext = (row.ext || extFromName(row.name || "") || extFromName(url) || "bin").toUpperCase();
        files.push({
          id: row.id || `${kind}_${index}`,
          name: row.name || `${kind === "photo" ? "사진" : "도면"}_${index + 1}.${ext.toLowerCase()}`,
          type: mime.startsWith("image/") ? "img" : "file",
          url,
          size: toSizeLabel(row.size),
          ext,
          mime,
          version: "v1",
          docType: kind,
        });
      }

      return { files, usedIds };
    };

    async function buildLinkedDocs() {
      const photoDocs: Doc[] = [];
      const drawingDocs: Doc[] = [];
      const allUsedIds: string[] = [];

      for (const log of worklogs) {
        const siteName = resolveOperationalSiteName(log.siteValue || "", log.siteName || "", siteLookup);
        if (!siteName) continue;
        const baseTime = (log.updatedAt || log.createdAt || "").slice(11, 16);
        const lookupKeys = collectLookupKeys(log.siteValue || "", log.siteName || "");

        const photoRows = (log.photos || []) as LegacyAttachmentRef[];
        const { files: worklogPhotoFiles, usedIds: photoUsedIds } =
          photoRows.length > 0 ? await toDocFiles(photoRows, "photo") : { files: [] as DocFile[], usedIds: [] as string[] };
        allUsedIds.push(...photoUsedIds);
        const fallbackPhotoRows = readLegacyRows(SITE_PHOTOS_KEY, lookupKeys, log.workDate || "");
        const fallbackPhotoFiles = toLegacyFiles(fallbackPhotoRows, "photo", `legacy_photo_${log.id}`);
        const mergedPhotoFiles = mergeFiles(worklogPhotoFiles, fallbackPhotoFiles);
        if (mergedPhotoFiles.length > 0) {
          photoDocs.push({
            id: `wl_photo_${log.id}`,
            title: siteName,
            author: "작업일지",
            date: log.workDate || "",
            time: baseTime,
            contractor: log.dept || "",
            affiliation: log.dept || "",
            files: mergedPhotoFiles,
          });
        }

        const drawingRows = (log.drawings || []) as LegacyAttachmentRef[];
        const { files: worklogDrawingFiles, usedIds: drawingUsedIds } =
          drawingRows.length > 0
            ? await toDocFiles(drawingRows, "drawing")
            : { files: [] as DocFile[], usedIds: [] as string[] };
        allUsedIds.push(...drawingUsedIds);
        const fallbackDrawingRows = readLegacyRows(SITE_DRAWINGS_KEY, lookupKeys, log.workDate || "");
        const fallbackDrawingFiles = toLegacyFiles(fallbackDrawingRows, "drawing", `legacy_drawing_${log.id}`);
        const mergedDrawingFiles = mergeFiles(worklogDrawingFiles, fallbackDrawingFiles);
        if (mergedDrawingFiles.length > 0) {
          drawingDocs.push({
            id: `wl_drawing_${log.id}`,
            title: siteName,
            author: "작업일지",
            date: log.workDate || "",
            time: baseTime,
            contractor: log.dept || "",
            affiliation: log.dept || "",
            files: mergedDrawingFiles,
          });
        }
      }

      const indexedMediaRefs = listAttachmentRefs({ source: "doc" }).filter(
        (row) => row.type === "photo" || row.type === "drawing",
      ) as LegacyAttachmentRef[];

      const docMediaMap = new Map<string, Doc>();
      for (const row of indexedMediaRefs) {
        const kind = row.type === "drawing" ? "drawing" : "photo";
        const siteName = resolveOperationalSiteName(String(row.siteValue || ""), String(row.siteName || ""), siteLookup);
        if (!siteName) continue;
        const workDate = row.workDate || String(row.timestamp || "").slice(0, 10) || "";
        const workTime = String(row.timestamp || "").slice(11, 16);
        const key = `${kind}|${siteName}|${workDate}`;
        if (!docMediaMap.has(key)) {
          docMediaMap.set(key, {
            id: `doc_${kind}_${siteName}_${workDate}`.replace(/\s+/g, "_"),
            title: siteName,
            author: "문서함",
            date: workDate,
            time: workTime,
            contractor: "",
            affiliation: "",
            files: [],
          });
        }
        const target = docMediaMap.get(key)!;
        const { files, usedIds } = await toDocFiles([row], kind);
        allUsedIds.push(...usedIds);
        if (files[0]) target.files.push(files[0]);
      }

      [...docMediaMap.values()].forEach((doc) => {
        if (!doc.files || doc.files.length === 0) return;
        const first = doc.files[0];
        if (first?.docType === "drawing") drawingDocs.push(doc);
        else photoDocs.push(doc);
      });

      if (cancelled) return;

      const prevIds = linkedRefIdsRef.current;
      prevIds.forEach((id) => {
        if (!allUsedIds.includes(id)) {
          revokeObjectUrl(id);
        }
      });
      linkedRefIdsRef.current = allUsedIds;

      setLinkedMediaDocs({
        photos: photoDocs.sort(compareDocsByLatest),
        drawings: drawingDocs.sort(compareDocsByLatest),
      });
    }

    buildLinkedDocs();

    return () => {
      cancelled = true;
    };
  }, [mediaRefreshTick, siteLookup, worklogs]);

  useEffect(() => {
    return () => {
      linkedRefIdsRef.current.forEach((id) => revokeObjectUrl(id));
      linkedRefIdsRef.current = [];
      myDocRefIdsRef.current.forEach((id) => revokeMyDocObjectUrl(id));
      myDocRefIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    setMyDocsHiddenLoaded(false);
    const { hiddenIds } = loadMyDocsState(myDocsScope);
    setMyDocsHiddenIds(new Set(hiddenIds));
    setMyDocsHiddenLoaded(true);
  }, [myDocsScope]);

  useEffect(() => {
    if (!myDocsHiddenLoaded) return;
    saveMyDocsHiddenIds(myDocsScope, Array.from(myDocsHiddenIds));
  }, [myDocsHiddenIds, myDocsHiddenLoaded, myDocsScope]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateMyDocs() {
      const { docs } = loadMyDocsState(myDocsScope);
      const nextDocs: Doc[] = [];
      const usedIds: string[] = [];

      for (const doc of docs) {
        const files: DocFile[] = [];
        for (const file of doc.files) {
          const url = await getMyDocObjectUrl(file.refId);
          if (!url) continue;
          usedIds.push(file.refId);
          files.push({
            id: file.id,
            name: file.name,
            type: file.type,
            url,
            size: file.size,
            ext: file.ext,
            mime: file.mime,
            docType: file.docType,
            version: file.version,
          });
        }
        nextDocs.push({
          id: doc.id,
          title: doc.title,
          author: doc.author,
          date: doc.date,
          time: doc.time,
          files,
          version: doc.version,
          contractor: doc.contractor,
          affiliation: doc.affiliation,
          status: doc.status,
        });
      }

      if (cancelled) return;

      const prevIds = myDocRefIdsRef.current;
      prevIds.forEach((id) => {
        if (!usedIds.includes(id)) {
          revokeMyDocObjectUrl(id);
        }
      });
      myDocRefIdsRef.current = usedIds;
      setCustomMyDocs(nextDocs.sort(compareDocsByLatest));
    }

    void hydrateMyDocs();

    return () => {
      cancelled = true;
    };
  }, [myDocsRefreshTick, myDocsScope]);

  const visibleMyDocs = useMemo(() => {
    return [...(STATIC_DOCS["내문서함"] || []), ...customMyDocs]
      .filter((doc) => !myDocsHiddenIds.has(doc.id))
      .sort(compareDocsByLatest);
  }, [customMyDocs, myDocsHiddenIds]);

  const docsByTab = useMemo(() => {
    const base = { ...STATIC_DOCS };
    const photoMerged = [...linkedMediaDocs.photos];
    const drawingMerged = [...linkedMediaDocs.drawings];
    return {
      ...base,
      "내문서함": visibleMyDocs,
      "사진함": photoMerged,
      "도면함": drawingMerged,
    } as Record<string, Doc[]>;
  }, [linkedMediaDocs, visibleMyDocs]);

  const mediaSiteOptions = useMemo<SiteComboboxOption[]>(() => {
    if (!isMediaArchiveTab) return [];
    const rows = docsByTab[tabKey] || [];
    const latestBySite = new Map<string, { value: string; label: string; latestKey: string }>();
    rows.forEach((doc) => {
      const siteName = (doc.title || "").trim();
      if (!isOperationalSiteName(siteName, liveSiteNames)) return;
      if (!siteName) return;
      const latestKey = `${doc.date || ""} ${doc.time || ""}`;
      const prev = latestBySite.get(siteName);
      if (!prev || latestKey > prev.latestKey) {
        latestBySite.set(siteName, { value: siteName, label: siteName, latestKey });
      }
    });
    return [...latestBySite.values()]
      .sort((left, right) => right.latestKey.localeCompare(left.latestKey) || left.label.localeCompare(right.label, "ko"))
      .map(({ latestKey: _latestKey, ...option }) => option);
  }, [docsByTab, isMediaArchiveTab, liveSiteNames, tabKey]);

  // Filtered docs (for non-punch tabs)
  const filteredDocs = useMemo(() => {
    if (isPunch) return [];
    const q = search.toLowerCase();
    return (docsByTab[tabKey] || []).filter(doc => {
      if (isMediaArchiveTab && !isOperationalSiteName(doc.title || "", liveSiteNames)) return false;
      if (isMediaArchiveTab && mediaSiteFilter && doc.title !== mediaSiteFilter) return false;
      const fileNames = (doc.files || []).map((file) => file.name).join(" ");
      const haystack = [
        doc.title,
        doc.author || "",
        doc.contractor || "",
        doc.affiliation || "",
        fileNames,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, tabKey, isPunch, docsByTab, isMediaArchiveTab, liveSiteNames, mediaSiteFilter]);

  // Filtered punch groups
  const filteredPunchGroups = useMemo(() => {
    if (!isPunch) return [];
    const q = search.toLowerCase();
    return punchGroups.filter(g => {
      if (!isOperationalSiteName(g.title || "", liveSiteNames)) return false;
      if (siteFilter && g.title !== siteFilter) return false;
      const matchSearch = g.title.toLowerCase().includes(q) || g.contractor.toLowerCase().includes(q);
      if (punchFilter === 'all') return matchSearch;
      if (punchFilter === 'open') return matchSearch && g.punchItems?.some(i => i.status !== 'done');
      if (punchFilter === 'done') return matchSearch && g.punchItems?.every(i => i.status === 'done');
      return matchSearch;
    });
  }, [isPunch, search, punchFilter, siteFilter, liveSiteNames, punchGroups]);

  const blueprintSitesAll = isBlueprint ? getBlueprintList() : [];
  const filteredBlueprintSites = !isBlueprint
    ? []
    : (() => {
        const q = search.trim().toLowerCase();
        if (!q) return blueprintSitesAll;
        return blueprintSitesAll.filter(s => {
          const hay = [
            s.siteName,
            s.affiliation,
            s.contractor,
            s.history?.[0]?.author,
            s.history?.[0]?.component,
            s.history?.[0]?.process
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
      })();

  const displayedDocs = (!isPunch && !isBlueprint) ? filteredDocs.slice(0, visibleCount) : [];
  const displayedPunchGroups = isPunch ? filteredPunchGroups.slice(0, visibleCount) : [];
  const displayedBlueprintSites = isBlueprint ? filteredBlueprintSites.slice(0, visibleCount) : [];
  const hasMore = isPunch
    ? filteredPunchGroups.length > visibleCount
    : isBlueprint
      ? filteredBlueprintSites.length > visibleCount
      : filteredDocs.length > visibleCount;
  const totalDisplayed = isPunch
    ? filteredPunchGroups.length
    : isBlueprint
      ? filteredBlueprintSites.length
      : filteredDocs.length;

  // Blueprint focus/highlight helper (collision guidance, after upload, etc.)
  useEffect(() => {
    if (!highlightBlueprintKey) return;
    if (!isBlueprint) return;

    const el = blueprintCardRefs.current[highlightBlueprintKey];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    const t = window.setTimeout(() => setHighlightBlueprintKey(null), 1600);
    return () => window.clearTimeout(t);
  }, [highlightBlueprintKey, isBlueprint]);

  // Prevent background scroll when the bottom-sheet is open (mobile usability)
  useEffect(() => {
    if (!uploadSheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [uploadSheetOpen]);

  useEffect(() => {
    if (!uploadSheetOpen) return;
    if (!isMediaArchiveTab) return;
    setUploadSheetOpen(false);
  }, [isMediaArchiveTab, uploadSheetOpen]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const punchSiteOptions = useMemo<SiteComboboxOption[]>(() => {
    const latestBySite = new Map<string, { value: string; label: string; latestKey: string; count: number }>();
    punchGroups.forEach((group) => {
      const siteName = (group.title || "").trim();
      if (!isOperationalSiteName(siteName, liveSiteNames)) return;
      if (!siteName) return;
      const latestKey = `${group.date || ""} ${group.time || ""}`;
      const prev = latestBySite.get(siteName);
      if (!prev) {
        latestBySite.set(siteName, { value: siteName, label: siteName, latestKey, count: 1 });
        return;
      }
      prev.count += 1;
      if (latestKey > prev.latestKey) {
        prev.latestKey = latestKey;
      }
    });
    return [...latestBySite.values()]
      .sort((left, right) => right.latestKey.localeCompare(left.latestKey) || left.label.localeCompare(right.label, "ko"))
      .map(({ latestKey: _latestKey, count, ...option }) => ({
        ...option,
        description: count > 1 ? `조치 ${count}건` : undefined,
      }));
  }, [liveSiteNames, punchGroups]);

  const getPriorityStyle = (p: string) => {
    if (p === '높음') return 'bg-red-50 text-red-600 border-red-300';
    if (p === '중간') return 'bg-amber-50 text-amber-600 border-amber-300';
    return 'bg-emerald-50 text-emerald-600 border-emerald-300';
  };

  const getStatusBadge = (group: PunchGroup) => {
    const hasOpen = group.punchItems?.some(i => i.status !== 'done');
    if (!hasOpen) return { text: '완료', cls: 'bg-slate-500 text-white' };
    // Match "예정" badge tone for "미조치"
    return { text: '미조치', cls: 'bg-indigo-500 text-white' };
  };

  // ─── Detail overlay ───
  const detailGroup = useMemo(() => {
    if (!detailGroupId) return null;
    return punchGroups.find(g => g.id === detailGroupId) || null;
  }, [detailGroupId, punchGroups]);

  const isApproved = detailGroup?.punchItems?.every(i => i.status === 'done') || false;
  const reportGroup = useMemo(() => {
    if (!reportModel) return null;
    return punchGroups.find(g => g.id === reportModel.groupId) || null;
  }, [reportModel, punchGroups]);
  const reportIsApproved = reportGroup?.punchItems?.every(i => i.status === "done") || false;

  const openDetail = (groupId: string) => {
    setDetailGroupId(groupId);
    setSelectedIds(new Set());
  };

  const closeDetail = () => {
    setDetailGroupId(null);
    setSelectedIds(new Set());
  };

  useEffect(() => {
    if (!reportEditorOpen) return;
    setReportPanMode(false);
    setReportFitMode("width");
    const handle = () => {
      const container = reportZoom.containerRef.current;
      const content = reportZoom.contentRef.current;
      if (!container || !content) return;
      const styles = window.getComputedStyle(container);
      const paddingX = (parseFloat(styles.paddingLeft || "0") || 0) + (parseFloat(styles.paddingRight || "0") || 0);
      const available = Math.max(0, container.clientWidth - paddingX);
      const next = available / content.offsetWidth;
      if (Number.isFinite(next) && next > 0) {
        reportZoom.reset(next);
        setReportFitMode("width");
      }
    };
    const handleOrientation = () => window.setTimeout(handle, 60);
    const raf = window.requestAnimationFrame(handle);
    window.addEventListener("resize", handle);
    window.addEventListener("orientationchange", handleOrientation);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", handle);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, [reportEditorOpen, reportZoom.reset]);

  // PATCH START: report editor overlay actions
  const statusLabel = (s: PunchItem["status"]) => (s === "done" ? "완료" : s === "ing" ? "진행중" : "미조치");

  const flushReportEditsToState = useCallback(() => {
    const groupId = reportModel?.groupId;
    const tbody = reportTableBodyRef.current;
    if (!groupId || !tbody) return;

    const nodes = Array.from(tbody.querySelectorAll<HTMLElement>("[data-report-edit='1']"));
    const nextEditsForGroup: Record<string, Partial<Pick<PunchItem, "location" | "issue">>> = {};
    for (const el of nodes) {
      const itemId = el.dataset.itemId || "";
      const field = el.dataset.field as "location" | "issue" | undefined;
      if (!itemId || (field !== "location" && field !== "issue")) continue;
      const value = (el.innerText || "").replace(/\u00A0/g, " ").trim();
      if (!nextEditsForGroup[itemId]) nextEditsForGroup[itemId] = {};
      nextEditsForGroup[itemId][field] = value;
    }

    if (nodes.length > 0) {
      setReportEdits(prev => {
        const prevGroup = prev[groupId] || {};
        const mergedGroup: Record<string, Partial<Pick<PunchItem, "location" | "issue">>> = { ...prevGroup };
        for (const [itemId, v] of Object.entries(nextEditsForGroup)) {
          mergedGroup[itemId] = { ...(mergedGroup[itemId] || {}), ...v };
        }
        return { ...prev, [groupId]: mergedGroup };
      });
    }

    const metaNodes = Array.from(
      reportContentRef.current?.querySelectorAll<HTMLElement>("[data-report-meta]") || []
    );
    const nextMeta: Partial<Pick<PunchReportModel, "title" | "siteName" | "date">> = {};
    for (const el of metaNodes) {
      const key = el.dataset.reportMeta as "title" | "siteName" | "date" | undefined;
      if (!key) continue;
      const value = (el.innerText || "").replace(/\u00A0/g, " ").trim();
      nextMeta[key] = value;
    }

    setReportModel(prev => {
      if (!prev || prev.groupId !== groupId) return prev;
      const nextRows =
        nodes.length === 0
          ? prev.rows
          : prev.rows.map(r => ({
              ...r,
              location: nextEditsForGroup[r.id]?.location ?? r.location,
              issue: nextEditsForGroup[r.id]?.issue ?? r.issue,
            }));
      return {
        ...prev,
        ...nextMeta,
        rows: nextRows,
      };
    });
  }, [reportModel?.groupId]);

  const updateReportPhoto = useCallback((itemId: string, field: "beforePhoto" | "afterPhoto", value: string) => {
    setReportModel(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map(r => (r.id === itemId ? { ...r, [field]: value } : r)),
      };
    });

    if (!reportModel?.groupId) return;
    updateItemMutation.mutate(
      { groupId: reportModel.groupId, itemId, field, value },
      { onSuccess: () => toast.success(value ? "사진이 업데이트되었습니다." : "사진이 삭제되었습니다.") }
    );
  }, [reportModel?.groupId, updateItemMutation]);

  const openReportPhotoPicker = useCallback((itemId: string, field: "beforePhoto" | "afterPhoto") => {
    if (!reportModel) return;
    if (reportIsApproved) {
      toast.error("승인완료 상태에서는 수정할 수 없습니다.");
      return;
    }
    flushReportEditsToState();
    setReportPhotoTarget({ itemId, field });
    reportPhotoInputRef.current?.click();
  }, [flushReportEditsToState, reportIsApproved, reportModel]);

  const onReportPhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !reportPhotoTarget) {
      e.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateReportPhoto(reportPhotoTarget.itemId, reportPhotoTarget.field, (ev.target?.result as string) || "");
      setReportPhotoTarget(null);
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  }, [reportPhotoTarget, updateReportPhoto]);

  const clearReportPhoto = useCallback((itemId: string, field: "beforePhoto" | "afterPhoto") => {
    if (reportIsApproved) {
      toast.error("승인완료 상태에서는 수정할 수 없습니다.");
      return;
    }
    flushReportEditsToState();
    updateReportPhoto(itemId, field, "");
  }, [flushReportEditsToState, reportIsApproved, updateReportPhoto]);

  const openReportEditor = useCallback((groupId?: string) => {
    // Determine target group:
    // 1) explicit groupId (detail header report button)
    // 2) currently opened detail group
    // 3) list selection (exactly one)
    const inferred =
      groupId ||
      detailGroupId ||
      (selectedIds.size === 1 ? Array.from(selectedIds)[0] : null);

    if (!inferred || (!groupId && !detailGroupId && selectedIds.size !== 1)) {
      toast.error("한 개의 그룹을 선택해야 합니다");
      return;
    }

    const group = punchGroups.find(g => g.id === inferred);
    if (!group) {
      toast.error("선택된 그룹을 찾을 수 없습니다.");
      return;
    }

    const groupEdits = reportEdits[group.id] || {};
    const rows: PunchReportRow[] = (group.punchItems || []).map((i) => ({
      id: i.id,
      location: groupEdits[i.id]?.location ?? i.location ?? "",
      issue: groupEdits[i.id]?.issue ?? i.issue ?? "",
      status: i.status,
      beforePhoto: i.beforePhoto,
      afterPhoto: i.afterPhoto,
    }));

    setReportModel({
      groupId: group.id,
      title: "조치 사항 점검 보고서",
      siteName: group.title,
      date: group.date,
      rows,
    });
    setReportEditorRenderKey(prev => prev + 1);
    setReportPanMode(false);
    setReportFitMode("width");
    setReportEditorOpen(true);
  }, [detailGroupId, selectedIds, punchGroups, reportEdits]);

  const closeReportEditor = useCallback(() => {
    flushReportEditsToState();
    setReportEditorOpen(false);
    setReportModel(null);
    setReportPhotoTarget(null);
    setReportPanMode(false);
    setReportFitMode("width");
  }, [flushReportEditsToState]);

  const resetReportEditor = useCallback(() => {
    flushReportEditsToState();
    if (!reportModel) return;
    const group = punchGroups.find(g => g.id === reportModel.groupId);
    if (!group) return;

    setReportEdits(prev => {
      const next = { ...prev };
      delete next[reportModel.groupId];
      return next;
    });

    const rows: PunchReportRow[] = (group.punchItems || []).map((item) => ({
      id: item.id,
      location: item.location ?? "",
      issue: item.issue ?? "",
      status: item.status,
      beforePhoto: item.beforePhoto,
      afterPhoto: item.afterPhoto,
    }));

    setReportModel({
      groupId: group.id,
      title: "조치 사항 점검 보고서",
      siteName: group.title,
      date: group.date,
      rows,
    });
    setReportEditorRenderKey(prev => prev + 1);
    setReportPhotoTarget(null);
    setReportPanMode(false);
    setReportFitMode("width");
    toast.success("입력을 초기화했습니다.");
  }, [flushReportEditsToState, punchGroups, reportModel]);

  const fitReportWidth = useCallback(() => {
    const container = reportZoom.containerRef.current;
    const content = reportZoom.contentRef.current;
    if (!container || !content) return;
    const styles = window.getComputedStyle(container);
    const paddingX = (parseFloat(styles.paddingLeft || "0") || 0) + (parseFloat(styles.paddingRight || "0") || 0);
    const available = Math.max(0, container.clientWidth - paddingX);
    const next = available / content.offsetWidth;
    if (Number.isFinite(next) && next > 0) {
      reportZoom.reset(next);
      setReportFitMode("width");
    }
  }, [reportZoom]);

  const fitReportPage = useCallback(() => {
    reportZoom.reset();
    setReportFitMode("page");
  }, [reportZoom]);

  const toggleReportFit = useCallback(() => {
    if (reportFitMode === "width") {
      fitReportPage();
      return;
    }
    fitReportWidth();
  }, [fitReportPage, fitReportWidth, reportFitMode]);

  const toggleReportPan = useCallback(() => {
    setReportPanMode(prev => !prev);
  }, []);

  const onReportWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    reportZoom.onWheel(e);
  }, [reportZoom]);

  const onReportTouchStart = useCallback((e: React.TouchEvent) => {
    if (!reportPanMode && e.touches.length === 1) return;
    reportZoom.onTouchStart(e);
  }, [reportPanMode, reportZoom]);

  const onReportTouchMove = useCallback((e: React.TouchEvent) => {
    if (!reportPanMode && e.touches.length === 1) return;
    reportZoom.onTouchMove(e);
  }, [reportPanMode, reportZoom]);

  const onReportTouchEnd = useCallback((e: React.TouchEvent) => {
    reportZoom.onTouchEnd(e);
  }, [reportZoom]);

  const loadScript = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }, []);

  const ensureReportPdfLibs = useCallback(async () => {
    const w = window as ReportPdfWindow;
    if (!w.html2canvas) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    }
    if (!w.jspdf) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    }
  }, [loadScript]);

  const generateReportPDF = useCallback(async () => {
    flushReportEditsToState();
    if (!reportModel) return;

    const source = reportContentRef.current;
    if (!source) {
      toast.error("보고서 내용을 찾을 수 없습니다.");
      return;
    }

    try {
      await ensureReportPdfLibs();
      const w = window as ReportPdfWindow;
      const html2canvas = w.html2canvas;
      const jsPDF = w.jspdf?.jsPDF;
      if (!html2canvas || !jsPDF) {
        toast.error("PDF 라이브러리가 로드되지 않았습니다.");
        return;
      }

      // Clone & normalize styles for capture (no UI impact)
      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.left = "0";
      clone.style.top = "-10000px";
      clone.style.transform = "none";
      clone.style.width = "210mm";
      clone.style.minHeight = "297mm";
      clone.style.background = "#ffffff";
      clone.style.margin = "0";
      clone.style.padding = "20mm 10mm";
      clone.style.boxSizing = "border-box";
      clone.style.fontFamily = "Arial, sans-serif";
      clone.style.pointerEvents = "none";

      document.body.appendChild(clone);

      try {
        clone.querySelectorAll("table").forEach((node) => {
          const table = node as HTMLElement;
          table.style.tableLayout = "fixed";
          table.style.width = "100%";
          table.style.borderCollapse = "collapse";
        });

        clone.querySelectorAll("td, th").forEach((node) => {
          const el = node as HTMLElement;
          el.style.verticalAlign = "top";
          el.style.lineHeight = "1.4";
          el.style.paddingTop = "6px";
          el.style.paddingBottom = "10px";
          el.style.paddingLeft = "4px";
          el.style.paddingRight = "4px";
          el.style.whiteSpace = "normal";
          el.style.wordBreak = "break-word";
          el.style.overflowWrap = "anywhere";
          el.style.boxSizing = "border-box";
        });

        clone.querySelectorAll("[contenteditable='true']").forEach((node) => {
          const el = node as HTMLElement;
          el.style.whiteSpace = "pre-wrap";
          el.style.wordBreak = "break-word";
        });

        clone.querySelectorAll("[data-report-remove='1']").forEach((node) => {
          (node as HTMLElement).style.display = "none";
        });

        const centerCols = new Set([0, 5]); // NO, 상태 컬럼
        clone.querySelectorAll("tr").forEach((row) => {
          const cells = row.querySelectorAll("th, td");
          centerCols.forEach((idx) => {
            const cell = cells[idx] as HTMLElement | undefined;
            if (!cell) return;
            cell.style.textAlign = "center";
            cell.style.verticalAlign = "middle";
          });
        });

        clone.querySelectorAll("img").forEach((node) => {
          const img = node as HTMLImageElement;
          img.style.display = "block";
          img.style.maxWidth = "100%";
          img.setAttribute("crossorigin", "anonymous");
        });

        const scale = 2;
        const images = Array.from(clone.querySelectorAll("img"));
        await Promise.all(images.map(img => {
          if ((img as HTMLImageElement).complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          });
        }));

        const cloneRect = clone.getBoundingClientRect();
        const rowBottomsCanvasPx: number[] = Array.from(clone.querySelectorAll("tbody tr")).map((row) => {
          const rect = (row as HTMLElement).getBoundingClientRect();
          return (rect.bottom - cloneRect.top) * scale;
        });

        const canvas = await html2canvas(clone, {
          scale,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: clone.scrollWidth || 794,
          windowHeight: clone.scrollHeight || clone.getBoundingClientRect().height,
        });

        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const marginX = 0;
        const marginY = 0;
        const usableW = pageWidthMm - marginX * 2;
        const usableH = pageHeightMm - marginY * 2;
        const mmPerPx = usableW / canvas.width;
        const pageHeightPx = Math.floor(usableH / mmPerPx);

        let y = 0;
        let pageIndex = 0;

        while (y < canvas.height - 1) {
          if (pageIndex > 0) pdf.addPage();

          const targetEnd = Math.min(y + pageHeightPx, canvas.height);
          let breakY = targetEnd;

          // Avoid cutting through table rows when possible
          for (let i = rowBottomsCanvasPx.length - 1; i >= 0; i--) {
            const rb = rowBottomsCanvasPx[i];
            if (rb > y + 40 && rb <= targetEnd) {
              breakY = rb;
              break;
            }
          }

          if (breakY <= y + 10) {
            breakY = targetEnd;
          }
          if (canvas.height - breakY <= 8 || canvas.height - y <= pageHeightPx + 8) {
            breakY = canvas.height;
          }

          const sliceH = breakY - y;
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = sliceH;
          const ctx = sliceCanvas.getContext("2d");
          if (ctx) ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

          const sliceHeightMm = sliceH * mmPerPx;
          pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.95), "JPEG", marginX, marginY, usableW, sliceHeightMm);

          pageIndex++;
          y = breakY;
        }

        const datePart = (reportModel.date || new Date().toISOString().split("T")[0]).slice(0, 10);
        const sitePart = (reportModel.siteName || "현장").replace(/[\\/:*?"<>|]+/g, "_").trim() || "현장";
        pdf.save(`${datePart}-${sitePart}-보고서.pdf`);
      } finally {
        clone.remove();
      }
    } catch (e) {
      console.error(e);
      toast.error("PDF 생성 중 오류가 발생했습니다.");
    }
  }, [ensureReportPdfLibs, flushReportEditsToState, reportModel]);

  const shareReport = useCallback(async () => {
    flushReportEditsToState();
    if (!reportModel) return;

    const source = reportContentRef.current;
    if (!source) {
      toast.error("공유할 보고서 내용을 찾을 수 없습니다.");
      return;
    }

    if (!navigator.share) {
      await generateReportPDF();
      return;
    }

    try {
      await ensureReportPdfLibs();
      const w = window as ReportPdfWindow;
      const html2canvas = w.html2canvas;
      if (!html2canvas) {
        await generateReportPDF();
        return;
      }

      const canvas = await html2canvas(source, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!blob) {
        await generateReportPDF();
        return;
      }

      const datePart = (reportModel.date || new Date().toISOString().split("T")[0]).slice(0, 10);
      const sitePart = (reportModel.siteName || "현장").replace(/[\\/:*?"<>|]+/g, "_").trim() || "현장";
      const fileName = `${datePart}-${sitePart}-보고서.png`;
      const shareFile = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [shareFile] })) {
        await navigator.share({ title: "조치보고서 공유", files: [shareFile] });
        toast.success("공유했습니다.");
        return;
      }

      await generateReportPDF();
    } catch (e) {
      if (isAbortError(e)) return;
      await generateReportPDF();
    }
  }, [ensureReportPdfLibs, flushReportEditsToState, generateReportPDF, reportModel]);
  // PATCH END

  // Punch item actions
  const handleUpdateField = (itemId: string, field: keyof PunchItem, value: string) => {
    if (!detailGroupId) return;
    updateItemMutation.mutate({ groupId: detailGroupId, itemId, field: field as string, value });
  };

  const handleDeletePunchItem = (itemId: string) => {
    if (!detailGroupId) return;
    if (!confirm('이 조치 항목을 삭제하시겠습니까?')) return;
    deleteItemMutation.mutate({ groupId: detailGroupId, itemId }, {
      onSuccess: () => toast.success("항목이 삭제되었습니다."),
    });
  };

  const handleAddPunchItem = () => {
    if (!detailGroupId) return;
    const newItem: PunchItem = {
      id: `pi_${Date.now()}`,
      location: '',
      issue: '',
      priority: '중간',
      status: 'open',
      assignee: '',
      dueDate: '',
      date: new Date().toISOString().split('T')[0],
      beforePhoto: '',
      afterPhoto: '',
    };
    addItemMutation.mutate({ groupId: detailGroupId, item: newItem }, {
      onSuccess: () => toast.success("새 항목이 추가되었습니다."),
    });
  };

  const handlePhotoUpload = (itemId: string, photoType: 'beforePhoto' | 'afterPhoto') => {
    if (isApproved) {
      toast.error("승인완료 상태에서는 수정할 수 없습니다.");
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file || !detailGroupId) return;
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        updateItemMutation.mutate({
          groupId: detailGroupId,
          itemId,
          field: photoType,
          value: ev.target?.result as string,
        }, {
          onSuccess: () => toast.success("사진이 업로드되었습니다."),
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`${selectedIds.size}개 항목을 삭제하시겠습니까?`)) return;

    void (async () => {
      if (isPunch && !detailGroupId) {
        const updated = punchGroups.filter(g => !selectedIds.has(g.id));
        savePunchGroupsMutation.mutate(updated);
        setSelectedIds(new Set());
        toast.success("삭제 완료");
        return;
      }

      if (isMyDocs && !detailGroupId) {
        setBatchBusy(true);
        try {
          const docIdsToRemove = new Set(
            (docsByTab["내문서함"] || [])
              .filter((doc) => selectedIds.has(doc.id))
              .map((doc) => doc.id),
          );
          const overrideKeysToClear: RequiredDocKey[] = [];

          const hasVisibleRequiredDoc = (key: RequiredDocKey) =>
            (docsByTab["내문서함"] || []).some((doc) =>
              (doc.files || []).some((file) => inferRequiredDocType(file, doc) === key),
            );

          REQUIRED_DOCS.forEach((item) => {
            const selectedId = `required-${item.key}`;
            if (!selectedIds.has(selectedId)) return;
            const pair = requiredDocByType[item.key];
            if (!pair) return;
            if (requiredDocOverrides[item.key] && pair.doc.id === selectedId) {
              overrideKeysToClear.push(item.key);
              return;
            }
            if (pair.doc.id) {
              docIdsToRemove.add(pair.doc.id);
            }
          });

          if (overrideKeysToClear.length > 0) {
            setRequiredDocOverrides((prev) => {
              const next = { ...prev };
              overrideKeysToClear.forEach((key) => {
                delete next[key];
              });
              return next;
            });
            setRequiredDocHiddenKeys((prev) => {
              const next = new Set(prev);
              overrideKeysToClear.forEach((key) => {
                if (hasVisibleRequiredDoc(key)) next.delete(key);
                else next.add(key);
              });
              return next;
            });
          }

          const customMyDocIds = new Set(customMyDocs.map((doc) => doc.id));
          const persistedIds = Array.from(docIdsToRemove).filter((id) => customMyDocIds.has(id));
          const hiddenIds = Array.from(docIdsToRemove).filter((id) => !customMyDocIds.has(id));

          if (persistedIds.length > 0) {
            await deleteMyDocEntries(myDocsScope, persistedIds);
            setMyDocsRefreshTick((prev) => prev + 1);
          }

          if (hiddenIds.length > 0) {
            setMyDocsHiddenIds((prev) => {
              const next = new Set(prev);
              hiddenIds.forEach((id) => next.add(id));
              return next;
            });
          }

          setSelectedIds(new Set());
          toast.success("삭제 완료");
        } catch {
          toast.error("삭제 중 오류가 발생했습니다.");
        } finally {
          setBatchBusy(false);
        }
        return;
      }

      setSelectedIds(new Set());
      toast.success("삭제 완료");
    })();
  };

  type BatchFile = { url: string; name: string };

  const normalizeVersion = (v?: string) => {
    const raw = (v || '').trim();
    if (!raw) return 'v1';
    return raw.toLowerCase().startsWith('v') ? raw : `v${raw}`;
  };

  const resolveFileUrl = (file: { url: string; url_before?: string; url_after?: string; currentView?: string }) => {
    const view = file.currentView;
    const chosen = view === 'after' ? file.url_after : view === 'before' ? file.url_before : undefined;
    return (chosen || file.url_after || file.url_before || file.url || '').trim();
  };

  const toPreviewFile = (doc: Doc, file: DocFile): FilePreviewFile => ({
    id: file.id || `${doc.id}-file`,
    name: file.name || doc.title || "file",
    url: resolveFileUrl(file),
    mime: file.mime,
    ext: file.ext,
    size: file.size,
    createdAt: `${doc.date || ""} ${doc.time || ""}`.trim(),
    previewUrl: file.previewUrl,
  });

  const openDocPreview = (doc: Doc, file?: DocFile) => {
    if (!file) {
      toast.error("미리볼 파일이 없습니다.");
      return;
    }

    const preview = toPreviewFile(doc, file);
    if (!preview.url) {
      toast.error("파일 주소를 찾지 못했습니다.");
      return;
    }

    setPreviewModal({
      isOpen: true,
      file: preview,
      title: doc.title || preview.name,
    });
  };

  const extractWorklogId = (docId: string) => {
    if (docId.startsWith("wl_photo_")) return docId.replace("wl_photo_", "");
    if (docId.startsWith("wl_drawing_")) return docId.replace("wl_drawing_", "");
    return "";
  };

  const inferRequiredDocType = useCallback((file?: DocFile, doc?: Doc): RequiredDocKey | undefined => {
    const raw = `${file?.docType || ""} ${file?.name || ""} ${doc?.title || ""}`.toLowerCase();
    if (!raw) return undefined;
    if (raw.includes("안전") || raw.includes("교육")) return "safetyEdu";
    if (raw.includes("통장")) return "bankbook";
    if (raw.includes("신분증") || raw.includes("주민등록증") || raw.includes("면허증")) return "idCard";
    if (raw.includes("검진")) return "medical";
    if (raw.includes("등록증")) return "carReg";
    if (raw.includes("보험")) return "carIns";
    if (raw.includes("고령")) return "senior";
    return undefined;
  }, []);

  const requiredDocByType = useMemo(() => {
    const bucket: Partial<Record<RequiredDocKey, { doc: Doc; file: DocFile }>> = {};
    const myDocs = docsByTab["내문서함"] || [];

    for (const doc of myDocs) {
      const files = [...(doc.files || [])].reverse();
      for (const file of files) {
        const key = inferRequiredDocType(file, doc);
        if (!key || bucket[key] || requiredDocHiddenKeys.has(key)) continue;
        bucket[key] = { doc, file };
      }
    }

    for (const item of REQUIRED_DOCS) {
      if (requiredDocHiddenKeys.has(item.key)) continue;
      if (requiredDocOverrides[item.key]) {
        bucket[item.key] = {
          doc: {
            id: `required-${item.key}`,
            title: item.label,
            author: "내문서함",
            date: new Date().toISOString().slice(0, 10),
            time: "",
            files: [requiredDocOverrides[item.key]!],
          },
          file: requiredDocOverrides[item.key]!,
        };
      }
    }

    return bucket;
  }, [docsByTab, inferRequiredDocType, requiredDocHiddenKeys, requiredDocOverrides]);

  const submittedRequiredCount = useMemo(
    () => REQUIRED_DOCS.filter((item) => !!requiredDocByType[item.key]?.file).length,
    [requiredDocByType],
  );

  const filteredRequiredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return REQUIRED_DOCS;

    return REQUIRED_DOCS.filter((item) => {
      const pair = requiredDocByType[item.key];
      const fileName = pair?.file?.name || "";
      const docTitle = pair?.doc?.title || "";
      const author = pair?.doc?.author || "";
      const haystack = [item.label, fileName, docTitle, author].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [requiredDocByType, search]);

  const triggerRequiredUpload = useCallback((key: RequiredDocKey) => {
    setPendingRequiredDocKey(key);
    requiredDocInputRef.current?.click();
  }, []);

  const handleRequiredPreviewClick = useCallback((key: RequiredDocKey) => {
    const pair = requiredDocByType[key];
    if (pair?.file) {
      openDocPreview(pair.doc, pair.file);
      return;
    }
    toast.error("파일을 올려주세요");
    setRequiredDocPulseKey(key);
    window.setTimeout(() => setRequiredDocPulseKey((prev) => (prev === key ? null : prev)), 700);
    triggerRequiredUpload(key);
  }, [requiredDocByType, triggerRequiredUpload]);

  const onRequiredDocFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    const targetKey = pendingRequiredDocKey;
    e.target.value = "";
    if (!selected || !targetKey) return;

    const objectUrl = URL.createObjectURL(selected);
    const nextFile: DocFile = {
      id: `${targetKey}-${Date.now()}`,
      name: selected.name,
      type: selected.type.startsWith("image/") ? "img" : "file",
      url: objectUrl,
      size: `${(selected.size / 1024 / 1024).toFixed(2)}MB`,
      ext: selected.name.split(".").pop()?.toUpperCase() || "",
      mime: selected.type,
      docType: targetKey,
      version: "v1",
    };

    setRequiredDocOverrides((prev) => ({ ...prev, [targetKey]: nextFile }));
    setRequiredDocHiddenKeys((prev) => {
      if (!prev.has(targetKey)) return prev;
      const next = new Set(prev);
      next.delete(targetKey);
      return next;
    });
    setPendingRequiredDocKey(null);
    toast.success("업로드 완료");
  }, [pendingRequiredDocKey]);

  const sanitizeDownloadName = (name: string) => (name || 'file').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'file';

  const ensureExt = (baseName: string, ext: string) => {
    const clean = sanitizeDownloadName(baseName);
    if (!ext) return clean;
    const hasExt = /\.[a-z0-9]{1,6}$/i.test(clean);
    return hasExt ? clean : `${clean}.${ext.toLowerCase()}`;
  };

  const guessMimeFromName = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'hwp') return 'application/x-hwp';
    return 'application/octet-stream';
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const collectSelectedFiles = (): BatchFile[] => {
    if (isPunch) {
      return punchGroups
        .filter(g => selectedIds.has(g.id))
        .flatMap(g =>
          (g.files || []).map(f => ({
            url: resolveFileUrl(f),
            name: ensureExt(f.name || `${g.title}_${f.id}`, f.ext || ''),
          }))
        );
    }

    if (isMyDocs) {
      const files = [
        ...REQUIRED_DOCS.flatMap((item) => {
          const id = `required-${item.key}`;
          if (!selectedIds.has(id)) return [];
          const pair = requiredDocByType[item.key];
          const file = pair?.file;
          if (!file) return [];
          const url = resolveFileUrl(file);
          if (!url) return [];
          return [{
            url,
            name: ensureExt(file.name || item.label, file.ext || ""),
          }];
        }),
        ...(docsByTab["내문서함"] || [])
          .filter((doc) => selectedIds.has(doc.id))
          .flatMap((doc) =>
            (doc.files || []).map((file) => ({
              url: resolveFileUrl(file),
              name: ensureExt(file.name || doc.title, file.ext || ""),
            })),
          ),
      ];

      const deduped = new Map<string, BatchFile>();
      files.forEach((file) => {
        if (!file.url) return;
        deduped.set(`${file.name}|${file.url}`, file);
      });
      return Array.from(deduped.values());
    }

    const docs = (docsByTab[tabKey] || []).filter(d => selectedIds.has(d.id));
    return docs.flatMap(d =>
      (d.files || []).map(f => ({
        url: resolveFileUrl(f),
        name: (() => {
          const base = ensureExt(f.name || d.title, f.ext || '');
          if (!isMediaArchiveTab) return base;
          const siteName = sanitizeDownloadName(d.title || "");
          if (!siteName) return base;
          return base.startsWith(`${siteName}_`) ? base : `${siteName}_${base}`;
        })(),
      }))
    );
  };

  const saveBatchFiles = async (files: BatchFile[]) => {
    let saved = 0;
    let skipped = 0;

    for (const file of files) {
      try {
        const res = await fetch(file.url);
        if (!res.ok) throw new Error("download_failed");
        const blob = await res.blob();
        downloadBlob(blob, file.name);
        saved += 1;
      } catch {
        skipped += 1;
      }
      await new Promise((resolve) => setTimeout(resolve, 180));
    }

    return { saved, skipped };
  };

  const handleBatchDownload = async () => {
    const files = collectSelectedFiles().filter((f) => !!f.url);
    if (files.length === 0) {
      toast.error("저장할 파일이 없습니다.");
      return;
    }

    setBatchBusy(true);
    try {
      const { saved, skipped } = await saveBatchFiles(files);
      if (saved > 0) toast.success(saved === 1 ? "1개 저장 완료" : `${saved}개 저장 완료`);
      if (skipped > 0) toast.error(`${skipped}개 파일은 건너뛰었습니다.`);
      if (saved === 0) toast.error("파일 저장에 실패했습니다.");
    } finally {
      setBatchBusy(false);
    }
  };

  const handleBatchShare = async () => {
    const files = collectSelectedFiles().filter((f) => !!f.url);
    if (files.length === 0) {
      toast.error("공유할 파일이 없습니다.");
      return;
    }

    if (!navigator.share) {
      toast("공유 미지원 환경입니다. 저장으로 전환합니다");
      await handleBatchDownload();
      return;
    }

    const maxShare = 10;
    const targets = files.slice(0, maxShare);

    setBatchBusy(true);
    try {
      const shareFiles: File[] = [];
      let skipped = 0;

      for (const file of targets) {
        try {
          const res = await fetch(file.url);
          if (!res.ok) throw new Error("share_fetch_failed");
          const blob = await res.blob();
          shareFiles.push(new File([blob], file.name, { type: blob.type || guessMimeFromName(file.name) }));
        } catch {
          skipped += 1;
        }
      }

      if (shareFiles.length === 0) {
        toast.error("공유할 파일을 준비하지 못했습니다.");
        if (skipped > 0) toast.error(`${skipped}개 파일은 건너뛰었습니다.`);
        return;
      }

      if (navigator.canShare?.({ files: shareFiles })) {
        toast.success(`${shareFiles.length}개 공유 준비`);
        await navigator.share({ title: "문서 공유", files: shareFiles });
        if (skipped > 0) toast.error(`${skipped}개 파일은 건너뛰었습니다.`);
      } else {
        toast("공유 미지원 환경입니다. 저장으로 전환합니다");
        const { saved, skipped: savedSkipped } = await saveBatchFiles(files);
        if (saved > 0) toast.success(saved === 1 ? "1개 저장 완료" : `${saved}개 저장 완료`);
        if (savedSkipped > 0) toast.error(`${savedSkipped}개 파일은 건너뛰었습니다.`);
      }
    } catch (e) {
      if (!isAbortError(e)) toast.error("공유에 실패했습니다.");
    } finally {
      setBatchBusy(false);
    }
  };

  // ─── Reset on tab change ───
  const handleTabChange = (i: number) => {
    setActiveTab(i);
    setSearch('');
    setSelectedIds(new Set());
    setVisibleCount(5);
    setPunchFilter('all');
    setSiteFilter('');
    setDetailGroupId(null);
    setMediaSiteFilter("");
    setUploadSheetOpen(false);
    setSelectedFiles([]);
    // PATCH START: reset upload autocomplete state
    setUploadSelectedSite(null);
    setUploadDate(today);
    setUploadSiteError(null);
    setUploadDocName("");
    // PATCH END
    setBpAffOpen(false);
    setBpContractorOpen(false);
    setBlueprintUploadData({
      siteName: '',
      siteIsCustom: false,
      affiliation: '',
      contractorPreset: '',
      contractorCustom: '',
      componentPreset: '',
      componentCustom: '',
      processPreset: '',
      processCustom: ''
    });
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    const files = picked.filter((file) => {
      if (tabKey === "사진함") return file.type.startsWith("image/");
      if (tabKey === "도면함") {
        return file.type.startsWith("image/") || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      }
      return true;
    });
    if (files.length !== picked.length) {
      toast.error(tabKey === "도면함" ? "도면은 이미지/PDF만 선택할 수 있습니다." : "이미지 파일만 선택할 수 있습니다.");
    }
    setSelectedFiles(prev => {
      const next = [...prev];
      for (const f of files) {
        const exists = next.some(p => p.name === f.name && p.size === f.size && p.lastModified === f.lastModified);
        if (!exists) next.push(f);
      }
      return next;
    });
    if (files.length > 0) toast.success(`${files.length}개 파일이 선택되었습니다.`);
    // Allow selecting the same file again if needed
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (uploadSubmitLockRef.current || batchBusy) return;
    uploadSubmitLockRef.current = true;
    void (async () => {
      try {
        if (isMediaArchiveTab) {
          toast.error("사진/도면 등록은 홈/일지에서 자동 연동됩니다.");
          return;
        }

        if (selectedFiles.length === 0) {
          toast.error("선택된 파일이 없습니다.");
          return;
        }

        if (isMyDocs) {
          setBatchBusy(true);
          try {
            const docName = uploadDocName.trim();
            if (!docName) {
              toast.error("문서명을 입력해주세요");
              return;
            }
            if (!uploadDate) {
              toast.error("등록일을 선택해주세요");
              return;
            }

            const matchedKeys = new Set<RequiredDocKey>();
            for (const file of selectedFiles) {
              const inferred = inferRequiredDocType(
                {
                  id: "",
                  name: file.name,
                  type: file.type.startsWith("image/") ? "img" : "file",
                  url: "",
                  size: "",
                  ext: "",
                  docType: docName,
                },
                {
                  id: "",
                  title: docName,
                  author: "내문서함",
                  date: uploadDate,
                  time: "",
                  files: [],
                },
              );
              if (inferred) matchedKeys.add(inferred);
            }

            const now = new Date();
            const uploadTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
            const saved = await addMyDocEntry({
              scope: myDocsScope,
              title: docName,
              author: currentUserLabel,
              date: uploadDate,
              time: uploadTime,
              files: selectedFiles,
            });

            if (!saved) {
              toast.error("문서 저장에 실패했습니다.");
              return;
            }

            if (matchedKeys.size > 0) {
              const keys = Array.from(matchedKeys);
              setRequiredDocOverrides((prev) => {
                const next = { ...prev };
                keys.forEach((key) => {
                  delete next[key];
                });
                return next;
              });
              setRequiredDocHiddenKeys((prev) => {
                const next = new Set(prev);
                keys.forEach((key) => next.delete(key));
                return next;
              });
            }

            setMyDocsRefreshTick((prev) => prev + 1);
            setSelectedFiles([]);
            setUploadDocName("");
            setUploadDate(today);
            setUploadSheetOpen(false);
            setSelectedIds(new Set());
            toast.success(matchedKeys.size > 0 ? "문서를 등록했고 필수서류 상태에도 반영했습니다." : "문서를 등록했습니다.");
          } catch {
            toast.error("문서 저장 중 오류가 발생했습니다.");
          } finally {
            setBatchBusy(false);
          }
          return;
        }

        if (!uploadSelectedSite) {
          setUploadSiteError("현장명을 선택해주세요");
          toast.error("현장명을 선택해주세요");
          return;
        }

        if (!uploadDate) {
          toast.error("등록일을 선택해주세요");
          return;
        }

        const uploadType: "photo" | "drawing" = tabKey === "도면함" ? "drawing" : "photo";
        const filteredFiles = selectedFiles.filter((file) => {
          if (uploadType === "photo") return file.type.startsWith("image/");
          return file.type.startsWith("image/") || file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        });

        if (filteredFiles.length === 0) {
          toast.error(uploadType === "drawing" ? "도면은 이미지/PDF만 업로드할 수 있습니다." : "사진은 이미지 파일만 업로드할 수 있습니다.");
          return;
        }
        if (filteredFiles.length !== selectedFiles.length) {
          toast.error(uploadType === "drawing" ? "이미지/PDF 외 파일은 제외되었습니다." : "이미지 외 파일은 제외되었습니다.");
        }

        setBatchBusy(true);
        try {
          const refs = await saveFiles({
            worklogId: `doc_${uploadSelectedSite.site_id}_${uploadDate}`,
            type: uploadType,
            files: filteredFiles,
            defaultStatus: uploadType === "drawing" ? "progress" : "after",
            siteValue: uploadSelectedSite.site_id,
            siteName: uploadSelectedSite.site_name,
            workDate: uploadDate,
            source: "doc",
          });

          setMediaRefreshTick((prev) => prev + 1);
          toast.success(refs.length === 1 ? "파일을 저장했습니다." : `${refs.length}개 파일을 저장했습니다.`);
          setSelectedFiles([]);
          setUploadSheetOpen(false);
          setUploadSelectedSite(null);
          setUploadSiteError(null);
          setUploadDate(today);
          setUploadDocName("");
        } catch {
          toast.error("업로드에 실패했습니다.");
        } finally {
          setBatchBusy(false);
        }
      } finally {
        uploadSubmitLockRef.current = false;
      }
    })();
  };

  const resetBlueprintUploadForm = () => {
    setSelectedFiles([]);
    setBpAffOpen(false);
    setBpContractorOpen(false);
    setBlueprintUploadData({
      siteName: '',
      siteIsCustom: false,
      affiliation: '',
      contractorPreset: '',
      contractorCustom: '',
      componentPreset: '',
      componentCustom: '',
      processPreset: '',
      processCustom: ''
    });
  };

  const closeUploadSheet = () => {
    resetBlueprintUploadForm();
    // PATCH START: reset non-blueprint upload state
    setUploadSelectedSite(null);
    setUploadSiteError(null);
    setUploadDate(today);
    setUploadDocName("");
    // PATCH END
    setUploadSheetOpen(false);
  };

  // Blueprint Management Functions
  const handleSaveToBlueprint = (inputData: {
    siteKey: string;
    siteName: string;
    siteSource: BlueprintSiteSource;
    affiliation: string;
    contractor: string;
    author: string;
    component: string;
    process: string;
    files: File[];
  }) => {
    const { siteKey, siteName, siteSource, affiliation, contractor, author, component, process, files } = inputData;
    
    if (!siteName.trim()) {
      toast.error('현장명을 입력해주세요.');
      return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    
    // Convert File objects to DocFile format
    const docFiles: DocFile[] = files.map((file, index) => ({
      id: `${Date.now()}_${index}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'img' : 'file',
      url: URL.createObjectURL(file),
      size: `${(file.size / 1024).toFixed(1)}KB`,
      ext: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      version: 'v1'
    }));

    const historyItem: BlueprintHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date,
      time,
      author,
      affiliation,
      contractor,
      component,
      process,
      files: docFiles,
      version: 1
    };

    if (blueprintStorage[siteKey]) {
      // Update existing site data
      const existingData = blueprintStorage[siteKey];
      existingData.history.unshift(historyItem);
      existingData.currentVersion += 1;
      existingData.lastUpdated = date;
      existingData.totalDrawings = existingData.history.reduce((sum, item) => sum + item.files.length, 0);
      historyItem.version = existingData.currentVersion;
      
      toast.success(`${siteName} 도면이 업데이트되었습니다. (v${existingData.currentVersion})`);
    } else {
      // Create new site data
      blueprintStorage[siteKey] = {
        id: siteKey,
        siteName,
        siteSource,
        affiliation,
        contractor,
        totalDrawings: docFiles.length,
        currentVersion: 1,
        lastUpdated: date,
        history: [historyItem]
      };
      
      toast.success(`${siteName} 도면함이 새로 생성되었습니다.`);
    }
  };

  function getBlueprintList() {
    return Object.values(blueprintStorage).sort(
      (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  const deleteBlueprintSite = (siteKey: string) => {
    if (blueprintStorage[siteKey]) {
      delete blueprintStorage[siteKey];
      setBlueprintSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteKey);
        return newSet;
      });
      toast.success(`도면함이 삭제되었습니다.`);
    }
  };

  const handleBlueprintUpload = () => {
    if (uploadSubmitLockRef.current || batchBusy) return;
    uploadSubmitLockRef.current = true;

    try {
      if (selectedFiles.length === 0) {
        toast.error('선택된 파일이 없습니다.');
        return;
      }

      const siteName = blueprintUploadData.siteName.trim();
      if (!siteName) {
        toast.error('현장명을 입력해주세요.');
        return;
      }

      const affiliation = blueprintUploadData.affiliation.trim();
      if (!affiliation) {
        toast.error('소속을 선택/입력해주세요.');
        return;
      }

      const contractor =
        blueprintUploadData.contractorPreset === '기타'
          ? blueprintUploadData.contractorCustom.trim()
          : blueprintUploadData.contractorPreset.trim();
      if (!contractor) {
        toast.error(blueprintUploadData.contractorPreset === '기타' ? '원청사를 입력해주세요.' : '원청사를 선택해주세요.');
        return;
      }

      const component =
        blueprintUploadData.componentPreset === '기타'
          ? blueprintUploadData.componentCustom.trim()
          : blueprintUploadData.componentPreset.trim();
      if (!component) {
        toast.error(blueprintUploadData.componentPreset === '기타' ? '부재명을 입력해주세요.' : '부재명을 선택해주세요.');
        return;
      }

      const process =
        blueprintUploadData.processPreset === '기타'
          ? blueprintUploadData.processCustom.trim()
          : blueprintUploadData.processPreset.trim();
      if (!process) {
        toast.error(blueprintUploadData.processPreset === '기타' ? '작업공정을 입력해주세요.' : '작업공정을 선택해주세요.');
        return;
      }

      // Collision-safe site key resolution:
      // - If the same siteName already exists (sys/custom), always upload into that existing bucket.
      // - If it's a brand-new name, treat it as "direct input" (custom) to avoid admin/system collisions.
      const intendedSource: BlueprintSiteSource = blueprintUploadData.siteIsCustom ? "custom" : "system";
      const sysKey = `sys:${siteName}`;
      const customKey = `custom:${siteName}`;
      const hasSys = !!blueprintStorage[sysKey];
      const hasCustom = !!blueprintStorage[customKey];

      let siteSource: BlueprintSiteSource = intendedSource;
      let siteKey = intendedSource === "custom" ? customKey : sysKey;

      if (hasSys) {
        // Same name already exists as system site -> never create a duplicated "custom" bucket.
        if (intendedSource === "custom") {
          toast.warning("동일한 현장명이 이미 등록되어 있습니다. 기존 현장 도면함으로 업로드합니다.");
        }
        siteSource = "system";
        siteKey = sysKey;
      } else if (hasCustom) {
        // Same name already exists as direct-input site -> keep uploading into it.
        if (intendedSource === "system") {
          toast("직접 입력 현장으로 존재합니다. 해당 도면함으로 업로드합니다.");
        }
        siteSource = "custom";
        siteKey = customKey;
      } else if (intendedSource === "system") {
        // Brand-new typed site name -> store as direct-input by default.
        toast("새 현장명입니다. 직접 입력 현장으로 분리 저장합니다.");
        siteSource = "custom";
        siteKey = customKey;
      }

      handleSaveToBlueprint({
        siteKey,
        siteName,
        siteSource,
        affiliation,
        contractor,
        author: '관리자', // TODO: Get from user context
        component,
        process,
        files: selectedFiles
      });

      setHighlightBlueprintKey(siteKey);
      closeUploadSheet();
    } finally {
      uploadSubmitLockRef.current = false;
    }
  };

  const blueprintDetail = blueprintDetailModal.blueprintKey
    ? blueprintStorage[blueprintDetailModal.blueprintKey]
    : null;

  return (
    <div className="animate-fade-in">
      <FilePreviewModal
        open={previewModal.isOpen}
        file={previewModal.file}
        title={previewModal.title || ""}
        onClose={() => setPreviewModal({ isOpen: false })}
      />

      {/* Tab Bar */}
      <div className="flex border-b border-border mb-4 -mx-4 px-1 bg-card -mt-6 pt-6 overflow-x-auto scrollbar-none">
        {DOC_TABS_FILTERED.map((tab, i) => (
          <button
            key={tab}
            onClick={() => handleTabChange(i)}
            className={cn(
              "flex-1 min-w-0 h-12 bg-transparent border-none text-[16px] font-semibold cursor-pointer border-b-[3px] transition-all whitespace-nowrap px-1",
              activeTab === i
                ? "text-sky-500 border-b-sky-500 font-bold"
                : "text-muted-foreground border-b-transparent"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Punch Site Filter */}
      {isPunch && !detailGroupId && (
        <SiteCombobox
          options={punchSiteOptions}
          value={siteFilter}
          onChange={(option) => setSiteFilter(option?.label || "")}
          containerClassName="mb-4"
          inputClassName="rounded-2xl px-5 pr-16 text-base"
        />
      )}

      
      {/* Search */}
      {!detailGroupId && DOC_TABS_FILTERED[activeTab] !== "조치" && !isMediaArchiveTab && (
        <div className="relative mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요."
            className="w-full h-[50px] bg-card border border-border rounded-2xl px-5 pr-12 text-base font-medium text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[12px] text-muted-foreground z-10",
                tabKey === "회사서류" ? "right-4" : "right-12"
              )}
            >
              ✕
            </button>
          )}
          {tabKey !== "회사서류" && (
            <Search className="absolute right-[18px] top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
        </div>
      )}

      {!detailGroupId && isMediaArchiveTab && (
        <SiteCombobox
          options={mediaSiteOptions}
          value={mediaSiteFilter}
          onChange={(option) => setMediaSiteFilter(option?.label || "")}
          containerClassName="mb-4"
          inputClassName="rounded-2xl px-5 pr-16 text-base"
        />
      )}
      {/* Punch Summary */}
      {isPunch && !detailGroupId && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'all' as const, label: '전체', count: punchStats.total, cls: 'bg-header-navy' },
            // PATCH START: match card badge tone (indigo) for "미조치"
            { key: 'open' as const, label: '미조치', count: punchStats.open, cls: 'bg-indigo-500' },
            // PATCH END
            { key: 'done' as const, label: '완료', count: punchStats.done, cls: 'bg-slate-500' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setPunchFilter(f.key)}
              className={cn(
                // NOTE: 선택 시 번짐(글로우) 효과는 제거하고 컬러만 변경
                "h-10 px-3.5 rounded-full text-[15px] font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 border shadow-none focus:outline-none",
                punchFilter === f.key
                  ? `${f.cls} text-white border-transparent font-bold shadow-none`
                  : "bg-white border-border text-[#64748b] hover:border-primary/50"
              )}
            >{f.label} {f.count}</button>
          ))}
        </div>
      )}

      {/* ═══════ DETAIL OVERLAY ═══════ */}
      {detailGroupId && detailGroup && (
        <>
          {/* PATCH START: connect report button -> openReportEditor */}
          <PunchDetailView
            group={detailGroup}
            isApproved={isApproved}
            onBack={closeDetail}
            onOpenReport={openReportEditor}
            onUpdateField={handleUpdateField}
            onDeleteItem={handleDeletePunchItem}
            onAddItem={handleAddPunchItem}
            onPhotoUpload={handlePhotoUpload}
          />
          {/* PATCH END */}
        </>
      )}

      {/* ═══════ LIST VIEW ═══════ */}
      {!detailGroupId && (
        <>
          {/* Punch Cards */}
          {isPunch && (
            <div className="space-y-3 max-[640px]:space-y-2.5">
              {displayedPunchGroups.length === 0 ? (
                <EmptyState />
              ) : displayedPunchGroups.map(group => {
                const isSelected = selectedIds.has(group.id);
                const statusBadge = getStatusBadge(group);
                const repImg = group.files?.find(f => f.type === 'img');
                const thumbUrl = repImg ? ((repImg.currentView === 'after' ? repImg.url_after : repImg.url_before) || repImg.url) : null;
                const openCount = group.punchItems?.filter(i => i.status !== 'done').length || 0;
                const doneCount = group.punchItems?.filter(i => i.status === 'done').length || 0;
                const totalCount = group.punchItems?.length || 0;

                return (
                  <div key={group.id} className={cn("bg-card rounded-2xl p-4 max-[640px]:p-3.5 cursor-pointer transition-all shadow-soft relative overflow-hidden", isSelected && "border-2 border-primary bg-sky-50/50")} onClick={() => openDetail(group.id)}>
                    <span className={cn("absolute top-0 right-0 text-[11px] font-bold px-2.5 py-1 text-white rounded-bl-xl z-10", statusBadge.cls)}>{statusBadge.text}</span>
                    <div className="flex gap-3 max-[640px]:gap-2.5 items-center">
                      <div onClick={(e) => { e.stopPropagation(); toggleSelect(group.id); }} className={cn("w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all", isSelected ? "bg-sky-500 border-sky-500 shadow-[0_2px_8px_rgba(14,165,233,0.3)]" : "bg-card border-muted-foreground/30")}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                      <div className="w-20 h-20 max-[640px]:w-16 max-[640px]:h-16 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 max-[640px]:w-7 max-[640px]:h-7 text-muted-foreground m-auto mt-6 max-[640px]:mt-5" />}
                      </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1 max-[640px]:gap-0.5 pt-0.5 leading-tight">
                          {(group.contractor || group.affiliation) && (
                            <div className="flex gap-1.5 flex-wrap mb-1.5">
                              {group.contractor && <span className="text-[12px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-500 border border-indigo-200 font-semibold">{group.contractor}</span>}
                              {group.affiliation && <span className="text-[12px] px-2.5 py-0.5 rounded-md bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] font-semibold">{group.affiliation}</span>}
                            </div>
                          )}
                          <div className="text-[16px] font-[800] text-header-navy truncate leading-tight">{group.title}</div>
                        <div className="text-[13px] font-medium text-text-sub leading-tight">
                          {group.author} <span className="text-muted-foreground">|</span> {formatDateShort(group.date)} <span className="text-muted-foreground">{group.time}</span>
                        </div>
                        <div className="text-[13px] font-medium text-muted-foreground truncate leading-tight">
                          총 {totalCount}건 (미조치 {openCount}, 완료 {doneCount})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Non-punch cards */}
          {!isPunch && !isBlueprint && (
            <div className="space-y-3 max-[640px]:space-y-2.5">
              {isMyDocs && (
                <>
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border border-rose-300 bg-white text-rose-600">
                        <Info className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 text-[14px] font-semibold leading-none text-rose-800">
                        필수서류 7개 중 {Math.max(0, 7 - submittedRequiredCount)}개 미제출입니다.
                      </div>
                    </div>
                  </div>
                  {filteredRequiredDocs.map((item) => {
                    const pair = requiredDocByType[item.key];
                    const file = pair?.file;
                    const hasFile = !!file && !!resolveFileUrl(file);
                    const selectedId = `required-${item.key}`;
                    const isSelected = selectedIds.has(selectedId);
                    const thumbUrl = hasFile && file?.type === "img" ? resolveFileUrl(file) : "";
                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "bg-card rounded-2xl p-3 max-[640px]:p-2.5 transition-all shadow-soft relative border border-border",
                          isSelected && "border-2 border-primary bg-sky-50/50",
                          requiredDocPulseKey === item.key && "ring-2 ring-indigo-300 scale-[1.01]"
                        )}
                      >
                        <span className={cn("status-badge absolute top-0 right-0 text-[11px] font-bold px-2.5 py-1 text-white rounded-tr-xl rounded-bl-xl z-10", hasFile ? "status-ok bg-slate-500" : "status-none bg-indigo-500")}>
                          {hasFile ? "제출완료" : "미제출"}
                        </span>
                        <div className="flex gap-2 max-[640px]:gap-1.5 items-center">
                          <button
                            type="button"
                            disabled={!hasFile}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!hasFile) return;
                              toggleSelect(selectedId);
                            }}
                            className={cn(
                              "w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all bg-transparent p-0",
                              isSelected ? "bg-sky-500 border-sky-500 shadow-[0_2px_8px_rgba(14,165,233,0.3)]" : "bg-card border-muted-foreground/30",
                              !hasFile && "opacity-40 cursor-not-allowed"
                            )}
                            aria-label={isSelected ? "선택 해제" : "선택"}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                          </button>
                          <div className="w-[56px] h-[56px] max-[640px]:w-[52px] max-[640px]:h-[52px] rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={item.label} className="w-full h-full object-cover" />
                            ) : file?.ext?.toLowerCase() === "pdf" ? (
                              <FileText className="w-7 h-7 text-red-500" />
                            ) : (
                              <FileText className="w-7 h-7 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-0.5 leading-tight">
                            <div className="text-[16px] font-[800] text-header-navy truncate leading-tight">{item.label}</div>
                            <div className="text-[13px] font-medium text-muted-foreground leading-tight">
                              {hasFile ? (file?.name || "제출 파일") : "파일을 올려주세요"}
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 max-[640px]:gap-1.5 items-center mt-1">
                              <div
                                className="w-full"
                                onClick={(e) => {
                                  if (hasFile) return;
                                  e.stopPropagation();
                                  handleRequiredPreviewClick(item.key);
                                }}
                              >
                                <button
                                  type="button"
                                  className={cn(
                                    "action-btn icon-action h-[32px] max-[640px]:h-[30px] w-full rounded-[10px] border text-[12px] font-[800] flex items-center justify-center gap-1.5 max-[640px]:gap-1 transition-all duration-200 group",
                                    hasFile
                                      ? "has-file bg-indigo-50 border-indigo-200 text-indigo-500 font-bold shadow-[0_2px_4px_rgba(99,102,241,0.1)] hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                      : "no-file bg-muted border-border text-muted-foreground opacity-60 cursor-not-allowed"
                                  )}
                                  disabled={!hasFile}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (hasFile && pair?.doc && pair?.file) {
                                      openDocPreview(pair.doc, pair.file);
                                    }
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
                                  미리보기
                                </button>
                              </div>

                              <button
                                type="button"
                                className="h-[32px] max-[640px]:h-[30px] w-full rounded-[10px] border border-[#bae6fd] bg-[#e0f2fe] px-2.5 text-[12px] font-[800] text-[#0284c7] flex items-center justify-center gap-1 transition-all duration-200 hover:bg-[#bae6fd] hover:border-[#7dd3fc] hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerRequiredUpload(item.key);
                                }}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {hasFile ? "변경하기" : "업로드"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {displayedDocs.length === 0 && (!isMyDocs || filteredRequiredDocs.length === 0) ? (
                isMediaArchiveTab ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
                    <p className="text-[16px] font-semibold text-header-navy">등록된 자료가 없습니다.</p>
                    <p className="mt-1 text-[13px] text-text-sub">작업일지에서 사진/도면을 등록하면 자동으로 표시됩니다.</p>
                  </div>
                ) : isMyDocs ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
                    <p className="text-[16px] font-semibold text-header-navy">
                      {search.trim() ? "검색 결과가 없습니다." : "직접 등록한 문서가 없습니다."}
                    </p>
                    <p className="mt-1 text-[13px] text-text-sub">
                      {search.trim() ? "문서명이나 파일명으로 다시 검색해보세요." : "오른쪽 아래 등록 버튼으로 일반 문서를 추가할 수 있습니다."}
                    </p>
                  </div>
                ) : (
                  <EmptyState />
                )
              ) : displayedDocs.map(doc => {
                const isSelected = selectedIds.has(doc.id);
                const canSelect = true;
                const primaryFile = doc.files?.[0];
                const hasFile = !!primaryFile && !!resolveFileUrl(primaryFile);
                const repImg = doc.files?.find(f => f.type === 'img');
                const thumbUrl = repImg ? ((repImg.currentView === 'after' ? repImg.url_after : repImg.url_before) || repImg.url) : null;
                const linkedWorklogId = extractWorklogId(doc.id);
                const mediaCount = doc.files?.length || 0;
                const displayFileName = (() => {
                  if (isMyDocs) return doc.title || primaryFile?.name || "문서";
                  const baseName = primaryFile?.name || doc.title;
                  if (!isMediaArchiveTab || !primaryFile) return baseName;
                  const siteName = (doc.title || "").trim();
                  if (!siteName) return baseName;
                  if (baseName.startsWith(`${siteName}_`)) return baseName;
                  return `${siteName}_${baseName}`;
                })();
                const secondaryFileName =
                  isMyDocs && primaryFile?.name && primaryFile.name !== displayFileName ? primaryFile.name : "";

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      if (isMediaArchiveTab) {
                        if (primaryFile) openDocPreview(doc, primaryFile);
                        return;
                      }
                      if (canSelect) {
                        toggleSelect(doc.id);
                        return;
                      }
                      if (primaryFile) openDocPreview(doc, primaryFile);
                    }}
                    className={cn(
                      "relative bg-card rounded-2xl p-3.5 max-[640px]:p-3 cursor-pointer transition-all shadow-soft flex gap-2.5 max-[640px]:gap-2 items-center",
                      canSelect && isSelected && "border-2 border-primary bg-sky-50/50 shadow-[0_0_0_2px_rgba(49,163,250,0.1)]",
                    )}
                  >
                    {isMediaArchiveTab && (
                      <div className="absolute right-3 top-3 h-[24px] rounded-lg border border-border bg-muted/40 px-2 text-[11px] font-semibold text-text-sub flex items-center justify-center">
                        자동 집계 {mediaCount}건
                      </div>
                    )}
                    {canSelect && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSelect(doc.id);
                        }}
                        className={cn("w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all", isSelected ? "bg-sky-500 border-sky-500 shadow-[0_2px_8px_rgba(14,165,233,0.3)]" : "bg-card border-muted-foreground/30")}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>
                    )}
                    <div className="w-[64px] h-[64px] max-[640px]:w-[60px] max-[640px]:h-[60px] rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-7 h-7 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 max-[640px]:gap-0.5 pt-0.5 leading-tight">
                      {doc.contractor && (
                        <div className="flex gap-1.5 flex-wrap mb-1.5 items-center">
                          {doc.affiliation && (
                            <span className="text-[12px] px-2.5 py-1 rounded-md bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] font-bold leading-none">
                              {doc.affiliation}
                            </span>
                          )}
                          <span className="text-[12px] px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200 font-bold leading-none">
                            {doc.contractor}
                          </span>
                        </div>
                      )}
                      {doc.contractor ? (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-text-sub shrink-0" />
                          <div className="text-[16px] font-[800] text-header-navy truncate flex-1 leading-tight">{displayFileName}</div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {tabKey !== "회사서류" && <FileText className="w-4 h-4 text-text-sub shrink-0" />}
                          <div className="text-[16px] font-[800] text-header-navy truncate flex-1 leading-tight">{displayFileName}</div>
                        </div>
                      )}
                      {secondaryFileName && (
                        <div className="text-[13px] font-medium text-muted-foreground truncate leading-tight">
                          {secondaryFileName}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-text-sub leading-tight">
                        <span className="font-semibold">{doc.author}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{formatDateShort(doc.date)}</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-muted-foreground">{normalizeVersion(primaryFile?.version || doc.version)}</span>
                      </div>

                      {tabKey === "회사서류" && (
                        <div className="mt-1.5 flex gap-2">
                          <button
                            type="button"
                            className={cn(
                              "h-[32px] w-full rounded-[10px] border text-[12px] font-[800] flex items-center justify-center gap-1.5 transition-all duration-200",
                              hasFile
                                ? "bg-indigo-50 border-indigo-200 text-indigo-500 hover:bg-indigo-100 hover:border-indigo-300"
                                : "bg-muted border-border text-muted-foreground opacity-60 cursor-not-allowed"
                            )}
                            disabled={!hasFile}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (primaryFile) openDocPreview(doc, primaryFile);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            미리보기
                          </button>
                        </div>
                      )}

                      {isMediaArchiveTab && (
                        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            className={cn(
                              "h-[32px] w-full rounded-[10px] border text-[12px] font-[800] flex items-center justify-center gap-1.5 transition-all duration-200",
                              hasFile
                                ? "bg-indigo-50 border-indigo-200 text-indigo-500 hover:bg-indigo-100 hover:border-indigo-300"
                                : "bg-muted border-border text-muted-foreground opacity-60 cursor-not-allowed"
                            )}
                            disabled={!hasFile}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (primaryFile) openDocPreview(doc, primaryFile);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            미리보기
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "h-[32px] w-full rounded-[10px] border text-[12px] font-[800] flex items-center justify-center gap-1.5 transition-all duration-200",
                              linkedWorklogId
                                ? "bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300"
                                : "bg-muted border-border text-muted-foreground opacity-60 cursor-not-allowed"
                            )}
                            disabled={!linkedWorklogId}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!linkedWorklogId) return;
                              navigate(`/worklog?focus=${encodeURIComponent(linkedWorklogId)}`);
                            }}
                          >
                            <MapPinIcon className="w-3.5 h-3.5" />
                            일지로 이동
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  );
              })}
            </div>
          )}

          {/* Blueprint Cards */}
          {isBlueprint && (
            <div className="space-y-3 max-[640px]:space-y-2.5">
              {filteredBlueprintSites.length === 0 ? (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-[60px] h-[60px] bg-muted rounded-full mb-5 max-[640px]:w-[48px] max-[640px]:h-[48px]">
                    <FileText className="w-6 h-6 max-[640px]:w-5 max-[640px]:h-5 text-muted-foreground opacity-60" />
                  </div>
                  <p className="text-base font-medium text-muted-foreground mb-2">
                    {search.trim() ? "검색 결과가 없습니다" : "등록된 도면이 없습니다"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {search.trim() ? "다른 키워드로 검색해보세요" : "상단 업로드 버튼을 눌러 도면을 추가해보세요"}
                  </p>
                </div>
              ) : displayedBlueprintSites.map(site => {
                const isSelected = blueprintSelectedIds.has(site.id);
                const latestHistory = site.history[0];

                return (
                  <div
                    key={site.id}
                    ref={(el) => { blueprintCardRefs.current[site.id] = el; }}
                    className={cn(
                      "bg-card rounded-2xl p-4 max-[640px]:p-3.5 cursor-pointer transition-all shadow-soft relative",
                      isSelected && "border-2 border-primary bg-sky-50/50",
                      highlightBlueprintKey === site.id && "ring-2 ring-sky-400 shadow-[0_0_0_4px_rgba(49,163,250,0.15)] animate-pulse"
                    )}
                  >
                    <span className="absolute top-0 right-0 text-[11px] font-bold px-2.5 py-1 text-white rounded-tr-xl rounded-bl-xl z-10 bg-blue-500">
                      도면 {site.totalDrawings}건
                    </span>

                    <div className="flex gap-3 max-[640px]:gap-2.5 items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBlueprintSelectedIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(site.id)) {
                              newSet.delete(site.id);
                            } else {
                              newSet.add(site.id);
                            }
                            return newSet;
                          });
                        }}
                        className={cn(
                          "w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                          isSelected ? "bg-sky-500 border-sky-500 shadow-[0_2px_8px_rgba(14,165,233,0.3)]" : "bg-card border-muted-foreground/30"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </button>

                      <div className="w-[64px] h-[64px] max-[640px]:w-[60px] max-[640px]:h-[60px] rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        <FileText className="w-6 h-6 max-[640px]:w-5 max-[640px]:h-5 text-blue-500" />
                      </div>

                      <div
                        className="flex-1 min-w-0 flex flex-col gap-1 max-[640px]:gap-0.5 pt-0.5 leading-tight"
                        onClick={() => setBlueprintDetailModal({ isOpen: true, blueprintKey: site.id })}
                      >
                        {/* Site info badges */}
                        <div className="flex gap-1.5 flex-wrap mb-1.5">
                          {site.siteSource === "custom" && (
                            <span className="text-[12px] px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              직접입력
                            </span>
                          )}
                          {site.affiliation && <span className="text-[12px] px-2.5 py-0.5 rounded-md bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] font-semibold">{site.affiliation}</span>}
                          {site.contractor && <span className="text-[12px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-500 border border-indigo-200 font-semibold">{site.contractor}</span>}
                        </div>

                        {/* Site name */}
                        <div className="text-[16px] font-[800] text-header-navy truncate leading-tight">{site.siteName}</div>

                        {/* Meta info */}
                        <div className="text-[13px] font-medium text-text-sub leading-tight">
                          {formatDateShort(site.lastUpdated)} <span className="text-muted-foreground">|</span> v{site.currentVersion}
                        </div>

                        {/* Latest summary */}
                        <div className="text-[13px] font-medium text-muted-foreground truncate leading-tight">
                          {latestHistory.author} | {latestHistory.component} | {latestHistory.process}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More / Collapse */}
          {hasMore && (
            <button onClick={() => setVisibleCount(v => v + 5)} className="w-full h-12 flex items-center justify-center gap-1.5 text-text-sub text-[14px] font-semibold border border-border rounded-3xl bg-card shadow-soft mt-4 cursor-pointer hover:bg-muted transition-all">
              <span>더보기</span>
              <ChevronDown className="w-[18px] h-[18px]" />
            </button>
          )}
          {!hasMore && visibleCount > 5 && totalDisplayed > 5 && (
            <button onClick={() => setVisibleCount(5)} className="w-full h-12 flex items-center justify-center gap-1.5 text-text-sub text-[14px] font-semibold border border-border rounded-3xl bg-card shadow-soft mt-4 cursor-pointer hover:bg-muted transition-all">
              <span>접기</span>
              <ChevronUp className="w-[18px] h-[18px]" />
            </button>
          )}
        </>
      )}

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && !detailGroupId && !isMediaArchiveTab && (
        <div className="fixed bottom-[calc(65px+14px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[5000] w-[calc(100%-32px)] max-w-[420px] animate-fade-in">
          <div className="bg-card rounded-xl px-2 py-2 grid grid-cols-3 gap-2 border border-gray-200">
            <button
              type="button"
              onClick={handleBatchDownload}
              disabled={batchBusy}
              className="flex-1 h-[44px] rounded-lg bg-header-navy text-[14px] font-bold text-white transition-all duration-200 hover:bg-header-navy/90 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              저장
            </button>

            <button
              type="button"
              onClick={handleBatchShare}
              disabled={batchBusy}
              className="flex-1 h-[44px] rounded-lg bg-header-navy text-[14px] font-bold text-white transition-all duration-200 hover:bg-header-navy/90 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
              공유
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={batchBusy}
              className="flex-1 h-[44px] rounded-lg bg-red-500 text-[14px] font-bold text-white transition-all duration-200 hover:bg-red-600 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={2.5} />
              삭제
            </button>
          </div>
        </div>
      )}
      {selectedIds.size > 0 && !detailGroupId && isMediaArchiveTab && (
        <div className="fixed bottom-[calc(65px+14px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[5000] w-[calc(100%-32px)] max-w-[420px] animate-fade-in">
          <div className="bg-card rounded-xl border border-gray-200 px-2 py-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleBatchDownload}
                disabled={batchBusy}
                className="h-[44px] rounded-lg bg-header-navy text-[14px] font-bold text-white transition-all duration-200 hover:bg-header-navy/90 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                저장
              </button>
              <button
                type="button"
                onClick={handleBatchShare}
                disabled={batchBusy}
                className="h-[44px] rounded-lg bg-header-navy text-[14px] font-bold text-white transition-all duration-200 hover:bg-header-navy/90 hover:shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                공유
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {!detailGroupId && tabKey !== "회사서류" && !isMediaArchiveTab && (
        <button
          onClick={() => setUploadSheetOpen(true)}
          className="fixed bottom-6 right-[calc(50%-280px)] w-14 h-14 rounded-full bg-header-navy text-white shadow-lg flex items-center justify-center cursor-pointer z-30 active:scale-90 transition-transform max-[600px]:right-4"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      <input
        ref={requiredDocInputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={onRequiredDocFileSelect}
        className="hidden"
      />

      {/* Upload Bottom Sheet */}
      {uploadSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[2100]" onClick={closeUploadSheet} />
          <div className="fixed bottom-0 left-0 right-0 w-full max-w-[600px] mx-auto bg-card border-t border-border z-[2200] rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto overscroll-contain animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-foreground">{isBlueprint ? '도면 등록' : '자료 등록'}</h3>
              <button type="button" onClick={closeUploadSheet} className="bg-transparent border-none cursor-pointer text-foreground p-1"><X className="w-6 h-6" /></button>
            </div>
            
            {isBlueprint ? (
              <>
                <div className="mb-4">
                  <label className="block text-[15px] font-semibold text-text-sub mb-2">현장명 *</label>
                  <input 
                    type="text" 
                    placeholder="현장명을 입력하세요" 
                    value={blueprintUploadData.siteName}
                    onChange={(e) => setBlueprintUploadData(prev => ({ ...prev, siteName: e.target.value }))}
                    className="w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none" 
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBlueprintUploadData(prev => ({ ...prev, siteIsCustom: !prev.siteIsCustom }))}
                      className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground"
                      aria-pressed={blueprintUploadData.siteIsCustom}
                    >
                      <span
                        className={cn(
                          "relative inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors",
                          blueprintUploadData.siteIsCustom ? "bg-sky-500" : "bg-muted"
                        )}
                      >
                        <span
                          className={cn(
                            "h-5 w-5 rounded-full bg-white shadow transition-transform",
                            blueprintUploadData.siteIsCustom ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </span>
                      직접 입력 현장 (기존 현장과 분리 저장)
                    </button>
                  </div>
                  {blueprintUploadData.siteIsCustom && (
                    <div className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
                      신규 현장명만 직접입력으로 분리 저장됩니다.
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 max-[520px]:grid-cols-1">
                  <div>
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">소속 *</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="선택 또는 직접 입력"
                        value={blueprintUploadData.affiliation}
                        onChange={(e) => {
                          setBlueprintUploadData(prev => ({ ...prev, affiliation: e.target.value }));
                          setBpAffOpen(true);
                        }}
                        onFocus={() => setBpAffOpen(true)}
                        onBlur={() => setTimeout(() => setBpAffOpen(false), 120)}
                        className="w-full h-[50px] px-4 pr-14 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
                      />
                      {blueprintUploadData.affiliation && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setBlueprintUploadData(prev => ({ ...prev, affiliation: '' }))}
                          className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[12px] text-muted-foreground z-10"
                          aria-label="소속 지우기"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setBpAffOpen(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        aria-label="소속 옵션 열기"
                      >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </button>
                      {bpAffOpen && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-56 overflow-auto bg-card border border-border rounded-xl shadow-lg">
                          {bpAffiliationOptions
                            .filter(opt => matchKo(opt, blueprintUploadData.affiliation))
                            .map(opt => (
                              <li
                                key={opt}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setBlueprintUploadData(prev => ({ ...prev, affiliation: opt }));
                                  setBpAffOpen(false);
                                }}
                                className="px-4 py-3 cursor-pointer border-b border-border last:border-0 text-[15px] font-medium text-foreground hover:bg-muted"
                              >
                                {opt}
                              </li>
                            ))}
                          {bpAffiliationOptions.filter(opt => matchKo(opt, blueprintUploadData.affiliation)).length === 0 && (
                            <li className="px-4 py-3 text-center text-sm text-muted-foreground">검색 결과가 없습니다</li>
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">원청사 *</label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={["직영", "본사"].includes(blueprintUploadData.affiliation.trim())}
                        onClick={() => setBpContractorOpen(v => !v)}
                        className={cn(
                          "w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none flex items-center justify-between gap-2",
                          ["직영", "본사"].includes(blueprintUploadData.affiliation.trim()) && "opacity-70 cursor-not-allowed hover:border-border"
                        )}
                      >
                        <span className={cn("truncate text-left", !blueprintUploadData.contractorPreset && "text-muted-foreground")}>
                          {blueprintUploadData.contractorPreset || "원청사 선택"}
                        </span>
                        {["직영", "본사"].includes(blueprintUploadData.affiliation.trim()) ? (
                          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {bpContractorOpen && !["직영", "본사"].includes(blueprintUploadData.affiliation.trim()) && (
                        <ul className="absolute z-50 left-0 right-0 top-full mt-1.5 max-h-56 overflow-auto bg-card border border-border rounded-xl shadow-lg">
                          {bpContractorOptions.map(opt => (
                            <li
                              key={opt}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setBlueprintUploadData(prev => ({
                                  ...prev,
                                  contractorPreset: opt,
                                  contractorCustom: opt === "기타" ? prev.contractorCustom : ''
                                }));
                                setBpContractorOpen(false);
                              }}
                              className="px-4 py-3 cursor-pointer border-b border-border last:border-0 text-[15px] font-medium text-foreground hover:bg-muted"
                            >
                              {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {blueprintUploadData.contractorPreset === "기타" && (
                      <input
                        type="text"
                        placeholder="원청사를 직접 입력하세요"
                        value={blueprintUploadData.contractorCustom}
                        onChange={(e) => setBlueprintUploadData(prev => ({ ...prev, contractorCustom: e.target.value }))}
                        className="mt-2 w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 max-[520px]:grid-cols-1">
                  <div>
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">부재명 *</label>
                    <div className="flex flex-wrap gap-2">
                      {MEMBER_CHIPS.map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setBlueprintUploadData(prev => ({
                            ...prev,
                            componentPreset: chip,
                            componentCustom: chip === "기타" ? prev.componentCustom : ''
                          }))}
                          className={cn(
                            "h-10 px-3.5 rounded-full text-[14px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 border shadow-none focus:outline-none",
                            blueprintUploadData.componentPreset === chip
                              ? "bg-header-navy text-white border-transparent"
                              : "bg-white border-border text-[#64748b] hover:border-primary/50"
                          )}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    {blueprintUploadData.componentPreset === "기타" && (
                      <input
                        type="text"
                        placeholder="부재명을 입력하세요"
                        value={blueprintUploadData.componentCustom}
                        onChange={(e) => setBlueprintUploadData(prev => ({ ...prev, componentCustom: e.target.value }))}
                        className="mt-2 w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">작업공정 *</label>
                    <div className="flex flex-wrap gap-2">
                      {PROCESS_CHIPS.map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setBlueprintUploadData(prev => ({
                            ...prev,
                            processPreset: chip,
                            processCustom: chip === "기타" ? prev.processCustom : ''
                          }))}
                          className={cn(
                            "h-10 px-3.5 rounded-full text-[14px] font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 border shadow-none focus:outline-none",
                            blueprintUploadData.processPreset === chip
                              ? "bg-header-navy text-white border-transparent"
                              : "bg-white border-border text-[#64748b] hover:border-primary/50"
                          )}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    {blueprintUploadData.processPreset === "기타" && (
                      <input
                        type="text"
                        placeholder="작업공정을 입력하세요"
                        value={blueprintUploadData.processCustom}
                        onChange={(e) => setBlueprintUploadData(prev => ({ ...prev, processCustom: e.target.value }))}
                        className="mt-2 w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
                      />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {isMyDocs ? (
                  <div className="mb-4">
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">문서명 *</label>
                    <input
                      type="text"
                      placeholder="문서명을 입력해주세요"
                      value={uploadDocName}
                      onChange={(e) => setUploadDocName(e.target.value)}
                      className="w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground placeholder:text-muted-foreground transition-all hover:bg-card hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)] outline-none"
                    />
                  </div>
                ) : (
                  <div className="mb-4">
                    {/* PATCH START: site autocomplete (must select from list) */}
                    <label className="block text-[15px] font-semibold text-text-sub mb-2">현장명 *</label>
                    <SiteCombobox
                      options={siteSelectionOptions}
                      value={uploadSelectedSite?.site_name || ""}
                      onChange={(option) => {
                        if (!option) {
                          setUploadSelectedSite(null);
                          setUploadSiteError(null);
                          return;
                        }
                        const matchedSite =
                          siteList.find((site) => site.site_id === option.siteId) ||
                          siteList.find((site) => site.site_name === option.label) ||
                          null;
                        setUploadSelectedSite(matchedSite);
                        setUploadSiteError(null);
                      }}
                      placeholder="현장명을 선택해주세요"
                      inputClassName="h-[50px] px-4 pr-16 text-[18px]"
                    />
                    {/* PATCH START: only show warning after user interaction */}
                    {(!uploadSelectedSite && !!uploadSiteError) && (
                      <div className="mt-2 text-[12px] font-semibold text-red-600">
                        {uploadSiteError || "현장명을 선택해주세요"}
                      </div>
                    )}
                    {/* PATCH END */}
                    {/* PATCH END */}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-[15px] font-semibold text-text-sub mb-2">등록일</label>
                  {/* PATCH START: controlled date input */}
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full h-[50px] px-4 rounded-xl border border-border bg-card text-[18px] text-foreground outline-none transition-all focus:border-sky-500"
                  />
                  {/* PATCH END */}
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={uploadAccept}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 text-[15px] font-extrabold text-sky-700 transition-colors hover:bg-sky-100 active:scale-[0.98] mb-4"
            >
              <FileUp className="h-5 w-5" />
              파일 선택 (다중 가능)
            </button>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-text-sub mb-2">선택된 파일 ({selectedFiles.length})</div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-card border border-border rounded-lg p-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-text-sub shrink-0" />
                        <span className="text-sm text-foreground truncate">{file.name}</span>
                        <span className="text-xs text-text-sub shrink-0">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={closeUploadSheet} className="flex-1 h-[50px] rounded-xl bg-gray-200 text-[15px] font-bold text-gray-700 transition-all sm:text-base">취소</button>
              {/* PATCH START: disable submit until a site is selected (non-blueprint) */}
              <button
                type="button"
                onClick={isBlueprint ? handleBlueprintUpload : handleUpload}
                disabled={batchBusy || (!isBlueprint && !canSubmitUpload)}
                className={cn(
                  "flex-1 h-[50px] rounded-xl bg-header-navy text-[15px] font-bold text-header-navy-foreground transition-all sm:text-base",
                  (batchBusy || (!isBlueprint && !canSubmitUpload)) && "opacity-50 cursor-not-allowed"
                )}
              >
                등록하기
              </button>
              {/* PATCH END */}
            </div>
          </div>
        </>
      )}

      {/* Blueprint Detail Modal */}
      {blueprintDetailModal.isOpen && blueprintDetailModal.blueprintKey && blueprintDetail && (
        <Drawer.Root
          open={blueprintDetailModal.isOpen}
          onOpenChange={(open) => setBlueprintDetailModal(open ? blueprintDetailModal : { isOpen: false })}
          dismissible
          shouldScaleBackground
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm" />
            <Drawer.Content className="fixed inset-x-0 bottom-0 z-[10000] mx-auto w-full max-w-[600px] rounded-t-3xl bg-card border border-border shadow-[0_-12px_40px_rgba(0,0,0,0.25)] outline-none">
              {/* Drag handle (swipe down to close) */}
              <div className="pt-3 pb-2 flex items-center justify-center">
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-border">
                <div className="min-w-0">
                  <h2 className="text-[18px] font-[800] text-foreground truncate">{blueprintDetail.siteName}</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">도면 히스토리</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBlueprintDetailModal({ isOpen: false })}
                  className="h-8 w-8 rounded-lg border border-border text-muted-foreground shrink-0"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4 mx-auto" />
                </button>
              </div>

              {/* Site Info */}
              <div className="px-5 py-4 border-b border-border bg-muted/20">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    {blueprintDetail.siteSource === "custom" && (
                      <span className="text-[12px] px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold leading-none inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        직접입력
                      </span>
                    )}
                    {blueprintDetail.affiliation && (
                      <span className="text-[12px] px-2.5 py-1 rounded-md bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] font-bold leading-none">
                        {blueprintDetail.affiliation}
                      </span>
                    )}
                    {blueprintDetail.contractor && (
                      <span className="text-[12px] px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-500 border border-indigo-200 font-bold leading-none">
                        {blueprintDetail.contractor}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-muted-foreground whitespace-nowrap">
                    총 {blueprintDetail.totalDrawings}건 · v{blueprintDetail.currentVersion}
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div className="px-5 pb-6 pt-4 max-h-[70vh] overflow-y-auto">
                {blueprintDetail.history.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Timeline line */}
                    {index < blueprintDetail.history.length - 1 && (
                      <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
                    )}

                    <div className="flex gap-4 pb-6">
                      {/* Timeline dot */}
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        v{item.version}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground">{item.author}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-sm text-muted-foreground">{formatDateShort(item.date)} {item.time}</span>
                        </div>

                        <div className="text-sm text-muted-foreground mb-3">
                          {item.component} · {item.process}
                        </div>

                        {/* Files */}
                        {item.files.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {item.files.map(file => (
                              <div key={file.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm truncate">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-1">
                          <button className="flex items-center gap-1 px-3 py-0.5 text-[14px] rounded-full bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd] font-semibold hover:bg-[#bae6fd] hover:border-[#7dd3fc] transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                            마킹
                          </button>
                          <button className="flex items-center gap-1 px-3 py-0.5 text-[14px] rounded-full bg-indigo-50 text-indigo-500 border border-indigo-200 font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                            보기
                          </button>
                          <button className="flex items-center gap-1 px-3 py-0.5 text-[14px] rounded-full bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 hover:border-red-300 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      {/* PATCH START: report editor overlay UI */}
      {reportEditorOpen && reportModel && (
        <>
          <input
            ref={reportPhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onReportPhotoChange}
          />
          <PreviewModal
            open={reportEditorOpen}
            title={`${reportModel.title} · ${reportModel.siteName}`}
            onBack={closeReportEditor}
            onClose={closeReportEditor}
            onSave={generateReportPDF}
            onShare={shareReport}
            zoom={reportZoom}
            contentRef={reportContentRef as unknown as { current: HTMLElement | null }}
            titleClassName="max-w-[150px] truncate sm:max-w-[320px]"
            maxWidthClassName="max-w-[600px]"
          >
            <div className="px-3 py-2">
              <div
                key={`${reportModel.groupId}-${reportEditorRenderKey}`}
                className="bg-white shadow-lg"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "20mm 10mm",
                  boxSizing: "border-box",
                }}
              >
              <div className="text-center border-b-2 border-[#1a254f] pb-3 mb-4">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  data-report-meta="title"
                  onBlur={flushReportEditsToState}
                  className="text-[24px] font-[800] text-[#1a254f] outline-none"
                >
                  {reportModel.title}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  data-report-meta="siteName"
                  onBlur={flushReportEditsToState}
                  className="text-[14px] text-[#666] mt-1 outline-none"
                >
                  {reportModel.siteName}
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  data-report-meta="date"
                  onBlur={flushReportEditsToState}
                  className="text-[12px] text-[#666] mt-0.5 outline-none"
                >
                  {reportModel.date}
                </div>
              </div>

              <table className="w-full border-collapse text-[12px] [table-layout:fixed] [&_th]:align-middle [&_td]:align-middle [&_th]:box-border [&_td]:box-border [&_th]:leading-[1.4] [&_td]:leading-[1.45] [&_td]:whitespace-pre-wrap [&_td]:break-keep [&_td]:[overflow-wrap:anywhere] [&_td]:px-[10px]">
                <colgroup>
                  <col style={{ width: "40px" }} />
                  <col style={{ width: "96px" }} />
                  <col style={{ minWidth: "180px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "64px" }} />
                </colgroup>
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-2 w-10">NO</th>
                    <th className="border border-slate-300 p-2 w-24">위치</th>
                    <th className="border border-slate-300 p-2 min-w-[180px]">지적 내용</th>
                    <th className="border border-slate-300 p-2 w-[88px]">조치 전</th>
                    <th className="border border-slate-300 p-2 w-[88px]">조치 후</th>
                    <th className="border border-slate-300 p-2 w-16">상태</th>
                  </tr>
                </thead>
                <tbody ref={reportTableBodyRef} id="reportTableBody">
                  {reportModel.rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-300 p-2 align-middle">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          data-report-edit="1"
                          data-item-id={row.id}
                          data-field="location"
                          className="min-h-[18px] whitespace-pre-wrap break-keep [overflow-wrap:anywhere] [writing-mode:horizontal-tb] leading-[1.45] outline-none"
                        >
                          {row.location || ""}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 align-middle">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          data-report-edit="1"
                          data-item-id={row.id}
                          data-field="issue"
                          className="min-h-[18px] whitespace-pre-wrap break-keep [overflow-wrap:anywhere] [writing-mode:horizontal-tb] leading-[1.45] outline-none"
                        >
                          {row.issue || ""}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center align-middle">
                        <div className="relative">
                          <button
                            type="button"
                            data-no-pan="1"
                            disabled={reportIsApproved}
                            onClick={() => openReportPhotoPicker(row.id, "beforePhoto")}
                            className={cn(
                              "w-full h-[64px] flex items-center justify-center bg-transparent border-none p-0",
                              reportIsApproved ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                            )}
                          >
                            {row.beforePhoto ? (
                              <img src={row.beforePhoto} alt="before" className="w-full max-h-[64px] h-auto object-contain rounded" />
                            ) : (
                              <span className="text-slate-400 text-[11px]">사진 추가</span>
                            )}
                          </button>
                          {row.beforePhoto && !reportIsApproved && (
                            <button
                              type="button"
                              data-no-pan="1"
                              data-report-remove="1"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearReportPhoto(row.id, "beforePhoto");
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center align-middle">
                        <div className="relative">
                          <button
                            type="button"
                            data-no-pan="1"
                            disabled={reportIsApproved}
                            onClick={() => openReportPhotoPicker(row.id, "afterPhoto")}
                            className={cn(
                              "w-full h-[64px] flex items-center justify-center bg-transparent border-none p-0",
                              reportIsApproved ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                            )}
                          >
                            {row.afterPhoto ? (
                              <img src={row.afterPhoto} alt="after" className="w-full max-h-[64px] h-auto object-contain rounded" />
                            ) : (
                              <span className="text-slate-400 text-[11px]">사진 추가</span>
                            )}
                          </button>
                          {row.afterPhoto && !reportIsApproved && (
                            <button
                              type="button"
                              data-no-pan="1"
                              data-report-remove="1"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearReportPhoto(row.id, "afterPhoto");
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-bold">{statusLabel(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          </PreviewModal>
        </>
      )}
      {/* PATCH END */}
    </div>
  );
}

// ─── Empty State ───
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
        <Search className="w-8 h-8 text-muted-foreground opacity-60" />
      </div>
      <p className="text-[16px] font-medium text-foreground mb-2">검색 결과가 없습니다</p>
    </div>
  );
}

// ─── Punch Detail View Component ───
interface PunchDetailProps {
  group: PunchGroup;
  isApproved: boolean;
  onBack: () => void;
  // PATCH START: report overlay trigger
  onOpenReport: (groupId?: string) => void;
  // PATCH END
  onUpdateField: (itemId: string, field: keyof PunchItem, value: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: () => void;
  onPhotoUpload: (itemId: string, photoType: 'beforePhoto' | 'afterPhoto') => void;
}

function PunchDetailView({ group, isApproved, onBack, onOpenReport, onUpdateField, onDeleteItem, onAddItem, onPhotoUpload }: PunchDetailProps) {
  const items = group.punchItems || [];
  const totalCount = items.length;
  const openCount = items.filter(i => i.status !== 'done').length;
  const doneCount = items.filter(i => i.status === 'done').length;

  return (
    <div className="animate-fade-in">
      {/* Detail Header */}
      <div className="flex items-center justify-between mb-4 -mx-4 px-4 pb-3 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground font-semibold text-[16px] bg-transparent border-none cursor-pointer rounded-lg p-2 -ml-2 hover:bg-muted transition-colors">
          <ArrowLeft className="w-6 h-6" />
          <span>이전</span>
        </button>
        <h2 className="text-[18px] font-bold text-foreground flex-1 text-center px-4 truncate">{group.title}</h2>
        {/* PATCH START: connect report button */}
        <button
          className="bg-muted text-text-sub border border-border rounded-lg px-3 py-1.5 text-[14px] font-bold cursor-pointer hover:bg-card transition-colors whitespace-nowrap"
          onClick={() => onOpenReport(group.id)}
        >
          보고서
        </button>
        {/* PATCH END */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-sky-50 text-sky-600 border border-sky-400">
          <span className="text-[22px] font-[800] leading-tight tracking-tight">{totalCount}</span>
          <span className="text-[13px] font-bold opacity-90 text-sky-700">전체</span>
        </div>
        <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-red-50 text-red-600 border border-red-400">
          <span className="text-[22px] font-[800] leading-tight tracking-tight">{openCount}</span>
          <span className="text-[13px] font-bold opacity-90 text-red-700">미조치</span>
        </div>
        <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-slate-50 text-slate-600 border border-slate-400">
          <span className="text-[22px] font-[800] leading-tight tracking-tight">{doneCount}</span>
          <span className="text-[13px] font-bold opacity-90 text-slate-500">완료</span>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <FileText className="w-[20px] h-[20px] text-header-navy" />
        <h3 className="text-[20px] font-bold text-header-navy">조치 내역 ({totalCount})</h3>
      </div>

      {/* Punch Items */}
      {items.length === 0 ? (
        <div className="p-10 text-center text-text-sub bg-card rounded-2xl border-2 border-dashed border-border">
          등록된 조치 정보가 없습니다.
          <br /><small className="text-[13px] mt-2 block">아래 버튼을 눌러 새로운 하자 내용을 추가하세요.</small>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <PunchItemCard
              key={item.id}
              item={item}
              isApproved={isApproved}
              onUpdateField={onUpdateField}
              onDelete={onDeleteItem}
              onPhotoUpload={onPhotoUpload}
            />
          ))}
        </div>
      )}

      {/* Add Button */}
      {!isApproved ? (
        <button
          onClick={onAddItem}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50 text-[15px] font-extrabold text-sky-700 transition-colors hover:bg-sky-100 active:scale-[0.98] mt-4"
        >
          <FileUp className="h-5 w-5" />
          <span>새로운 하자 내용 추가</span>
        </button>
      ) : (
        <div className="w-full h-[50px] px-5 border border-dashed border-border rounded-xl bg-muted text-muted-foreground text-[16px] font-[800] flex items-center justify-center gap-2.5 mt-4 opacity-60">
          <Lock className="w-6 h-6" />
          <span>승인완료 - 조회만 가능</span>
        </div>
      )}
    </div>
  );
}

// ─── Single Punch Item Card ───
interface PunchItemCardProps {
  item: PunchItem;
  isApproved: boolean;
  onUpdateField: (itemId: string, field: keyof PunchItem, value: string) => void;
  onDelete: (itemId: string) => void;
  onPhotoUpload: (itemId: string, photoType: 'beforePhoto' | 'afterPhoto') => void;
}

function PunchItemCard({ item, isApproved, onUpdateField, onDelete, onPhotoUpload }: PunchItemCardProps) {
  const issueRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = issueRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [item.issue]);

  const priorities = [
    { key: '높음' as const, activeBg: 'bg-red-100', activeText: 'text-red-600', inactiveBg: 'bg-slate-50', inactiveText: 'text-slate-400' },
    { key: '중간' as const, activeBg: 'bg-amber-100', activeText: 'text-amber-600', inactiveBg: 'bg-slate-50', inactiveText: 'text-slate-400' },
    { key: '낮음' as const, activeBg: 'bg-emerald-100', activeText: 'text-emerald-600', inactiveBg: 'bg-slate-50', inactiveText: 'text-slate-400' },
  ];

  const statuses = [
    { key: 'open' as const, label: '미조치', activeText: 'text-red-500' },
    { key: 'ing' as const, label: '진행중', activeText: 'text-blue-500' },
    { key: 'done' as const, label: '완료', activeText: 'text-slate-800' },
  ];

  return (
    <div className="bg-white rounded-xl p-5 relative shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all">
      {/* Delete button */}
      {!isApproved && (
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-300 cursor-pointer p-1 transition-colors hover:text-destructive"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}

      {/* Location */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
        <MapPinIcon className="w-4 h-4 text-text-sub shrink-0" />
        <input
          type="text"
          value={item.location || ''}
          placeholder="위치 (예: 101동 302호)"
          onChange={e => onUpdateField(item.id, 'location', e.target.value)}
          readOnly={isApproved}
          className={cn(
            // Same tone as the "A동 1층" style (compact, bold, subdued)
            "text-[17px] font-bold text-text-sub bg-transparent p-0 border-none outline-none flex-1 min-w-0 truncate",
            isApproved && "pointer-events-none opacity-70"
          )}
        />
      </div>

      {/* Issue */}
      <textarea
        ref={issueRef}
        value={item.issue || ''}
        placeholder="지적 내용을 상세히 입력하세요..."
        onChange={e => {
          onUpdateField(item.id, 'issue', e.target.value);
          // Auto-grow to content (keeps 1-line height initially, expands as needed).
          const el = issueRef.current;
          if (el) {
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          }
        }}
        readOnly={isApproved}
        rows={1}
        className={cn(
          "w-full text-[15px] font-medium text-foreground bg-transparent border-none outline-none resize-none leading-snug min-h-[28px] p-0 mb-3 overflow-y-auto transition-all",
          isApproved && "pointer-events-none opacity-70"
        )}
      />

      {/* Priority & Status */}
      <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
        {/* Priority buttons */}
        <div className="flex gap-1 flex-wrap w-[calc(50%-4px)] min-w-[120px]">
          {priorities.map(p => (
            <button
              key={p.key}
              onClick={() => !isApproved && onUpdateField(item.id, 'priority', p.key)}
              className={cn(
                "py-1.5 px-3 rounded-md text-[12px] font-bold border-none cursor-pointer transition-all min-h-[32px] flex-1",
                item.priority === p.key ? `${p.activeBg} ${p.activeText}` : `${p.inactiveBg} ${p.inactiveText}`,
                isApproved && "pointer-events-none opacity-60"
              )}
            >{p.key}</button>
          ))}
        </div>

        {/* Status toggle */}
        <div className="flex bg-slate-100 rounded-full p-0.5 shrink-0 w-[calc(50%-4px)] min-w-[120px]">
          {statuses.map(s => (
            <button
              key={s.key}
              onClick={() => !isApproved && onUpdateField(item.id, 'status', s.key)}
              className={cn(
                "py-1 px-2 rounded-full text-[11px] font-bold border-none cursor-pointer transition-all min-h-[28px] flex-1 whitespace-nowrap",
                item.status === s.key ? `bg-white ${s.activeText} shadow-sm` : "bg-transparent text-slate-400",
                isApproved && "pointer-events-none opacity-60"
              )}
            >{s.label}</button>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="flex gap-3 mt-3 w-full">
        {(['beforePhoto', 'afterPhoto'] as const).map(photoType => (
          <div
            key={photoType}
            onClick={() => onPhotoUpload(item.id, photoType)}
            className={cn(
              "flex-1 aspect-square bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative hover:bg-slate-100 hover:border-slate-400",
              isApproved && "pointer-events-none opacity-60"
            )}
          >
            {item[photoType] ? (
              <>
                <img src={item[photoType]} className="w-full h-full object-cover absolute inset-0" alt="" />
                <div className={cn(
                  "absolute top-2 left-2 text-white text-[11px] font-[800] px-2.5 py-1 rounded-md",
                  photoType === 'beforePhoto' ? "bg-slate-800" : "bg-sky-500"
                )}>
                  {photoType === 'beforePhoto' ? '보수전' : '보수후'}
                </div>
              </>
            ) : (
              <>
                <Camera className="w-7 h-7 text-slate-300 mb-1" />
                <span className="text-[11px] font-[900] text-slate-400">
                  {photoType === 'beforePhoto' ? '보수전' : '보수후'}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
