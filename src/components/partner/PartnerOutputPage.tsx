import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SiteCombobox, { type SiteComboboxOption } from "@/components/site/SiteCombobox";
import { useWorklogs } from "@/hooks/useSupabaseWorklogs";
import { useSiteList } from "@/hooks/useSiteList";
import { createOperationalSiteLookup, resolveOperationalSiteName } from "@/lib/siteList";

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

type PartnerDayEntry = {
  site: string;
  people: number;
  note: string;
};

function buildEntryNote(worklog: { dept?: string; workSets?: Array<{ process?: string; member?: string }> }) {
  const process = worklog.workSets?.find((item) => item.process || item.member);
  return [worklog.dept, process?.process, process?.member].filter(Boolean).join(" · ");
}

function countPeople(manpower: Array<{ worker?: string; workHours?: number }> | undefined) {
  if (!Array.isArray(manpower) || manpower.length === 0) return 1;
  const filled = manpower.filter((item) => String(item.worker || "").trim() || Number(item.workHours || 0) > 0).length;
  return Math.max(1, filled || manpower.length);
}

export default function PartnerOutputPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [filterSite, setFilterSite] = useState("");
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [detailModal, setDetailModal] = useState<{ date: string; entries: PartnerDayEntry[] } | null>(null);
  const { data: worklogs = [] } = useWorklogs();
  const { data: siteList = [] } = useSiteList();
  const siteLookup = useMemo(() => createOperationalSiteLookup(siteList), [siteList]);

  const workData = useMemo(() => {
    const data: Record<string, PartnerDayEntry[]> = {};
    const prefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    worklogs
      .filter((worklog) => (worklog.workDate || "").startsWith(prefix))
      .forEach((worklog) => {
        const dateKey = worklog.workDate || "";
        if (!dateKey) return;
        const site = resolveOperationalSiteName(worklog.siteValue || "", worklog.siteName || "", siteLookup);
        if (!site) return;
        const people = countPeople(worklog.manpower);
        const note = buildEntryNote(worklog);
        if (!data[dateKey]) data[dateKey] = [];

        const existing = data[dateKey].find((entry) => entry.site === site && entry.note === note);
        if (existing) {
          existing.people += people;
          return;
        }

        data[dateKey].push({ site, people, note });
      });

    return data;
  }, [currentMonth, currentYear, siteLookup, worklogs]);

  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();
    const cells: { day: number; isToday: boolean; entries: PartnerDayEntry[] }[] = [];

    for (let day = 1; day <= lastDate; day += 1) {
      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      let entries = workData[dateKey] || [];
      if (filterSite) {
        entries = entries.filter((entry) => entry.site === filterSite);
      }
      const isToday = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth && today.getDate() === day;
      cells.push({ day, isToday, entries });
    }

    return { firstDay, cells };
  }, [currentMonth, currentYear, filterSite, today, workData]);

  const summaryStats = useMemo(() => {
    const sites = new Set<string>();
    let totalPeople = 0;
    let workedDays = 0;

    calendarData.cells.forEach((cell) => {
      if (cell.entries.length === 0) return;
      workedDays += 1;
      cell.entries.forEach((entry) => {
        sites.add(entry.site);
        totalPeople += entry.people;
      });
    });

    return { totalSites: sites.size, totalPeople, workedDays };
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
    let nextMonth = currentMonth + delta;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    setCurrentMonth(nextMonth);
    setCurrentYear(nextYear);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-3 flex items-center gap-3">
        <SiteCombobox
          options={siteFilterOptions}
          value={filterSite}
          onChange={(option) => setFilterSite(option?.label || "")}
          containerClassName="flex-1 min-w-[200px]"
        />

        <div className="relative">
          <button
            onClick={() => {
              setPickerYear(currentYear);
              setShowMonthPicker((prev) => !prev);
            }}
            className={cn(
              "flex h-[54px] min-w-[145px] items-center justify-between rounded-xl border border-border bg-card px-4 text-[17px] font-bold text-foreground transition-all hover:border-primary/50",
              showMonthPicker && "border-primary shadow-[0_0_0_3px_rgba(49,163,250,0.15)]",
            )}
          >
            <span>{currentYear}년 {currentMonth}월</span>
            <Calendar className="ml-2 h-[18px] w-[18px] text-muted-foreground" />
          </button>

          {showMonthPicker && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-[1000] w-[280px] animate-fade-in rounded-2xl border border-border bg-card p-4 shadow-lg">
              <div className="mb-4 flex items-center justify-between px-1">
                <button onClick={() => setPickerYear((prev) => prev - 1)} className="rounded p-1 hover:bg-muted">
                  <ChevronLeft className="h-[18px] w-[18px]" />
                </button>
                <span className="text-lg-app font-bold">{pickerYear}년</span>
                <button onClick={() => setPickerYear((prev) => prev + 1)} className="rounded p-1 hover:bg-muted">
                  <ChevronRight className="h-[18px] w-[18px]" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setCurrentYear(pickerYear);
                      setCurrentMonth(month);
                      setShowMonthPicker(false);
                    }}
                    className={cn(
                      "h-11 rounded-lg border-none text-[15px] font-semibold transition-all",
                      pickerYear === currentYear && month === currentMonth
                        ? "bg-primary/10 font-[800] text-primary"
                        : "text-text-sub hover:bg-muted hover:text-primary",
                    )}
                  >
                    {month}월
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-2xl bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border p-6">
          <button onClick={() => changeMonth(-1)} className="rounded-full border-none bg-transparent p-2 text-text-sub hover:bg-muted">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <span className="text-[22px] font-[800] text-foreground">{currentYear}년 {currentMonth}월</span>
          <button onClick={() => changeMonth(1)} className="rounded-full border-none bg-transparent p-2 text-text-sub hover:bg-muted">
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>

        <div className="grid grid-cols-7">
          {WEEK_DAYS.map((dayLabel, index) => (
            <div
              key={dayLabel}
              className={cn(
                "flex h-9 items-center justify-center border-b border-border bg-muted/50 text-[14px] font-bold",
                index === 0 ? "text-destructive" : index === 6 ? "text-primary" : "text-text-sub",
              )}
            >
              {dayLabel}
            </div>
          ))}

          {Array.from({ length: calendarData.firstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[96px] border-b border-r border-border bg-card" />
          ))}

          {calendarData.cells.map((cell) => {
            const dayOfWeek = (calendarData.firstDay + cell.day - 1) % 7;
            const totalPeople = cell.entries.reduce((sum, entry) => sum + entry.people, 0);

            return (
              <div
                key={cell.day}
                onClick={() => cell.entries.length > 0 && setDetailModal({
                  date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`,
                  entries: cell.entries,
                })}
                className={cn(
                  "flex min-h-[96px] cursor-pointer flex-col items-center gap-0.5 border-b border-border bg-card p-1.5 transition-colors hover:bg-muted",
                  dayOfWeek < 6 && "border-r",
                )}
              >
                <span
                  className={cn(
                    "mb-1 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[15px] font-bold",
                    cell.isToday ? "bg-header-navy font-[800] text-white" : dayOfWeek === 0 ? "text-destructive" : dayOfWeek === 6 ? "text-primary" : "text-foreground",
                  )}
                >
                  {cell.day}
                </span>

                {cell.entries.length > 0 && (
                  <div className="flex w-full flex-col items-center">
                    <span className="text-[13px] font-[800] text-primary">{totalPeople}명</span>
                    <span className="max-w-full truncate text-center text-[11px] font-bold text-text-sub">
                      {cell.entries.length === 1
                        ? cell.entries[0].site.replace(/\s+/g, "").slice(0, 4)
                        : `${cell.entries[0].site.replace(/\s+/g, "").slice(0, 4)} 외 ${cell.entries.length - 1}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2.5">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[#0284c7] bg-[hsl(201_100%_94%)] p-4 text-center text-[#0284c7] shadow-soft">
          <span className="text-[24px] font-[800] leading-tight tracking-tight">{summaryStats.totalSites}</span>
          <span className="text-[14px] font-bold opacity-90">현장수</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[#1e3a8a] bg-[hsl(225_33%_95%)] p-4 text-center text-[#1e3a8a] shadow-soft">
          <span className="text-[24px] font-[800] leading-tight tracking-tight">{summaryStats.totalPeople}</span>
          <span className="text-[14px] font-bold opacity-90">투입인원</span>
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-text-sub bg-muted p-4 text-center text-text-sub shadow-soft">
          <span className="text-[24px] font-[800] leading-tight tracking-tight">{summaryStats.workedDays}</span>
          <span className="text-[14px] font-bold opacity-90">투입일</span>
        </div>
      </div>

      {detailModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 p-5" onClick={() => setDetailModal(null)}>
          <div
            className="max-h-[80vh] w-full max-w-[440px] overflow-y-auto rounded-[20px] border border-border bg-card p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[20px] font-[800] text-foreground">작업 상세 정보</span>
              <button onClick={() => setDetailModal(null)} className="cursor-pointer border-none bg-transparent p-1 text-text-sub">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-3 text-sm-app font-medium text-text-sub">{detailModal.date}</div>
            <div className="mt-2">
              {detailModal.entries.map((entry, index) => (
                <div key={`${entry.site}-${index}`} className="flex items-start justify-between gap-3 border-b border-border py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-foreground">{entry.site}</div>
                    {entry.note && <div className="mt-0.5 text-[13px] text-muted-foreground">{entry.note}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[15px] font-[800] text-primary">{entry.people}명</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-[15px] font-bold text-text-sub">합계</span>
              <span className="text-[18px] font-[800] text-primary">
                {detailModal.entries.reduce((sum, entry) => sum + entry.people, 0)}명
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
