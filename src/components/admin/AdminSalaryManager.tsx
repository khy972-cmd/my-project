import { useDeferredValue, useMemo, useState } from "react";
import { Pencil, Search, Wallet, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { cn } from "@/lib/utils";

type DirectoryRow = Tables<"admin_user_directory">;

type WorklogForPay = {
  id: string;
  work_date: string;
  site_name: string;
  worklog_manpower: Array<{ worker_name: string; work_hours: number }>;
};

type WorkerPayRow = {
  workerName: string;
  manDays: number;
  daily: number | null;
  estimatedPay: number | null;
  directoryId: string | null;
};

const WORKLOG_HOURS_PER_DAY = 8;

function clampRangeStart(range: "30" | "90" | "all") {
  if (range === "all") return null;
  const days = Number(range);
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function AdminSalaryManager() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [range, setRange] = useState<"30" | "90" | "all">("30");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [editOpen, setEditOpen] = useState(false);
  const [editWorkerName, setEditWorkerName] = useState("");
  const [editDaily, setEditDaily] = useState<number>(150000);
  const [editDirectoryId, setEditDirectoryId] = useState<string | null>(null);

  const sinceDate = clampRangeStart(range);

  const { data: directory = [], isLoading: dirLoading, error: dirError } = useQuery({
    queryKey: ["admin-salary-directory"],
    enabled: isAdmin,
    staleTime: 30_000,
    queryFn: async (): Promise<DirectoryRow[]> => {
      const { data, error } = await supabase
        .from("admin_user_directory")
        .select("id, name, daily, role, is_active")
        .eq("is_active", true)
        .limit(2000);

      if (error) {
        if (isMissingSchemaEntityError(error, "admin_user_directory")) return [];
        throw error;
      }

      return (data || []) as DirectoryRow[];
    },
  });

  const { data: worklogs = [], isLoading: wlLoading, error: wlError } = useQuery({
    queryKey: ["admin-salary-worklogs", sinceDate],
    enabled: isAdmin,
    staleTime: 15_000,
    queryFn: async (): Promise<WorklogForPay[]> => {
      let q = supabase
        .from("worklogs")
        .select("id, work_date, site_name, worklog_manpower(worker_name, work_hours)")
        .order("work_date", { ascending: false })
        .limit(1200);
      if (sinceDate) q = q.gte("work_date", sinceDate);

      const { data, error } = await q;

      if (error) {
        if (isMissingSchemaEntityError(error, "worklogs")) return [];
        throw error;
      }

      return (data || []) as any;
    },
  });

  const directoryByName = useMemo(() => {
    const map = new Map<string, DirectoryRow>();
    (directory || []).forEach((row) => {
      const name = String(row.name || "").trim();
      if (!name) return;
      if (!map.has(name)) map.set(name, row);
      else if (map.get(name)?.role !== "worker" && row.role === "worker") map.set(name, row);
    });
    return map;
  }, [directory]);

  const aggregated = useMemo((): WorkerPayRow[] => {
    const hoursByWorker = new Map<string, number>();
    (worklogs || []).forEach((wl) => {
      (wl.worklog_manpower || []).forEach((mp) => {
        const name = String(mp.worker_name || "").trim();
        if (!name) return;
        const hours = Number(mp.work_hours || 0);
        hoursByWorker.set(name, (hoursByWorker.get(name) || 0) + hours);
      });
    });

    const list = Array.from(hoursByWorker.entries()).map(([workerName, totalHours]) => {
      const manDays = Math.max(0, totalHours / WORKLOG_HOURS_PER_DAY);
      const dir = directoryByName.get(workerName);
      const daily = typeof dir?.daily === "number" ? dir.daily : null;
      const estimatedPay = daily != null ? Math.round(daily * manDays) : null;
      return { workerName, manDays, daily, estimatedPay, directoryId: dir?.id ?? null };
    });

    const q = deferredSearch.trim().toLowerCase();
    const filtered = q ? list.filter((r) => r.workerName.toLowerCase().includes(q)) : list;

    filtered.sort(
      (a, b) =>
        (b.estimatedPay ?? 0) - (a.estimatedPay ?? 0) ||
        b.manDays - a.manDays ||
        a.workerName.localeCompare(b.workerName, "ko-KR"),
    );

    return filtered;
  }, [worklogs, directoryByName, deferredSearch]);

  const stats = useMemo(() => {
    const workerCount = aggregated.length;
    const totalManDays = aggregated.reduce((s, r) => s + r.manDays, 0);
    const knownDaily = aggregated.filter((r) => r.daily != null).length;
    const totalPay = aggregated.reduce((s, r) => s + (r.estimatedPay ?? 0), 0);
    return { workerCount, totalManDays, knownDaily, totalPay };
  }, [aggregated]);

  const upsertDailyMutation = useMutation({
    mutationFn: async () => {
      const name = editWorkerName.trim();
      if (!name) throw new Error("작업자명을 입력하세요.");
      const daily = Number(editDaily);
      if (!Number.isFinite(daily) || daily <= 0) throw new Error("일당을 올바르게 입력하세요.");

      if (editDirectoryId) {
        const payload: TablesUpdate<"admin_user_directory"> = { daily };
        const { error } = await supabase.from("admin_user_directory").update(payload).eq("id", editDirectoryId);
        if (error) throw error;
        return;
      }

      const payload: TablesInsert<"admin_user_directory"> = { name, daily, role: "worker", is_active: true };
      const { error } = await supabase.from("admin_user_directory").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-salary-directory"] });
      setEditOpen(false);
      toast.success("일당을 저장했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "저장에 실패했습니다."),
  });

  if (!isAdmin) {
    return <div className="py-20 text-center text-muted-foreground">급여관리는 본사관리자만 이용할 수 있습니다.</div>;
  }

  if (dirError || wlError) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">급여관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (dirLoading || wlLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">급여관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">급여관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">
        작업일지 공수(worklog_manpower)와 인력 디렉터리 일당(admin_user_directory.daily)을 기반으로 급여를 집계합니다.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "작업자 수", value: stats.workerCount, sub: "집계 대상" },
          { label: "총 공수", value: stats.totalManDays.toFixed(1), sub: "man-day" },
          { label: "일당 등록", value: stats.knownDaily, sub: "명" },
          { label: "추정 급여", value: stats.totalPay.toLocaleString("ko-KR"), sub: "원" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
            <div className="text-[11px] text-muted-foreground">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          className="h-[48px] rounded-xl border border-border bg-card px-3 text-[14px] font-semibold text-foreground outline-none"
        >
          <option value="30">최근 30일</option>
          <option value="90">최근 90일</option>
          <option value="all">전체</option>
        </select>
        <div className="relative flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="작업자명 검색"
            className="h-[48px] w-full rounded-xl border border-border bg-card pl-4 pr-10 text-[15px] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {editOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 text-[15px] font-[800] text-header-navy">일당 수정</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">작업자명</label>
              <input value={editWorkerName} disabled className="h-11 w-full rounded-lg border border-border px-3 text-[14px] opacity-70" />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">일당(원)</label>
              <input
                type="number"
                value={editDaily}
                onChange={(e) => setEditDaily(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => upsertDailyMutation.mutate()}
              disabled={upsertDailyMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-primary-foreground disabled:opacity-50"
            >
              저장
            </button>
            <button type="button" onClick={() => setEditOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[14px] font-bold">
              취소
            </button>
          </div>
        </div>
      )}

      {aggregated.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">집계 데이터가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {aggregated.map((row) => (
            <div key={row.workerName} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="font-[800] text-foreground">{row.workerName}</div>
                <div className="text-[12px] text-text-sub">공수 {row.manDays.toFixed(2)}일 · 일당 {row.daily?.toLocaleString("ko-KR") ?? "미설정"}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("text-[14px] font-[800]", row.estimatedPay != null ? "text-header-navy" : "text-muted-foreground")}>
                  {row.estimatedPay != null ? `${row.estimatedPay.toLocaleString("ko-KR")}원` : "-"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditWorkerName(row.workerName);
                    setEditDirectoryId(row.directoryId);
                    setEditDaily(row.daily ?? 150000);
                    setEditOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold"
                >
                  <Pencil className="h-3.5 w-3.5" /> 일당
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
