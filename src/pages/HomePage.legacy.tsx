import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSaveWorklog } from "@/hooks/useSupabaseWorklogs";
import { useOperationalWorkerNames } from "@/hooks/useOperationalWorkerNames";
import { useUserRole } from "@/hooks/useUserRole";
import PartnerHomePage from "@/components/partner/PartnerHomePage";
import { addToQueue, saveMediaOffline } from "@/lib/offlineStore";
import { useSiteList } from "@/hooks/useSiteList";
import { getSiteAffiliationLabel, getSiteBuilderLabel } from "@/lib/siteList";
import {
  MapPin, Users, HardHat, Package, Image, Camera, ScanLine,
  FileText, ChevronDown, ChevronUp, Plus, Minus, X, ReceiptText
} from "lucide-react";
import { toast } from "sonner";
import DrawingSelectSheet from "@/components/media/DrawingSelectSheet";
import {
  HOME_DRAFT_KEY,
  SITE_DRAWINGS_KEY,
  SITE_PHOTOS_KEY,
  SITE_WORKLOGS_KEY,
  WORKLOG_INDEX_V4_KEY,
} from "@/constants/storageKeys";
import { getTodayYYYYMMDD } from "@/lib/dateFormat";
import quickIconFlash from "@/assets/icons/flash.png";
import quickIconDoc from "@/assets/icons/docs.png";
import quickIconReport from "@/assets/icons/worklog.png";
import quickIconMap from "@/assets/icons/map.png";
import quickIconRequest from "@/assets/icons/request.png";
import quickIconPhoto from "@/assets/icons/photo.png";

/* ─── Constants ─── */
const PREDEFINED_WORKERS = ["이현수", "김철수", "박영희", "정민수", "최지영"];
const MEMBER_CHIPS = ["슬라브", "거더", "기둥", "기타"];
const PROCESS_CHIPS = ["균열", "면", "마감", "기타"];
const TYPE_CHIPS = ["지하", "지상", "지붕", "기타"];

// Quick menu icons must stay local-static in both home-v2 and legacy fallback.
const QUICK_MENU_DEFAULT_ICON = quickIconDoc;
const QUICK_MENU = [
  { id: 1, label: "출력현황", path: "/output", icon: quickIconDoc },
  { id: 2, label: "작업일지", path: "/worklog", badge: 3, badgeClass: "bg-green-600", icon: quickIconReport },
  { id: 3, label: "현장정보", path: "/site", icon: quickIconMap },
  { id: 4, label: "문서함", path: "/doc", icon: quickIconDoc },
  { id: 5, label: "본사요청", path: "/request", icon: quickIconRequest },
  { id: 6, label: "조치사항", path: "/doc", icon: quickIconPhoto },
];

/* ─── Types ─── */
interface ManpowerItem {
  id: number;
  worker: string;
  workHours: number;
  isCustom: boolean;
  locked: boolean;
}

interface WorkSet {
  id: number;
  member: string;
  process: string;
  type: string;
  location: { block: string; dong: string; floor: string };
  customMemberValue: string;
  customProcessValue: string;
  customTypeValue: string;
}

interface MaterialItem {
  id: number;
  name: string;
  qty: number;
}

interface PhotoItem {
  id: number;
  url: string;
  badge: "사진" | "보수" | "완료";
  type: "photo" | "drawing";
}

/* ─── Component ─── */
export default function HomePageLegacy() {
  const { isPartner } = useUserRole();

  if (isPartner) return <PartnerHomePage />;

  return <WorkerHomePageLegacy />;
}

