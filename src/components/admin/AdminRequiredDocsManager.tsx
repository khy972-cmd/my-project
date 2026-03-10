import { useDeferredValue, useMemo, useState } from "react";
import { FileCheck, Plus, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { cn } from "@/lib/utils";

type DocTypeAgg = { doc_type: string; count: number };
type RequiredTypeRow = {
  id: string;
  key: string;
  label: string;
  required: boolean;
  sort_order: number;
  is_active: boolean;
};

const DOC_QUERY_KEY = ["admin-required-docs-docs"];
const SETTINGS_QUERY_KEY = ["admin-required-docs-settings"];

export default function AdminRequiredDocsManager() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [panel, setPanel] = useState<"settings" | "status">("settings");
  const [range, setRange] = useState<"all" | "30" | "90">("all");

  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<RequiredTypeRow[]> => {
      const { data, error } = await (supabase as any)
        .from("company_doc_types")
        .select("id, key, label, required, sort_order, is_active")
        .order("is_active", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("label", { ascending: true })
        .limit(300);
      if (isMissingSchemaEntityError(error, "company_doc_types")) return [];
      if (error) throw error;
      return (data || []) as RequiredTypeRow[];
    },
  });

  const { data: docAgg = [], isLoading: docsLoading, error: docsError } = useQuery({
    queryKey: [...DOC_QUERY_KEY, range],
    enabled: isAdmin,
    queryFn: async (): Promise<DocTypeAgg[]> => {
      const since =
        range === "all"
          ? null
          : new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();

      // Prefer DB-side aggregation (fast). Fallback to client aggregation if RPC missing.
      const { data: rpcData, error: rpcErr } = await (supabase as any).rpc("admin_document_type_counts", { _since: since });
      if (!rpcErr && Array.isArray(rpcData)) {
        return (rpcData as Array<{ doc_type: string; count: number }>)
          .map((r) => ({ doc_type: r.doc_type || "other", count: Number(r.count || 0) }))
          .filter((r) => r.doc_type)
          .sort((a, b) => b.count - a.count || a.doc_type.localeCompare(b.doc_type, "ko-KR"));
      }

      if (isMissingSchemaEntityError(rpcErr, "admin_document_type_counts")) {
        // Fallback: fetch doc_type only and aggregate client-side (kept for backward compatibility)
        const { data, error } = await supabase.from("documents").select("doc_type, created_at").limit(5000);
        if (isMissingSchemaEntityError(error, "documents")) return [];
        if (error) throw error;
        const rows = (data || []) as Array<{ doc_type: string; created_at?: string }>;
        const map = new Map<string, number>();
        rows.forEach((r) => {
          if (since && r.created_at && r.created_at < since) return;
          const t = r.doc_type || "other";
          map.set(t, (map.get(t) || 0) + 1);
        });
        return Array.from(map.entries())
          .map(([doc_type, count]) => ({ doc_type, count }))
          .sort((a, b) => b.count - a.count || a.doc_type.localeCompare(b.doc_type, "ko-KR"));
      }

      // Unknown RPC error: surface it
      throw rpcErr;
    },
    staleTime: 15_000,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ key, label }: { key: string; label: string }) => {
      const payload = { key: key.trim(), label: label.trim(), required: true, sort_order: 0, is_active: true };
      const { error } = await (supabase as any).from("company_doc_types").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success("필수서류 유형을 추가했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "추가에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<RequiredTypeRow> }) => {
      const { error } = await (supabase as any).from("company_doc_types").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
    onError: (e: { message?: string }) => toast.error(e.message || "변경에 실패했습니다."),
  });

  const settingsFiltered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return settings;
    return settings.filter((r) => `${r.key} ${r.label}`.toLowerCase().includes(q));
  }, [settings, deferredSearch]);

  const docsFiltered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return docAgg;
    return docAgg.filter((r) => r.doc_type.toLowerCase().includes(q));
  }, [docAgg, deferredSearch]);

  const stats = useMemo(() => {
    const active = settings.filter((s) => s.is_active).length;
    const required = settings.filter((s) => s.required).length;
    return { totalTypes: settings.length, activeTypes: active, requiredTypes: required, docTypes: docAgg.length };
  }, [settings, docAgg]);

  if (!isAdmin) {
    return <div className="py-20 text-center text-muted-foreground">필수서류 관리는 본사관리자만 이용할 수 있습니다.</div>;
  }

  if (docsError) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">필수서류 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (settingsLoading || docsLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">필수서류 관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">필수서류 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">필수서류 유형 설정과 업로드 현황을 함께 관리합니다.</p>

      <div className="mb-5 grid grid-cols-4 gap-2.5">
        {[
          { label: "유형", value: stats.totalTypes },
          { label: "활성", value: stats.activeTypes },
          { label: "필수", value: stats.requiredTypes },
          { label: "업로드유형", value: stats.docTypes },
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
            placeholder="key/라벨/문서유형 검색"
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
          value={panel}
          onChange={(e) => setPanel(e.target.value as any)}
          className="h-[48px] rounded-xl border border-border bg-card px-3 text-[14px] font-semibold text-foreground appearance-none cursor-pointer outline-none"
        >
          <option value="settings">필수서류 설정</option>
          <option value="status">업로드 현황</option>
        </select>
        {panel === "status" && (
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="h-[48px] rounded-xl border border-border bg-card px-3 text-[14px] font-semibold text-foreground appearance-none cursor-pointer outline-none"
          >
            <option value="all">전체</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>
        )}
      </div>

      {panel === "settings" ? (
        settingsFiltered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-[15px] font-medium text-text-sub">
              {settings.length === 0 ? "필수서류 유형이 아직 없습니다." : "검색 결과가 없습니다."}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              필수서류 설정은 `company_doc_types` 테이블을 사용합니다. 마이그레이션이 적용되지 않았다면 먼저 적용하세요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {settingsFiltered.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4">
                <div className="min-w-0">
                  <div className="font-[800] text-foreground">{row.label}</div>
                  <div className="text-[12px] text-text-sub">key: {row.key} · order {row.sort_order}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: row.id, patch: { required: !row.required } })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-[13px] font-bold",
                      row.required ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700",
                    )}
                  >
                    {row.required ? "필수" : "선택"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: row.id, patch: { is_active: !row.is_active } })}
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-bold",
                      row.is_active ? "border-slate-200 bg-slate-100 text-slate-700" : "border-amber-200 bg-amber-50 text-amber-800",
                    )}
                  >
                    {row.is_active ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                    {row.is_active ? "비활성" : "활성"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : docsFiltered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">{docAgg.length === 0 ? "문서가 없습니다." : "검색 결과가 없습니다."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docsFiltered.map(({ doc_type, count }) => (
            <div key={doc_type} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <span className="font-semibold text-foreground">{doc_type || "(미분류)"}</span>
              <span className="text-[14px] font-bold text-text-sub">{count}건</span>
            </div>
          ))}
        </div>
      )}

      {/* Quick add helper: allow adding a required type from an existing doc_type */}
      {panel === "settings" && docAgg.length > 0 && (
        <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-2 text-[14px] font-[800] text-header-navy">빠른 추가</div>
          <p className="mb-3 text-[13px] text-text-sub">이미 업로드된 doc_type을 기준으로 필수서류 유형을 빠르게 추가할 수 있습니다.</p>
          <div className="flex flex-wrap gap-2">
            {docAgg.slice(0, 12).map((d) => (
              <button
                key={d.doc_type}
                type="button"
                onClick={() => upsertMutation.mutate({ key: d.doc_type, label: d.doc_type })}
                disabled={upsertMutation.isPending || settings.some((s) => s.key === d.doc_type)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-bold",
                  settings.some((s) => s.key === d.doc_type)
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-primary/30 bg-primary/10 text-primary",
                )}
              >
                <Plus className="h-3.5 w-3.5" /> {d.doc_type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
