import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock3, LogOut, ShieldAlert } from "lucide-react";
import logoImg from "@/assets/logo_b.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isMissingSchemaEntityError } from "@/lib/operationalData";
import { clearUserRoleCache, getUserRole } from "@/lib/userRole";

type SignupRequestRow = Tables<"signup_requests">;

function getStatusCopy(request: SignupRequestRow | null) {
  if (!request) {
    return {
      title: "승인 대기 중입니다",
      description: "가입 요청이 접수되었습니다. 관리자가 승인하면 바로 사용할 수 있습니다.",
      tone: "amber" as const,
    };
  }

  if (request.status === "rejected") {
    return {
      title: "가입 요청이 반려되었습니다",
      description: request.admin_note?.trim() || "관리자에게 문의해 주세요.",
      tone: "rose" as const,
    };
  }

  if (request.status === "approved") {
    return {
      title: "승인 반영 중입니다",
      description: "권한이 반영되는 동안 잠시만 기다려 주세요. 새로고침하거나 다시 로그인하면 반영될 수 있습니다.",
      tone: "emerald" as const,
    };
  }

  return {
    title: "승인 대기 중입니다",
    description: "가입 요청이 접수되었습니다. 관리자가 검토 후 승인하면 현장과 메뉴가 열립니다.",
    tone: "amber" as const,
  };
}

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  const redirectApprovedUser = async () => {
    if (!user?.id) return;
    clearUserRoleCache(user.id);
    const nextRole = await getUserRole(user.id);
    if (!nextRole) return;
    navigate(nextRole === "admin" || nextRole === "manager" ? "/admin" : "/", { replace: true });
  };

  const { data: request, isLoading, refetch } = useQuery({
    queryKey: ["signup-request", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async (): Promise<SignupRequestRow | null> => {
      const { data, error } = await supabase
        .from("signup_requests")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (isMissingSchemaEntityError(error, "signup_requests")) return null;
      if (error) throw error;
      return (data || null) as SignupRequestRow | null;
    },
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (roleLoading || !role) return;
    navigate(role === "admin" || role === "manager" ? "/admin" : "/", { replace: true });
  }, [navigate, role, roleLoading]);

  useEffect(() => {
    if (!user?.id || role) return;

    const intervalId = window.setInterval(() => {
      void redirectApprovedUser();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [role, user?.id]);

  const copy = getStatusCopy(request ?? null);
  const toneClass =
    copy.tone === "rose"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : copy.tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[460px] items-center">
        <div className="w-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] max-[640px]:rounded-[24px] max-[640px]:p-6">
          <div className="mb-8 text-center">
            <img src={logoImg} alt="INOPNC" className="mx-auto mb-5 h-auto w-[188px] object-contain" />
            <div className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border ${toneClass}`}>
              {copy.tone === "rose" ? <ShieldAlert className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
            </div>
            <h1 className="text-[24px] font-[800] text-header-navy">{copy.title}</h1>
            <p className="mt-3 text-[14px] leading-6 text-slate-500">{copy.description}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[14px] text-slate-600">
            <div className="font-semibold text-slate-800">{user?.email ?? "이메일 정보 없음"}</div>
            {request?.request_type && (
              <div className="mt-2">
                요청 구분: {request.request_type === "partner" ? "협력사" : "내부 직원"}
              </div>
            )}
            {request?.requested_company_name && (
              <div className="mt-1">제출 회사명: {request.requested_company_name}</div>
            )}
            {request?.job_title && <div className="mt-1">직책: {request.job_title}</div>}
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={async () => {
                await refetch();
                await redirectApprovedUser();
              }}
              disabled={isLoading}
              className="h-12 rounded-xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              상태 새로고침
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/auth", { replace: true });
              }}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border-none bg-header-navy text-[15px] font-semibold text-white transition-all hover:opacity-95"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
