import { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar, Clock, FileText, Eye, EyeOff, Share, Download, X } from "lucide-react";
import { useRef } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWorklogs } from "@/hooks/useSupabaseWorklogs";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMyAdminDirectoryEntry } from "@/hooks/useMyAdminDirectoryEntry";
import SiteCombobox, { type SiteComboboxOption } from "@/components/site/SiteCombobox";
import AdminConsoleTab from "@/components/admin/AdminConsoleTab";
import PartnerOutputPage from "@/components/partner/PartnerOutputPage";
import { createOperationalSiteLookup, resolveOperationalSiteName } from "@/lib/siteList";
import { useSiteList } from "@/hooks/useSiteList";
import { describeWorkerRelevance } from "@/lib/worklogWorker";

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

function compactSiteLabel(siteName: string) {
  const compact = (siteName || "").replace(/\s+/g, "");
  return compact.slice(0, 4);
}

type SalaryHistoryEntry = {
  rawDate: string;
  month: string;
  baseTotal: number;
  man: number;
  price: number;
  year: number;
  netPay: number;
  grossPay: number;
  deductions: number;
};

function buildEmptySalaryEntry(year: number, month: number, dailyRate: number): SalaryHistoryEntry {
  return {
    rawDate: `${year}-${String(month).padStart(2, "0")}`,
    month: `${year}년 ${month}월`,
    baseTotal: 0,
    man: 0,
    price: dailyRate,
    year,
    netPay: 0,
    grossPay: 0,
    deductions: 0,
  };
}

export default function OutputPage() {
  const { isAdmin, isPartner } = useUserRole();

  if (isPartner) return <PartnerOutputPage />;

  return <WorkerOutputPage isAdmin={isAdmin} />;
}

