import { useDeferredValue, useMemo, useState } from "react";
import { Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { cn } from "@/lib/utils";

type MaterialRow = {
  id: string;
  worklog_id: string;
  name: string;
  qty: number;
};

type WorklogRow = {
  id: string;
  site_name: string;
  work_date: string;
  status: string | null;
  created_at: string;
};

type JoinedRow = MaterialRow & { worklog: WorklogRow | null };

type AuditRow = {
  id: string;
  material_id: string | null;
  worklog_id: string | null;
  action: "insert" | "update" | "delete" | string;
  before: any | null;
  after: any | null;
  note: string | null;
  actor_id: string | null;
  created_at: string;
};

type AuditEnrichedRow = AuditRow & {
  worklog_site_name?: string | null;
  worklog_work_date?: string | null;
  material_label?: string | null;
};

const QUERY_KEY = ["admin-materials"];

export default function AdminMaterialsManager() {
  const { isAdmin, isManager } = useUserRole();
  const canAccess = isAdmin || isManager;
  const canEdit = isAdmin; // 안전: 관리자(manager)는 조회만
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [view, setView] = useState<"summary" | "worklogs" | "audit">("summary");
  const [editOpen, setEditOpen] = useState(false);
  const [editMode, setEditMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);
  const [editWorklogId, setEditWorklogId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState<number>(1);
  const [visibleWorklogs, setVisibleWorklogs] = useState(20);

  // 보기별로 필요한 데이터만 로드 (로딩 단축)
  const { data: summaryRows = [], isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: [...QUERY_KEY, "summary"],
    enabled: canAccess && view === "summary",
    queryFn: async (): Promise<MaterialRow[]> => {
      const { data, error: qErr } = await supabase
        .from("worklog_materials")
        .select("id, worklog_id, name, qty")
        .order("worklog_id", { ascending: false })
        .limit(4000);
      if (isMissingSchemaEntityError(qErr, "worklog_materials")) return [];
      if (qErr) throw qErr;
      return (data || []) as MaterialRow[];
    },
    staleTime: 15_000,
  });

  const { data: worklogRows = [], isLoading: worklogsLoading, error: worklogsError } = useQuery({
    queryKey: [...QUERY_KEY, "worklogs"],
    enabled: canAccess && view === "worklogs",
    queryFn: async (): Promise<JoinedRow[]> => {
      const { data, error: qErr } = await supabase
        .from("worklog_materials")
        .select("id, worklog_id, name, qty, worklog:worklogs(id, site_name, work_date, status, created_at)")
        .order("worklog_id", { ascending: false })
        .limit(2000);
      if (isMissingSchemaEntityError(qErr, "worklog_materials")) return [];
      if (qErr) throw qErr;
      return (data || []) as JoinedRow[];
    },
    staleTime: 10_000,
  });

  const { data: auditRows = [], isLoading: auditLoading, error: auditError } = useQuery({
    queryKey: ["admin-materials-audit"],
    enabled: isAdmin,
    queryFn: async (): Promise<AuditEnrichedRow[]> => {
      const { data, error: qErr } = await (supabase as any)
        .from("admin_worklog_material_audit")
        .select("id, material_id, worklog_id, action, before, after, note, actor_id, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      if (isMissingSchemaEntityError(qErr, "admin_worklog_material_audit")) return [];
      if (qErr) throw qErr;
      const base = (data || []) as AuditRow[];

      const worklogIds = [...new Set(base.map((r) => r.worklog_id).filter(Boolean))] as string[];
      const materialIds = [...new Set(base.map((r) => r.material_id).filter(Boolean))] as string[];

      const [worklogsRes, materialsRes] = await Promise.all([
        worklogIds.length
          ? supabase.from("worklogs").select("id, site_name, work_date").in("id", worklogIds)
          : Promise.resolve({ data: [] as any[], error: null as any }),
        materialIds.length
          ? supabase.from("worklog_materials").select("id, name, qty").in("id", materialIds)
          : Promise.resolve({ data: [] as any[], error: null as any }),
      ]);

      // If join fails due to RLS/schema, fail safely: keep base rows.
      const worklogMap = new Map<string, { site_name: string | null; work_date: string | null }>();
      if (!worklogsRes.error) {
        (worklogsRes.data || []).forEach((w: any) => {
          worklogMap.set(String(w.id), { site_name: w.site_name ?? null, work_date: w.work_date ?? null });
        });
      }

      const materialMap = new Map<string, { name: string | null; qty: number | null }>();
      if (!materialsRes.error) {
        (materialsRes.data || []).forEach((m: any) => {
          materialMap.set(String(m.id), { name: m.name ?? null, qty: typeof m.qty === "number" ? m.qty : null });
        });
      }

      return base.map((row) => {
        const w = row.worklog_id ? worklogMap.get(row.worklog_id) : null;
        const m = row.material_id ? materialMap.get(row.material_id) : null;
        const beforeName = row.before?.name ? String(row.before.name) : null;
        const afterName = row.after?.name ? String(row.after.name) : null;
        const label = m?.name || afterName || beforeName || null;
        return {
          ...row,
          worklog_site_name: w?.site_name ?? null,
          worklog_work_date: w?.work_date ?? null,
          material_label: label,
        };
      });
    },
  });

  const auditSafe = async (payload: any) => {
    const { error: auditErr } = await (supabase as any).from("admin_worklog_material_audit").insert(payload);
    if (isMissingSchemaEntityError(auditErr, "admin_worklog_material_audit")) return;
    if (auditErr) throw auditErr;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!editWorklogId) throw new Error("작업일지를 찾지 못했습니다.");
      const payload = { worklog_id: editWorklogId, name: editName.trim(), qty: Number(editQty || 0) };
      const { data, error: iErr } = await supabase.from("worklog_materials").insert(payload).select("id").single();
      if (iErr) throw iErr;
      await auditSafe({ material_id: data?.id ?? null, worklog_id: editWorklogId, action: "insert", before: null, after: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditOpen(false);
      toast.success("자재를 추가했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "추가에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editId) throw new Error("자재 항목을 찾지 못했습니다.");
      const before = normalized.find((r) => r.id === editId);
      const patch = { name: editName.trim(), qty: Number(editQty || 0) };
      const { error: uErr } = await supabase.from("worklog_materials").update(patch).eq("id", editId);
      if (uErr) throw uErr;
      await auditSafe({
        material_id: editId,
        worklog_id: before?.worklog_id ?? null,
        action: "update",
        before: before ? { name: before.name, qty: before.qty } : null,
        after: patch,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setEditOpen(false);
      toast.success("자재를 수정했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "수정에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const before = normalized.find((r) => r.id === id);
      const { error: dErr } = await supabase.from("worklog_materials").delete().eq("id", id);
      if (dErr) throw dErr;
      await auditSafe({
        material_id: id,
        worklog_id: before?.worklog_id ?? null,
        action: "delete",
        before: before ? { name: before.name, qty: before.qty } : null,
        after: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("자재를 삭제했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "삭제에 실패했습니다."),
  });

  const normalized = useMemo(() => {
    const base = view === "worklogs" ? worklogRows : summaryRows;
    return (base as any[])
      .map((r) => ({
        ...r,
        name: String(r.name || "").trim(),
        qty: Number(r.qty || 0),
      }))
      .filter((r) => r.name);
  }, [summaryRows, worklogRows, view]);

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((r) => {
      const site = (r as any).worklog?.site_name || "";
      const date = (r as any).worklog?.work_date || "";
      return (
        r.name.toLowerCase().includes(q) ||
        site.toLowerCase().includes(q) ||
        date.toLowerCase().includes(q)
      );
    });
  }, [normalized, deferredSearch]);

  const auditFiltered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return auditRows;
    return auditRows.filter((r) => {
      const hay = [
        r.action,
        r.material_id || "",
        r.worklog_id || "",
        r.worklog_site_name || "",
        r.worklog_work_date || "",
        r.material_label || "",
        r.actor_id || "",
        r.note || "",
        JSON.stringify(r.before || {}),
        JSON.stringify(r.after || {}),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [auditRows, deferredSearch]);

  const materialAgg = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; count: number }>();
    filtered.forEach((r) => {
      const key = r.name;
      const cur = map.get(key) || { name: key, qty: 0, count: 0 };
      cur.qty += r.qty;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty || b.count - a.count || a.name.localeCompare(b.name, "ko-KR"));
  }, [filtered]);

  const worklogAgg = useMemo(() => {
    const map = new Map<string, { worklog: WorklogRow; items: Array<{ id: string; name: string; qty: number }> }>();
    filtered.forEach((r) => {
      if (!r.worklog) return;
      const cur = map.get(r.worklog.id) || { worklog: r.worklog, items: [] };
      cur.items.push({ id: r.id, name: r.name, qty: r.qty });
      map.set(r.worklog.id, cur);
    });
    return Array.from(map.values()).sort((a, b) => (b.worklog.work_date || "").localeCompare(a.worklog.work_date || "") || (b.worklog.created_at || "").localeCompare(a.worklog.created_at || ""));
  }, [filtered]);

  const displayedWorklogs = useMemo(() => worklogAgg.slice(0, visibleWorklogs), [worklogAgg, visibleWorklogs]);

  const stats = useMemo(() => {
    const totalItems = normalized.length;
    const uniqueMaterials = new Set(normalized.map((r) => r.name)).size;
    const uniqueWorklogs = new Set(normalized.map((r) => r.worklog_id)).size;
    return { totalItems, uniqueMaterials, uniqueWorklogs };
  }, [normalized]);

  if (!canAccess) {
    return <div className="py-20 text-center text-muted-foreground">자재관리는 관리자 권한이 필요합니다.</div>;
  }

  if (summaryError || worklogsError || auditError) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">자재관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if ((view === "summary" && summaryLoading) || (view === "worklogs" && worklogsLoading) || (view === "audit" && auditLoading)) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">자재관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">자재관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">작업일지 자재 입력(`worklog_materials`)을 기준으로 자재 사용 현황을 조회합니다.{canEdit ? "" : " (조회 전용)"}</p>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {[
          { label: "자재 항목", value: stats.totalItems },
          { label: "자재 종류", value: stats.uniqueMaterials },
          { label: "일지 수", value: stats.uniqueWorklogs },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-3 text-center shadow-soft">
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === "summary" ? "자재명 검색" : view === "audit" ? "이력 검색 (현장/자재/ID)" : "자재명 / 현장명 / 날짜 검색"}
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
        <select
          value={view}
          onChange={(e) => {
            setView(e.target.value as any);
            setVisibleWorklogs(20);
            setEditOpen(false);
          }}
          className="h-[48px] rounded-xl border border-border bg-card px-3 text-[14px] font-semibold text-foreground appearance-none cursor-pointer outline-none"
        >
          <option value="summary">자재 집계</option>
          <option value="worklogs">일지별</option>
          {isAdmin && <option value="audit">변경 이력</option>}
        </select>
      </div>

      {editOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 text-[15px] font-[800] text-header-navy">{editMode === "create" ? "자재 추가" : "자재 수정"}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">자재명</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">수량</label>
              <input
                type="number"
                value={editQty}
                onChange={(e) => setEditQty(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => (editMode === "create" ? createMutation.mutate() : updateMutation.mutate())}
              disabled={!editName.trim() || !Number.isFinite(editQty) || (createMutation.isPending || updateMutation.isPending)}
              className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-primary-foreground disabled:opacity-50"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-[14px] font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {view === "audit" ? (
        !isAdmin ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-[15px] font-medium text-text-sub">변경 이력은 본사관리자만 조회할 수 있습니다.</p>
          </div>
        ) : auditFiltered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-[15px] font-medium text-text-sub">
              {auditRows.length === 0 ? "변경 이력이 없습니다." : "검색 결과가 없습니다."}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              이력 저장은 `admin_worklog_material_audit` 테이블을 사용합니다. 마이그레이션이 적용되지 않았다면 먼저 적용하세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {auditFiltered.map((row) => (
              <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-[800] text-foreground">
                      {row.action} <span className="text-muted-foreground font-bold">·</span>{" "}
                      {row.worklog_site_name || "현장"} {row.worklog_work_date ? `· ${row.worklog_work_date}` : ""}{" "}
                      <span className="text-muted-foreground font-bold">·</span>{" "}
                      {row.worklog_id ? `worklog ${row.worklog_id.slice(0, 8)}…` : "worklog -"}
                    </div>
                    <div className="mt-1 text-[12px] text-text-sub">
                      자재 {row.material_label || "-"} · material {row.material_id ? row.material_id.slice(0, 8) : "-"} · actor{" "}
                      {row.actor_id ? row.actor_id.slice(0, 8) : "-"}
                    </div>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[12px] font-bold", "border-slate-200 bg-slate-100 text-slate-700")}>
                    {new Date(row.created_at).toLocaleString("ko-KR")}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-1 text-[12px] font-bold text-text-sub">before</div>
                    <pre className="m-0 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{JSON.stringify(row.before, null, 2)}</pre>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-1 text-[12px] font-bold text-text-sub">after</div>
                    <pre className="m-0 whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{JSON.stringify(row.after, null, 2)}</pre>
                  </div>
                </div>
                {row.note && <div className="mt-2 text-[12px] text-text-sub">note: {row.note}</div>}
              </div>
            ))}
          </div>
        )
      ) : normalized.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">등록된 자재 데이터가 없습니다.</p>
        </div>
      ) : view === "summary" ? (
        materialAgg.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-[15px] font-medium text-text-sub">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {materialAgg.map((m) => (
              <div key={m.name} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
                <div className="min-w-0">
                  <div className="font-[800] text-foreground truncate">{m.name}</div>
                  <div className="text-[12px] text-text-sub">항목 {m.count}건</div>
                </div>
                <div className="text-[14px] font-[800] text-header-navy">{m.qty}</div>
              </div>
            ))}
          </div>
        )
      ) : worklogAgg.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedWorklogs.map(({ worklog, items }) => (
            <div key={worklog.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-[800] text-foreground">{worklog.site_name || "현장 미지정"}</div>
                  <div className="text-[13px] font-medium text-text-sub">{worklog.work_date || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full border px-2.5 py-1 text-[12px] font-bold", "border-slate-200 bg-slate-100 text-slate-700")}>
                    {worklog.status || "상태"}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode("create");
                        setEditId(null);
                        setEditWorklogId(worklog.id);
                        setEditName("");
                        setEditQty(1);
                        setEditOpen(true);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[13px] font-bold text-primary"
                    >
                      <Plus className="h-4 w-4" /> 추가
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-1.5">
                {items.map((it, idx) => (
                  <div key={`${worklog.id}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-[13px] font-semibold text-foreground">{it.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-text-sub">{it.qty}</span>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditMode("edit");
                              setEditId(it.id);
                              setEditWorklogId(worklog.id);
                              setEditName(it.name);
                              setEditQty(it.qty);
                              setEditOpen(true);
                            }}
                            className="rounded-md border border-border bg-card px-2 py-1 text-[12px] font-bold"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const ok = window.confirm("이 자재 항목을 삭제할까요?");
                              if (!ok) return;
                              deleteMutation.mutate({ id: it.id });
                            }}
                            disabled={deleteMutation.isPending}
                            className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[12px] font-bold text-rose-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {worklogAgg.length > displayedWorklogs.length && (
            <button
              type="button"
              onClick={() => setVisibleWorklogs((v) => v + 20)}
              className="w-full rounded-xl border border-border bg-card py-3 text-[14px] font-bold text-text-sub shadow-soft"
            >
              더보기 ({displayedWorklogs.length}/{worklogAgg.length})
            </button>
          )}
        </div>
      )}
    </div>
  );
}

