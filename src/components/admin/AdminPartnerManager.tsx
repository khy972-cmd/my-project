import { useMemo, useState } from "react";
import { Search, X, Handshake, MapPin, Phone, UserPlus, Eye, Building2 } from "lucide-react";
import { ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES } from "@/lib/adminBadgeStyles";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

interface PartnerUser {
  user_id: string;
  name: string;
  affiliation: string | null;
  organizationId: string | null;
  organizationName: string | null;
  phone: string | null;
  manualSiteCount: number;
  deploymentCount: number;
}

type OrganizationRow = Pick<Tables<"organizations">, "id" | "name" | "status">;

const PARTNER_QUERY_KEY = ["admin-partners-v2"];
const ORGANIZATION_QUERY_KEY = ["admin-partner-organizations"];

export default function AdminPartnerManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailPartner, setDetailPartner] = useState<PartnerUser | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState<string | null>(null);
  const [organizationPartnerId, setOrganizationPartnerId] = useState<string | null>(null);

  const { data: organizations = [] } = useQuery({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: async (): Promise<OrganizationRow[]> => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, status")
        .order("name");
      if (error) throw error;
      return (data || []) as OrganizationRow[];
    },
  });

  const { data: partners = [], isLoading } = useQuery({
    queryKey: PARTNER_QUERY_KEY,
    queryFn: async (): Promise<PartnerUser[]> => {
      const { data: partnerRoles, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "partner");
      if (roleError) throw roleError;

      const partnerIds = [...new Set((partnerRoles || []).map((row) => row.user_id))];
      if (partnerIds.length === 0) return [];

      const [
        profilesResult,
        orgMembersResult,
        siteMembersResult,
        deploymentsResult,
        organizationsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("user_id, name, affiliation, phone").in("user_id", partnerIds),
        supabase.from("org_members").select("user_id, org_id").in("user_id", partnerIds),
        supabase.from("site_members").select("user_id, site_id").in("user_id", partnerIds),
        supabase.from("partner_deployments").select("partner_user_id").in("partner_user_id", partnerIds),
        supabase.from("organizations").select("id, name").order("name"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (orgMembersResult.error) throw orgMembersResult.error;
      if (siteMembersResult.error) throw siteMembersResult.error;
      if (deploymentsResult.error) throw deploymentsResult.error;
      if (organizationsResult.error) throw organizationsResult.error;

      const orgById = new Map((organizationsResult.data || []).map((row) => [row.id, row.name]));
      const profileByUserId = new Map((profilesResult.data || []).map((row) => [row.user_id, row]));
      const orgMembershipByUserId = new Map((orgMembersResult.data || []).map((row) => [row.user_id, row]));
      const manualSiteCount = new Map<string, number>();
      const deploymentCount = new Map<string, number>();

      (siteMembersResult.data || []).forEach((row) => {
        manualSiteCount.set(row.user_id, (manualSiteCount.get(row.user_id) || 0) + 1);
      });

      (deploymentsResult.data || []).forEach((row) => {
        deploymentCount.set(row.partner_user_id, (deploymentCount.get(row.partner_user_id) || 0) + 1);
      });

      return partnerIds.map((userId) => {
        const profile = profileByUserId.get(userId);
        const orgMember = orgMembershipByUserId.get(userId);
        const organizationName = orgMember?.org_id ? orgById.get(orgMember.org_id) ?? null : null;

        return {
          user_id: userId,
          name: profile?.name || "미지정",
          affiliation: profile?.affiliation ?? null,
          organizationId: orgMember?.org_id ?? null,
          organizationName,
          phone: profile?.phone ?? null,
          manualSiteCount: manualSiteCount.get(userId) || 0,
          deploymentCount: deploymentCount.get(userId) || 0,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return partners;

    return partners.filter((partner) =>
      [partner.name, partner.organizationName, partner.affiliation]
        .map((value) => (value || "").toLowerCase())
        .some((value) => value.includes(query)),
    );
  }, [partners, search]);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">파트너 관리</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">조직 배정을 기본으로 관리하고, 예외 현장은 별도로 추가합니다.</p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="h-[80.8px] rounded-xl border border-violet-200 bg-violet-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-violet-700">{partners.length}</div>
          <div className="text-[12px] font-bold text-violet-700">파트너 계정</div>
        </div>
        <div className="h-[80.8px] rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-sky-700">{partners.filter((partner) => partner.organizationId).length}</div>
          <div className="text-[12px] font-bold text-sky-700">조직 배정 완료</div>
        </div>
        <div className="h-[80.8px] rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-slate-700">{partners.reduce((sum, partner) => sum + partner.manualSiteCount, 0)}</div>
          <div className="text-[12px] font-bold text-slate-700">예외 현장 수</div>
        </div>
      </div>

      <div className="relative mb-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="파트너 이름 또는 조직 검색"
          className="h-[48px] w-full rounded-xl border border-border bg-card pl-4 pr-10 text-[15px] font-medium outline-none focus:border-primary focus:shadow-input-focus"
        />
        {search ? (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Handshake className="h-10 w-10 opacity-50" />
          <p>등록된 파트너가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((partner) => (
            <div key={partner.user_id} className="relative overflow-hidden rounded-2xl border border-violet-100 bg-card p-4 shadow-soft">
              <span className={cn(ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES.violet)}>파트너</span>
              <div className="mb-3 flex items-center gap-3 pr-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-[18px] font-[800] text-violet-700 ring-1 ring-violet-100">
                  {partner.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[17px] font-[800] text-header-navy">{partner.name}</div>
                  <div className="text-[13px] font-medium text-text-sub">
                    {partner.organizationName || partner.affiliation || "조직 미배정"}
                  </div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 rounded-xl border border-violet-100 bg-violet-50/40 p-2.5">
                <div className="border-r border-violet-100 text-center">
                  <span className="flex h-5 items-center justify-center text-[16px] font-[800] text-header-navy">
                    {partner.organizationId ? "배정" : "-"}
                  </span>
                  <span className="block text-[10px] font-bold text-text-sub">조직 상태</span>
                </div>
                <div className="border-r border-violet-100 text-center">
                  <span className="flex h-5 items-center justify-center text-[16px] font-[800] text-header-navy">{partner.manualSiteCount}</span>
                  <span className="block text-[10px] font-bold text-text-sub">예외 현장</span>
                </div>
                <div className="text-center">
                  {partner.phone ? (
                    <span className="flex h-5 items-center justify-center">
                      <Phone className="h-4 w-4 text-header-navy" strokeWidth={1.9} />
                    </span>
                  ) : (
                    <span className="flex h-5 items-center justify-center text-[16px] font-[800] text-slate-300">-</span>
                  )}
                  <span className="block text-[10px] font-bold text-text-sub">연락처</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOrganizationPartnerId(partner.user_id)}
                  className="flex-1 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-[13px] font-bold text-violet-700"
                >
                  조직 배정
                </button>
                <button
                  onClick={() => setAssignPartnerId(partner.user_id)}
                  className="flex-1 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] font-bold text-sky-700"
                >
                  예외 현장
                </button>
                <button
                  onClick={() => setDetailPartner(partner)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-[13px] font-bold text-slate-700"
                >
                  상세 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {organizationPartnerId && (
        <PartnerOrganizationAssignModal
          partner={partners.find((partner) => partner.user_id === organizationPartnerId) ?? null}
          organizations={organizations}
          onClose={() => setOrganizationPartnerId(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY });
            setOrganizationPartnerId(null);
          }}
        />
      )}

      {assignPartnerId && (
        <PartnerSiteAssignModal
          partnerId={assignPartnerId}
          onClose={() => setAssignPartnerId(null)}
        />
      )}

      {detailPartner && (
        <PartnerDetailModal partner={detailPartner} onClose={() => setDetailPartner(null)} />
      )}
    </div>
  );
}

function PartnerOrganizationAssignModal({
  partner,
  organizations,
  onClose,
  onSuccess,
}: {
  partner: PartnerUser | null;
  organizations: OrganizationRow[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedOrgId, setSelectedOrgId] = useState(partner?.organizationId ?? "");

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!partner) return;
      if (!selectedOrgId) {
        throw new Error("조직을 선택해 주세요.");
      }

      const organization = organizations.find((row) => row.id === selectedOrgId);
      if (!organization) {
        throw new Error("선택한 조직을 찾을 수 없습니다.");
      }

      const { error: deleteError } = await supabase
        .from("org_members")
        .delete()
        .eq("user_id", partner.user_id);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("org_members")
        .insert({ user_id: partner.user_id, org_id: selectedOrgId, role: "partner" });
      if (insertError) throw insertError;

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ user_id: partner.user_id, name: partner.name, phone: partner.phone, affiliation: organization.name });
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      toast.success("조직을 배정했습니다.");
      onSuccess();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "조직 배정에 실패했습니다.");
    },
  });

  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-t-[20px] bg-card p-6 animate-slide-up md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-[800] text-header-navy">조직 배정</h3>
          <button onClick={onClose} className="border-none bg-transparent">
            <X className="h-5 w-5 text-text-sub" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[15px] font-[800] text-slate-900">{partner.name}</div>
          <div className="mt-1 text-[13px] text-slate-600">현재 조직: {partner.organizationName || "미배정"}</div>
        </div>

        <label className="mb-2 block text-[13px] font-bold text-text-sub">조직 선택</label>
        <select
          value={selectedOrgId}
          onChange={(event) => setSelectedOrgId(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus:border-primary"
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

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="flex-1 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-[14px] font-bold text-violet-700 disabled:opacity-50"
          >
            저장
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-[14px] font-bold text-foreground"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function PartnerSiteAssignModal({ partnerId, onClose }: { partnerId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: assignedSites = [] } = useQuery({
    queryKey: ["partner-site-exceptions", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_members")
        .select("id, site_id, sites:site_id(name, status)")
        .eq("user_id", partnerId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allSites = [] } = useQuery({
    queryKey: ["all-sites-for-partner-exception"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, name, status")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const assignedSiteIds = new Set(assignedSites.map((site: any) => site.site_id));
  const availableSites = allSites.filter(
    (site) => !assignedSiteIds.has(site.id) && (!search || site.name.toLowerCase().includes(search.toLowerCase())),
  );

  const assignMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const { error } = await supabase
        .from("site_members")
        .insert({ site_id: siteId, user_id: partnerId, role: "partner" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-site-exceptions", partnerId] });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY });
      toast.success("예외 현장을 추가했습니다.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "예외 현장 추가에 실패했습니다.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("site_members")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-site-exceptions", partnerId] });
      queryClient.invalidateQueries({ queryKey: PARTNER_QUERY_KEY });
      toast.success("예외 현장을 제거했습니다.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "예외 현장 제거에 실패했습니다.");
    },
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-t-[20px] bg-card p-6 animate-slide-up md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-[800] text-header-navy">예외 현장 관리</h3>
          <button onClick={onClose} className="border-none bg-transparent">
            <X className="h-5 w-5 text-text-sub" />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-[14px] font-bold text-text-sub">현재 예외 현장 ({assignedSites.length}개)</div>
          {assignedSites.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">추가된 예외 현장이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {assignedSites.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-[14px] font-bold text-foreground">{member.sites?.name || "미지정"}</span>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(member.id)}
                    className="border-none bg-transparent text-[12px] font-bold text-destructive"
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="mb-2 text-[14px] font-bold text-text-sub">예외 현장 추가</div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="현장명 검색"
            className="mb-3 h-[44px] w-full rounded-xl border border-border bg-card px-3 text-[14px] font-medium outline-none focus:border-primary"
          />
          <div className="max-h-[200px] space-y-2 overflow-y-auto">
            {availableSites.map((site) => (
              <div key={site.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-text-sub" />
                  <span className="text-[14px] font-bold text-foreground">{site.name}</span>
                </div>
                <button
                  onClick={() => assignMutation.mutate(site.id)}
                  className="rounded-lg bg-violet-100 px-3 py-1.5 text-[12px] font-bold text-violet-600"
                >
                  추가
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerDetailModal({ partner, onClose }: { partner: PartnerUser; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50 md:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-[500px] overflow-y-auto rounded-t-[20px] bg-card p-6 animate-slide-up md:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[18px] font-[800] text-header-navy">{partner.name} 상세</h3>
          <button onClick={onClose} className="border-none bg-transparent">
            <X className="h-5 w-5 text-text-sub" />
          </button>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-[14px]">
            <div>
              <span className="font-medium text-text-sub">이름</span>
              <div className="font-bold text-foreground">{partner.name}</div>
            </div>
            <div>
              <span className="font-medium text-text-sub">조직</span>
              <div className="font-bold text-foreground">{partner.organizationName || "-"}</div>
            </div>
            <div>
              <span className="font-medium text-text-sub">소속 표기</span>
              <div className="font-bold text-foreground">{partner.affiliation || "-"}</div>
            </div>
            <div>
              <span className="font-medium text-text-sub">연락처</span>
              <div className="font-bold text-foreground">{partner.phone || "-"}</div>
            </div>
            <div>
              <span className="font-medium text-text-sub">예외 현장</span>
              <div className="font-bold text-foreground">{partner.manualSiteCount}개</div>
            </div>
            <div>
              <span className="font-medium text-text-sub">투입 기록</span>
              <div className="font-bold text-foreground">{partner.deploymentCount}건</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
