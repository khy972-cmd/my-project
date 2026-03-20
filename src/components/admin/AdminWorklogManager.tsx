/**
 * Admin Worklog Manager - Enhanced version of AdminConsoleTab for the admin console
 * Manages worklog approval/rejection with full Supabase integration
 */
import { useState, useMemo, useCallback } from "react";
import {
  Search, X, ChevronDown, ChevronUp, Phone, MessageSquare, FileCheck,
  Pin, PinOff, MapPin, FileText, Package, Check, RotateCcw, Filter
} from "lucide-react";
import { ADMIN_PINNED_IDS_KEY } from "@/constants/storageKeys";
import { ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES } from "@/lib/adminBadgeStyles";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface WorklogSubmission {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  site: string;
  siteId: string;
  member: string;
  process: string;
  workType: string;
  location: string;
  man: number;
  cumDays: number;
  cumMan: number;
  task: string;
  status: string;
  latestDate: string;
  phone: string;
  pinned: boolean;
  worklogId: string;
  materials: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminWorklogManager() {
  const { isTestMode } = useAuth();
  const [search, setSearch] = useState("");
  const [sortFilter, setSortFilter] = useState<"latest" | "name">("latest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(ADMIN_PINNED_IDS_KEY) || "[]")); } catch { return new Set(); }
  });
  const [reviewModal, setReviewModal] = useState<WorklogSubmission | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const queryClient = useQueryClient();

  const MOCK_SUBMISSIONS: WorklogSubmission[] = [
    { id: "mw1", name: "이현수", role: "작업자", affiliation: "이노피앤씨", site: "강남 오피스텔 신축", siteId: "", member: "슬라브", process: "철근", workType: "가공", location: "A동 3층", man: 8, cumDays: 15, cumMan: 120, task: "슬라브 철근 가공", status: "pending", latestDate: "2026-02-23T09:00:00", phone: "010-1234-5678", pinned: false, worklogId: "mw1", materials: "철근 D13 (50본)" },
    { id: "mw2", name: "박민호", role: "작업자", affiliation: "이노피앤씨", site: "판교 데이터센터", siteId: "", member: "거더", process: "용접", workType: "조립", location: "B동 지하1층", man: 12, cumDays: 22, cumMan: 264, task: "거더 용접 조립", status: "pending", latestDate: "2026-02-22T14:30:00", phone: "010-5678-1234", pinned: false, worklogId: "mw2", materials: "용접봉 (20kg)" },
    { id: "mw3", name: "김태우", role: "작업자", affiliation: "이노피앤씨", site: "송도 물류센터", siteId: "", member: "기둥", process: "콘크리트", workType: "타설", location: "C블록", man: 6, cumDays: 8, cumMan: 48, task: "기둥 콘크리트 타설", status: "approved", latestDate: "2026-02-21T16:00:00", phone: "010-9876-5432", pinned: false, worklogId: "mw3", materials: "레미콘 25-21-15 (40㎥)" },
    { id: "mw4", name: "최영진", role: "작업자", affiliation: "이노피앤씨", site: "여의도 리모델링", siteId: "", member: "벽체", process: "철근", workType: "배근", location: "4층", man: 10, cumDays: 30, cumMan: 300, task: "벽체 철근 배근", status: "rejected", latestDate: "2026-02-20T11:00:00", phone: "010-1111-2222", pinned: false, worklogId: "mw4", materials: "철근 D16 (30본) ㅣ 결속선 (5kg)" },
    { id: "mw5", name: "정하늘", role: "작업자", affiliation: "이노피앤씨", site: "인천공항 T2 확장", siteId: "", member: "슬라브", process: "거푸집", workType: "설치", location: "게이트 E", man: 14, cumDays: 45, cumMan: 630, task: "슬라브 거푸집 설치", status: "pending", latestDate: "2026-02-23T08:00:00", phone: "", pinned: false, worklogId: "mw5", materials: "합판 (120장) ㅣ 동바리 (80본)" },
  ];

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-all-worklogs", isTestMode],
    queryFn: async () => {
      if (isTestMode) return MOCK_SUBMISSIONS;
      const { data: worklogs, error } = await supabase
        .from("worklogs")
        .select(`
          id, site_name, site_id, work_date, status, created_by, created_at, dept, weather,
          worklog_manpower(worker_name, work_hours),
          worklog_worksets(member, process, work_type, block, dong, floor),
          worklog_materials(name, qty)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      const userIds = [...new Set((worklogs || []).map(w => w.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, phone, affiliation")
        .in("user_id", userIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });

      return (worklogs || []).map(w => {
        const profile = profileMap[w.created_by];
        const manpower = w.worklog_manpower || [];
        const worksets = w.worklog_worksets || [];
        const materials = w.worklog_materials || [];
        const ws = worksets[0];
        const totalMan = manpower.reduce((s: number, m: any) => s + (m.work_hours || 0), 0);
        const loc = ws ? [ws.block, ws.dong, ws.floor].filter(Boolean).join(" ") || "미지정" : "미지정";

        return {
          id: w.id,
          name: profile?.name || "미지정",
          role: "작업자",
          affiliation: profile?.affiliation || "본사",
          site: w.site_name,
          siteId: w.site_id,
          member: ws?.member || "-",
          process: ws?.process || "-",
          workType: ws?.work_type || "-",
          location: loc,
          man: totalMan,
          cumDays: 0,
          cumMan: 0,
          task: worksets.map((s: any) => `${s.member || ""} ${s.process || ""}`).join(", ") || "작업 내용 없음",
          status: w.status === "draft" ? "pending" : w.status === "submitted" ? "pending" : w.status,
          latestDate: w.created_at,
          phone: profile?.phone || "",
          pinned: false,
          worklogId: w.id,
          materials: materials.map((m: any) => `${m.name} (${m.qty})`).join(" ㅣ ") || "-",
        } as WorklogSubmission;
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ worklogId, newStatus }: { worklogId: string; newStatus: string }) => {
      const { error } = await supabase.from("worklogs").update({ status: newStatus }).eq("id", worklogId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-worklogs"] });
      setReviewModal(null);
      setRejectComment("");
      toast.success("상태가 업데이트되었습니다");
    },
  });

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(ADMIN_PINNED_IDS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const enriched = useMemo(() =>
    submissions.map(s => ({ ...s, pinned: pinnedIds.has(s.id) })),
    [submissions, pinnedIds]
  );

  const filtered = useMemo(() => {
    let list = enriched.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.site.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortFilter === "name") return a.name.localeCompare(b.name, "ko");
      return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime();
    });
    return list;
  }, [enriched, search, statusFilter, sortFilter]);

  const displayed = filtered.slice(0, visibleCount);

  const stats = useMemo(() => ({
    all: enriched.length,
    pending: enriched.filter(s => s.status === "pending").length,
    approved: enriched.filter(s => s.status === "approved").length,
    rejected: enriched.filter(s => s.status === "rejected").length,
  }), [enriched]);

  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">일지 관리</h1>
      <p className="text-[15px] text-text-sub font-medium mb-5">작업일지 검토 및 승인/반려</p>

      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="작업자명 또는 현장명 검색"
            className="w-full h-[48px] bg-card border border-border rounded-xl pl-4 pr-10 text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:shadow-input-focus"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <select
          value={sortFilter}
          onChange={e => setSortFilter(e.target.value as "latest" | "name")}
          className="w-[90px] h-[48px] bg-card border border-border rounded-xl px-3 text-[14px] font-semibold text-foreground appearance-none cursor-pointer outline-none"
        >
          <option value="latest">최신순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      {/* Status Filter Chips */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {([
          { key: "all" as const, label: "전체", val: stats.all, cls: "bg-slate-50 text-slate-700 border-slate-200" },
          { key: "pending" as const, label: "대기", val: stats.pending, cls: "bg-amber-50 text-amber-800 border-amber-200" },
          { key: "approved" as const, label: "승인", val: stats.approved, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { key: "rejected" as const, label: "반려", val: stats.rejected, cls: "bg-rose-50 text-rose-700 border-rose-200" },
        ]).map(c => (
          <button
            key={c.key}
            onClick={() => setStatusFilter(c.key)}
            className={cn(
              "p-3 rounded-xl text-center flex flex-col items-center gap-0.5 border cursor-pointer transition-all active:scale-[0.98]",
              c.cls,
              statusFilter === c.key && "translate-y-[-1px] ring-1 ring-current/20 shadow-soft"
            )}
          >
            <span className="text-[20px] font-[800]">{c.val}</span>
            <span className="text-[12px] font-bold">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">결과가 없습니다</div>
      ) : (
        <div className="space-y-3">
          {displayed.map(s => (
            <div key={s.id} className={cn("bg-card rounded-2xl shadow-soft overflow-hidden relative", s.pinned && "border-2 border-primary")}>
              <span className={cn(
                ADMIN_CORNER_BADGE_BASE,
                s.status === "pending"
                  ? ADMIN_CORNER_BADGE_TONES.amber
                  : s.status === "approved"
                    ? ADMIN_CORNER_BADGE_TONES.emerald
                    : ADMIN_CORNER_BADGE_TONES.rose
              )}>
                {s.status === "pending" ? "대기" : s.status === "approved" ? "승인" : "반려"}
              </span>

              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[18px] font-[800] text-header-navy">{s.name}</span>
                  <span className="text-[13px] font-semibold text-text-sub">{s.affiliation}</span>
                  <button onClick={() => togglePin(s.id)} className={cn("ml-auto p-1", s.pinned ? "text-primary" : "text-border")}>
                    {s.pinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-[15px] font-bold text-header-navy mb-1">{s.site}</div>
                <div className="text-[13px] text-text-sub font-medium mb-2">
                  {formatDate(s.latestDate)} · {s.member} · {s.process} · {s.location}
                </div>

                <div className="grid grid-cols-3 bg-muted/50 rounded-xl p-2.5 border border-border/50 mb-3">
                  <div className="text-center border-r border-border">
                    <span className="block text-[16px] font-[800] text-header-navy">{s.man}</span>
                    <span className="block text-[10px] font-bold text-text-sub">금일 공수</span>
                  </div>
                  <div className="text-center border-r border-border">
                    <span className="block text-[16px] font-[800] text-header-navy">{s.cumDays}일</span>
                    <span className="block text-[10px] font-bold text-text-sub">누적 일수</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[16px] font-[800] text-header-navy">{s.cumMan}</span>
                    <span className="block text-[10px] font-bold text-text-sub">누적 공수</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {s.status === "pending" && (
                    <>
                      <button
                        onClick={() => statusMutation.mutate({ worklogId: s.worklogId, newStatus: "approved" })}
                        className="flex-1 h-10 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <Check className="w-3.5 h-3.5" /> 승인
                      </button>
                      <button
                        onClick={() => { setReviewModal(s); setRejectComment(""); }}
                        className="flex-1 h-10 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> 반려
                      </button>
                    </>
                  )}
                  {s.phone && (
                    <a href={`tel:${s.phone}`} className="h-10 px-4 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 no-underline">
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => setReviewModal(s)}
                    className="h-10 px-4 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                  >
                    <FileCheck className="w-3.5 h-3.5" /> 상세
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {visibleCount < filtered.length && (
        <button
          onClick={() => setVisibleCount(v => v + 10)}
          className="w-full h-[48px] mt-4 bg-card border border-border rounded-full text-text-sub font-semibold text-[14px] flex items-center justify-center gap-1 cursor-pointer hover:bg-muted"
        >
          더 보기 <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Review/Reject Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center" onClick={() => setReviewModal(null)}>
          <div className="w-full max-w-[500px] bg-card rounded-t-[20px] md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-[800] text-header-navy">일지 상세</h3>
              <button onClick={() => setReviewModal(null)} className="bg-transparent border-none cursor-pointer p-1"><X className="w-5 h-5 text-text-sub" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <InfoRow label="작업자" value={`${reviewModal.name} (${reviewModal.affiliation})`} />
              <InfoRow label="현장" value={reviewModal.site} />
              <InfoRow label="작업내용" value={reviewModal.task} />
              <InfoRow label="위치" value={`${reviewModal.member} · ${reviewModal.process} · ${reviewModal.location}`} />
              <InfoRow label="공수" value={`${reviewModal.man} 공수`} />
              <InfoRow label="자재" value={reviewModal.materials} />
            </div>

            {reviewModal.status === "pending" && (
              <div className="border-t border-border pt-4">
                <textarea
                  value={rejectComment}
                  onChange={e => setRejectComment(e.target.value)}
                  placeholder="반려 사유 입력 (반려 시 필수)"
                  className="w-full min-h-[80px] p-3 border border-border rounded-xl text-[14px] resize-none outline-none focus:border-primary mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => statusMutation.mutate({ worklogId: reviewModal.worklogId, newStatus: "approved" })}
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl font-bold text-[15px] cursor-pointer active:scale-[0.98]"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectComment.trim()) { toast.error("반려 사유를 입력해주세요"); return; }
                      statusMutation.mutate({ worklogId: reviewModal.worklogId, newStatus: "rejected" });
                    }}
                    className="flex-1 h-12 bg-destructive text-destructive-foreground rounded-xl font-bold text-[15px] cursor-pointer active:scale-[0.98]"
                  >
                    반려
                  </button>
                </div>
              </div>
            )}
            {reviewModal.status === "approved" && (
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => statusMutation.mutate({ worklogId: reviewModal.worklogId, newStatus: "draft" })}
                  className="w-full h-12 rounded-xl border border-primary/30 bg-primary/10 text-[15px] font-bold text-primary cursor-pointer active:scale-[0.98]"
                >
                  수정 허용으로 전환
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
      <div className="text-[12px] font-bold text-text-sub mb-1">{label}</div>
      <div className="text-[15px] font-bold text-foreground">{value}</div>
    </div>
  );
}
