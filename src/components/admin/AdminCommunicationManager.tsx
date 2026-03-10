import { useMemo, useState } from "react";
import { Check, Megaphone, Pencil, Plus, Search, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { formatDateDot } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  status: "active" | "inactive" | string;
  target_roles: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

const QUERY_KEY = ["admin-announcements"];

export default function AdminCommunicationManager() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [targetRoles, setTargetRoles] = useState<string[]>(["worker", "partner", "manager"]);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<AnnouncementRow[]> => {
      const { data, error: qErr } = await (supabase as any)
        .from("admin_announcements")
        .select("id, title, body, status, target_roles, starts_at, ends_at, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(300);

      if (isMissingSchemaEntityError(qErr, "admin_announcements")) return [];
      if (qErr) throw qErr;
      return (data || []) as AnnouncementRow[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        status,
        target_roles: targetRoles.length > 0 ? targetRoles : null,
      };
      if (editId) {
        const { error: uErr } = await (supabase as any).from("admin_announcements").update(payload).eq("id", editId);
        if (uErr) throw uErr;
        return;
      }
      const { error: iErr } = await (supabase as any).from("admin_announcements").insert(payload);
      if (iErr) throw iErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setFormOpen(false);
      setEditId(null);
      setTitle("");
      setBody("");
      setStatus("active");
      toast.success(editId ? "공지를 수정했습니다." : "공지를 등록했습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "저장에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: "active" | "inactive" }) => {
      const { error: uErr } = await (supabase as any).from("admin_announcements").update({ status: nextStatus }).eq("id", id);
      if (uErr) throw uErr;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (e: { message?: string }) => toast.error(e.message || "상태 변경에 실패했습니다."),
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => `${r.title} ${r.body}`.toLowerCase().includes(q));
    return list;
  }, [rows, statusFilter, search]);

  const openCreate = () => {
    setEditId(null);
    setTitle("");
    setBody("");
    setStatus("active");
    setTargetRoles(["worker", "partner", "manager"]);
    setFormOpen(true);
  };

  const openEdit = (row: AnnouncementRow) => {
    setEditId(row.id);
    setTitle(row.title || "");
    setBody(row.body || "");
    setStatus(row.status === "inactive" ? "inactive" : "active");
    setTargetRoles((row.target_roles || []).length ? (row.target_roles || []) : ["worker", "partner", "manager"]);
    setFormOpen(true);
  };

  if (!isAdmin) {
    return <div className="py-20 text-center text-muted-foreground">공지사항 관리는 본사관리자만 이용할 수 있습니다.</div>;
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">공지사항 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">공지사항 관리</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">공지사항 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">공지 작성·목록·활성/비활성·대상(역할) 설정을 관리합니다.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목/내용 검색"
            className="h-11 w-full rounded-xl border border-border bg-[hsl(var(--bg-input))] pl-9 pr-9 text-[14px] outline-none focus:border-primary"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-11 rounded-xl border border-border bg-card px-3 text-[14px] font-bold"
        >
          <option value="all">전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
        </select>
        <button
          type="button"
          onClick={openCreate}
          className="flex h-11 items-center gap-1.5 rounded-xl border border-primary bg-primary/10 px-4 text-[14px] font-bold text-primary"
        >
          <Plus className="h-4 w-4" /> 공지 작성
        </button>
      </div>

      {isMissingSchemaEntityError(null as any, "admin_announcements") && rows.length === 0 ? null : null}

      {formOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="mb-3 text-[15px] font-[800] text-header-navy">{editId ? "공지 수정" : "공지 작성"}</h3>
          <div className="mb-3">
            <label className="mb-1 block text-[13px] font-bold text-text-sub">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-border px-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div className="mb-3">
            <label className="mb-1 block text-[13px] font-bold text-text-sub">내용</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-border px-3 py-2 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-11 w-full rounded-lg border border-border bg-card px-3 text-[14px] font-bold"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">대상 역할</label>
              <div className="flex flex-wrap gap-1.5">
                {["worker", "partner", "manager", "admin"].map((r) => {
                  const on = targetRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTargetRoles(on ? targetRoles.filter((x) => x !== r) : [...targetRoles, r])}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[12px] font-bold",
                        on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-text-sub",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => upsertMutation.mutate()}
              disabled={!title.trim() || !body.trim() || upsertMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> 저장
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-[14px] font-bold"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-[15px] font-medium text-text-sub">{rows.length === 0 ? "등록된 공지가 없습니다." : "검색 결과가 없습니다."}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            만약 공지 목록이 항상 비어있다면, Supabase에 `20260310140000_admin_parity_modules.sql` 마이그레이션이 적용되었는지 확인하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => {
            const isActive = row.status !== "inactive";
            return (
              <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-[800] text-foreground">{row.title}</div>
                    <div className="mt-1 line-clamp-2 text-[13px] text-text-sub">{row.body}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      <span className={cn("rounded-full border px-2 py-0.5 font-bold", isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-700")}>
                        {isActive ? "활성" : "비활성"}
                      </span>
                      <span>작성 {formatDateDot(row.created_at)}</span>
                      <span>수정 {formatDateDot(row.updated_at)}</span>
                      {(row.target_roles || []).length > 0 && <span>대상 {(row.target_roles || []).join(", ")}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold"
                    >
                      <Pencil className="h-3.5 w-3.5" /> 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleMutation.mutate({ id: row.id, nextStatus: isActive ? "inactive" : "active" })}
                      disabled={toggleMutation.isPending}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[13px] font-bold disabled:opacity-50",
                        isActive ? "border-slate-200 bg-slate-100 text-slate-700" : "border-emerald-200 bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                      {isActive ? "비활성" : "활성"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
