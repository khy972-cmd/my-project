import { useState, useMemo } from "react";
import { Search, X, ChevronDown, Calendar, Pin, PinOff, MapPin, Camera, Map as MapIcon, FileCheck2, Eye, ArrowLeft, Info, Image, FolderOpen, Upload, ClipboardList, Loader2 } from "lucide-react";
import { PARTNER_PINNED_SITES_KEY } from "@/constants/storageKeys";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Types ─── */
type StatusType = "all" | "pending" | "wait" | "approved";

interface SiteWorklogSummary {
  id: string;
  siteName: string;
  siteId: string;
  latestDate: string;
  status: "pending" | "wait" | "approved";
  latestContent: string;
  workerCount: number;
  totalDays: number;
  totalManpower: number;
  isPinned: boolean;
  detailDates: { date: string; man: number }[];
  photos: { name: string; date: string }[];
  drawings: { name: string; date: string }[];
  certDocs: { name: string; date: string }[];
}

const STATUS_MAP = {
  pending: { label: "진행", bgCls: "bg-[hsl(217_100%_96%)]", textCls: "text-blue-500", borderCls: "border-blue-200", badgeBg: "bg-blue-500" },
  wait: { label: "예정", bgCls: "bg-[hsl(263_100%_97%)]", textCls: "text-violet-600", borderCls: "border-violet-200", badgeBg: "bg-violet-500" },
  approved: { label: "완료", bgCls: "bg-muted", textCls: "text-muted-foreground", borderCls: "border-border", badgeBg: "bg-muted-foreground" },
};

function mapSiteStatus(siteStatus: string): "pending" | "wait" | "approved" {
  if (siteStatus === "진행중") return "pending";
  if (siteStatus === "예정") return "wait";
  return "approved";
}

