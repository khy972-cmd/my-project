import { useMemo, useState } from "react";
import { Plus, Search, Sliders, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  category: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

const QUERY_KEY = ["admin-work-options"];

const CATEGORIES = [
  { key: "member", label: "부재명" },
  { key: "process", label: "작업공정" },
  { key: "work_type", label: "작업유형" },
  { key: "location", label: "위치" },
] as const;

export default function AdminWorkOptionsManager() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<string>(CATEGORIES[0].key);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: [...QUERY_KEY, category],
    enabled: isAdmin,
    queryFn: async (): Promise<Row[]> => {
      const { data, error: qErr } = await (supabase as any)
        .from("admin_work_options")
        .select("id, category, label, value, sort_order, is_active, updated_at")
        .eq("category", category)
        .order("is_active", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .limit(500);
      if (isMissingSchemaEntityError(qErr, "admin_work_options")) return [];
      if (qErr) throw qErr;
      return (data || []) as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.label} ${r.value}`.toLowerCase().includes(q));
  }, [rows, search]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category,
        label: label.trim(),
        value: value.trim(),
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
        is_active: isActive,
      };
      if (editId) {
        const { error: uErr } = await (supabase as any).from("admin_work_options").update(payload).eq("id", editId);
        if (uErr) throw uErr;
        return;
      }
      const { error: iErr } = await (supabase as any).from("admin_work_options").insert(payload);
      if (iErr) throw iErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, category] });
      setFormOpen(false);
      setEditId(null);
      setLabel("");
      setValue("");
      setSortOrder(0);
      setIsActive(true);
      toast.success(editId ? "옵션을 수정했습니다." : "옵션을 추가했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "저장에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, nextActive }: { id: string; nextActive: boolean }) => {
      const { error: uErr } = await (supabase as any).from("admin_work_options").update({ is_active: nextActive }).eq("id", id);
      if (uErr) throw uErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, category] }),
    onError: (e: { message?: string }) => toast.error(e.message || "상태 변경에 실패했습니다."),
  });

  const openCreate = () => {
    setEditId(null);
    setLabel("");
    setValue("");
    setSortOrder(0);
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditId(row.id);
    setLabel(row.label || "");
    setValue(row.value || "");
    setSortOrder(row.sort_order ?? 0);
    setIsActive(!!row.is_active);
    setFormOpen(true);
  };

  if (!isAdmin) {
    return <div className="py-20 text-center text-muted-foreground">작업 옵션 관리는 본사관리자만 이용할 수 있습니다.</div>;
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">작업 옵션 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">작업 옵션 관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const categoryLabel = CATEGORIES.find((c) => c.key === category)?.label || category;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">작업 옵션 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">작업 유형·공정·부재명 등 옵션 마스터를 관리합니다.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-11 rounded-xl border border-border bg-card px-3 text-[14px] font-bold"
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${categoryLabel} 검색`}
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
          onClick={openCreate}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-4 text-[14px] font-bold text-primary"
        >
          <Plus className="h-4 w-4" /> 옵션 추가
        </button>
      </div>

      {formOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 text-[15px] font-[800] text-header-navy">{editId ? "옵션 수정" : "옵션 추가"}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">표시명</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">값(value)</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">정렬 순서</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">활성</label>
              <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")} className="h-11 w-full rounded-lg border border-border bg-card px-3 text-[14px] font-bold">
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => upsertMutation.mutate()}
              disabled={!label.trim() || !value.trim() || upsertMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-primary-foreground disabled:opacity-50"
            >
              저장
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border border-border px-4 py-2 text-[14px] font-bold">
              취소
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Sliders className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">{rows.length === 0 ? "등록된 옵션이 없습니다." : "검색 결과가 없습니다."}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            옵션이 보이지 않으면 Supabase에 `20260310140000_admin_parity_modules.sql` 마이그레이션이 적용되었는지 확인하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="font-[800] text-foreground">{row.label}</div>
                <div className="text-[12px] text-text-sub">value: {row.value} · order {row.sort_order}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => openEdit(row)} className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold">
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: row.id, nextActive: !row.is_active })}
                  disabled={toggleMutation.isPending}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-bold disabled:opacity-50",
                    row.is_active ? "border-slate-200 bg-slate-100 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {row.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                  {row.is_active ? "비활성" : "활성"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
