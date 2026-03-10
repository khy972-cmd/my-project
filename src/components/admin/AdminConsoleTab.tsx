import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, ChevronUp, Phone, MessageSquare, FileCheck, Pin, PinOff, MapPin, FileText, Map, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_PINNED_IDS_KEY } from "@/constants/storageKeys";
import { formatDateDot } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

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

type StatusFilter = "all" | "pending" | "approved";

export default function AdminConsoleTab() {
  const { isAdmin, isManager } = useUserRole();
  const canReview = isAdmin || isManager;
  const [search, setSearch] = useState("");
  const [sortFilter, setSortFilter] = useState<"latest" | "name">("latest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isExpanded, setIsExpanded] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(ADMIN_PINNED_IDS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [reviewModal, setReviewModal] = useState<WorklogSubmission | null>(null);
  const [reviewStage, setReviewStage] = useState(1);
  const [rejectComment, setRejectComment] = useState("");
  const queryClient = useQueryClient();

  // Fetch worklogs with profiles for admin view
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["admin-worklogs"],
    queryFn: async () => {
      // Fetch worklogs with related data
      const { data: worklogs, error } = await supabase
        .from("worklogs")
        .select(`
          id, site_name, site_id, work_date, status, created_by, created_at, dept, weather,
          worklog_manpower(worker_name, work_hours),
          worklog_worksets(member, process, work_type, block, dong, floor),
          worklog_materials(name, qty)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for all creators
      const userIds = [...new Set((worklogs || []).map(w => w.created_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, phone, affiliation")
        .in("user_id", userIds);

      const profileMap: Record<string, { user_id: string; name: string; phone: string | null; affiliation: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p; });

      // Map to submission format
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

  // Approve/reject mutation
  const statusMutation = useMutation({
    mutationFn: async ({ worklogId, newStatus }: { worklogId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("worklogs")
        .update({ status: newStatus })
        .eq("id", worklogId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-worklogs"] });
      setReviewModal(null);
      setRejectComment("");
      setReviewStage(1);
    },
  });

  const togglePin = useCallback((id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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

  const displayed = isExpanded ? filtered : filtered.slice(0, 3);

  const stats = useMemo(() => ({
    all: enriched.length,
    pending: enriched.filter(s => s.status === "pending").length,
    approved: enriched.filter(s => s.status === "approved").length,
  }), [enriched]);

  const formatDate = formatDateDot;

  const handleApprove = () => {
    if (!reviewModal) return;
    statusMutation.mutate({ worklogId: reviewModal.worklogId, newStatus: "approved" });
  };

  const handleReject = () => {
    if (!reviewModal) return;
    if (!rejectComment.trim()) { alert("반려 사유를 입력해주세요."); return; }
    statusMutation.mutate({ worklogId: reviewModal.worklogId, newStatus: "rejected" });
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in mt-3">
      {/* Search + Sort */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="작업자명 또는 현장명 검색"
            className="w-full h-[54px] bg-card border border-border rounded-xl pl-4 pr-[75px] text-[17px] font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all shadow-soft hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {search && (
              <button onClick={() => setSearch("")} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div className="relative">
          <select
            value={sortFilter}
            onChange={e => setSortFilter(e.target.value as "latest" | "name")}
            className="w-[95px] h-[54px] bg-card border border-border rounded-xl px-3 text-[15px] font-semibold text-foreground appearance-none outline-none cursor-pointer shadow-soft transition-all hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]"
          >
            <option value="latest">최신순</option>
            <option value="name">이름순</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {([
          { key: "all" as const, label: "전체 현장", val: stats.all, colors: "bg-[hsl(217_100%_96%)] text-[#3b82f6] border-[#bfdbfe]" },
          { key: "pending" as const, label: "승인 대기", val: stats.pending, colors: "bg-[hsl(229_100%_96%)] text-[#6366f1] border-[#c7d2fe]" },
          { key: "approved" as const, label: "금일 승인", val: stats.approved, colors: "bg-muted text-text-sub border-[#94a3b8]" },
        ] as const).map(c => (
          <button
            key={c.key}
            onClick={() => { setStatusFilter(c.key); setIsExpanded(false); }}
            className={cn(
              "p-3.5 rounded-2xl text-center flex flex-col items-center gap-0.5 border cursor-pointer transition-all active:scale-[0.98]",
              c.colors,
              statusFilter === c.key && "ring-1 ring-primary/30 -translate-y-px"
            )}
          >
            <span className="text-[22px] font-[800] leading-tight">{c.val}</span>
            <span className="text-[12px] font-bold opacity-90">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Worker Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">검색 결과가 없습니다.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(s => (
            <div
              key={s.id}
              className={cn(
                "bg-card rounded-2xl shadow-soft overflow-hidden relative",
                s.pinned && "border-2 border-primary shadow-[0_4px_12px_rgba(49,163,250,0.2)]"
              )}
            >
              {/* Status Badge */}
              <span className={cn(
                "absolute top-0 right-0 text-[11px] font-bold px-3.5 py-1.5 text-white z-10",
                s.pinned ? "rounded-bl-xl rounded-tr-[14px]" : "rounded-bl-xl rounded-tr-2xl",
                s.status === "pending" ? "bg-[#6366f1]" : s.status === "approved" ? "bg-[#475569]" : "bg-destructive"
              )}>
                {s.status === "pending" ? "승인대기" : s.status === "approved" ? "승인완료" : "반려"}
              </span>

              {/* Card Header */}
              <div className="p-5 pb-3 cursor-pointer" onClick={() => { setReviewModal(s); setReviewStage(1); }}>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[20px] font-[800] text-header-navy">{s.name}</span>
                  <span className="text-[16px] font-semibold text-text-sub ml-2">{s.role}</span>
                </div>

                <div className="flex items-center justify-between w-full mt-1">
                  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                    <span className="text-[14px] font-semibold px-2 py-0.5 rounded-lg bg-[hsl(229_100%_96%)] text-[#6366f1] border border-[#c7d2fe] shrink-0">
                      {s.affiliation}
                    </span>
                    <span className="text-[17px] font-[800] text-header-navy truncate">{s.site}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); togglePin(s.id); }}
                    className={cn("p-1 shrink-0 ml-2 transition-colors", s.pinned ? "text-primary" : "text-border")}
                  >
                    {s.pinned ? <Pin className="w-6 h-6 fill-current" /> : <PinOff className="w-6 h-6" />}
                  </button>
                </div>

                <div className="flex items-center gap-1 mt-2 text-[14px] text-text-sub font-semibold">
                  <span className="text-[#0369a1] font-[800]">{formatDate(s.latestDate)} l</span>
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  <span>{s.member} ㅣ {s.process} ㅣ {s.location}</span>
                </div>

                {/* Cumulative Stats */}
                <div className="grid grid-cols-3 bg-muted/50 rounded-xl p-3 mt-3 border border-border/50">
                  <div className="text-center border-r border-border">
                    <span className="block text-[17px] font-[800] text-primary">{s.man}</span>
                    <span className="block text-[11px] font-bold text-text-sub">금일 공수</span>
                  </div>
                  <div className="text-center border-r border-border">
                    <span className="block text-[17px] font-[800] text-primary">{s.cumDays}일</span>
                    <span className="block text-[11px] font-bold text-text-sub">누적 일수</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[17px] font-[800] text-primary">{s.cumMan}</span>
                    <span className="block text-[11px] font-bold text-text-sub">누적 공수</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-4 flex gap-2">
                {s.phone && (
                  <a
                    href={`tel:${s.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 h-12 flex items-center justify-center gap-1.5 text-[14px] font-bold rounded-xl border bg-[hsl(138_76%_97%)] border-[#bbf7d0] text-[#166534] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Phone className="w-3.5 h-3.5" />전화
                  </a>
                )}
                {s.phone && (
                  <a
                    href={`sms:${s.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 h-12 flex items-center justify-center gap-1.5 text-[14px] font-bold rounded-xl border bg-[hsl(229_100%_96%)] border-[#c7d2fe] text-[#6366f1] cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />메신저
                  </a>
                )}
                <button
                  onClick={e => { e.stopPropagation(); setReviewModal(s); setReviewStage(1); }}
                  className="flex-1 h-12 flex items-center justify-center gap-1.5 text-[14px] font-[800] rounded-xl border bg-muted border-[#94a3b8] text-[#334155] cursor-pointer transition-all active:scale-[0.98] shadow-sm"
                >
                  <FileCheck className="w-3.5 h-3.5" />검토
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {filtered.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-[54px] bg-card border border-border rounded-full text-text-sub font-semibold text-[15px] cursor-pointer mt-2.5 mb-4 flex items-center justify-center gap-1.5 transition-all hover:bg-muted"
        >
          <span>{isExpanded ? "접기" : "더 보기"}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-end justify-center p-0"
          onClick={() => { setReviewModal(null); setReviewStage(1); setRejectComment(""); }}
        >
          <div
            className="w-full max-w-[600px] bg-card rounded-t-[20px] p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-bold text-foreground m-0">현장기록보고서 검토</h3>
              <button onClick={() => { setReviewModal(null); setReviewStage(1); setRejectComment(""); }} className="bg-transparent border-none text-text-sub cursor-pointer p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            {reviewStage === 1 && (
              <>
                <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
                  <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> 금일 주요 작업 내용
                  </div>
                  <div className="text-[16px] font-[800] text-foreground leading-relaxed">{reviewModal.task}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <span className="block text-[13px] font-[800] text-text-sub mb-1.5">보고 공수</span>
                    <div className="text-[19px] font-[900] text-header-navy">{reviewModal.man} 공수</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                    <span className="block text-[13px] font-[800] text-text-sub mb-1.5">제출 시간</span>
                    <div className="text-[19px] font-[900] text-header-navy">
                      {new Date(reviewModal.latestDate).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setReviewStage(2)}
                  className="w-full h-14 rounded-xl text-[16px] font-[900] border border-[#e0f2fe] bg-[hsl(205_100%_97%)] text-[#0284c7] flex items-center justify-center gap-2 cursor-pointer mb-3"
                >
                  상세 현장기록 보러가기 <ChevronRight className="w-5 h-5" />
                </button>

                {canReview && (
                  <button
                    onClick={handleApprove}
                    disabled={statusMutation.isPending}
                    className="w-full h-14 rounded-xl text-[16px] font-[900] border-none bg-header-navy text-white cursor-pointer shadow-[0_8px_22px_rgba(26,37,79,0.18)] disabled:opacity-50"
                  >
                    즉시 승인확정
                  </button>
                )}
              </>
            )}

            {reviewStage === 2 && (
              <>
                <button onClick={() => setReviewStage(1)} className="flex items-center gap-1.5 text-text-sub font-bold mb-4 cursor-pointer bg-transparent border-none p-0">
                  <ChevronLeft className="w-5 h-5" /> 뒤로가기
                </button>

                <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
                  <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                    <Map className="w-4 h-4" /> 작업 위치 및 공정
                  </div>
                  <div className="text-[16px] font-[800] text-foreground">{reviewModal.member} ㅣ {reviewModal.process} ㅣ {reviewModal.location}</div>
                </div>

                <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
                  <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> 사용 자재 현황
                  </div>
                  <div className="text-[13px] font-[800] text-foreground">{reviewModal.materials}</div>
                </div>

                {canReview && (
                  <textarea
                    value={rejectComment}
                    onChange={e => setRejectComment(e.target.value)}
                    placeholder="반려 사유 혹은 작업 지시사항을 입력하세요."
                    className="w-full h-24 p-3.5 border border-border rounded-xl text-[13px] font-bold outline-none resize-none mb-3.5 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.12)]"
                  />
                )}

                {canReview ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={statusMutation.isPending}
                      className="flex-1 h-14 rounded-xl text-[16px] font-[900] border-[1.5px] border-[#fecaca] bg-[hsl(0_100%_97%)] text-destructive cursor-pointer disabled:opacity-50"
                    >
                      반려 처리
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={statusMutation.isPending}
                      className="flex-1 h-14 rounded-xl text-[16px] font-[900] border-none bg-header-navy text-white cursor-pointer disabled:opacity-50"
                    >
                      승인 확정
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-3 text-[14px] font-semibold text-text-sub bg-muted rounded-xl">
                    조회 전용 — 승인/반려는 관리자만 가능합니다
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