function WorkerOutputPage({ isAdmin }: { isAdmin: boolean }) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { data: directoryEntry } = useMyAdminDirectoryEntry();
  const { data: siteList = [] } = useSiteList();
  const [activeTab, setActiveTab] = useState<'output' | 'salary' | 'admin'>('output');
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [filterSite, setFilterSite] = useState('');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [isPrivacyOn, setIsPrivacyOn] = useState(true);
  const [salHistoryExpanded, setSalHistoryExpanded] = useState(false);
  const [salFilterYear, setSalFilterYear] = useState(today.getFullYear());
  const [salFilterMonth, setSalFilterMonth] = useState<number | null>(null);
  const [salSortFilter, setSalSortFilter] = useState('latest');
  const [showSalDatePicker, setShowSalDatePicker] = useState(false);
  const [salPickerYear, setSalPickerYear] = useState(today.getFullYear());
  const [isPayStubOpen, setIsPayStubOpen] = useState(false);
  const [selectedPayStub, setSelectedPayStub] = useState<SalaryHistoryEntry | null>(null);
  const [editModal, setEditModal] = useState<{ date: string; entries: { site: string; man: number; price: number; worker: string }[] } | null>(null);
  const paystubRef = useRef<HTMLDivElement | null>(null);
  // A4-sized offscreen paystub for PDF capture (keeps table layout consistent even on mobile viewport)
  const paystubPdfRef = useRef<HTMLDivElement | null>(null);
  const payRequestRef = useRef<HTMLDivElement | null>(null);

  const workerNameCandidates = useMemo(() => {
    const metadataName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "";
    const emailName = typeof user?.email === "string" ? user.email.split("@")[0] : "";
    return [...new Set([directoryEntry?.name, profile?.name, metadataName, emailName].map((value) => String(value || "").trim()).filter(Boolean))];
  }, [directoryEntry?.name, profile?.name, user?.email, user?.user_metadata?.name]);
  const normalizedWorkerNames = useMemo(
    () =>
      new Set(
        workerNameCandidates
          .map((name) => String(name || "").toLowerCase().replace(/\s+/g, "").trim())
          .filter(Boolean),
      ),
    [workerNameCandidates],
  );
  // Live worklog data from Supabase
  const { data: worklogs = [] } = useWorklogs({ mode: "worker-output", workerNames: workerNameCandidates });
  const dailyRate = typeof directoryEntry?.daily === "number" ? directoryEntry.daily : 0;
  const siteLookup = useMemo(() => createOperationalSiteLookup(siteList), [siteList]);

  const relevantWorklogsForCurrentWorker = useMemo(
    () =>
      worklogs
        .map((worklog) => {
          const relevance = describeWorkerRelevance(worklog, {
            userId: user?.id,
            normalizedWorkerNames,
          });
          if (!relevance.isRelevant || relevance.effectiveHours <= 0) return null;

          const resolvedSiteName =
            resolveOperationalSiteName(worklog.siteValue || "", worklog.siteName || "", siteLookup) ||
            String(worklog.siteName || "").trim() ||
            String(worklog.siteValue || "").trim() ||
            "현장 미지정";

          return {
            worklog,
            effectiveHours: relevance.effectiveHours,
            resolvedSiteName,
            matchedWorkerName: relevance.matchedWorkerName,
          };
        })
        .filter((item): item is NonNullable<typeof item> => !!item),
    [normalizedWorkerNames, siteLookup, user?.id, worklogs],
  );
  const workerDisplayName =
    directoryEntry?.name ||
    profile?.name ||
    (typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    relevantWorklogsForCurrentWorker[0]?.matchedWorkerName ||
    "-";
  const workerAffiliation = directoryEntry?.affiliation || profile?.affiliation || "이노피앤씨";

  // Build calendar work data from real worklogs
  const workData = useMemo(() => {
    const data: Record<string, { site: string; man: number; price: number; worker: string }[]> = {};
    const monthLogs = relevantWorklogsForCurrentWorker.filter(({ worklog }) => {
      const prefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      return worklog.workDate.startsWith(prefix);
    });

    monthLogs.forEach(({ effectiveHours, resolvedSiteName, worklog }) => {
      if (!data[worklog.workDate]) data[worklog.workDate] = [];
      const price = dailyRate > 0 ? Math.round(effectiveHours * dailyRate) : 0;
      const existing = data[worklog.workDate].find((entry) => entry.site === resolvedSiteName && entry.worker === workerDisplayName);
      if (existing) {
        existing.man = Math.round((existing.man + effectiveHours) * 10) / 10;
        existing.price += price;
        return;
      }
      data[worklog.workDate].push({
        site: resolvedSiteName,
        man: Math.round(effectiveHours * 10) / 10,
        price,
        worker: workerDisplayName,
      });
    });

    return data;
  }, [currentYear, currentMonth, dailyRate, relevantWorklogsForCurrentWorker, workerDisplayName]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info("[output] fetched-worklogs", {
      userId: user?.id,
      count: worklogs.length,
      workerNameCandidates,
    });
  }, [user?.id, workerNameCandidates, worklogs.length]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info("[output] relevant-worklogs", {
      userId: user?.id,
      count: relevantWorklogsForCurrentWorker.length,
      worklogIds: relevantWorklogsForCurrentWorker.map(({ worklog }) => worklog.id),
    });
  }, [relevantWorklogsForCurrentWorker, user?.id]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.info("[output] calendar-date-keys", {
      keys: Object.keys(workData).sort(),
    });
  }, [workData]);

  // Calendar rendering
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();
    const cells: { day: number; isToday: boolean; entries: typeof workData[string] }[] = [];

    for (let d = 1; d <= lastDate; d++) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let entries = workData[dateKey] || [];
      if (filterSite) {
        entries = entries.filter(e => e.site === filterSite);
      }
      const isToday = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth && today.getDate() === d;
      cells.push({ day: d, isToday, entries });
    }

    return { firstDay, cells };
  }, [currentYear, currentMonth, filterSite, workData]);

  const summaryStats = useMemo(() => {
    const sites = new Set<string>();
    let totalMan = 0;
    let workedDays = 0;

    calendarData.cells.forEach(cell => {
      if (cell.entries.length > 0) {
        workedDays++;
        cell.entries.forEach(e => {
          sites.add(e.site);
          totalMan += e.man;
        });
      }
    });

    return { totalSites: sites.size, totalMan: totalMan.toFixed(1), workedDays };
  }, [calendarData]);

  const shareTotals = useMemo(() => {
    let totalMan = 0;
    let totalPay = 0;
    calendarData.cells.forEach(cell => {
      cell.entries.forEach(e => {
        totalMan += e.man;
        totalPay += e.price;
      });
    });
    const deduction = Math.floor(totalPay * 0.033);
    const netPay = totalPay - deduction;
    return { totalMan, totalPay, deduction, netPay };
  }, [calendarData]);

  const shareCalendarCells = useMemo(() => {
    const daysInMonth = calendarData.cells.length;
    const totalSlots = Math.ceil((calendarData.firstDay + daysInMonth) / 7) * 7;
    return Array.from({ length: totalSlots }, (_, idx) => {
      const day = idx - calendarData.firstDay + 1;
      if (day < 1 || day > daysInMonth) return null;
      return calendarData.cells[day - 1];
    });
  }, [calendarData]);

  const siteFilterOptions = useMemo<SiteComboboxOption[]>(() => {
    const latestBySite = new Map<string, { value: string; label: string; latestKey: string }>();
    Object.entries(workData).forEach(([dateKey, entries]) => {
      entries.forEach((entry) => {
        const siteName = (entry.site || "").trim();
        if (!siteName) return;
        const prev = latestBySite.get(siteName);
        if (!prev || dateKey > prev.latestKey) {
          latestBySite.set(siteName, {
            value: siteName,
            label: siteName,
            latestKey: dateKey,
          });
        }
      });
    });
    return [...latestBySite.values()]
      .sort((left, right) => right.latestKey.localeCompare(left.latestKey) || left.label.localeCompare(right.label, "ko"))
      .map(({ latestKey, ...option }) => ({
        ...option,
        description: latestKey,
      }));
  }, [workData]);

  const changeMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const salaryHistory = useMemo<SalaryHistoryEntry[]>(() => {
    const grouped = new Map<string, { man: number; grossPay: number }>();

    relevantWorklogsForCurrentWorker.forEach(({ effectiveHours, worklog }) => {
      const rawDate = (worklog.workDate || "").slice(0, 7);
      if (!rawDate) return;
      const grossPay = dailyRate > 0 ? Math.round(effectiveHours * dailyRate) : 0;
      const bucket = grouped.get(rawDate) || { man: 0, grossPay: 0 };
      bucket.man += effectiveHours;
      bucket.grossPay += grossPay;
      grouped.set(rawDate, bucket);
    });

    return [...grouped.entries()]
      .map(([rawDate, bucket]) => {
        const [yearValue, monthValue] = rawDate.split("-").map((value) => Number(value));
        const deductions = Math.floor(bucket.grossPay * 0.033);
        return {
          rawDate,
          month: `${yearValue}년 ${monthValue}월`,
          baseTotal: bucket.grossPay,
          man: Math.round(bucket.man * 10) / 10,
          price: dailyRate,
          year: yearValue,
          netPay: Math.max(0, bucket.grossPay - deductions),
          grossPay: bucket.grossPay,
          deductions,
        };
      })
      .sort((left, right) => right.rawDate.localeCompare(left.rawDate));
  }, [dailyRate, relevantWorklogsForCurrentWorker]);

  const filteredSalary = useMemo(() => {
    let list = salaryHistory.filter(s => s.year === salFilterYear);
    if (salFilterMonth !== null) {
      list = list.filter(s => {
        const m = parseInt(s.rawDate.split('-')[1]);
        return m === salFilterMonth;
      });
    }
    if (salSortFilter === 'amount') {
      list = [...list].sort((a, b) => b.baseTotal - a.baseTotal);
    }
    return list;
  }, [salFilterYear, salFilterMonth, salSortFilter, salaryHistory]);

  const displayedSalary = salHistoryExpanded ? filteredSalary : filteredSalary.slice(0, 3);
  const currentSalary = salaryHistory.find((entry) => entry.rawDate === `${currentYear}-${String(currentMonth).padStart(2, "0")}`)
    || salaryHistory[0]
    || buildEmptySalaryEntry(currentYear, currentMonth, dailyRate);
  const formatCurrency = (n: number) => n.toLocaleString();

  const openPayStub = (sal: SalaryHistoryEntry) => {
    setSelectedPayStub(sal);
    setIsPayStubOpen(true);
  };

  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });

  const ensureHtml2Canvas = async () => {
    const w = window as typeof window & { html2canvas?: any };
    if (!w.html2canvas) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
  };

  const handlePaymentRequest = async () => {
    if (!payRequestRef.current) return;

    try {
      await ensureHtml2Canvas();
      const w = window as typeof window & { html2canvas?: any };
      const html2canvas = w.html2canvas;
      if (!html2canvas) {
        alert('공유 이미지를 위한 라이브러리가 로드되지 않았습니다.');
        return;
      }

      const canvas = await html2canvas(payRequestRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1));
      if (!blob) {
        alert('공유 이미지를 생성할 수 없습니다.');
        return;
      }

      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const fileName = `급여지급요청서_${monthKey}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: '급여 지급 요청서',
          files: [file],
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('공유용 이미지를 생성할 수 없습니다.');
    }
  };

  const ensurePdfLibs = async () => {
    const w = window as typeof window & { html2canvas?: any; jspdf?: any };
    if (!w.html2canvas) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }
    if (!w.jspdf) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }
  };

  const downloadPayStubPDF = async () => {
    const source = paystubPdfRef.current || paystubRef.current;
    if (!source || !selectedPayStub) return;

    try {
      await ensurePdfLibs();
      const w = window as typeof window & { html2canvas?: any; jspdf?: { jsPDF: any } };
      const html2canvas = w.html2canvas;
      const jsPDF = w.jspdf?.jsPDF;

      if (!html2canvas || !jsPDF) {
        alert('PDF 다운로드를 위한 라이브러리가 로드되지 않았습니다.');
        return;
      }

      // html2canvas가 테이블 텍스트 베이스라인을 아래로 찍는 경우가 있어,
      // 캡처용으로 DOM을 복제 + 스타일 보정 후 렌더링한다. (UI 영향 없음)
      const temp = source.cloneNode(true) as HTMLElement;
      temp.style.position = 'fixed';
      temp.style.left = '0';
      temp.style.top = '-10000px';
      temp.style.width = `${(source as HTMLElement).offsetWidth || 794}px`;
      temp.style.backgroundColor = '#ffffff';
      // Variable font에서 baseline 이슈가 있는 경우가 있어 캡처용 폰트는 일반 폰트로 강제
      temp.style.fontFamily = 'Arial, sans-serif';
      temp.style.pointerEvents = 'none';

      document.body.appendChild(temp);

      try {
        temp.querySelectorAll('td, th').forEach((node) => {
          const el = node as HTMLElement;
          el.style.verticalAlign = 'middle';
          el.style.lineHeight = '1.5';
          // 비대칭 패딩으로 텍스트가 하단에 붙는 현상 완화
          el.style.paddingTop = '6px';
          el.style.paddingBottom = '16px';
          el.style.paddingLeft = '4px';
          el.style.paddingRight = '4px';
          el.style.whiteSpace = 'nowrap';
          el.style.height = 'auto';
          el.style.boxSizing = 'border-box';
        });

        // Capture the A4-layout DOM (or fallback to the on-screen paystub).
        const canvas = await html2canvas(temp, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Fit the rendered image inside a single A4 page (no clipping).
        const margin = 10; // mm
        const maxW = pageWidth - margin * 2;
        const maxH = pageHeight - margin * 2;

        let renderW = maxW;
        let renderH = (canvas.height * renderW) / canvas.width;
        if (renderH > maxH) {
          renderH = maxH;
          renderW = (canvas.width * renderH) / canvas.height;
        }

        const x = (pageWidth - renderW) / 2;
        const y = margin;
        pdf.addImage(imgData, 'PNG', x, y, renderW, renderH);

        pdf.save(`급여명세서_${selectedPayStub.rawDate}.pdf`);
      } finally {
        temp.remove();
      }
    } catch {
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  const paystubGross = selectedPayStub?.grossPay ?? selectedPayStub?.baseTotal ?? 0;
  const paystubDeductions =
    selectedPayStub?.deductions ??
    (selectedPayStub?.netPay != null ? Math.max(0, paystubGross - selectedPayStub.netPay) : Math.floor(paystubGross * 0.033));
  const paystubNet = selectedPayStub?.netPay ?? Math.max(0, paystubGross - paystubDeductions);

  return (
    <div className="animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex border-b border-border -mx-4 px-4 bg-card pt-0" style={{ position: 'sticky', top: 114, zIndex: 30 }}>
        <button
          onClick={() => setActiveTab('output')}
          className={cn(
            "flex-1 min-w-0 h-12 bg-transparent border-none text-[16px] font-semibold cursor-pointer border-b-[3px] transition-all whitespace-nowrap px-1",
            activeTab === 'output' ? "text-primary border-b-primary font-bold" : "text-text-sub border-b-transparent"
          )}
        >
          출력현황
        </button>
        <button
          onClick={() => setActiveTab('salary')}
          className={cn(
            "flex-1 min-w-0 h-12 bg-transparent border-none text-[16px] font-semibold cursor-pointer border-b-[3px] transition-all whitespace-nowrap px-1",
            activeTab === 'salary' ? "text-primary border-b-primary font-bold" : "text-text-sub border-b-transparent"
          )}
        >
          급여현황
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={cn(
              "flex-1 min-w-0 h-12 bg-transparent border-none text-[16px] font-semibold cursor-pointer border-b-[3px] transition-all whitespace-nowrap px-1",
              activeTab === 'admin' ? "text-primary border-b-primary font-bold" : "text-text-sub border-b-transparent"
            )}
          >
            관리자
          </button>
        )}
      </div>

      {/* OUTPUT TAB */}
      {activeTab === 'output' && (
        <div className="animate-fade-in mt-3">
          {/* Site Search + Month Filter */}
          <div className="flex items-center gap-3 max-[640px]:gap-2 mb-3">
            <SiteCombobox
              options={siteFilterOptions}
              value={filterSite}
              onChange={(option) => setFilterSite(option?.label || "")}
              containerClassName="flex-1 min-w-0 md:min-w-[200px]"
            />

            <div className="relative">
              <button
                onClick={() => { setPickerYear(currentYear); setShowMonthPicker(!showMonthPicker); }}
                className={cn(
                  "flex items-center justify-between min-w-[145px] max-[640px]:min-w-[118px] h-[50px] px-4 max-[640px]:px-3 bg-card border border-border rounded-xl text-[17px] max-[640px]:text-[16px] font-bold text-foreground cursor-pointer transition-all hover:border-primary/50",
                  showMonthPicker && "border-primary shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
                )}
              >
                <span>{String(currentYear).slice(-2)}년 {currentMonth}월</span>
                <Calendar className="w-[18px] h-[18px] text-muted-foreground ml-2" />
              </button>

              {showMonthPicker && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-card border border-border rounded-2xl shadow-lg p-4 z-[1000] animate-fade-in">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <button onClick={() => setPickerYear(p => p - 1)} className="p-1 hover:bg-muted rounded"><ChevronLeft className="w-[18px] h-[18px]" /></button>
                    <span className="font-bold text-lg-app">{pickerYear}년</span>
                    <button onClick={() => setPickerYear(p => p + 1)} className="p-1 hover:bg-muted rounded"><ChevronRight className="w-[18px] h-[18px]" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <button
                        key={m}
                        onClick={() => { setCurrentYear(pickerYear); setCurrentMonth(m); setShowMonthPicker(false); }}
                        className={cn(
                          "h-11 rounded-lg text-[15px] font-semibold cursor-pointer transition-all border-none",
                          pickerYear === currentYear && m === currentMonth
                            ? "bg-primary/10 text-primary font-[800]"
                            : "text-text-sub hover:bg-muted hover:text-primary"
                        )}
                      >{m}월</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl overflow-hidden mb-4 bg-card shadow-soft">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <button onClick={() => changeMonth(-1)} className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-muted rounded-full">
                <ChevronLeft className="w-7 h-7" />
              </button>
              <span className="text-[22px] font-[800] text-foreground">{currentYear}년 {currentMonth}월</span>
              <button onClick={() => changeMonth(1)} className="bg-transparent border-none cursor-pointer text-text-sub p-2 hover:bg-muted rounded-full">
                <ChevronRight className="w-7 h-7" />
              </button>
            </div>

            <div className="grid grid-cols-7">
              {WEEK_DAYS.map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "h-9 flex items-center justify-center text-[14px] font-bold border-b border-border bg-muted/50",
                    i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-text-sub"
                  )}
                >{d}</div>
              ))}

              {Array.from({ length: calendarData.firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[96px] border-b border-r border-border bg-card" />
              ))}

              {calendarData.cells.map(cell => {
                const dayOfWeek = (calendarData.firstDay + cell.day - 1) % 7;
                const totalMan = cell.entries.reduce((s, e) => s + e.man, 0);
                const totalPrice = cell.entries.reduce((s, e) => s + e.price, 0);

                return (
                  <div
                    key={cell.day}
                    onClick={() => cell.entries.length > 0 && setEditModal({ date: `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`, entries: cell.entries })}
                    className={cn(
                      "min-h-[96px] p-1.5 flex flex-col items-center gap-0.5 cursor-pointer border-b border-border bg-card hover:bg-muted transition-colors",
                      dayOfWeek < 6 && "border-r"
                    )}
                  >
                    <span className={cn(
                      "text-[15px] font-bold w-[26px] h-[26px] rounded-full flex items-center justify-center mb-1",
                      cell.isToday ? "bg-header-navy text-white font-[800]" : dayOfWeek === 0 ? "text-destructive" : dayOfWeek === 6 ? "text-primary" : "text-foreground"
                    )}>{cell.day}</span>

                    {cell.entries.length > 0 && (
                      <div className="w-full flex flex-col items-center">
                        <span className="inline-flex w-fit whitespace-nowrap text-[11px] font-bold text-text-sub">{totalMan.toFixed(1)}</span>
                        <span className="text-[12px] font-[800] text-primary">{(totalPrice / 10000).toFixed(0)}만</span>
                        {cell.entries.length === 1 && (
                          <span className="max-w-full text-center text-[10px] font-bold text-text-sub">
                            {compactSiteLabel(cell.entries[0].site)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2.5 mb-0">
            <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-[hsl(201_100%_94%)] text-[#0284c7] border border-[#0284c7]">
              <span className="text-[22px] font-[800] leading-tight tracking-tight">{summaryStats.totalSites}</span>
              <span className="text-[13px] font-bold opacity-90">현장수</span>
            </div>
            <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-[hsl(225_33%_95%)] text-[#1e3a8a] border border-[#1e3a8a]">
              <span className="text-[22px] font-[800] leading-tight tracking-tight">{summaryStats.totalMan}</span>
              <span className="text-[13px] font-bold opacity-90">공수</span>
            </div>
            <div className="p-3 rounded-2xl text-center flex flex-col gap-1 shadow-soft bg-muted text-text-sub border border-text-sub">
              <span className="text-[22px] font-[800] leading-tight tracking-tight">{summaryStats.workedDays}</span>
              <span className="text-[13px] font-bold opacity-90">근무일</span>
            </div>
          </div>
        </div>
      )}

      {/* SALARY TAB */}
      {activeTab === 'salary' && (
        <div className="animate-fade-in mt-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-[20px] h-[20px] text-header-navy" />
              <span className="text-[20px] font-bold text-header-navy">이번 달 지급 대기</span>
            </div>
            <button
              onClick={() => setIsPrivacyOn(!isPrivacyOn)}
              className="bg-transparent border-none flex items-center gap-1 cursor-pointer text-text-sub text-[15px] font-semibold p-0"
            >
              <span>금액 보기/숨기기</span>
              {isPrivacyOn ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Current Salary Card */}
          <div className="bg-card shadow-sm rounded-2xl p-6 mb-4 border border-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg-app font-[800] text-foreground" style={{ fontSize: 18 }}>
                {currentYear}년 {currentMonth}월
              </span>
              <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full border bg-[#f0f9ff] text-[#0284c7] border-[#7dd3fc]">지급대기</span>
            </div>

            <div className="flex justify-between items-center mb-2 pb-3.5 border-b border-dashed border-border gap-2">
              <span className="font-bold text-foreground shrink-0">실수령 예정액</span>
              <div className="flex items-baseline justify-end gap-0.5 whitespace-nowrap">
                <span className="text-[24px] text-primary font-[800] tracking-tighter">
                  {isPrivacyOn ? '****' : formatCurrency(currentSalary.netPay)}
                </span>
                <span className="text-base-app font-semibold text-primary">원</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2 text-[15px]">
              <span className="font-bold text-foreground shrink-0">공수</span>
              <span className="font-semibold text-foreground text-[16px]">{currentSalary.man.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-[15px]">
              <span className="font-bold text-foreground shrink-0">일당(3.3%공제)</span>
              <span className="font-semibold text-foreground text-[16px]">
                {isPrivacyOn ? '****' : currentSalary.price > 0 ? `${formatCurrency(currentSalary.price)}원` : '-'}
              </span>
            </div>

            <button
              onClick={handlePaymentRequest}
              className="w-full mt-4 h-[50px] rounded-[10px] bg-header-navy text-white font-bold text-base-app cursor-pointer flex items-center justify-center gap-2 border-none transition-all active:scale-[0.98]"
            >
              <Share className="w-[18px] h-[18px]" />
              지급 요청하기 (공유)
            </button>
          </div>

          {/* History */}
          <div className="flex justify-between items-center mb-3 mt-[12px]">
            <div className="flex items-center gap-2">
              <FileText className="w-[20px] h-[20px] text-header-navy" />
              <span className="text-[20px] font-bold text-header-navy">지난 급여 내역</span>
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <button
                onClick={() => { setSalPickerYear(salFilterYear); setShowSalDatePicker(!showSalDatePicker); }}
                className={cn(
                  "flex items-center justify-between w-full h-[50px] px-4 bg-card border border-border rounded-xl text-[17px] font-bold text-foreground cursor-pointer transition-all hover:border-primary/50",
                  showSalDatePicker && "border-primary shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
                )}
              >
                <span>{salFilterYear}년 {salFilterMonth !== null ? `${salFilterMonth}월` : '전체'}</span>
                <Calendar className="w-[18px] h-[18px] text-muted-foreground" />
              </button>

              {showSalDatePicker && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-[280px] bg-card border border-border rounded-2xl shadow-lg p-4 z-[1000] animate-fade-in">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <button onClick={() => setSalPickerYear(p => p - 1)} className="p-1 hover:bg-muted rounded"><ChevronLeft className="w-[18px] h-[18px]" /></button>
                    <span className="font-bold text-lg-app">{salPickerYear}년</span>
                    <button onClick={() => setSalPickerYear(p => p + 1)} className="p-1 hover:bg-muted rounded"><ChevronRight className="w-[18px] h-[18px]" /></button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <button
                        key={m}
                        onClick={() => { setSalFilterYear(salPickerYear); setSalFilterMonth(m); setShowSalDatePicker(false); }}
                        className={cn(
                          "h-11 rounded-lg text-[15px] font-semibold cursor-pointer transition-all border-none",
                          salFilterYear === salPickerYear && salFilterMonth === m
                            ? "bg-primary/10 text-primary font-[800]"
                            : "text-text-sub hover:bg-muted hover:text-primary"
                        )}
                      >{m}월</button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => { setSalFilterYear(salPickerYear); setSalFilterMonth(null); setShowSalDatePicker(false); }}
                      className="w-full h-11 rounded-lg text-[15px] font-semibold cursor-pointer transition-all text-text-sub hover:bg-muted hover:text-primary border-none bg-transparent"
                    >해당 연도 전체</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <select
                value={salSortFilter}
                onChange={e => setSalSortFilter(e.target.value)}
                className="w-full h-[50px] bg-card border border-border rounded-xl px-3.5 pr-10 text-[17px] font-semibold text-foreground shadow-soft appearance-none outline-none cursor-pointer transition-all hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
              >
                <option value="latest">최신순</option>
                <option value="amount">금액순</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-sub pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {displayedSalary.map(sal => (
              <div
                key={sal.rawDate}
                onClick={() => openPayStub(sal)}
                className="bg-card shadow-soft rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] border border-border"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg-app font-[800] text-foreground" style={{ fontSize: 18 }}>
                    {sal.month}
                  </span>
                  <span className="text-[13px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300">지급완료</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-border mb-2">
                  <span className="font-bold text-foreground">실수령액</span>
                  <span className="text-[20px] font-[800] text-primary tracking-tight">
                    {isPrivacyOn ? '****' : `${formatCurrency(sal.netPay)}원`}
                  </span>
                </div>
                <div className="flex justify-between text-[15px] text-text-sub">
                  <span>공수 <strong className="text-foreground">{sal.man.toFixed(1)}</strong></span>
                  <span>총액 <strong className="text-foreground">{isPrivacyOn ? '****' : `${formatCurrency(sal.baseTotal)}원`}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {filteredSalary.length > 3 && (
            <button
              onClick={() => setSalHistoryExpanded(!salHistoryExpanded)}
              className="w-full h-[50px] bg-card border border-border rounded-full text-text-sub font-semibold text-[15px] cursor-pointer mt-2.5 mb-5 flex items-center justify-center gap-1.5 transition-all hover:bg-muted"
            >
              <span>{salHistoryExpanded ? '접기' : '더 보기'}</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", salHistoryExpanded && "rotate-180")} />
            </button>
          )}
        </div>
      )}


      {/* ADMIN TAB - Admin only */}
      {activeTab === 'admin' && isAdmin && <AdminConsoleTab />}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-5" onClick={() => setEditModal(null)}>
          <div className="bg-card w-full max-w-[440px] rounded-[20px] p-6 shadow-lg max-h-[80vh] overflow-y-auto border border-border" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[20px] font-[800] text-foreground">작업 상세 정보</span>
              <button onClick={() => setEditModal(null)} className="bg-transparent border-none text-text-sub p-1 cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            <div className="text-sm-app text-text-sub mb-3 font-medium">{editModal.date}</div>
            <div className="mt-2">
              {editModal.entries.map((entry, i) => (
                <div key={i} className="flex justify-between items-start py-2.5 border-b border-border gap-3">
                  <div>
                    <div className="text-[15px] font-bold text-text-sub">{entry.site}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-semibold text-foreground">{entry.man}공수</div>
                    <div className="text-[15px] font-semibold text-primary">{formatCurrency(entry.price)}원</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PayStub Overlay */}
      {isPayStubOpen && selectedPayStub && (
        <div className={cn("fixed inset-0 bg-background z-[2000] flex flex-col transition-transform duration-300", isPayStubOpen ? "translate-y-0" : "translate-y-full")}>
          <div className="h-[60px] px-4 flex items-center justify-between bg-card border-b border-border shrink-0">
            <button onClick={() => setIsPayStubOpen(false)} className="bg-transparent border-none text-foreground cursor-pointer"><X className="w-6 h-6" /></button>
            <span className="text-lg-app font-bold text-foreground">급여명세서 조회</span>
            <div className="w-6" />
          </div>
          <div className="flex-1 p-5 max-[640px]:p-3 pb-10 overflow-y-auto">
            <div ref={paystubRef} className="w-full max-w-[500px] bg-white rounded-2xl shadow-lg p-10 max-[640px]:p-6 text-[#111] mx-auto">
              <div className="flex justify-between items-end border-b-2 border-header-navy pb-5 mb-8">
                <div>
                  <h2 className="text-[32px] font-[800] text-header-navy tracking-tight leading-tight m-0">급여명세서</h2>
                  <span className="text-[22px] font-bold text-header-navy">{selectedPayStub.month}</span>
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold text-[#111]">이노피앤씨</div>
                  <div className="text-[14px] text-[#64748b] font-medium">{selectedPayStub.rawDate}-25 발급</div>
                </div>
              </div>

              <table className="w-full border-collapse mb-5 border border-[#d1d5db]">
                <tbody>
                  <tr>
                    <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">성명</th>
                    <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{workerDisplayName}</td>
                    <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">소속</th>
                    <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{workerAffiliation}</td>
                  </tr>
                  <tr>
                    <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">공수</th>
                    <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{selectedPayStub.man.toFixed(1)}</td>
                    <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">단가</th>
                    <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">₩{formatCurrency(selectedPayStub.price)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse mb-0 border-t border-header-navy">
                <tbody>
                  <tr>
                    <th colSpan={2} className="bg-header-navy text-white text-[14px] font-bold text-center p-2 border border-[#556080] border-b-0">지급내역</th>
                    <th colSpan={2} className="bg-header-navy text-white text-[14px] font-bold text-center p-2 border border-[#556080] border-b-0">공제내역</th>
                  </tr>
                  <tr>
                    <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">항목</td>
                    <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">금액</td>
                    <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">항목</td>
                    <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">금액</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-[#d1d5db] text-[14px]">기본급</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px] text-right font-medium">₩{formatCurrency(paystubGross)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px]">공제합계</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px] text-right font-medium">₩{formatCurrency(paystubDeductions)}</td>
                  </tr>
                  <tr className="bg-[#f8fafc] font-[800]">
                    <td className="p-2 border border-[#d1d5db] text-[14px]">지급합계</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px] text-right">₩{formatCurrency(paystubGross)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px]">공제합계</td>
                    <td className="p-2 border border-[#d1d5db] text-[14px] text-right">₩{formatCurrency(paystubDeductions)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-5 bg-[#eff6ff] rounded-2xl p-6 flex justify-between items-center">
                <span className="text-[16px] font-bold text-header-navy">실수령액</span>
                <span className="text-[28px] font-[800] text-[#2563eb]">₩{formatCurrency(paystubNet)}</span>
              </div>

              {/* 급여 산정 기준표: 모바일에서 잘림 방지 (카드형) */}
              <div className="mt-5 sm:hidden">
                <div className="border border-[#d1d5db] rounded-2xl overflow-hidden">
                  <div className="bg-header-navy text-white text-[14px] font-bold text-center py-2">급여 산정 기준</div>
                  <div className="divide-y divide-[#e5e7eb]">
                    <div className="flex justify-between items-center px-4 py-3 text-[13px]">
                      <span className="font-bold text-[#334155]">공수</span>
                      <span className="font-semibold text-[#111]">{selectedPayStub.man.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-[13px]">
                      <span className="font-bold text-[#334155]">단가</span>
                      <span className="font-semibold text-[#111]">₩{formatCurrency(selectedPayStub.price)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-[13px]">
                      <span className="font-bold text-[#334155]">총액</span>
                      <span className="font-semibold text-[#111]">₩{formatCurrency(paystubGross)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-[13px]">
                      <span className="font-bold text-[#334155]">공제</span>
                      <span className="font-semibold text-[#ef4444]">-₩{formatCurrency(paystubDeductions)}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-[13px] bg-[#eff6ff]">
                      <span className="font-bold text-header-navy">실수령</span>
                      <span className="font-[800] text-[#2563eb]">₩{formatCurrency(paystubNet)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablet/Desktop: 표 형태 */}
              <table className="hidden sm:table w-full border-collapse mt-5">
                <tbody>
                  <tr className="bg-header-navy text-white font-bold text-[14px]">
                    <td colSpan={5} className="p-2 text-center">급여 산정 기준</td>
                  </tr>
                  <tr>
                    <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">공수</th>
                    <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">단가</th>
                    <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">총액</th>
                    <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">공제</th>
                    <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">실수령</th>
                  </tr>
                  <tr>
                    <td className="p-2 border border-[#d1d5db] text-[13px] text-center">{selectedPayStub.man.toFixed(1)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(selectedPayStub.price)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubGross)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubDeductions)}</td>
                    <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubNet)}</td>
                  </tr>
                </tbody>
              </table>

              <p className="mt-6 text-center text-[14px] text-[#64748b] font-medium">본 명세서는 참고용이며, 실제 지급액과 차이가 있을 수 있습니다.</p>
            </div>

            <button
              onClick={downloadPayStubPDF}
              className="mt-4 w-full max-w-[500px] mx-auto bg-header-navy text-white text-base-app font-bold rounded-xl h-14 border-none flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 shadow-lg"
            >
              <Download className="w-5 h-5" />
              PDF 다운로드
            </button>

            {/* A4 PayStub (PDF 전용 캡처용) */}
            <div
              ref={paystubPdfRef}
              className="fixed left-[-10000px] top-0 w-[794px] bg-white text-[#111]"
              style={{ fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
            >
              <div className="p-[56px]">
                <div className="flex justify-between items-end border-b-2 border-header-navy pb-6 mb-8">
                  <div>
                    <h2 className="text-[36px] font-[800] text-header-navy tracking-tight leading-tight m-0">급여명세서</h2>
                    <span className="text-[24px] font-bold text-header-navy">{selectedPayStub.month}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-bold text-[#111]">이노피앤씨</div>
                    <div className="text-[14px] text-[#64748b] font-medium">{selectedPayStub.rawDate}-25 발급</div>
                  </div>
                </div>

                <table className="w-full border-collapse mb-6 border border-[#d1d5db]">
                  <tbody>
                    <tr>
                      <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">성명</th>
                      <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{workerDisplayName}</td>
                      <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">소속</th>
                      <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{workerAffiliation}</td>
                    </tr>
                    <tr>
                      <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">공수</th>
                      <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">{selectedPayStub.man.toFixed(1)}</td>
                      <th className="bg-[#f8fafc] text-header-navy font-bold text-[14px] p-2 border border-[#d1d5db] w-1/4 text-center">단가</th>
                      <td className="font-medium text-[14px] p-2 border border-[#d1d5db] text-center">₩{formatCurrency(selectedPayStub.price)}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="w-full border-collapse mb-0 border-t border-header-navy">
                  <tbody>
                    <tr>
                      <th colSpan={2} className="bg-header-navy text-white text-[14px] font-bold text-center p-2 border border-[#556080] border-b-0">지급내역</th>
                      <th colSpan={2} className="bg-header-navy text-white text-[14px] font-bold text-center p-2 border border-[#556080] border-b-0">공제내역</th>
                    </tr>
                    <tr>
                      <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">항목</td>
                      <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">금액</td>
                      <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">항목</td>
                      <td className="bg-[#e0f2fe] text-header-navy font-bold text-[14px] text-center p-2 border border-[#d1d5db]">금액</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-[#d1d5db] text-[14px]">기본급</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px] text-right font-medium">₩{formatCurrency(paystubGross)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px]">공제합계</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px] text-right font-medium">₩{formatCurrency(paystubDeductions)}</td>
                    </tr>
                    <tr className="bg-[#f8fafc] font-[800]">
                      <td className="p-2 border border-[#d1d5db] text-[14px]">지급합계</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px] text-right">₩{formatCurrency(paystubGross)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px]">공제합계</td>
                      <td className="p-2 border border-[#d1d5db] text-[14px] text-right">₩{formatCurrency(paystubDeductions)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6 bg-[#eff6ff] rounded-2xl p-6 flex justify-between items-center">
                  <span className="text-[16px] font-bold text-header-navy">실수령액</span>
                  <span className="text-[28px] font-[800] text-[#2563eb]">₩{formatCurrency(paystubNet)}</span>
                </div>

                <table className="w-full border-collapse mt-6">
                  <tbody>
                    <tr className="bg-header-navy text-white font-bold text-[14px]">
                      <td colSpan={5} className="p-2 text-center">급여 산정 기준</td>
                    </tr>
                    <tr>
                      <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">공수</th>
                      <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">단가</th>
                      <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">총액</th>
                      <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">공제</th>
                      <th className="bg-header-navy text-white text-[13px] p-2 border border-[#556080] text-center">실수령</th>
                    </tr>
                    <tr>
                      <td className="p-2 border border-[#d1d5db] text-[13px] text-center">{selectedPayStub.man.toFixed(1)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(selectedPayStub.price)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubGross)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubDeductions)}</td>
                      <td className="p-2 border border-[#d1d5db] text-[13px] text-center">₩{formatCurrency(paystubNet)}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="mt-8 text-center text-[14px] text-[#64748b] font-medium">본 명세서는 참고용이며, 실제 지급액과 차이가 있을 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Request Share Sheet (A4, hidden offscreen) */}
      <div
        ref={payRequestRef}
        className="fixed left-[-10000px] top-0 w-[794px] min-h-[1123px] bg-white text-[#0f172a]"
        style={{ fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
      >
        <div className="p-[56px]">
          <div className="text-[36px] font-[800] text-[#1e2a57]">급여 지급 요청서</div>
          <div className="mt-2 text-[24px] font-[700] text-[#64748b]">{currentYear}년 {currentMonth}월</div>
          <div className="mt-4 h-[2px] bg-[#1e2a57]" />

          <div className="mt-8 flex justify-between items-start">
            <div />
            <div className="text-right">
              <div className="text-[18px] font-[700] text-[#64748b]">실수령 예정액</div>
              <div className="mt-2 text-[42px] font-[800] text-[#3b82f6]">{formatCurrency(shareTotals.netPay)}원</div>
            </div>
          </div>

          <div className="mt-6 rounded-[22px] bg-[#f8fafc] p-6 border border-[#e2e8f0]">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-[16px] font-[700] text-[#64748b]">총 공수</div>
                <div className="mt-2 text-[28px] font-[800] text-[#0f172a]">{shareTotals.totalMan.toFixed(1)} 공수</div>
              </div>
              <div>
                <div className="text-[16px] font-[700] text-[#64748b]">총 지급액</div>
                <div className="mt-2 text-[28px] font-[800] text-[#0f172a]">{formatCurrency(shareTotals.totalPay)}원</div>
              </div>
            </div>
            <div className="mt-4 border-t border-dashed border-[#cbd5e1]" />
            <div className="mt-4 flex justify-between items-center text-[18px] font-[700] text-[#64748b]">
              <span>공제금액 (3.3%)</span>
              <span className="text-[#ef4444]">-{formatCurrency(shareTotals.deduction)}원</span>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-[#e2e8f0] overflow-hidden">
            <div className="grid grid-cols-7 bg-[#f8fafc] text-center text-[16px] font-[700] text-[#334155]">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div
                  key={d}
                  className={cn(
                    "py-3 border-b border-r border-[#e2e8f0]",
                    i === 0 ? "text-[#ef4444]" : i === 6 ? "text-[#2563eb]" : "text-[#334155]",
                    i === 6 && "border-r-0"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {shareCalendarCells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className={cn(
                        "h-[90px] border-b border-r border-[#e2e8f0]",
                        (idx + 1) % 7 === 0 && "border-r-0"
                      )}
                    />
                  );
                }

                const totalMan = cell.entries.reduce((s, e) => s + e.man, 0);
                const totalPay = cell.entries.reduce((s, e) => s + e.price, 0);
                let siteLabel = '';
                if (cell.entries.length > 0) {
                  const base = cell.entries[0].site.replace(/\s+/g, '');
                  const shortName = base.slice(0, 4);
                  siteLabel = cell.entries.length > 1 ? `${shortName}외${cell.entries.length - 1}` : shortName;
                }

                return (
                  <div
                    key={`day-${cell.day}`}
                    className={cn(
                      "h-[90px] border-b border-r border-[#e2e8f0] p-2 text-[#0f172a]",
                      (idx + 1) % 7 === 0 && "border-r-0"
                    )}
                  >
                    <div className="text-[16px] font-[700]">{cell.day}</div>
                    {cell.entries.length > 0 && (
                      <div className="mt-1 text-[12px] text-[#64748b] leading-tight">
                        <div className="font-[700] text-[#0f172a]">{totalMan.toFixed(1)}공수</div>
                        <div className="font-[800] text-[#2563eb]">{(totalPay / 10000).toFixed(0)}만</div>
                        <div className="truncate">{siteLabel}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 text-center text-[#94a3b8] text-[14px] font-[600]">Generated by INOPNC App</div>
        </div>
      </div>
    </div>
  );
}





