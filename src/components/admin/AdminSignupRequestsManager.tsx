import { useState, useMemo } from "react";
import { Search, X, Check, Ban, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDateDot } from "@/lib/dateFormat";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { ROLE_LABELS, normalizeAppRole, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type Row = Tables<"pending_role_assignments">;
type Status = "pending" | "linked" | "cancelled";

const STATUS_LABEL: Record<string, string> = {
  pending: "승인 대기",
  linked: "승인 완료",
  cancelled: "거절",
};

const STATUS_CLS: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  linked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-600",
};

const QUERY_KEY = ["admin-signup-requests"];

export default function AdminSignupRequestsManager() {
  const { isTestMode } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<Row[]> => {
      const { data, err } = await supabase
        .from("pending_role_assignments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (isMissingSchemaEntityError(err, "pending_role_assignments")) return [];
      if (err) throw err;
      return (data || []) as Row[];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error: rpcError } = await supabase.rpc("link_pending_role_assignment", { _assignment_id: assignmentId });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDetailId(null);
      toast.success("가입 요청을 승인했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "승인 처리에 실패했습니다."),
  });

  const rejectMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const payload: TablesUpdate<"pending_role_assignments"> = { status: "cancelled", linked_user_id: null };
      const { error: updateError } = await supabase.from("pending_role_assignments").update(payload).eq("id", assignmentId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDetailId(null);
      toast.success("가입 요청을 거절했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "거절 처리에 실패했습니다."),
  });

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      linked: rows.filter((r) => r.status === "linked").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.reserved_name || "").toLowerCase().includes(q) ||
          (r.reserved_email || "").toLowerCase().includes(q) ||
          (r.note || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, statusFilter, search]);

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        가입 요청 관리는 본사관리자만 이용할 수 있습니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">가입 요청 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">가입 요청 관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const detail = detailId ? rows.find((r) => r.id === detailId) : null;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">가입 요청 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">권한 예약·가입 요청을 검토하고 승인 또는 거절합니다.</p>

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "전체 요청", value: stats.total, key: "all" as const },
          { label: "승인 대기", value: stats.pending, key: "pending" as const },
          { label: "승인 완료", value: stats.linked, key: "linked" as const },
          { label: "거절", value: stats.cancelled, key: "cancelled" as const },
        ].map(({ label, value, key }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "rounded-2xl border p-3 text-left shadow-soft transition-all active:scale-[0.98]",
              statusFilter === key ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름·이메일·메모 검색"
          className="h-12 w-full rounded-xl border border-border bg-[hsl(var(--bg-input))] pl-10 pr-10 text-[15px] outline-none focus:border-primary"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">
            {rows.length === 0 ? "등록된 가입 요청이 없습니다." : "검색 결과가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div
              key={row.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 transition-colors",
                detailId === row.id && "ring-2 ring-primary",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="font-[800] text-foreground">{row.reserved_name || "-"}</div>
                <div className="text-[13px] text-text-sub">{row.reserved_email || "이메일 없음"}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                  <span className={cn("rounded-full border px-2 py-0.5 font-bold", STATUS_CLS[row.status] || STATUS_CLS.pending)}>
                    {STATUS_LABEL[row.status] || row.status}
                  </span>
                  <span className="text-muted-foreground">{ROLE_LABELS[normalizeAppRole(row.reserved_role)]}</span>
                  <span className="text-muted-foreground">{formatDateDot(row.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailId(detailId === row.id ? null : row.id)}
                  className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold text-foreground"
                >
                  {detailId === row.id ? "닫기" : "상세"}
                </button>
                {row.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => linkMutation.mutate(row.id)}
                      disabled={linkMutation.isPending}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> 승인
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectMutation.mutate(row.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[13px] font-bold text-rose-700 disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" /> 거절
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <h3 className="mb-2 text-[14px] font-[800] text-header-navy">상세</h3>
          <p className="text-[13px] text-text-sub">메모: {detail.note || "-"}</p>
          <p className="text-[13px] text-text-sub">생성: {formatDateDot(detail.created_at)} · 수정: {formatDateDot(detail.updated_at)}</p>
        </div>
      )}
    </div>
  );
}