export default function PartnerWorklogPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [sortFilter, setSortFilter] = useState<"latest" | "name">("latest");
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(PARTNER_PINNED_SITES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [visibleCount, setVisibleCount] = useState(5);
  const [detailLog, setDetailLog] = useState<SiteWorklogSummary | null>(null);
  const [cumulOpen, setCumulOpen] = useState(false);

  // Fetch partner's assigned sites with worklog summaries
  const { data: siteWorklogs = [], isLoading } = useQuery({
    queryKey: ["partner-worklog-sites", user?.id],
    queryFn: async (): Promise<SiteWorklogSummary[]> => {
      if (!user) return [];

      // 1. Get sites the partner is a member of
      const { data: memberships, error: memErr } = await supabase
        .from("site_members")
        .select("site_id")
        .eq("user_id", user.id);

      if (memErr) throw memErr;
      if (!memberships || memberships.length === 0) return [];

      const siteIds = memberships.map(m => m.site_id);

      // 2. Get site details
      const { data: sites, error: siteErr } = await supabase
        .from("sites")
        .select("*")
        .in("id", siteIds);

      if (siteErr) throw siteErr;

      // 3. Get worklogs for these sites
      const { data: worklogs, error: wlErr } = await supabase
        .from("worklogs")
        .select(`
          id, site_id, site_name, work_date, status, dept,
          worklog_manpower(worker_name, work_hours),
          worklog_worksets(member, process, work_type, block, dong, floor)
        `)
        .in("site_id", siteIds)
        .order("work_date", { ascending: false });

      if (wlErr) throw wlErr;

      // 4. Get documents for these sites
      const { data: docs } = await supabase
        .from("documents")
        .select("id, title, doc_type, file_ext, site_id, work_date, created_at")
        .in("site_id", siteIds);

      // 5. Aggregate per site
      return (sites || []).map(site => {
        const siteWls = (worklogs || []).filter(w => w.site_id === site.id);
        const siteDocs = (docs || []).filter(d => d.site_id === site.id);
        const latestWl = siteWls[0];

        // Build detail dates (recent work dates with manpower)
        const detailDates = siteWls.slice(0, 10).map(wl => {
          const mp = (wl.worklog_manpower || []).reduce((sum: number, m: any) => sum + Number(m.work_hours || 8) / 8, 0);
          return {
            date: new Date(wl.work_date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }).replace(". ", ".").replace(".", "."),
            man: Math.round(mp * 10) / 10 || (wl.worklog_manpower || []).length,
          };
        });

        const totalManpower = siteWls.reduce((sum, wl) => {
          const mp = (wl.worklog_manpower || []).reduce((s: number, m: any) => s + Number(m.work_hours || 8) / 8, 0);
          return sum + (mp || (wl.worklog_manpower || []).length);
        }, 0);

        // Build latest content from worksets
        let latestContent = "";
        if (latestWl) {
          const ws = (latestWl.worklog_worksets || [])[0];
          if (ws) {
            const parts = [ws.block, ws.dong, ws.floor, ws.process].filter(Boolean);
            latestContent = parts.join(" | ") || ws.work_type || "";
          }
        }

        const latestWorkerCount = latestWl ? (latestWl.worklog_manpower || []).length : 0;

        return {
          id: site.id,
          siteName: site.name,
          siteId: site.id,
          latestDate: latestWl?.work_date || site.created_at?.slice(0, 10) || "",
          status: mapSiteStatus(site.status),
          latestContent,
          workerCount: latestWorkerCount,
          totalDays: siteWls.length,
          totalManpower: Math.round(totalManpower * 10) / 10,
          isPinned: pinnedIds.has(site.id),
          detailDates,
          photos: siteDocs.filter(d => d.doc_type === "photo").map(d => ({ name: d.title, date: d.created_at?.slice(0, 10) || "" })),
          drawings: siteDocs.filter(d => d.doc_type === "drawing").map(d => ({ name: d.title, date: d.created_at?.slice(0, 10) || "" })),
          certDocs: siteDocs.filter(d => d.doc_type === "cert" || d.doc_type === "completion").map(d => ({ name: d.title, date: d.created_at?.slice(0, 10) || "" })),
        };
      });
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    let list = siteWorklogs.map(s => ({ ...s, isPinned: pinnedIds.has(s.id) }));
    list = list.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q || l.siteName.toLowerCase().includes(q) || l.latestContent.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || l.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      if (sortFilter === "name") return a.siteName.localeCompare(b.siteName, "ko");
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });
    return list;
  }, [siteWorklogs, pinnedIds, search, statusFilter, sortFilter]);

  const stats = useMemo(() => ({
    pending: siteWorklogs.filter(l => l.status === "pending").length,
    wait: siteWorklogs.filter(l => l.status === "wait").length,
    approved: siteWorklogs.filter(l => l.status === "approved").length,
  }), [siteWorklogs]);

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(PARTNER_PINNED_SITES_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="현장명, 작업내용 검색"
            className="w-full h-[54px] bg-card border border-border rounded-xl px-4 pr-10 text-[17px] font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <select
          value={sortFilter}
          onChange={e => setSortFilter(e.target.value as "latest" | "name")}
          className="w-[120px] h-[54px] bg-card border border-border rounded-xl px-3 text-[15px] font-semibold text-foreground appearance-none cursor-pointer outline-none"
        >
          <option value="latest">최신순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {(["pending", "wait", "approved"] as const).map(key => {
          const st = STATUS_MAP[key];
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className={cn(
                "p-3.5 rounded-xl text-center flex flex-col items-center gap-1 border cursor-pointer transition-all active:scale-[0.98] shadow-soft",
                st.bgCls, st.borderCls,
                statusFilter === key && "ring-2 ring-primary/30"
              )}
            >
              <span className={cn("text-[22px] font-[800]", st.textCls)}>{stats[key]}</span>
              <span className={cn("text-[13px] font-semibold", st.textCls)}>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* Card List */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-2">
          <ClipboardList className="w-10 h-10 opacity-50" />
          <p>{user ? "배정된 현장이 없습니다." : "로그인이 필요합니다."}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map(log => {
            const st = STATUS_MAP[log.status];
            const hasPhoto = log.photos.length > 0;
            const hasDraw = log.drawings.length > 0;
            const hasCert = log.certDocs.length > 0;
            return (
              <div
                key={log.id}
                onClick={() => { setDetailLog(log); setCumulOpen(false); }}
                className={cn(
                  "bg-card rounded-2xl shadow-soft overflow-hidden relative cursor-pointer transition-all active:scale-[0.98]",
                  log.isPinned && "border-2 border-primary shadow-[0_4px_12px_rgba(49,163,250,0.2)]"
                )}
              >
                <span className={cn("absolute top-0 right-0 text-[11px] font-bold px-3 py-1 text-white rounded-bl-xl z-10", st.badgeBg)}>{st.label}</span>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-1 text-[15px] text-text-sub font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> {log.latestDate}
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[19px] font-[800] text-header-navy flex-1 truncate mr-2">{log.siteName}</span>
                    <button
                      onClick={e => { e.stopPropagation(); togglePin(log.id); }}
                      className={cn("p-1 transition-colors", log.isPinned ? "text-primary" : "text-border")}
                    >
                      {log.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                  </div>
                  {log.latestContent && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[15px] font-semibold text-foreground truncate">{log.latestContent}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
                    <span className="text-[15px] font-semibold flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{log.workerCount}명</span>
                      <span className="text-text-sub">({log.totalDays}일)</span>
                    </span>
                    <div className="flex gap-2 items-center">
                      <Camera className={cn("w-4 h-4", hasPhoto ? "text-header-navy" : "text-border")} />
                      <MapIcon className={cn("w-4 h-4", hasDraw ? "text-header-navy" : "text-border")} />
                      <FileCheck2 className={cn("w-4 h-4", hasCert ? "text-header-navy" : "text-border")} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 5)}
          className="w-full h-[50px] mt-4 bg-card border border-border rounded-full text-text-sub font-semibold text-[15px] flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:bg-muted active:scale-[0.98]"
        >
          더 보기 <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Detail Overlay */}
      {detailLog && (
        <div className="fixed inset-0 z-[2000] bg-background flex flex-col animate-fade-in">
          <div className="h-[60px] px-4 flex items-center justify-between bg-card border-b border-border">
            <button onClick={() => setDetailLog(null)} className="bg-transparent border-none">
              <ArrowLeft className="w-6 h-6 text-text-sub" />
            </button>
            <span className="text-[18px] font-[800] text-header-navy absolute left-1/2 -translate-x-1/2">현장 상세 정보</span>
            <div className="w-6" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-10">
            {/* Overview */}
            <div className="bg-card rounded-2xl p-5 mb-4 shadow-soft">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                <span className="text-[17px] font-[800] text-header-navy flex items-center gap-2">
                  <Info className="w-5 h-5" /> 현장 개요
                </span>
                <span className={cn(
                  "text-[13px] font-[800] px-3 py-1.5 rounded-full text-white",
                  STATUS_MAP[detailLog.status].badgeBg
                )}>
                  {STATUS_MAP[detailLog.status].label}
                </span>
              </div>
              <div className="space-y-2.5 text-[15px]">
                <div className="flex justify-between"><span className="text-text-sub font-medium">현장명</span><span className="font-bold text-foreground">{detailLog.siteName}</span></div>
                <div className="flex justify-between"><span className="text-text-sub font-medium">작업내용</span><span className="font-bold text-foreground">{detailLog.latestContent || "-"}</span></div>
                <div className="flex justify-between"><span className="text-text-sub font-medium">투입인원</span><span className="font-bold text-foreground">{detailLog.workerCount}명</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-text-sub font-medium">누적 투입일</span>
                  <button onClick={() => setCumulOpen(!cumulOpen)} className="flex items-center gap-1 font-bold text-foreground bg-transparent border-none cursor-pointer">
                    {detailLog.totalDays}일 ({detailLog.totalManpower}공수)
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", cumulOpen && "rotate-180")} />
                  </button>
                </div>
                {cumulOpen && detailLog.detailDates.length > 0 && (
                  <div className="bg-muted/50 rounded-xl p-3 mt-2 animate-fade-in">
                    {detailLog.detailDates.map((d, i) => (
                      <div key={i} className="flex justify-between text-[14px] py-1">
                        <span className="text-text-sub">{d.date}</span>
                        <span className="font-bold text-foreground">{d.man}공수</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Photos & Drawings */}
            <div className="bg-card rounded-2xl p-5 mb-4 shadow-soft">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                <span className="text-[17px] font-[800] text-header-navy flex items-center gap-2">
                  <Image className="w-5 h-5" /> 사진대지 및 도면
                </span>
              </div>
              {detailLog.photos.length > 0 ? detailLog.photos.map((p, i) => (
                <DocListItem key={`p-${i}`} icon={<Camera className="w-6 h-6 text-muted-foreground" />} title={p.name} sub={p.date} />
              )) : (
                <p className="text-[14px] text-muted-foreground mb-2">등록된 사진이 없습니다.</p>
              )}
              {detailLog.drawings.length > 0 ? detailLog.drawings.map((d, i) => (
                <DocListItem key={`d-${i}`} icon={<MapIcon className="w-6 h-6 text-muted-foreground" />} title={d.name} sub={d.date} />
              )) : (
                <p className="text-[14px] text-muted-foreground">등록된 도면이 없습니다.</p>
              )}
            </div>

            {/* Documents */}
            <div className="bg-card rounded-2xl p-5 mb-4 shadow-soft">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                <span className="text-[17px] font-[800] text-header-navy flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" /> 문서 관리
                </span>
              </div>

              <DocSection title="작업완료 확인서">
                {detailLog.certDocs.length > 0 ? detailLog.certDocs.map((c, i) => (
                  <DocListItem key={i} icon={<FileCheck2 className="w-6 h-6 text-muted-foreground" />} title={c.name} sub={c.date} />
                )) : (
                  <p className="text-[14px] text-muted-foreground">등록된 확인서가 없습니다.</p>
                )}
              </DocSection>

              <DocSection title="견적서">
                <UploadButton label="견적서 업로드" />
              </DocSection>

              <DocSection title="기성청구서">
                <UploadButton label="기성청구서 업로드" />
              </DocSection>

              <DocSection title="기타 서류" noBorder>
                <UploadButton label="기타 서류 업로드" />
              </DocSection>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub Components ─── */
function DocListItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between bg-card border border-border p-4 rounded-xl mb-2.5 cursor-pointer transition-all active:scale-[0.98] hover:bg-muted/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon}
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-foreground truncate">{title}</div>
          <div className="text-[13px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <Eye className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}

function DocSection({ title, children, noBorder }: { title: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={cn("mb-6", !noBorder && "")}>
      <div className="text-[15px] font-bold text-text-sub mb-2">{title}</div>
      {children}
    </div>
  );
}

function UploadButton({ label }: { label: string }) {
  return (
    <button className="w-full h-[54px] border border-dashed border-primary bg-primary/[0.04] text-primary rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-primary/[0.08] active:scale-[0.98] mt-2">
      <Upload className="w-[18px] h-[18px]" /> {label}
    </button>
  );
}
