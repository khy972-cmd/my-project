import { useState, useMemo } from "react";
import { Search, X, Building2, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDateDot } from "@/lib/dateFormat";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { cn } from "@/lib/utils";

type Row = Tables<"organizations">;

const QUERY_KEY = ["admin-organizations"];
const STATUS_LABEL: Record<string, string> = { active: "활성", inactive: "비활성" };

export default function AdminOrganizationsManager() {
  const { isTestMode } = useAuth();
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<Row[]> => {
      const { data, err } = await supabase.from("organizations").select("*").order("name").limit(500);
      if (isMissingSchemaEntityError(err, "organizations")) return [];
      if (err) throw err;
      return (data || []) as Row[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const payload: TablesUpdate<"organizations"> = { name: formName.trim(), status: formStatus };
        const { error: updateError } = await supabase.from("organizations").update(payload).eq("id", editId);
        if (updateError) throw updateError;
      } else {
        const payload: TablesInsert<"organizations"> = { name: formName.trim(), status: formStatus };
        const { error: insertError } = await supabase.from("organizations").insert(payload);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setFormOpen(false);
      setEditId(null);
      setFormName("");
      setFormStatus("active");
      toast.success(editId ? "소속을 수정했습니다." : "소속을 등록했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "저장에 실패했습니다."),
  });

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === "active").length,
      inactive: rows.filter((r) => r.status === "inactive").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => (r.name || "").toLowerCase().includes(q));
    return list;
  }, [rows, statusFilter, search]);

  const openEdit = (row: Row) => {
    setEditId(row.id);
    setFormName(row.name || "");
    setFormStatus((row.status as "active" | "inactive") || "active");
    setFormOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-muted-foreground">소속(시공사) 관리는 본사관리자만 이용할 수 있습니다.</div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">소속(시공사) 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">소속(시공사) 관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">소속(시공사) 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">시공사·소속 마스터를 등록하고 관리합니다.</p>

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        {[
          { label: "전체", value: stats.total, key: "all" },
          { label: "활성", value: stats.active, key: "active" },
          { label: "비활성", value: stats.inactive, key: "inactive" },
        ].map(({ label, value, key }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={cn(
              "rounded-2xl border p-3 text-center shadow-soft transition-all",
              statusFilter === key ? "ring-2 ring-primary border-primary bg-primary/5" : "border-border bg-card",
            )}
          >
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="소속명 검색"
            className="h-11 w-full rounded-xl border border-border bg-[hsl(var(--bg-input))] pl-9 pr-9 text-[14px] outline-none focus:border-primary"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setEditId(null);
            setFormName("");
            setFormStatus("active");
            setFormOpen(true);
          }}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-4 text-[14px] font-bold text-primary"
        >
          <Plus className="h-4 w-4" /> 소속 추가
        </button>
      </div>

      {formOpen && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-[15px] font-[800] text-header-navy">{editId ? "소속 수정" : "소속 추가"}</h3>
          <div className="mb-3">
            <label className="mb-1 block text-[13px] font-bold text-text-sub">이름</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="시공사/소속명"
              className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-[13px] font-bold text-text-sub">상태</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
              className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => upsertMutation.mutate()}
              disabled={!formName.trim() || upsertMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {editId ? "저장" : "추가"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setEditId(null);
                setFormName("");
              }}
              className="rounded-lg border border-border px-4 py-2 text-[14px] font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">
            {rows.length === 0 ? "등록된 소속이 없습니다." : "검색 결과가 없습니다."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="font-[800] text-foreground">{row.name || "-"}</div>
                <div className="text-[12px] text-text-sub">
                  {STATUS_LABEL[row.status] || row.status} · 수정 {formatDateDot(row.updated_at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold"
              >
                수정
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
