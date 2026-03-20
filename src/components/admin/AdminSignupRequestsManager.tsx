import { useEffect, useMemo, useState } from "react";
import { Search, X, Check, Ban, UserPlus, Building2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDateDot } from "@/lib/dateFormat";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type SignupRequestRow = Tables<"signup_requests">;
type OrganizationRow = Pick<Tables<"organizations">, "id" | "name" | "status">;
type StatusFilter = SignupRequestRow["status"] | "all";

const STATUS_LABEL: Record<SignupRequestRow["status"], string> = {
  pending: "승인 대기",
  approved: "승인 완료",
  rejected: "반려",
};

const STATUS_CLS: Record<SignupRequestRow["status"], string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const QUERY_KEY = ["admin-signup-requests-v2"];
const ORGANIZATION_QUERY_KEY = ["admin-organizations-select"];

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export default function AdminSignupRequestsManager() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("worker");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<SignupRequestRow[]> => {
      const { data, error } = await supabase
        .from("signup_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (isMissingSchemaEntityError(error, "signup_requests")) return [];
      if (error) throw error;
      return (data || []) as SignupRequestRow[];
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    enabled: isAdmin,
    queryFn: async (): Promise<OrganizationRow[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, status")
        .order("name");

      if (isMissingSchemaEntityError(error, "organizations")) return [];
      if (error) throw error;
      return (data || []) as OrganizationRow[];
    },
  });

  const detail = detailId ? rows.find((row) => row.id === detailId) ?? null : null;

  useEffect(() => {
    if (!detail) {
      setSelectedRole("worker");
      setSelectedOrgId("");
      setAdminNote("");
      return;
    }

    setSelectedRole(detail.request_type === "partner" ? "partner" : (detail.requested_role as AppRole));
    setAdminNote(detail.admin_note ?? "");

    if (detail.request_type !== "partner") {
      setSelectedOrgId("");
      return;
    }

    const matchedOrganization = organizations.find(
      (organization) => normalizeText(organization.name) === normalizeText(detail.requested_company_name),
    );

    setSelectedOrgId(detail.assigned_org_id ?? matchedOrganization?.id ?? "");
  }, [detail?.id, detail?.assigned_org_id, detail?.admin_note, detail?.request_type, detail?.requested_company_name, detail?.requested_role, organizations]);

  const approveMutation = useMutation({
    mutationFn: async (request: SignupRequestRow) => {
      if (request.request_type === "partner" && !selectedOrgId) {
        throw new Error("파트너 승인은 조직 선택이 필요합니다.");
      }

      const { error } = await supabase.rpc("admin_approve_signup_request", {
        _request_id: request.id,
        _assigned_role: request.request_type === "partner" ? "partner" : selectedRole,
        _assigned_org_id: request.request_type === "partner" ? selectedOrgId : null,
        _admin_note: adminNote.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-partners-v2"] });
      toast.success("가입 요청을 승인했습니다.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "가입 요청 승인에 실패했습니다.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (request: SignupRequestRow) => {
      const { error } = await supabase.rpc("admin_reject_signup_request", {
        _request_id: request.id,
        _admin_note: adminNote.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("가입 요청을 반려했습니다.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "가입 요청 반려에 실패했습니다.");
    },
  });

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      internalPending: rows.filter((row) => row.status === "pending" && row.request_type === "internal").length,
      partnerPending: rows.filter((row) => row.status === "pending" && row.request_type === "partner").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    let nextRows = rows;
    if (statusFilter !== "all") {
      nextRows = nextRows.filter((row) => row.status === statusFilter);
    }

    const query = search.trim().toLowerCase();
    if (!query) return nextRows;

    return nextRows.filter((row) =>
      [
        row.name,
        row.email,
        row.phone,
        row.requested_company_name,
        row.job_title,
        row.admin_note,
      ]
        .map((value) => normalizeText(value))
        .some((value) => value.includes(query)),
    );
  }, [rows, search, statusFilter]);

  const internalRows = filtered.filter((row) => row.request_type === "internal");
  const partnerRows = filtered.filter((row) => row.request_type === "partner");

  if (!isAdmin) {
    return <div className="py-20 text-center text-muted-foreground">가입 요청 관리는 본사 관리자만 사용할 수 있습니다.</div>;
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">가입 요청 관리</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          가입 요청을 불러오는 중 오류가 발생했습니다.
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

  const renderRequestList = (title: string, description: string, requestRows: SignupRequestRow[]) => (
    <section className="space-y-3">
      <div>
        <h2 className="text-[16px] font-[800] text-header-navy">{title}</h2>
        <p className="text-[13px] text-text-sub">{description}</p>
      </div>

      {requestRows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-[14px] text-muted-foreground">
          표시할 요청이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {requestRows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "rounded-2xl border border-border bg-card p-4 shadow-soft transition-all",
                detailId === row.id && "ring-2 ring-primary/30",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-[16px] font-[800] text-foreground">{row.name}</div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[12px] font-bold", STATUS_CLS[row.status])}>
                      {STATUS_LABEL[row.status]}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-text-sub">{row.email}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    <span>{row.request_type === "partner" ? "협력사" : "내부 직원"}</span>
                    <span>{formatDateDot(row.created_at)}</span>
                    {row.request_type === "partner" && row.requested_company_name && (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                        요청 회사: {row.requested_company_name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDetailId((current) => (current === row.id ? null : row.id))}
                  className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold text-foreground"
                >
                  {detailId === row.id ? "닫기" : "상세"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">가입 요청 관리</h1>
        <p className="text-[15px] font-medium text-text-sub">
          협력사 요청은 회사명을 비공개로 접수하고, 승인 시 조직을 지정해 접근 범위를 고정합니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "전체 요청", value: stats.total },
          { label: "승인 대기", value: stats.pending },
          { label: "내부 대기", value: stats.internalPending },
          { label: "협력사 대기", value: stats.partnerPending },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-3 text-left shadow-soft">
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="이름, 이메일, 요청 회사명 검색"
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

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="h-12 rounded-xl border border-border bg-card px-4 text-[14px] font-semibold outline-none focus:border-primary"
        >
          <option value="all">전체 상태</option>
          <option value="pending">승인 대기</option>
          <option value="approved">승인 완료</option>
          <option value="rejected">반려</option>
        </select>
      </div>

      {renderRequestList("내부 직원 요청", "내부 직원은 더 단순한 승인 흐름으로 역할만 지정하면 됩니다.", internalRows)}
      {renderRequestList("협력사 요청", "요청 회사명은 관리자만 확인하고, 승인 시 조직을 연결합니다.", partnerRows)}

      {detail && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-[16px] font-[800] text-header-navy">{detail.name}</h3>
              </div>
              <p className="mt-1 text-[13px] text-text-sub">{detail.email}</p>
            </div>
            <span className={cn("rounded-full border px-2 py-0.5 text-[12px] font-bold", STATUS_CLS[detail.status])}>
              {STATUS_LABEL[detail.status]}
            </span>
          </div>

          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
            <div>
              <div className="text-[12px] font-bold text-slate-500">요청 구분</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">
                {detail.request_type === "partner" ? "협력사" : "내부 직원"}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-500">연락처</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">{detail.phone || "-"}</div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-500">요청 역할</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">{ROLE_LABELS[detail.requested_role]}</div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-500">요청 일시</div>
              <div className="mt-1 text-[14px] font-semibold text-slate-900">{formatDateDot(detail.created_at)}</div>
            </div>
            {detail.requested_company_name && (
              <div className="md:col-span-2">
                <div className="text-[12px] font-bold text-slate-500">제출 회사명</div>
                <div className="mt-1 text-[14px] font-semibold text-slate-900">{detail.requested_company_name}</div>
              </div>
            )}
            {detail.job_title && (
              <div>
                <div className="text-[12px] font-bold text-slate-500">직책</div>
                <div className="mt-1 text-[14px] font-semibold text-slate-900">{detail.job_title}</div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {detail.request_type === "internal" ? (
              <div>
                <label className="mb-1 block text-[13px] font-bold text-text-sub">승인 역할</label>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as AppRole)}
                  disabled={detail.status !== "pending"}
                  className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="worker">작업자</option>
                  <option value="manager">관리자</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="mb-1 flex items-center gap-1 text-[13px] font-bold text-text-sub">
                  승인 조직 <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedOrgId}
                    onChange={(event) => setSelectedOrgId(event.target.value)}
                    disabled={detail.status !== "pending"}
                    className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="">조직을 선택해 주세요</option>
                    {organizations
                      .filter((organization) => organization.status !== "inactive")
                      .map((organization) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-[13px] font-bold text-text-sub">관리자 메모</label>
              <textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                disabled={detail.status !== "pending"}
                placeholder="승인/반려 사유 또는 내부 메모"
                className="min-h-[92px] w-full rounded-xl border border-border bg-card px-3 py-3 text-[14px] outline-none focus:border-primary disabled:opacity-60"
              />
            </div>
          </div>

          {detail.status === "pending" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => approveMutation.mutate(detail)}
                disabled={approveMutation.isPending || (detail.request_type === "partner" && !selectedOrgId)}
                className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[14px] font-bold text-emerald-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                승인
              </button>
              <button
                type="button"
                onClick={() => rejectMutation.mutate(detail)}
                disabled={rejectMutation.isPending}
                className="flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[14px] font-bold text-rose-700 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                반려
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
              검토 완료된 요청입니다. 상태를 다시 변경하려면 데이터베이스에서 새 요청을 만들어 주세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
