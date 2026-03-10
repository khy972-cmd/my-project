import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES } from "@/lib/adminBadgeStyles";
import { cn } from "@/lib/utils";

type DeletionRequestStatus = "requested" | "reviewing" | "approved" | "rejected";

interface DeletionRequestRow {
  id: string;
  user_id: string;
  reason: string | null;
  status: DeletionRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  profile_name: string | null;
  profile_phone: string | null;
  profile_affiliation: string | null;
}

const STATUS_LABEL: Record<DeletionRequestStatus, string> = {
  requested: "요청됨",
  reviewing: "검토중",
  approved: "승인",
  rejected: "반려",
};

const STATUS_BADGE_CLASS: Record<DeletionRequestStatus, string> = {
  requested: ADMIN_CORNER_BADGE_TONES.amber,
  reviewing: ADMIN_CORNER_BADGE_TONES.sky,
  approved: ADMIN_CORNER_BADGE_TONES.emerald,
  rejected: ADMIN_CORNER_BADGE_TONES.rose,
};

import { formatDateTime } from "@/lib/dateFormat";

export default function AdminDeletionRequestManager() {
  const { user, isTestMode } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const canManage = isAdmin || isManager;
  const queryClient = useQueryClient();

  const mockRows: DeletionRequestRow[] = [
    {
      id: "mock-1",
      user_id: "user-1",
      reason: "개인 사정",
      status: "requested",
      created_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      profile_name: "홍길동",
      profile_phone: "010-0000-0001",
      profile_affiliation: "이노피앤씨",
    },
  ];

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-deletion-requests", user?.id || "anonymous", isTestMode],
    enabled: canManage,
    queryFn: async (): Promise<DeletionRequestRow[]> => {
      if (isTestMode) return mockRows;

      const { data, error } = await (supabase as any)
        .from("account_deletion_requests")
        .select("id, user_id, reason, status, created_at, reviewed_at, reviewed_by")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;

      const rows = (data || []) as Array<{
        id: string;
        user_id: string;
        reason: string | null;
        status: DeletionRequestStatus;
        created_at: string;
        reviewed_at: string | null;
        reviewed_by: string | null;
      }>;

      if (rows.length === 0) return [];

      const uniqueUserIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, phone, affiliation")
        .in("user_id", uniqueUserIds);

      const profileMap = new Map(
        (profiles || []).map((profile) => [
          profile.user_id,
          {
            name: profile.name || null,
            phone: profile.phone || null,
            affiliation: profile.affiliation || null,
          },
        ]),
      );

      return rows.map((row) => {
        const profile = profileMap.get(row.user_id);
        return {
          ...row,
          profile_name: profile?.name || null,
          profile_phone: profile?.phone || null,
          profile_affiliation: profile?.affiliation || null,
        };
      });
    },
  });

  const stats = useMemo(
    () => ({
      total: requests.length,
      requested: requests.filter((row) => row.status === "requested").length,
      reviewing: requests.filter((row) => row.status === "reviewing").length,
      approved: requests.filter((row) => row.status === "approved").length,
      rejected: requests.filter((row) => row.status === "rejected").length,
    }),
    [requests],
  );

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Exclude<DeletionRequestStatus, "requested"> }) => {
      if (!user?.id) throw new Error("로그인 정보가 없습니다.");
      if (isTestMode) return;
      const now = new Date().toISOString();
      const { error } = await (supabase as any)
        .from("account_deletion_requests")
        .update({
          status,
          reviewed_at: now,
          reviewed_by: user.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
      toast.success("탈퇴 요청 상태를 변경했습니다.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "탈퇴 요청 상태 변경에 실패했습니다.";
      toast.error(message);
    },
  });

  if (!canManage) {
    return (
      <div className="bg-card rounded-2xl shadow-soft p-6 text-sm text-muted-foreground">
        관리자 권한이 필요합니다.
      </div>
    );
  }

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">탈퇴요청 관리</h1>
        <p className="text-[15px] text-text-sub font-medium">회원 탈퇴 요청 조회 및 상태 처리</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <StatCard label="전체" value={stats.total} />
        <StatCard label="요청됨" value={stats.requested} />
        <StatCard label="검토중" value={stats.reviewing} />
        <StatCard label="승인" value={stats.approved} />
        <StatCard label="반려" value={stats.rejected} />
      </div>

      {requests.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-soft p-6 text-sm text-muted-foreground">접수된 탈퇴 요청이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const isRowUpdating =
              updateStatusMutation.isPending && updateStatusMutation.variables?.id === request.id;
            return (
              <div key={request.id} className="relative overflow-hidden bg-card rounded-2xl shadow-soft p-4">
                <span className={cn(ADMIN_CORNER_BADGE_BASE, STATUS_BADGE_CLASS[request.status])}>
                  {STATUS_LABEL[request.status]}
                </span>
                <div className="flex items-center gap-2">
                  <div className="pr-20">
                    <h3 className="text-[16px] font-[800] text-header-navy">
                      {request.profile_name || "이름 미등록"} ({request.user_id.slice(0, 8)}...)
                    </h3>
                    <p className="text-[13px] text-text-sub">
                      {request.profile_affiliation || "소속 미등록"}
                      {request.profile_phone ? ` / ${request.profile_phone}` : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoRow label="요청 시각" value={formatDateTime(request.created_at)} />
                  <InfoRow label="검토 시각" value={formatDateTime(request.reviewed_at)} />
                  <InfoRow label="검토자" value={request.reviewed_by || "-"} />
                  <InfoRow label="요청 사유" value={request.reason || "(사유 없음)"} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusButton
                    label="검토중"
                    disabled={isRowUpdating || request.status === "reviewing"}
                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: "reviewing" })}
                  />
                  <StatusButton
                    label="승인"
                    disabled={isRowUpdating || request.status === "approved"}
                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}
                  />
                  <StatusButton
                    label="반려"
                    disabled={isRowUpdating || request.status === "rejected"}
                    onClick={() => updateStatusMutation.mutate({ id: request.id, status: "rejected" })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <div className="text-[18px] font-[800] text-primary">{value}</div>
      <div className="text-[12px] text-text-sub font-bold">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-2.5 border border-border/40">
      <div className="text-[11px] font-bold text-text-sub mb-1">{label}</div>
      <div className="text-[13px] font-semibold break-all text-foreground">{value}</div>
    </div>
  );
}

function StatusButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-3 rounded-lg border border-border bg-muted/40 text-[12px] font-bold text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}
