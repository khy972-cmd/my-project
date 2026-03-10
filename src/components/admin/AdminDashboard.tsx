import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  ClipboardList,
  FileCheck,
  Handshake,
  MapPin,
  TrendingUp,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

interface Props {
  onNavigate: (tab: string) => void;
}

type DashboardStats = {
  sites: number;
  workers: number;
  partners: number;
  pending: number;
  totalWorklogs: number;
  docs: number;
  recentWorklogs: Array<{
    id: string;
    site_name: string | null;
    status: string | null;
    work_date: string | null;
    created_at: string | null;
  }>;
};

function statusLabel(status: string | null | undefined) {
  if (status === "approved") return "승인";
  if (status === "rejected") return "반려";
  return "대기";
}

function statusClass(status: string | null | undefined) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function AdminDashboard({ onNavigate }: Props) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        { count: siteCount },
        { count: workerCount },
        { count: partnerCount },
        { count: pendingCount },
        { count: totalWorklogs },
        { count: docCount },
        { data: recentWorklogs },
      ] = await Promise.all([
        supabase.from("sites").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "worker"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "partner"),
        supabase.from("worklogs").select("*", { count: "exact", head: true }).in("status", ["submitted", "pending", "draft"]),
        supabase.from("worklogs").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("worklogs").select("id, site_name, status, work_date, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      return {
        sites: siteCount || 0,
        workers: workerCount || 0,
        partners: partnerCount || 0,
        pending: pendingCount || 0,
        totalWorklogs: totalWorklogs || 0,
        docs: docCount || 0,
        recentWorklogs: recentWorklogs || [],
      };
    },
  });

  const statCards = useMemo(() => [
    { key: "site", label: "등록 현장", value: stats?.sites ?? 0, icon: MapPin, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", tab: "site" },
    { key: "worker", label: "작업자", value: stats?.workers ?? 0, icon: Users, color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200", tab: "user" },
    { key: "partner", label: "파트너사", value: stats?.partners ?? 0, icon: Handshake, color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", tab: "partner" },
    { key: "pending", label: "확인 대기", value: stats?.pending ?? 0, icon: AlertTriangle, color: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200", tab: "worklog" },
    { key: "worklogs", label: "전체 일지", value: stats?.totalWorklogs ?? 0, icon: ClipboardList, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200", tab: "worklog" },
    { key: "docs", label: "문서", value: stats?.docs ?? 0, icon: FileCheck, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", tab: "doc" },
  ], [stats]);

  if (isLoading) {
    return <LoadingScreen fullScreen={false} className="py-20" />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">대시보드</h1>
        <p className="text-[15px] font-medium text-text-sub">본사 관리자 통합 현황</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
        {statCards.map((card) => (
          <button
            key={card.key}
            onClick={() => onNavigate(card.tab)}
            className={cn(
              "flex flex-col gap-1.5 rounded-[20px] border p-3.5 text-left transition-all hover:shadow-soft active:scale-[0.98]",
              card.bg,
              card.border,
            )}
          >
            <span className={cn("text-[25px] font-[800] leading-tight md:text-[27px]", card.color)}>{card.value}</span>
            <div className="flex min-w-0 items-center gap-1.5">
              <card.icon className={cn("h-4 w-4 flex-shrink-0", card.color)} />
              <span className={cn("min-w-0 flex-1 truncate text-[12px] font-bold leading-none", card.color)}>{card.label}</span>
              <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      <div className="mb-5 rounded-2xl bg-card p-4 shadow-soft">
        <h3 className="mb-3.5 flex items-center gap-2 text-[17px] font-[800] text-header-navy">
          <TrendingUp className="h-5 w-5" /> 빠른 작업
        </h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {[
            { label: "일지 확인", tab: "worklog", icon: ClipboardList, cls: "bg-sky-50 text-sky-700 border-sky-200" },
            { label: "현장 등록", tab: "site", icon: MapPin, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { label: "사진/도면", tab: "photosheet", icon: Camera, cls: "bg-amber-50 text-amber-800 border-amber-200" },
            { label: "파트너 배정", tab: "partner", icon: Handshake, cls: "bg-violet-50 text-violet-700 border-violet-200" },
            { label: "인력 현황", tab: "user", icon: Users, cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
            { label: "문서 관리", tab: "doc", icon: FileCheck, cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.tab)}
              className={cn(
                "flex h-[48px] items-center justify-center gap-2 rounded-xl border text-[13px] font-bold transition-all active:scale-[0.98]",
                action.cls,
              )}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[17px] font-[800] text-header-navy">
            <ClipboardList className="h-5 w-5" /> 최근 일지
          </h3>
          <button
            onClick={() => onNavigate("worklog")}
            className="flex items-center gap-1 border-none bg-transparent text-[13px] font-bold text-primary"
          >
            전체보기 <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {(stats?.recentWorklogs || []).length === 0 ? (
          <p className="py-6 text-center text-[14px] text-muted-foreground">최근 일지가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {(stats?.recentWorklogs || []).map((worklog) => (
              <div key={worklog.id} className="flex items-center justify-between border-b border-dashed border-border py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-foreground">{worklog.site_name || "현장 미지정"}</div>
                  <div className="text-[13px] font-medium text-text-sub">{worklog.work_date || "-"}</div>
                </div>
                <span className={cn("rounded-full border px-2.5 py-1 text-[12px] font-bold", statusClass(worklog.status))}>
                  {statusLabel(worklog.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
