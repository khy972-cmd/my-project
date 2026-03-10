import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Link2, Mail, Pencil, Phone, Plus, Search, Unlink, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useUserRole } from "@/hooks/useUserRole";
import { formatDate } from "@/lib/dateFormat";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { ROLE_LABELS, ROLE_PRIORITY, normalizeAppRole, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

type AdminDirectoryRow = Tables<"admin_user_directory">;
type PendingRoleAssignmentRow = Tables<"pending_role_assignments">;
type PendingStatus = "pending" | "linked" | "cancelled";
type RoleFilter = "all" | AppRole;
type ReservableRole = Extract<AppRole, "admin" | "manager">;

type UserDirectoryRecord = {
  id: string;
  linkedUserId: string | null;
  name: string;
  phone: string | null;
  affiliation: string | null;
  role: AppRole;
  notes: string | null;
  daily: number | null;
  siteCount: number;
  worklogCount: number;
};

type AdminAuthAccount = {
  user_id: string;
  email: string | null;
  profile_name: string | null;
  current_role: AppRole;
};

type ReservationFormState = {
  id: string | null;
  reservedName: string;
  reservedEmail: string;
  reservedRole: ReservableRole;
  note: string;
  status: PendingStatus;
};

const EMPTY_FIELD = "\u00A0";
const USER_DIRECTORY_QUERY_KEY = ["admin-users-directory"];
const PENDING_ROLE_ASSIGNMENTS_QUERY_KEY = ["pending-role-assignments"];
const ADMIN_AUTH_ACCOUNTS_QUERY_KEY = ["admin-auth-accounts"];

const ROLE_CLS: Record<AppRole, string> = {
  admin: "border-slate-200 bg-slate-100 text-slate-800",
  manager: "border-amber-200 bg-amber-50 text-amber-800",
  worker: "border-sky-200 bg-sky-50 text-sky-700",
  partner: "border-violet-200 bg-violet-50 text-violet-700",
};

const STAT_CARD_STYLES: Record<RoleFilter, string> = {
  all: "border-slate-200 bg-slate-50 text-slate-700",
  worker: "border-sky-200 bg-sky-50 text-sky-700",
  manager: "border-amber-200 bg-amber-50 text-amber-800",
  admin: "border-slate-300 bg-slate-100 text-slate-800",
  partner: "border-violet-200 bg-violet-50 text-violet-700",
};

const STATUS_CLS: Record<PendingStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  linked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildCountMap(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sortUsers(users: UserDirectoryRecord[]) {
  return [...users].sort((left, right) => {
    const roleDiff = ROLE_PRIORITY[right.role] - ROLE_PRIORITY[left.role];
    if (roleDiff !== 0) return roleDiff;
    return left.name.localeCompare(right.name, "ko-KR");
  });
}

function highestRole(roles: string[] | undefined) {
  if (!roles || roles.length === 0) return "worker" as AppRole;
  return [...roles]
    .map((role) => normalizeAppRole(role))
    .sort((left, right) => ROLE_PRIORITY[right] - ROLE_PRIORITY[left])[0];
}

function assignmentStatusLabel(status: string) {
  if (status === "linked") return "연결됨";
  if (status === "cancelled") return "취소됨";
  return "대기중";
}

function buildInitialForm(isAdmin: boolean): ReservationFormState {
  return {
    id: null,
    reservedName: "",
    reservedEmail: "",
    reservedRole: isAdmin ? "admin" : "manager",
    note: "",
    status: "pending",
  };
}

async function fetchLegacyUsers(): Promise<UserDirectoryRecord[]> {
  const [profilesResult, rolesResult, membersResult, worklogsResult] = await Promise.all([
    supabase.from("profiles").select("user_id, name, phone, affiliation"),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("site_members").select("user_id"),
    supabase.from("worklogs").select("created_by"),
  ]);

  if (profilesResult.error) throw profilesResult.error;
  if (rolesResult.error) throw rolesResult.error;
  if (membersResult.error) throw membersResult.error;
  if (worklogsResult.error) throw worklogsResult.error;

  const roleMap = (rolesResult.data || []).reduce<Record<string, string[]>>((acc, row) => {
    acc[row.user_id] = [...(acc[row.user_id] || []), row.role];
    return acc;
  }, {});
  const siteCountMap = buildCountMap((membersResult.data || []).map((row) => row.user_id));
  const worklogCountMap = buildCountMap((worklogsResult.data || []).map((row) => row.created_by));

  const users = (profilesResult.data || []).map((profile) => ({
    id: profile.user_id,
    linkedUserId: profile.user_id,
    name: normalizeOptionalText(profile.name) || "미지정",
    phone: normalizeOptionalText(profile.phone),
    affiliation: normalizeOptionalText(profile.affiliation),
    role: highestRole(roleMap[profile.user_id]),
    notes: null,
    daily: null,
    siteCount: siteCountMap[profile.user_id] || 0,
    worklogCount: worklogCountMap[profile.user_id] || 0,
  }));

  return sortUsers(users);
}

async function fetchAdminDirectoryUsers(): Promise<UserDirectoryRecord[]> {
  const { data: directory, error } = await supabase
    .from("admin_user_directory")
    .select("id, linked_user_id, name, phone, affiliation, role, notes, is_active, daily, source")
    .eq("is_active", true);

  if (error) {
    if (isMissingSchemaEntityError(error, "admin_user_directory")) {
      return fetchLegacyUsers();
    }
    throw error;
  }

  const linkedUserIds = [...new Set((directory || []).map((row) => row.linked_user_id).filter(Boolean))] as string[];
  const [membersResult, worklogsResult] = linkedUserIds.length
    ? await Promise.all([
        supabase.from("site_members").select("user_id").in("user_id", linkedUserIds),
        supabase.from("worklogs").select("created_by").in("created_by", linkedUserIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (membersResult.error) throw membersResult.error;
  if (worklogsResult.error) throw worklogsResult.error;

  const siteCountMap = buildCountMap((membersResult.data || []).map((row) => row.user_id));
  const worklogCountMap = buildCountMap((worklogsResult.data || []).map((row) => row.created_by));
  const visibleDirectoryRows = ((directory || []) as AdminDirectoryRow[]).filter(
    (row) => row.source !== "pending_role_assignment",
  );

  const users = visibleDirectoryRows.map((row) => ({
    id: row.id,
    linkedUserId: row.linked_user_id,
    name: normalizeOptionalText(row.name) || "미지정",
    phone: normalizeOptionalText(row.phone),
    affiliation: normalizeOptionalText(row.affiliation),
    role: normalizeAppRole(row.role),
    notes: normalizeOptionalText(row.notes),
    daily: typeof row.daily === "number" ? row.daily : null,
    siteCount: row.linked_user_id ? siteCountMap[row.linked_user_id] || 0 : 0,
    worklogCount: row.linked_user_id ? worklogCountMap[row.linked_user_id] || 0 : 0,
  }));

  return sortUsers(users);
}

async function fetchPendingRoleAssignments(): Promise<PendingRoleAssignmentRow[]> {
  const { data, error } = await supabase.from("pending_role_assignments").select("*").order("created_at", { ascending: false });
  if (error) {
    if (isMissingSchemaEntityError(error, "pending_role_assignments")) return [];
    throw error;
  }
  return (data || []) as PendingRoleAssignmentRow[];
}

async function fetchAdminAuthAccounts(): Promise<AdminAuthAccount[]> {
  const { data, error } = await supabase.rpc("list_admin_auth_accounts");
  if (error) {
    if (isMissingSchemaEntityError(error, "list_admin_auth_accounts")) return [];
    throw error;
  }

  return ((data || []) as AdminAuthAccount[]).map((row) => ({
    user_id: row.user_id,
    email: normalizeOptionalText(row.email),
    profile_name: normalizeOptionalText(row.profile_name),
    current_role: normalizeAppRole(row.current_role),
  }));
}

function formatDaily(value: number | null) {
  if (!Number.isFinite(value)) return EMPTY_FIELD;
  return `${Number(value).toLocaleString("ko-KR")}원`;
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3", className)}>
      <div className="mb-1 text-[11px] font-bold tracking-[0.02em] text-text-sub">{label}</div>
      <div className="min-h-[20px] text-[14px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

export default function AdminUserManager() {
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useUserRole();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [reservationSearch, setReservationSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [reservationForm, setReservationForm] = useState<ReservationFormState>(() => buildInitialForm(isAdmin));
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const canManageReservations = isAdmin || isManager;

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: USER_DIRECTORY_QUERY_KEY,
    queryFn: fetchAdminDirectoryUsers,
  });
  const { data: pendingAssignments = [], isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY,
    queryFn: fetchPendingRoleAssignments,
    enabled: canManageReservations,
  });
  const { data: authAccounts = [], isLoading: authAccountsLoading, error: authAccountsError } = useQuery({
    queryKey: ADMIN_AUTH_ACCOUNTS_QUERY_KEY,
    queryFn: fetchAdminAuthAccounts,
    enabled: canManageReservations,
  });

  const saveReservationMutation = useMutation({
    mutationFn: async (form: ReservationFormState) => {
      const reservedRole: ReservableRole = isAdmin ? form.reservedRole : "manager";
      const payload: TablesUpdate<"pending_role_assignments"> = {
        reserved_name: form.reservedName.trim(),
        reserved_email: normalizeOptionalText(form.reservedEmail),
        reserved_role: reservedRole,
        note: normalizeOptionalText(form.note),
        status: form.status,
      };

      if (form.id) {
        const { error: updateError } = await supabase.from("pending_role_assignments").update(payload).eq("id", form.id);
        if (updateError) throw updateError;
        return;
      }

      const insertPayload: TablesInsert<"pending_role_assignments"> = {
        reserved_name: payload.reserved_name || "",
        reserved_email: payload.reserved_email ?? null,
        reserved_role: reservedRole,
        note: payload.note ?? null,
        status: "pending",
      };
      const { error: insertError } = await supabase.from("pending_role_assignments").insert(insertPayload);
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY });
      setReservationForm(buildInitialForm(isAdmin));
      setFormOpen(false);
      toast.success("권한예약을 저장했습니다.");
    },
    onError: (mutationError: { message?: string }) => {
      toast.error(mutationError.message || "권한예약 저장에 실패했습니다.");
    },
  });

  const linkReservationMutation = useMutation({
    mutationFn: async ({ assignmentId, userId }: { assignmentId: string; userId: string }) => {
      const { error: rpcError } = await supabase.rpc("link_pending_role_assignment", {
        _assignment_id: assignmentId,
        _target_user_id: userId,
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_ACCOUNTS_QUERY_KEY });
      toast.success("권한예약을 계정과 연결했습니다.");
    },
    onError: (mutationError: { message?: string }) => {
      toast.error(mutationError.message || "권한예약 연결에 실패했습니다.");
    },
  });

  const autoLinkReservationMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error: rpcError } = await supabase.rpc("auto_link_pending_role_assignment", { _assignment_id: assignmentId });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_ACCOUNTS_QUERY_KEY });
      toast.success("정확한 이메일 일치 계정으로 연결했습니다.");
    },
    onError: (mutationError: { message?: string }) => {
      toast.error(mutationError.message || "자동 연결에 실패했습니다.");
    },
  });

  const unlinkReservationMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error: rpcError } = await supabase.rpc("unlink_pending_role_assignment", { _assignment_id: assignmentId });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_DIRECTORY_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ADMIN_AUTH_ACCOUNTS_QUERY_KEY });
      toast.success("권한예약 연결을 해제했습니다.");
    },
    onError: (mutationError: { message?: string }) => {
      toast.error(mutationError.message || "연결 해제에 실패했습니다.");
    },
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async ({ assignmentId, nextStatus }: { assignmentId: string; nextStatus: PendingStatus }) => {
      const payload: TablesUpdate<"pending_role_assignments"> = { status: nextStatus };
      if (nextStatus === "cancelled") {
        payload.linked_user_id = null;
      }

      const { error: updateError } = await supabase.from("pending_role_assignments").update(payload).eq("id", assignmentId);
      if (updateError) throw updateError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PENDING_ROLE_ASSIGNMENTS_QUERY_KEY });
      toast.success(variables.nextStatus === "cancelled" ? "권한예약을 취소했습니다." : "권한예약을 다시 대기 상태로 전환했습니다.");
    },
    onError: (mutationError: { message?: string }) => {
      toast.error(mutationError.message || "권한예약 상태 변경에 실패했습니다.");
    },
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const digitQuery = search.replace(/\D/g, "");

    return users.filter((user) => {
      const haystacks = [user.name, user.affiliation || "", user.phone || ""].map((value) => value.toLowerCase());
      const phoneDigits = (user.phone || "").replace(/\D/g, "");
      const matchSearch = !query
        || haystacks.some((value) => value.includes(query))
        || (digitQuery.length > 0 && phoneDigits.includes(digitQuery));
      const matchRole = roleFilter === "all" || user.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    worker: users.filter((user) => user.role === "worker").length,
    manager: users.filter((user) => user.role === "manager").length,
    admin: users.filter((user) => user.role === "admin").length,
    partner: users.filter((user) => user.role === "partner").length,
  }), [users]);

  const sortedAuthAccounts = useMemo(
    () => [...authAccounts].sort((left, right) => {
      const leftLabel = left.profile_name || left.email || left.user_id;
      const rightLabel = right.profile_name || right.email || right.user_id;
      return leftLabel.localeCompare(rightLabel, "ko-KR");
    }),
    [authAccounts],
  );
  const authAccountsById = useMemo(
    () => new Map(sortedAuthAccounts.map((account) => [account.user_id, account])),
    [sortedAuthAccounts],
  );
  const filteredAssignments = useMemo(() => {
    const query = reservationSearch.trim().toLowerCase();
    const statusOrder: Record<PendingStatus, number> = { pending: 3, linked: 2, cancelled: 1 };

    return [...pendingAssignments]
      .filter((assignment) => {
        if (!query) return true;
        return [assignment.reserved_name, assignment.reserved_email || "", assignment.note || "", assignment.status]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => {
        const statusDiff =
          statusOrder[(right.status as PendingStatus) || "pending"] - statusOrder[(left.status as PendingStatus) || "pending"];
        if (statusDiff !== 0) return statusDiff;
        return right.created_at.localeCompare(left.created_at);
      });
  }, [pendingAssignments, reservationSearch]);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">인력 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">운영 인력 디렉터리와 DB 기반 권한예약을 함께 관리합니다.</p>

      <div className="mb-5 grid grid-cols-5 gap-2.5">
        {[
          { key: "all" as const, label: "전체", value: stats.total },
          { key: "worker" as const, label: "작업자", value: stats.worker },
          { key: "manager" as const, label: "관리자", value: stats.manager },
          { key: "admin" as const, label: "본사관리자", value: stats.admin },
          { key: "partner" as const, label: "파트너", value: stats.partner },
        ].map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setRoleFilter(card.key)}
            className={cn(
              "rounded-2xl border px-2 py-3 text-center shadow-soft transition-all active:scale-[0.98]",
              STAT_CARD_STYLES[card.key],
              roleFilter === card.key && "translate-y-[-1px] ring-1 ring-current/20",
            )}
          >
            <div className="text-[18px] font-[800]">{card.value}</div>
            <div className="text-[11px] font-bold">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="이름, 소속, 전화번호 검색"
          className="h-[48px] w-full rounded-xl border border-border bg-card pl-4 pr-10 text-[15px] font-medium outline-none focus:border-primary focus:shadow-input-focus"
        />
        {search ? (
          <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
      </div>

      {error ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-10 text-center text-sm-app font-medium text-muted-foreground shadow-soft">
          인력 데이터를 불러오지 못했습니다.
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-14 text-center text-sm-app font-medium text-muted-foreground">
          검색 조건에 맞는 인력이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[16px] font-[800] text-primary">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[17px] font-[800] text-header-navy">{user.name}</div>
                    <div className="text-[13px] font-medium text-text-sub">{user.linkedUserId ? "연동 계정 있음" : "연동 계정 없음"}</div>
                  </div>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold", ROLE_CLS[user.role])}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <InfoField label="소속" value={user.affiliation || EMPTY_FIELD} />
                <InfoField
                  label="전화번호"
                  value={user.phone ? (
                    <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1.5 text-sky-700 no-underline">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone}
                    </a>
                  ) : EMPTY_FIELD}
                />
                <InfoField
                  label="일당"
                  value={user.daily != null ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <Wallet className="h-3.5 w-3.5" />
                      {formatDaily(user.daily)}
                    </span>
                  ) : EMPTY_FIELD}
                />
                <InfoField label="현장/일지" value={`${user.siteCount}개 / ${user.worklogCount}건`} />
              </div>

              {user.notes ? (
                <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3">
                  <div className="mb-1 text-[11px] font-bold tracking-[0.02em] text-text-sub">메모</div>
                  <div className="text-[14px] font-semibold text-foreground">{user.notes}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {canManageReservations ? (
        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-[17px] font-[800] text-header-navy">권한예약 관리</h2>
              <p className="mt-1 text-[13px] font-medium text-text-sub">
                실계정 권한은 기존처럼 <code>user_roles</code>로 판정하고, 이 섹션은 예약과 계정 연결 상태만 관리합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setReservationForm(buildInitialForm(isAdmin));
                setFormOpen((prev) => !prev);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              {formOpen ? "입력 닫기" : "권한예약 추가"}
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-[12px] font-medium text-text-sub">
            자동 연결은 예약 이메일과 실제 계정 이메일이 정확히 1건 일치할 때만 제안합니다. 이름만 같은 경우 자동 연결하지 않습니다.
          </div>
          {formOpen ? (
            <div className="mt-4 rounded-2xl border border-border/80 bg-background p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-[800] text-header-navy">
                    {reservationForm.id ? "권한예약 수정" : "새 권한예약 등록"}
                  </div>
                  <div className="mt-1 text-[12px] font-medium text-text-sub">
                    {reservationForm.id
                      ? `현재 상태: ${assignmentStatusLabel(reservationForm.status)}`
                      : "관리자콘솔에서 나중에 계정과 연결할 수 있습니다."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReservationForm(buildInitialForm(isAdmin));
                    setFormOpen(false);
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-text-sub transition-colors hover:bg-muted/60"
                >
                  닫기
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1.5 text-[12px] font-bold text-text-sub">예약 이름</div>
                  <input
                    value={reservationForm.reservedName}
                    onChange={(event) => setReservationForm((prev) => ({ ...prev, reservedName: event.target.value }))}
                    placeholder="예: 김재형"
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-primary focus:shadow-input-focus"
                  />
                </label>
                <label className="block">
                  <div className="mb-1.5 text-[12px] font-bold text-text-sub">예약 이메일</div>
                  <input
                    value={reservationForm.reservedEmail}
                    onChange={(event) => setReservationForm((prev) => ({ ...prev, reservedEmail: event.target.value }))}
                    placeholder="정확히 일치하는 계정 이메일만 자동 연결 후보가 됩니다"
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-primary focus:shadow-input-focus"
                  />
                </label>
                <label className="block">
                  <div className="mb-1.5 text-[12px] font-bold text-text-sub">예약 권한</div>
                  <select
                    value={reservationForm.reservedRole}
                    disabled={!isAdmin || reservationForm.status === "linked"}
                    onChange={(event) => setReservationForm((prev) => ({
                      ...prev,
                      reservedRole: event.target.value as ReservableRole,
                    }))}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-primary focus:shadow-input-focus disabled:bg-muted/50 disabled:text-muted-foreground"
                  >
                    {isAdmin ? (
                      <>
                        <option value="admin">본사관리자</option>
                        <option value="manager">관리자</option>
                      </>
                    ) : (
                      <option value="manager">관리자</option>
                    )}
                  </select>
                </label>
                <label className="block">
                  <div className="mb-1.5 text-[12px] font-bold text-text-sub">메모</div>
                  <input
                    value={reservationForm.note}
                    onChange={(event) => setReservationForm((prev) => ({ ...prev, note: event.target.value }))}
                    placeholder="예: 운영 발급 계정 대기"
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-primary focus:shadow-input-focus"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!reservationForm.reservedName.trim() || saveReservationMutation.isPending}
                  onClick={() => saveReservationMutation.mutate(reservationForm)}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveReservationMutation.isPending ? "저장 중..." : reservationForm.id ? "수정 저장" : "예약 저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReservationForm(buildInitialForm(isAdmin));
                    setFormOpen(false);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold text-text-sub transition-colors hover:bg-muted/60"
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}

          <div className="relative mt-4">
            <input
              value={reservationSearch}
              onChange={(event) => setReservationSearch(event.target.value)}
              placeholder="이름, 이메일, 메모, 상태 검색"
              className="h-[46px] w-full rounded-xl border border-border bg-card pl-4 pr-10 text-[14px] font-medium outline-none focus:border-primary focus:shadow-input-focus"
            />
            {reservationSearch ? (
              <button
                type="button"
                onClick={() => setReservationSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>

          {pendingError ? (
            <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              권한예약 데이터를 불러오지 못했습니다.
            </div>
          ) : authAccountsError ? (
            <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              연결 가능한 계정 목록을 불러오지 못했습니다.
            </div>
          ) : pendingLoading || authAccountsLoading ? (
            <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-8 text-center text-sm font-medium text-muted-foreground">
              권한예약 정보를 불러오는 중입니다.
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-background px-4 py-10 text-center text-sm font-medium text-muted-foreground">
              등록된 권한예약이 없습니다.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredAssignments.map((assignment) => {
                const normalizedStatus = (["pending", "linked", "cancelled"].includes(assignment.status)
                  ? assignment.status
                  : "pending") as PendingStatus;
                const linkedAccount = assignment.linked_user_id ? authAccountsById.get(assignment.linked_user_id) : undefined;
                const reservedEmail = normalizeOptionalText(assignment.reserved_email);
                const exactMatches = reservedEmail
                  ? sortedAuthAccounts.filter((account) => (account.email || "").toLowerCase() === reservedEmail.toLowerCase())
                  : [];
                const exactUniqueCandidate = exactMatches.length === 1 ? exactMatches[0] : null;
                const canManageAssignment = isAdmin || assignment.reserved_role === "manager";
                const selectedTarget = selectedTargets[assignment.id] || "";

                return (
                  <div key={assignment.id} className="rounded-2xl border border-border/80 bg-background p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[17px] font-[800] text-header-navy">{assignment.reserved_name}</div>
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[11px] font-bold",
                              ROLE_CLS[normalizeAppRole(assignment.reserved_role)],
                            )}
                          >
                            {ROLE_LABELS[normalizeAppRole(assignment.reserved_role)]}
                          </span>
                          <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", STATUS_CLS[normalizedStatus])}>
                            {assignmentStatusLabel(normalizedStatus)}
                          </span>
                          {!canManageAssignment ? (
                            <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-bold text-text-sub">
                              관리자만 수정 가능
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] font-medium text-text-sub">
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {reservedEmail || "예약 이메일 없음"}
                          </span>
                          <span>생성 {formatDate(assignment.created_at)}</span>
                          <span>수정 {formatDate(assignment.updated_at)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={!canManageAssignment}
                          onClick={() => {
                            setReservationForm({
                              id: assignment.id,
                              reservedName: assignment.reserved_name,
                              reservedEmail: assignment.reserved_email || "",
                              reservedRole: assignment.reserved_role === "admin" ? "admin" : "manager",
                              note: assignment.note || "",
                              status: normalizedStatus,
                            });
                            setFormOpen(true);
                          }}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-text-sub transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4" />
                          수정
                        </button>
                        {assignment.linked_user_id ? (
                          <button
                            type="button"
                            disabled={!canManageAssignment || unlinkReservationMutation.isPending}
                            onClick={() => unlinkReservationMutation.mutate(assignment.id)}
                            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-text-sub transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Unlink className="h-4 w-4" />
                            연결 해제
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={!canManageAssignment || cancelReservationMutation.isPending}
                          onClick={() =>
                            cancelReservationMutation.mutate({
                              assignmentId: assignment.id,
                              nextStatus: normalizedStatus === "cancelled" ? "pending" : "cancelled",
                            })
                          }
                          className={cn(
                            "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            normalizedStatus === "cancelled"
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-rose-200 text-rose-700 hover:bg-rose-50",
                          )}
                        >
                          <Ban className="h-4 w-4" />
                          {normalizedStatus === "cancelled" ? "재활성" : "취소"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 lg:grid-cols-3">
                      <InfoField
                        label="현재 연결 계정"
                        value={linkedAccount ? (
                          <div className="space-y-0.5">
                            <div>{linkedAccount.profile_name || linkedAccount.email || linkedAccount.user_id}</div>
                            <div className="text-[12px] font-medium text-text-sub">
                              {linkedAccount.email || linkedAccount.user_id}
                            </div>
                          </div>
                        ) : assignment.linked_user_id ? (
                          <div className="space-y-0.5">
                            <div>{assignment.linked_user_id}</div>
                            <div className="text-[12px] font-medium text-text-sub">계정 메타데이터를 찾지 못했습니다.</div>
                          </div>
                        ) : (
                          EMPTY_FIELD
                        )}
                      />
                      <InfoField
                        label="자동 연결 후보"
                        value={reservedEmail ? (
                          exactUniqueCandidate ? (
                            <div className="space-y-0.5">
                              <div>{exactUniqueCandidate.profile_name || exactUniqueCandidate.email || exactUniqueCandidate.user_id}</div>
                              <div className="text-[12px] font-medium text-text-sub">
                                {exactUniqueCandidate.email || exactUniqueCandidate.user_id}
                              </div>
                            </div>
                          ) : exactMatches.length > 1 ? (
                            "동일 이메일 후보가 복수여서 자동 연결을 막았습니다."
                          ) : (
                            "정확히 일치하는 이메일 계정이 없습니다."
                          )
                        ) : (
                          "예약 이메일이 없어 자동 연결 후보를 제시하지 않습니다."
                        )}
                      />
                      <InfoField label="메모" value={assignment.note || EMPTY_FIELD} />
                    </div>

                    <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(0,1.2fr)_auto_auto]">
                      <select
                        value={selectedTarget}
                        onChange={(event) =>
                          setSelectedTargets((prev) => ({
                            ...prev,
                            [assignment.id]: event.target.value,
                          }))
                        }
                        disabled={!canManageAssignment}
                        className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:border-primary focus:shadow-input-focus disabled:bg-muted/50 disabled:text-muted-foreground"
                      >
                        <option value="">수동 연결할 계정을 선택하세요</option>
                        {sortedAuthAccounts.map((account) => (
                          <option key={account.user_id} value={account.user_id}>
                            {(account.profile_name || "이름없음").trim()} / {account.email || account.user_id} / {ROLE_LABELS[account.current_role]}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={!canManageAssignment || !selectedTarget || linkReservationMutation.isPending}
                        onClick={() => linkReservationMutation.mutate({ assignmentId: assignment.id, userId: selectedTarget })}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold text-text-sub transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Link2 className="h-4 w-4" />
                        수동 연결
                      </button>

                      <button
                        type="button"
                        disabled={!canManageAssignment || !exactUniqueCandidate || autoLinkReservationMutation.isPending}
                        onClick={() => autoLinkReservationMutation.mutate(assignment.id)}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Mail className="h-4 w-4" />
                        자동 연결
                      </button>
                    </div>

                    <div className="mt-3 text-[12px] font-medium text-text-sub">
                      연결 해제는 예약과 계정의 매핑만 해제합니다. 기존 <code>user_roles</code> 기록은 자동으로 강등하지 않습니다.
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