/** iframe 실패 시 폴백용 워커 홈 (HomePage.tsx에서 import) */
export function WorkerHomePageLegacy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveWorklogMutation = useSaveWorklog();
  const { data: siteList = [] } = useSiteList();
  const { data: workerNames = [] } = useOperationalWorkerNames();
  const legacyAllSites = useMemo(
    () =>
      siteList.map((site) => ({
        value: site.site_id,
        text: site.site_name,
        dept: site.builder || site.company_name || site.dept || "원청사",
        contractor: site.builder || site.company_name || site.dept || "원청사",
      })),
    [siteList],
  );

  const allSites = useMemo(
    () =>
      siteList.map((site) => {
        const affiliation = getSiteAffiliationLabel(site);
        const contractor = getSiteBuilderLabel(site) || affiliation;
        return {
          value: site.site_id,
          text: site.site_name,
          dept: affiliation,
          contractor,
        };
      }),
    [siteList],
  );

  const currentWorkerName = useMemo(() => {
    const metadataName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
    if (metadataName) return metadataName;

    const email = typeof user?.email === "string" ? user.email.trim() : "";
    if (!email) return "";

    return email.split("@")[0]?.trim() || email;
  }, [user?.email, user?.user_metadata?.name]);

  const availableWorkers = useMemo(
    () =>
      [...new Set([currentWorkerName, ...workerNames, ...PREDEFINED_WORKERS].map((name) => String(name || "").trim()).filter(Boolean))],
    [currentWorkerName, workerNames],
  );

  const createDefaultManpowerRow = useCallback(
    () => ({
      id: Date.now(),
      worker: currentWorkerName,
      workHours: 1.0,
      isCustom: !currentWorkerName,
      locked: false,
    }),
    [currentWorkerName],
  );

  /* Site */
  const [selectedSite, setSelectedSite] = useState("");
  const [siteSearch, setSiteSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dept, setDept] = useState("INOPNC");
  const [workDate, setWorkDate] = useState(() => getTodayYYYYMMDD());

  /* Manpower */
  const [manpower, setManpower] = useState<ManpowerItem[]>(() => [createDefaultManpowerRow()]);

  /* Work Sets */
  const [workSets, setWorkSets] = useState<WorkSet[]>([
    { id: Date.now(), member: "", process: "", type: "", location: { block: "", dong: "", floor: "" }, customMemberValue: "", customProcessValue: "", customTypeValue: "" },
  ]);

  /* Materials */
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [materialSelect, setMaterialSelect] = useState("NPC-1000");
  const [materialQty, setMaterialQty] = useState("");
  const [isMaterialDirect, setIsMaterialDirect] = useState(false);
  const [customMaterialValue, setCustomMaterialValue] = useState("");

  /* Receipt */
  const [receiptFile, setReceiptFile] = useState<{ name: string } | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  /* Photos & Drawings */
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const drawingInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<number | null>(null);

  /* Drawing Sheet */
  const [drawingSheetOpen, setDrawingSheetOpen] = useState(false);

  /* Summary */
  const [summaryOpen, setSummaryOpen] = useState(false);

  /* Next-step guide */
  const [guideTarget, setGuideTarget] = useState<string | null>(null);
  const [guideBadge, setGuideBadge] = useState<{ target: string; message: string } | null>(null);

  /* Save state */
  const [saveVersion, setSaveVersion] = useState(0);

  /* Auto-update workDate to today on mount and daily */
  useEffect(() => {
    const updateToToday = () => {
      const currentToday = getTodayYYYYMMDD();
      setWorkDate(currentToday);
    };

    // Set to today on mount
    updateToToday();

    // Update at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const midnightTimer = setTimeout(() => {
      updateToToday();
      // Set up daily interval after first midnight
      const dailyInterval = setInterval(updateToToday, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, msUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  /* Validation */
  const hasSite = !!selectedSite;
  const hasWorkDate = !!workDate;
  const hasManpower = manpower.some(m => m.worker && m.workHours > 0);
  const hasWorkSet = workSets.length > 0 && workSets.some(ws => {
    const m = ws.member === "기타" ? ws.customMemberValue : ws.member;
    const p = ws.process === "기타" ? ws.customProcessValue : ws.process;
    return !!m && !!p;
  });
  const isReady = hasSite && hasWorkDate && hasManpower && hasWorkSet;

  /* Refs for scroll targets */
  const siteCardRef = useRef<HTMLDivElement>(null);
  const manpowerCardRef = useRef<HTMLDivElement>(null);
  const workDateRef = useRef<HTMLInputElement>(null);

  /* ─── Guide helpers ─── */
  const showGuide = useCallback((targetId: string, message: string, duration = 2500) => {
    setGuideTarget(targetId);
    setGuideBadge({ target: targetId, message });
    setTimeout(() => {
      setGuideTarget(null);
      setGuideBadge(null);
    }, duration);
  }, []);

  const scrollToElement = useCallback((el: HTMLElement | null, offset = 0.3) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetY = rect.top + scrollTop - (window.innerHeight * offset);
    if (targetY > scrollTop) {
      window.scrollTo({ top: targetY, behavior: "smooth" });
    }
  }, []);

  /* ─── Error shake ─── */
  const [shakeTarget, setShakeTarget] = useState<string | null>(null);
  const triggerShake = useCallback((targetId: string) => {
    setShakeTarget(targetId);
    setTimeout(() => setShakeTarget(null), 2000);
  }, []);

  /* ─── Site Functions ─── */
  const filteredSites = siteSearch.trim()
    ? allSites.filter(s => s.text.toLowerCase().includes(siteSearch.toLowerCase()))
    : allSites;

  const handleSiteSelect = (site: (typeof allSites)[number]) => {
    setSelectedSite(site.value);
    setSiteSearch(site.text);
    const nextDept = site.dept || site.contractor || "";
    setDept(nextDept);
    setShowDropdown(false);

    // Next step: scroll to workDate
    setTimeout(() => {
      scrollToElement(workDateRef.current, 0.35);
      setTimeout(() => showGuide("workDate", "작업일자를 확인해주세요"), 400);
    }, 300);
  };

  const handleWorkDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkDate(e.target.value);
    if (e.target.value) {
      setTimeout(() => {
        scrollToElement(manpowerCardRef.current, 0.3);
        showGuide("manpower-card", "투입인원(공수)를 확인해주세요");
      }, 300);
    }
  };

  const clearSiteSearch = () => {
    setSiteSearch("");
    setSelectedSite("");
    setShowDropdown(true);
  };

  /* ─── Manpower ─── */
  useEffect(() => {
    if (!currentWorkerName) return;
    setManpower((prev) => {
      if (prev.length === 0) return [createDefaultManpowerRow()];
      const [first, ...rest] = prev;
      if (first.isCustom || (first.worker && first.worker !== currentWorkerName)) return prev;
      return [{ ...first, worker: currentWorkerName, isCustom: false, locked: false }, ...rest];
    });
  }, [createDefaultManpowerRow, currentWorkerName]);

  const addManpower = () => {
    setManpower(prev => [...prev, { id: Date.now(), worker: "", workHours: 1.0, isCustom: false, locked: false }]);
  };
  const updateHours = (id: number, delta: number) => {
    setManpower(prev => prev.map(m => m.id === id ? { ...m, workHours: Math.max(0, Math.min(3.5, Math.round((m.workHours + delta) * 2) / 2)) } : m));
  };
  const removeManpower = (id: number) => {
    setManpower(prev => prev.filter(m => m.id !== id));
  };
  const updateWorker = (id: number, value: string) => {
    setManpower(prev => prev.map(m => {
      if (m.id !== id) return m;
      if (value === "__custom__") return { ...m, isCustom: true, worker: "" };
      return { ...m, worker: value, isCustom: m.isCustom };
    }));
  };

  /* ─── Work Sets ─── */
  const addWorkSet = () => {
    setWorkSets(prev => [...prev, { id: Date.now(), member: "", process: "", type: "", location: { block: "", dong: "", floor: "" }, customMemberValue: "", customProcessValue: "", customTypeValue: "" }]);
  };
  const removeWorkSet = (id: number) => {
    setWorkSets(prev => prev.filter(ws => ws.id !== id));
  };
  const toggleChip = (wsId: number, field: "member" | "process" | "type", value: string) => {
    setWorkSets(prev => prev.map(ws => {
      if (ws.id !== wsId) return ws;
      const current = ws[field];
      const next = field === "type" && current === value ? "" : value;
      // Guide to next step when member selected
      if (field === "member" && next) {
        setTimeout(() => showGuide(`ws-${wsId}-process`, "작업공정을 선택해주세요"), 100);
      }
      return { ...ws, [field]: next };
    }));
  };
  const updateLocation = (wsId: number, key: string, value: string) => {
    setWorkSets(prev => prev.map(ws =>
      ws.id === wsId ? { ...ws, location: { ...ws.location, [key]: value } } : ws
    ));
  };
  const updateCustomValue = (wsId: number, key: string, value: string) => {
    setWorkSets(prev => prev.map(ws => ws.id === wsId ? { ...ws, [key]: value } : ws));
  };

  /* ─── Materials ─── */
  const addMaterial = () => {
    const qty = parseFloat(materialQty);
    if (!materialSelect || isNaN(qty) || qty <= 0) {
      toast.error("올바른 수량을 입력하세요");
      return;
    }
    setMaterials(prev => [...prev, { id: Date.now(), name: materialSelect, qty }]);
    setMaterialQty("");
  };
  const removeMaterial = (id: number) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };
  const handleConfirmCustomMaterial = () => {
    if (!customMaterialValue.trim()) { toast.error("자재명을 입력하세요"); return; }
    setMaterialSelect(customMaterialValue.trim());
    setIsMaterialDirect(false);
    toast.success("자재 선택");
  };

  /* ─── Receipt ─── */
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("파일 크기는 10MB 이하만 가능합니다"); return; }
    setReceiptFile({ name: file.name });
    toast.success("영수증이 업로드되었습니다");
    e.target.value = "";
  };

  /* ─── Photos ─── */
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target?.result as string, badge: "사진", type: "photo" }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDrawingFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target?.result as string, badge: "사진", type: "drawing" }]);
      };
      reader.readAsDataURL(file);
    });
    setDrawingSheetOpen(false);
    toast.success("도면이 업로드되었습니다");
  };

  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDrawingFiles(e.target.files);
    e.target.value = "";
  };

  const removePhoto = (id: number) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const cycleBadge = (id: number) => {
    setPhotos(prev => prev.map(p => {
      if (p.id !== id) return p;
      const next = p.badge === "사진" ? "보수" : p.badge === "보수" ? "완료" : "사진";
      return { ...p, badge: next };
    }));
  };

  const handleReplaceMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || replaceTargetId === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotos(prev => prev.map(p => p.id === replaceTargetId ? { ...p, url: ev.target?.result as string } : p));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setReplaceTargetId(null);
  };

  /* ─── Save (offline-aware) ─── */
  const getMissingHomeFields = () => {
    const missing = new Set<string>();
    if (!selectedSite) missing.add("현장");
    if (!workDate) missing.add("작업일자");
    if (!hasManpower) missing.add("투입 인원");

    let hasWorkContent = false;
    workSets.forEach((ws) => {
      const member = (ws.member === "기타" ? ws.customMemberValue : ws.member).trim();
      const process = (ws.process === "기타" ? ws.customProcessValue : ws.process).trim();
      if (member || process) hasWorkContent = true;
      if (!member) missing.add("부재명");
      if (!process) missing.add("작업공정");
    });

    if (!hasWorkContent) missing.add("작업내용");
    return [...missing];
  };

  const handleSave = async () => {
    if (!isReady) {
      const missing = getMissingHomeFields();
      if (!selectedSite) { triggerShake("site-card"); toast.error("현장을 선택하세요"); siteCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      if (!workDate) { triggerShake("site-card"); toast.error("작업일자를 선택하세요"); return; }
      if (!hasManpower) { triggerShake("manpower-card"); toast.error("투입 인원을 입력하세요"); manpowerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      if (!hasWorkSet) {
        const workMissing = missing.filter((item) => ["작업내용", "부재명", "작업공정"].includes(item));
        toast.error(`필수 입력을 확인하세요: ${workMissing.join(", ") || "작업내용"}`);
        return;
      }
      return;
    }

    const newVersion = saveVersion + 1;
    setSaveVersion(newVersion);
    const currentTimestamp = new Date().toISOString();
    const site = allSites.find(s => s.value === selectedSite) || allSites.find(s => s.text === siteSearch);
    const photoRefs = photos
      .filter((item) => item.type === "photo")
      .map((item, index) => ({
        id: `home_photo_${Date.now()}_${index}`,
        type: "photo" as const,
        status: "after",
        timestamp: currentTimestamp,
        url: item.url,
      }));
    const drawingRefs = photos
      .filter((item) => item.type === "drawing")
      .map((item, index) => ({
        id: `home_drawing_${Date.now()}_${index}`,
        type: "drawing" as const,
        status: "progress",
        timestamp: currentTimestamp,
        url: item.url,
      }));

    const worklogPayload = {
      siteValue: selectedSite,
      siteName: site?.text || siteSearch || "",
      dept: dept || site?.dept || site?.contractor || "",
      workDate,
      manpower,
      workSets,
      materials,
      photos: photoRefs,
      drawings: drawingRefs,
      photoCount: photos.filter(p => p.type === "photo").length,
      drawingCount: photos.filter(p => p.type === "drawing").length,
      status: "draft" as const,
      createdAt: currentTimestamp,
      version: newVersion,
    };

    // If offline, queue everything to IndexedDB
    if (!navigator.onLine) {
      try {
        await addToQueue({
          action: "save_worklog",
          payload: worklogPayload,
          createdAt: currentTimestamp,
          retryCount: 0,
          status: "pending",
        });

        // Queue photos
        for (const p of photos.filter(ph => ph.type === "photo")) {
          await saveMediaOffline({
            type: "photo",
            dataUrl: p.url,
            siteValue: selectedSite,
            siteName: site?.text || "",
            workDate,
            badge: p.badge,
            createdAt: currentTimestamp,
          });
          await addToQueue({
            action: "upload_photo",
            payload: {
              siteValue: selectedSite,
              workDate,
              data: { ...p, version: newVersion, timestamp: currentTimestamp, siteName: site?.text || "", workDate },
            },
            createdAt: currentTimestamp,
            retryCount: 0,
            status: "pending",
          });
        }

        // Queue drawings
        for (const d of photos.filter(ph => ph.type === "drawing")) {
          await saveMediaOffline({
            type: "drawing",
            dataUrl: d.url,
            siteValue: selectedSite,
            siteName: site?.text || "",
            workDate,
            createdAt: currentTimestamp,
          });
          await addToQueue({
            action: "upload_drawing",
            payload: {
              siteValue: selectedSite,
              workDate,
              data: { img: d.url, version: newVersion, timestamp: currentTimestamp, siteName: site?.text || "", workDate },
            },
            createdAt: currentTimestamp,
            retryCount: 0,
            status: "pending",
          });
        }

        toast.success(`오프라인 저장 완료 (v${newVersion}) - 연결 시 자동 동기화`, { duration: 4000 });
      } catch {
        toast.error("오프라인 저장 중 오류가 발생했습니다");
      }
      return;
    }

    // Online: save directly
    try {
      // Save to siteWorklogs (versioned, site+date based)
      const existingWorklogs = JSON.parse(localStorage.getItem(SITE_WORKLOGS_KEY) || "{}");
      if (!existingWorklogs[selectedSite]) existingWorklogs[selectedSite] = {};
      const dateKey = workDate;

      if (!existingWorklogs[selectedSite][dateKey]) {
        existingWorklogs[selectedSite][dateKey] = {
          baseInfo: {
            siteName: site?.text || "",
            siteValue: selectedSite,
            dept,
            workDate,
            manpower,
            workSets,
            createdAt: currentTimestamp,
          },
          versions: [],
        };
      } else {
        existingWorklogs[selectedSite][dateKey].baseInfo = {
          siteName: site?.text || "",
          siteValue: selectedSite,
          dept,
          workDate,
          manpower,
          workSets,
          updatedAt: currentTimestamp,
        };
      }

      existingWorklogs[selectedSite][dateKey].versions.push({
        version: newVersion,
        timestamp: currentTimestamp,
        materials,
        photoCount: photos.filter(p => p.type === "photo").length,
        drawingCount: photos.filter(p => p.type === "drawing").length,
      });

      localStorage.setItem(SITE_WORKLOGS_KEY, JSON.stringify(existingWorklogs));

      // Save photos to sitePhotos
      const photoItems = photos.filter(p => p.type === "photo");
      if (photoItems.length > 0) {
        const existingPhotos = JSON.parse(localStorage.getItem(SITE_PHOTOS_KEY) || "{}");
        if (!existingPhotos[selectedSite]) existingPhotos[selectedSite] = {};
        if (!existingPhotos[selectedSite][workDate]) existingPhotos[selectedSite][workDate] = [];
        photoItems.forEach(p => {
          existingPhotos[selectedSite][workDate].push({
            ...p, version: newVersion, timestamp: currentTimestamp, siteName: site?.text || "", workDate,
          });
        });
        localStorage.setItem(SITE_PHOTOS_KEY, JSON.stringify(existingPhotos));
      }

      // Save drawings to siteDrawings
      const drawingItems = photos.filter(p => p.type === "drawing");
      if (drawingItems.length > 0) {
        const existingDrawings = JSON.parse(localStorage.getItem(SITE_DRAWINGS_KEY) || "{}");
        if (!existingDrawings[selectedSite]) existingDrawings[selectedSite] = {};
        if (!existingDrawings[selectedSite][workDate]) existingDrawings[selectedSite][workDate] = [];
        drawingItems.forEach(d => {
          existingDrawings[selectedSite][workDate].push({
            img: d.url, version: newVersion, timestamp: currentTimestamp, siteName: site?.text || "", workDate,
          });
        });
        localStorage.setItem(SITE_DRAWINGS_KEY, JSON.stringify(existingDrawings));
      }

      // Legacy index for worklog tab
      const existing = JSON.parse(localStorage.getItem(WORKLOG_INDEX_V4_KEY) || "{}");
      if (!existing[selectedSite]) existing[selectedSite] = [];
      existing[selectedSite] = existing[selectedSite].filter((w: any) => w.workDate !== workDate);
      existing[selectedSite].unshift({
        site: siteSearch, siteValue: selectedSite, dept, workDate, manpower, workSets, materials,
        photoCount: photos.length, savedAt: currentTimestamp,
      });
      localStorage.setItem(WORKLOG_INDEX_V4_KEY, JSON.stringify(existing));

      // Save to Supabase (or localStorage in test mode)
      await saveWorklogMutation.mutateAsync(worklogPayload);

      toast.success(`성공적으로 저장되었습니다 (v${newVersion})`);
    } catch {
      toast.error("저장 중 오류가 발생했습니다");
    }
  };

  const handleReset = () => {
    if (!window.confirm("모든 입력 내용을 초기화하시겠습니까?")) return;

    localStorage.removeItem(HOME_DRAFT_KEY);
    setSelectedSite("");
    setSiteSearch("");
    setDept("INOPNC");
    setWorkDate(getTodayYYYYMMDD());
    setManpower([createDefaultManpowerRow()]);
    setWorkSets([{ id: Date.now(), member: "", process: "", type: "", location: { block: "", dong: "", floor: "" }, customMemberValue: "", customProcessValue: "", customTypeValue: "" }]);
    setMaterials([]);
    setPhotos([]);
    setReceiptFile(null);
    setSaveVersion(0);
    toast("초기화 완료");
  };

  /* ─── Chip Renderer ─── */
  const ChipGrid = ({ wsId, field, chips, ws }: { wsId: number; field: "member" | "process" | "type"; chips: string[]; ws: WorkSet }) => {
    const customKey = `custom${field.charAt(0).toUpperCase() + field.slice(1)}Value` as keyof WorkSet;
    const isGuided = guideTarget === `ws-${wsId}-${field}`;
    return (
      <div id={`ws-${wsId}-${field}`} className={isGuided ? "next-step-guide" : ""}>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {chips.map(chip => (
            <button
              key={chip}
              onClick={() => toggleChip(wsId, field, chip)}
              className={`h-[54px] rounded-xl border text-base-app font-medium transition-all ${
                ws[field] === chip
                  ? "bg-card border-primary text-primary font-bold shadow-sm"
                  : "bg-[hsl(var(--bg-input))] border-border text-text-sub"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        {ws[field] === "기타" && (
          <input
            className="w-full h-[54px] border border-border rounded-xl px-4 text-base-app mt-1 outline-none transition-all focus:border-primary focus:shadow-input-focus bg-[hsl(var(--bg-input))]"
            placeholder="직접 입력"
            value={ws[customKey] as string}
            onChange={(e) => updateCustomValue(wsId, customKey, e.target.value)}
          />
        )}
      </div>
    );
  };

  /* ─── Summary rows ─── */
  const summaryRows = [
    { label: "현장", value: siteSearch || "선택 안됨" },
    { label: "소속", value: dept || "-" },
    { label: "작업일자", value: workDate },
    { label: "투입인원", value: `${manpower.length}명` },
    { label: "부재명", value: (() => { const ws = workSets[0]; return ws ? (ws.member === "기타" ? ws.customMemberValue : ws.member) || "-" : "-"; })() },
    { label: "작업공정", value: (() => { const ws = workSets[0]; return ws ? (ws.process === "기타" ? ws.customProcessValue : ws.process) || "-" : "-"; })() },
    { label: "작업유형", value: (() => { const ws = workSets[0]; return ws ? (ws.type === "기타" ? ws.customTypeValue : ws.type) || "-" : "-"; })() },
    { label: "블럭/동/층", value: (() => { const ws = workSets[0]; return ws ? `${ws.location.block} ${ws.location.dong} ${ws.location.floor}`.trim() || "-" : "-"; })() },
    { label: "사진/도면 업로드", value: `사진 ${photos.filter(p => p.type === "photo").length}장, 도면 ${photos.filter(p => p.type === "drawing").length}건` },
  ];

  return (
    <div className="animate-fade-in">
      {/* Quick Menu */}
      <section className="py-2.5 pb-5" style={{ paddingTop: 0 }}>
        <div className="flex items-center gap-1.5 mb-4 pl-1">
          <img src={quickIconFlash} alt="빠른메뉴" className="w-5 h-5 object-contain" />
          <span className="text-lg-app font-bold text-header-navy tracking-[-0.5px]">빠른메뉴</span>
        </div>
        <div className="grid grid-cols-6 gap-0.5 w-full">
          {QUICK_MENU.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1.5 cursor-pointer py-1 transition-transform active:scale-95 hover:-translate-y-0.5 ${item.badge !== undefined ? "rounded-[14px] py-1.5 pb-2.5 overflow-visible" : ""}`}
            >
              <div className="relative inline-block">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-[5px] rounded-full text-white text-[10px] font-[900] flex items-center justify-center shadow-md border-2 border-background z-10 animate-pulse ${item.badgeClass || "bg-destructive"}`}>
                    {item.badge}
                  </span>
                )}
                <img src={item.icon || QUICK_MENU_DEFAULT_ICON} onError={(event) => { const target = event.currentTarget; target.onerror = null; target.src = QUICK_MENU_DEFAULT_ICON; }} alt={item.label} className="w-[46px] h-[46px] object-contain drop-shadow-sm" />
              </div>
              <span className="text-tiny font-bold text-foreground text-center leading-tight whitespace-nowrap tracking-[-0.5px]">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Site Card */}
      <div
        ref={siteCardRef}
        id="site-card"
        className={`bg-card rounded-2xl p-6 mb-4 shadow-soft border border-border transition-all ${shakeTarget === "site-card" ? "section-error-highlight" : ""}`}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <MapPin className="w-5 h-5 text-header-navy" />
            작업현장 <span className="text-destructive">*</span>
          </div>
          <span className="bg-destructive/10 text-destructive text-tiny font-bold h-8 px-3.5 rounded-xl flex items-center">* 필수 입력</span>
        </div>

        <div className="mb-3 relative">
          <input
            type="text"
            value={siteSearch}
            onChange={(e) => { setSiteSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedSite(""); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="현장 선택 또는 검색"
            className="w-full h-[54px] bg-[hsl(var(--bg-input))] border border-border rounded-xl px-4 pr-16 text-base-app font-medium outline-none transition-all placeholder:text-muted-foreground focus:border-sky-focus focus:shadow-input-focus"
          />
          {/* Clear button */}
          {siteSearch && (
            <button
              onMouseDown={(e) => { e.preventDefault(); clearSiteSearch(); }}
              className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/30 transition-all z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          {showDropdown && (
            <ul className="absolute z-50 w-full mt-1.5 max-h-60 overflow-auto bg-card border border-border rounded-xl shadow-xl animate-[dropdownSlide_0.2s_ease-out]">
              {filteredSites.length > 0 ? filteredSites.map(s => (
                <li
                  key={s.value}
                  onClick={() => handleSiteSelect(s)}
                  className={`px-4 py-3.5 cursor-pointer text-sm-app font-medium border-b border-border/30 last:border-0 hover:bg-background transition-colors ${
                    selectedSite === s.value ? "text-primary bg-primary/10" : "text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{s.text}</span>
                    <span className="text-tiny text-text-sub bg-background px-2 py-0.5 rounded border border-border">{s.dept}</span>
                  </div>
                </li>
              )) : (
                <li className="px-4 py-3 text-center text-text-sub">검색 결과가 없습니다</li>
              )}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm-app font-bold text-text-sub mb-2">
              소속 <span className="text-sm font-medium ml-1">ㅣ 자동연동</span>
            </label>
            <div className="relative">
              <input type="text" readOnly value={dept} placeholder="자동연동"
                className="w-full h-[54px] bg-background border border-border rounded-xl px-4 text-base-app font-medium text-text-sub cursor-not-allowed" />
              <div className="absolute top-2 right-2">
                <span className="text-[11px] px-1.5 py-0.5 h-5 bg-indigo-50 text-indigo-500 border border-indigo-200 rounded font-bold">현대건설</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm-app font-bold text-text-sub mb-2">작업일자</label>
            <div className="relative">
              <input
                ref={workDateRef}
                type="date"
                value={workDate}
                onChange={handleWorkDateChange}
                className={`w-full h-[54px] bg-[hsl(var(--bg-input))] border rounded-xl px-3 text-sm-app font-medium outline-none transition-all cursor-pointer focus:border-sky-focus focus:shadow-input-focus ${
                  guideTarget === "workDate" ? "border-2 border-sky-focus" : "border-border"
                }`}
              />
              {guideBadge?.target === "workDate" && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-lg z-50 whitespace-nowrap bg-sky-focus animate-[slideDown_0.3s_ease-out]">
                  {guideBadge.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manpower Card */}
      <div
        ref={manpowerCardRef}
        id="manpower-card"
        className={`bg-card rounded-2xl p-6 mb-4 shadow-soft border border-border transition-all ${shakeTarget === "manpower-card" ? "section-error-highlight" : ""} ${guideTarget === "manpower-card" ? "next-step-guide" : ""}`}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <Users className="w-5 h-5 text-header-navy" />
            투입 인원(공수) <span className="text-destructive">*</span>
          </div>
          <button onClick={addManpower} className="bg-primary-bg text-primary h-8 px-3.5 rounded-xl text-sm-app font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span className="text-lg font-[900]">+</span> 추가
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          {manpower.map(item => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)_auto] gap-2 items-center bg-[hsl(var(--bg-input))] p-3 rounded-2xl transition-all">
              {item.locked ? (
                <div className="text-base-app font-bold text-foreground truncate px-1">{item.worker}</div>
              ) : item.isCustom ? (
                <input autoFocus placeholder="이름 입력" value={item.worker}
                  onChange={(e) => updateWorker(item.id, e.target.value)}
                  className="w-full h-[50px] bg-card border border-border rounded-xl px-4 outline-none text-sm-app font-medium placeholder:text-muted-foreground focus:border-primary focus:shadow-input-focus" />
              ) : (
                <select
                  value={item.worker}
                  onChange={(e) => updateWorker(item.id, e.target.value)}
                  className="w-full h-[50px] bg-card border border-border rounded-xl px-4 text-sm-app font-medium appearance-none cursor-pointer outline-none focus:border-primary focus:shadow-input-focus"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "16px" }}
                >
                  <option value="">작업자</option>
                  {availableWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                  <option value="__custom__">직접입력</option>
                </select>
              )}
              <div className="flex h-12 border border-border rounded-xl bg-card overflow-hidden w-full min-w-0">
                <button onClick={() => updateHours(item.id, -0.5)} className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-background"><Minus className="w-4 h-4" /></button>
                <span className="flex-1 flex items-center justify-center text-base-app font-bold text-primary tabular-nums border-x border-border">{item.workHours.toFixed(1)}</span>
                <button onClick={() => updateHours(item.id, 0.5)} className="flex-1 flex items-center justify-center text-xl text-text-sub hover:bg-background"><Plus className="w-4 h-4" /></button>
              </div>
              {!item.locked && (
                <button onClick={() => removeManpower(item.id)} className="bg-destructive/10 text-destructive text-sm-app font-bold px-3 py-1 rounded-xl">삭제</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Work Content Card */}
      <div className="bg-card rounded-2xl p-6 mb-4 shadow-soft border border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <HardHat className="w-5 h-5 text-header-navy" />
            작업내용 <span className="text-destructive">*</span>
          </div>
          <button onClick={addWorkSet} className="bg-primary-bg text-primary h-8 px-3.5 rounded-xl text-sm-app font-bold flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span className="text-lg font-[900]">+</span> 추가
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {workSets.map((ws, idx) => (
            <div key={ws.id} className="bg-card border-2 border-primary rounded-2xl p-5 animate-[slideDown_0.3s_ease-out]">
              <div className="flex justify-between items-center mb-5">
                <span className="text-sm-app font-bold text-primary bg-primary-bg px-3 py-1.5 rounded-lg">작업 세트 {idx + 1}</span>
                <button onClick={() => removeWorkSet(ws.id)} className="bg-destructive/10 text-destructive text-sm-app font-bold px-3 py-1 rounded-xl">삭제</button>
              </div>

              <div className="mb-3">
                <label className="block text-base-app font-bold text-text-sub mb-2">부재명 <span className="text-destructive">*</span></label>
                <ChipGrid wsId={ws.id} field="member" chips={MEMBER_CHIPS} ws={ws} />
              </div>
              <div className="mb-3">
                <label className="block text-base-app font-bold text-text-sub mb-2">작업공정 <span className="text-destructive">*</span></label>
                <ChipGrid wsId={ws.id} field="process" chips={PROCESS_CHIPS} ws={ws} />
              </div>
              <div className="mb-3">
                <label className="block text-base-app font-bold text-text-sub mb-2">작업유형</label>
                <ChipGrid wsId={ws.id} field="type" chips={TYPE_CHIPS} ws={ws} />
              </div>
              <div>
                <label className="block text-base-app font-bold text-text-sub mb-2">블럭 / 동 / 층</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["block", "dong", "floor"] as const).map((key) => (
                    <input key={key}
                      className="h-[54px] border border-border rounded-xl px-4 text-center outline-none transition-all bg-[hsl(var(--bg-input))] focus:border-primary focus:shadow-input-focus"
                      placeholder={key === "block" ? "블럭" : key === "dong" ? "동" : "층"}
                      value={ws.location[key]}
                      onChange={(e) => updateLocation(ws.id, key, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material Card */}
      <div className="bg-card rounded-2xl p-6 mb-4 shadow-soft border border-border">
        <div className="flex justify-between items-center mb-3">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <Package className="w-5 h-5 text-header-navy" />
            자재 사용 내역
            <span className="text-sm text-text-sub font-medium ml-2">ㅣ 자재 있을 시 입력</span>
          </div>
        </div>
        <div className="grid grid-cols-[1.8fr_1fr_auto] gap-2.5 mb-3 items-center">
          <select
            value={materialSelect}
            onChange={(e) => { setMaterialSelect(e.target.value); setIsMaterialDirect(e.target.value === "custom"); }}
            className="h-12 bg-[hsl(var(--bg-input))] border border-border rounded-xl px-4 text-base-app font-medium appearance-none cursor-pointer outline-none transition-all focus:border-sky-focus focus:shadow-input-focus"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", backgroundSize: "16px" }}
          >
            <option value="NPC-1000">NPC-1000</option>
            <option value="NPC-3000Q">NPC-3000Q</option>
            <option value="custom">직접입력</option>
          </select>
          <div className="flex items-center bg-[hsl(var(--bg-input))] border border-border rounded-xl h-12 px-3">
            <input type="number" min="0" value={materialQty} onChange={(e) => setMaterialQty(e.target.value)}
              placeholder="0" className="flex-1 bg-transparent text-right font-medium outline-none w-full" />
            <span className="text-text-sub text-sm-app font-medium ml-1">말</span>
          </div>
          <button onClick={addMaterial} className="w-12 h-12 bg-primary-bg text-primary rounded-xl font-[900] text-lg flex items-center justify-center hover:opacity-80 transition-opacity">+</button>
        </div>

        {isMaterialDirect && (
          <div className="flex gap-2 items-center mb-3">
            <input type="text" value={customMaterialValue} onChange={(e) => setCustomMaterialValue(e.target.value)}
              placeholder="자재명 직접 입력"
              className="flex-1 min-w-0 h-12 bg-[hsl(var(--bg-input))] border border-border rounded-xl px-4 outline-none transition-all text-sm-app focus:border-sky-focus focus:shadow-input-focus" />
            <button onClick={handleConfirmCustomMaterial}
              className="bg-header-navy text-white px-4 h-12 rounded-xl font-bold text-sm-app whitespace-nowrap shrink-0">확인</button>
          </div>
        )}

        {/* Receipt Upload */}
        {materialSelect && materialSelect !== "custom" && (
          <div className="mb-3">
            <input ref={receiptInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceiptUpload} />
            <button
              onClick={() => receiptInputRef.current?.click()}
              className="w-full h-[50px] border border-dashed border-primary bg-primary/5 text-primary rounded-xl font-[800] flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors text-sm-app"
            >
              <ReceiptText className="w-5 h-5" /> 영수증 업로드
            </button>
            {receiptFile && (
              <div className="mt-3 flex items-center justify-between bg-card rounded-lg p-2 border border-primary/30">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground truncate max-w-[200px]">{receiptFile.name}</span>
                </div>
                <button onClick={() => setReceiptFile(null)} className="text-destructive hover:text-destructive/80">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {materials.map(mat => (
            <div key={mat.id} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center text-sm-app">
              <div>
                <span className="font-semibold">{mat.name}</span>
                <span className="text-primary ml-2">{mat.qty}말</span>
              </div>
              <button onClick={() => removeMaterial(mat.id)} className="bg-destructive/10 text-destructive text-sm-app font-bold px-2.5 py-1 rounded-xl">삭제</button>
            </div>
          ))}
        </div>
      </div>

      {/* Photos & Drawings */}
      <div className="bg-card rounded-2xl p-6 mb-4 shadow-soft border border-border">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <Image className="w-5 h-5 text-header-navy" />
            사진 및 도면
          </div>
        </div>

        {photos.length > 0 && (
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-3 pt-2 mb-3 px-1 w-full no-scrollbar">
            {photos.map(p => (
              <div key={p.id} className="relative rounded-xl overflow-hidden shadow-md shrink-0 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <img src={p.url} alt={p.type === "drawing" ? "도면" : "사진"} className="w-[120px] h-[120px] object-cover rounded-xl" />
                <button onClick={() => removePhoto(p.id)}
                  className="absolute top-2 right-2 bg-destructive/90 text-white border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-base font-bold hover:scale-110 transition-transform z-10">
                  <X className="w-4 h-4" />
                </button>
                {/* Badge - clickable to cycle */}
                <button
                  onClick={() => cycleBadge(p.id)}
                  className={`absolute top-2 left-2 text-white px-2 py-1 rounded-md text-[11px] font-bold z-10 cursor-pointer ${
                    p.type === "drawing" ? "bg-teal-500/90" :
                    p.badge === "완료" || p.badge === "보수" ? "bg-muted-foreground/90" : "bg-primary/90"
                  }`}
                >
                  {p.type === "drawing" ? "도면" : p.badge}
                </button>
                {/* Replace button */}
                <button
                  onClick={() => { setReplaceTargetId(p.id); replaceInputRef.current?.click(); }}
                  className="absolute bottom-2 right-2 bg-foreground/65 text-white border-none rounded-[10px] w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-foreground/85 transition-all z-10"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input ref={photoInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <input ref={drawingInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleDrawingUpload} />
        <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceMedia} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-base-app font-bold text-text-sub mb-2">사진등록</div>
            <button onClick={() => photoInputRef.current?.click()}
              className="w-full h-[50px] border border-dashed border-primary bg-primary/5 text-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors text-sm-app">
              <Camera className="w-5 h-5" /> 사진 등록
            </button>
          </div>
          <div>
            <div className="text-base-app font-bold text-text-sub mb-2">도면마킹</div>
            <button
              onClick={() => setDrawingSheetOpen(true)}
              className="w-full h-[50px] border border-dashed border-teal-400 bg-teal-50 text-teal-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-100 transition-colors text-sm-app">
              <ScanLine className="w-5 h-5" /> 도면마킹
            </button>
          </div>
        </div>
      </div>

      {/* Floating Actions */}
      <div className="sticky bottom-[20px] bg-card p-2.5 rounded-2xl border border-border shadow-xl mb-5 z-40 transition-all">
        {isReady && (
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-tiny font-bold px-4 py-1 rounded-full shadow-lg bg-sky-focus animate-pulse">
            ✓ 저장 가능
          </div>
        )}
        <div className="flex gap-2.5">
          <button onClick={handleReset}
            className="flex-1 h-[50px] bg-background text-text-sub font-bold rounded-xl border border-border text-sm-app active:scale-[0.98] transition-transform">
            초기화
          </button>
          <button onClick={handleSave}
            className={`flex-1 h-[50px] text-white font-bold rounded-xl transition-all text-sm-app active:scale-[0.98] ${
              isReady ? "bg-sky-focus shadow-[0_0_0_3px_rgba(135,206,235,0.3)]" : "bg-header-navy"
            }`}>
            {isReady ? "일지저장 가능" : "일지저장"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-6 mb-8 shadow-soft border border-border">
        <div onClick={() => setSummaryOpen(!summaryOpen)}
          className="flex justify-between items-center pb-3 border-b border-border cursor-pointer mb-4">
          <div className="text-xl-app font-bold text-header-navy flex items-center gap-2">
            <FileText className="w-5 h-5 text-header-navy" />
            작성 내용 요약
          </div>
          {summaryOpen ? <ChevronUp className="w-5 h-5 text-text-sub" /> : <ChevronDown className="w-5 h-5 text-text-sub" />}
        </div>
        {summaryOpen && (
          <div className="animate-[slideDown_0.2s_ease-out]">
            {summaryRows.map((row, i) => (
              <div key={row.label} className={`flex justify-between py-1.5 ${i < summaryRows.length - 1 ? "border-b border-border/50" : ""}`}>
                <span className="text-base-app font-bold text-text-sub">{row.label}</span>
                <span className="text-base-app font-semibold text-foreground text-right break-words" style={{ maxWidth: "60%", wordBreak: "break-all" }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <DrawingSelectSheet
        open={drawingSheetOpen}
        onClose={() => setDrawingSheetOpen(false)}
        onUploadFiles={handleDrawingFiles}
        onLoadSiteDrawings={() => toast("현장 도면 불러오기 (준비 중)")}
      />
    </div>
  );
}
