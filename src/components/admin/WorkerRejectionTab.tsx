import { useState, useMemo } from "react";
import { Search, X, ChevronDown, ChevronUp, MapPin, FileText, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateDot } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface RejectedWorklog {
  id: string;
  siteName: string;
  member: string;
  process: string;
  location: string;
  man: number;
  task: string;
  status: string;
  createdAt: string;
  materials: string;
}

export default function WorkerRejectionTab() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailModal, setDetailModal] = useState<RejectedWorklog | null>(null);

  const { data: rejectedLogs = [], isLoading } = useQuery({
    queryKey: ["worker-rejections", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: worklogs, error } = await supabase
        .from("worklogs")
        .select(`
          id, site_name, work_date, status, created_at,
          worklog_manpower(worker_name, work_hours),
          worklog_worksets(member, process, work_type, block, dong, floor),
          worklog_materials(name, qty)
        `)
        .eq("created_by", user.id)
        .eq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (worklogs || []).map(w => {
        const manpower = w.worklog_manpower || [];
        const worksets = w.worklog_worksets || [];
        const materials = w.worklog_materials || [];
        const ws = worksets[0];
        const totalMan = manpower.reduce((s: number, m: any) => s + (m.work_hours || 0), 0);
        const loc = ws ? [ws.block, ws.dong, ws.floor].filter(Boolean).join(" ") || "미지정" : "미지정";

        return {
          id: w.id,
          siteName: w.site_name,
          member: ws?.member || "-",
          process: ws?.process || "-",
          location: loc,
          man: totalMan,
          task: worksets.map((s: any) => `${s.member || ""} ${s.process || ""}`).join(", ") || "작업 내용 없음",
          status: w.status,
          createdAt: w.created_at,
          materials: materials.map((m: any) => `${m.name} (${m.qty})`).join(" ㅣ ") || "-",
        } as RejectedWorklog;
      });
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    if (!search) return rejectedLogs;
    const q = search.toLowerCase();
    return rejectedLogs.filter(l =>
      l.siteName.toLowerCase().includes(q) || l.task.toLowerCase().includes(q)
    );
  }, [rejectedLogs, search]);

  const displayed = isExpanded ? filtered : filtered.slice(0, 3);

  const formatDate = formatDateDot;

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in mt-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-[22px] h-[22px] text-header-navy" />
        <span className="text-[20px] font-[800] text-header-navy">반려된 일지 조회</span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="현장명 또는 작업내용 검색"
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

      {/* Count Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-bold bg-[hsl(0_100%_97%)] text-destructive border border-[#fecaca]">
          반려 {rejectedLogs.length}건
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {rejectedLogs.length === 0 ? "반려된 일지가 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map(log => (
            <div
              key={log.id}
              onClick={() => setDetailModal(log)}
              className="bg-card rounded-2xl shadow-soft overflow-hidden cursor-pointer border border-border hover:border-primary/30 transition-all"
            >
              {/* Status Badge */}
              <span className="absolute top-0 right-0 text-[11px] font-bold px-3.5 py-1.5 text-white rounded-bl-xl rounded-tr-2xl bg-destructive relative float-right">
                반려
              </span>

              <div className="p-5 pb-4">
                <div className="text-[18px] font-[800] text-header-navy mb-1">{log.siteName}</div>

                <div className="flex items-center gap-1 text-[14px] text-text-sub font-semibold mb-2">
                  <span className="text-[#0369a1] font-[800]">{formatDate(log.createdAt)} l</span>
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  <span>{log.member} ㅣ {log.process} ㅣ {log.location}</span>
                </div>

                <div className="text-[14px] font-semibold text-text-sub line-clamp-2">{log.task}</div>

                <div className="grid grid-cols-1 bg-muted/50 rounded-xl p-3 mt-3 border border-border/50">
                  <div className="text-center">
                    <span className="text-[17px] font-[800] text-primary">{log.man}</span>
                    <span className="text-[11px] font-bold text-text-sub ml-1">공수</span>
                  </div>
                </div>
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

      {/* Detail Modal */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-end justify-center p-0"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="w-full max-w-[600px] bg-card rounded-t-[20px] p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[20px] font-bold text-foreground m-0">반려 일지 상세</h3>
              <button onClick={() => setDetailModal(null)} className="bg-transparent border-none text-text-sub cursor-pointer p-1">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
              <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> 작업 내용
              </div>
              <div className="text-[16px] font-[800] text-foreground leading-relaxed">{detailModal.task}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <span className="block text-[13px] font-[800] text-text-sub mb-1.5">보고 공수</span>
                <div className="text-[19px] font-[900] text-header-navy">{detailModal.man} 공수</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl border border-border/50">
                <span className="block text-[13px] font-[800] text-text-sub mb-1.5">제출 시간</span>
                <div className="text-[19px] font-[900] text-header-navy">
                  {new Date(detailModal.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
              <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 작업 위치
              </div>
              <div className="text-[16px] font-[800] text-foreground">{detailModal.member} ㅣ {detailModal.process} ㅣ {detailModal.location}</div>
            </div>

            <div className="bg-muted/50 rounded-[14px] p-[18px] mb-4 border border-border">
              <div className="text-[14px] font-[800] text-header-navy mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4" /> 사용 자재
              </div>
              <div className="text-[13px] font-[800] text-foreground">{detailModal.materials}</div>
            </div>

            <div className="text-center py-3 text-[14px] font-semibold text-text-sub bg-muted rounded-xl">
              반려된 일지입니다. 수정 후 다시 제출해 주세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
