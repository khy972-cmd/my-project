import { useState, useMemo } from "react";
import { Search, X, Handshake, MapPin, Phone, UserPlus, Eye } from "lucide-react";
import { ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES } from "@/lib/adminBadgeStyles";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PartnerUser {
  user_id: string;
  name: string;
  affiliation: string | null;
  phone: string | null;
  siteCount: number;
  deploymentCount: number;
}

export default function AdminPartnerManager() {
  const { isTestMode } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [detailPartner, setDetailPartner] = useState<PartnerUser | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState<string | null>(null);

  const MOCK_PARTNERS: PartnerUser[] = [
    { user_id: "p1", name: "한지민", affiliation: "대한건설", phone: "010-5555-6666", siteCount: 2, deploymentCount: 8 },
    { user_id: "p2", name: "오세훈", affiliation: "미래종합건설", phone: "010-7777-8888", siteCount: 3, deploymentCount: 15 },
    { user_id: "p3", name: "윤서연", affiliation: "한빛엔지니어링", phone: "010-4444-3333", siteCount: 1, deploymentCount: 5 },
  ];

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin-partners", isTestMode],
    queryFn: async () => {
      if (isTestMode) return MOCK_PARTNERS;
      // Get partner role users
      const { data: partnerRoles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "partner");
      if (rErr) throw rErr;

      const partnerIds = (partnerRoles || []).map(r => r.user_id);
      if (partnerIds.length === 0) return [];

      // Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, name, affiliation, phone")
        .in("user_id", partnerIds);
      if (pErr) throw pErr;

      // Get site counts
      const { data: members } = await supabase.from("site_members").select("user_id").in("user_id", partnerIds);
      const siteCount: Record<string, number> = {};
      members?.forEach(m => { siteCount[m.user_id] = (siteCount[m.user_id] || 0) + 1; });

      // Get deployment counts
      const { data: deployments } = await supabase.from("partner_deployments").select("partner_user_id").in("partner_user_id", partnerIds);
      const deplCount: Record<string, number> = {};
      deployments?.forEach(d => { deplCount[d.partner_user_id] = (deplCount[d.partner_user_id] || 0) + 1; });

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        name: p.name || "미지정",
        affiliation: p.affiliation,
        phone: p.phone,
        siteCount: siteCount[p.user_id] || 0,
        deploymentCount: deplCount[p.user_id] || 0,
      })) as PartnerUser[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return partners.filter(p => !q || p.name.toLowerCase().includes(q) || (p.affiliation || "").toLowerCase().includes(q));
  }, [partners, search]);

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">파트너 관리</h1>
      <p className="text-[15px] text-text-sub font-medium mb-5">파트너사 소속 관리 및 현장 배정</p>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="h-[80.8px] rounded-xl border border-violet-200 bg-violet-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-violet-700">{partners.length}</div>
          <div className="text-[12px] font-bold text-violet-700">파트너사</div>
        </div>
        <div className="h-[80.8px] rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-sky-700">{partners.reduce((s, p) => s + p.siteCount, 0)}</div>
          <div className="text-[12px] font-bold text-sky-700">배정 현장</div>
        </div>
        <div className="h-[80.8px] rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
          <div className="text-[22px] font-[800] text-slate-700">{partners.reduce((s, p) => s + p.deploymentCount, 0)}</div>
          <div className="text-[12px] font-bold text-slate-700">투입 기록</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="파트너 이름 또는 소속 검색"
          className="w-full h-[48px] bg-card border border-border rounded-xl pl-4 pr-10 text-[15px] font-medium outline-none focus:border-primary focus:shadow-input-focus" />
        {search ? <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
          : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Partner List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center gap-2">
          <Handshake className="w-10 h-10 opacity-50" />
          <p>등록된 파트너가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(partner => (
            <div key={partner.user_id} className="relative overflow-hidden rounded-2xl border border-violet-100 bg-card p-4 shadow-soft">
              <span className={cn(ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES.violet)}>파트너</span>
              <div className="mb-3 flex items-center gap-3 pr-20">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-[18px] font-[800] text-violet-700 ring-1 ring-violet-100">
                  {partner.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-[800] text-header-navy">{partner.name}</div>
                  <div className="text-[13px] text-text-sub font-medium">{partner.affiliation || "파트너사"}</div>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-3 rounded-xl border border-violet-100 bg-violet-50/40 p-2.5">
                <div className="text-center border-r border-violet-100">
                  <span className="flex h-5 items-center justify-center text-[16px] font-[800] text-header-navy">{partner.siteCount}</span>
                  <span className="block text-[10px] font-bold text-text-sub">배정 현장</span>
                </div>
                <div className="text-center border-r border-violet-100">
                  <span className="flex h-5 items-center justify-center text-[16px] font-[800] text-header-navy">{partner.deploymentCount}</span>
                  <span className="block text-[10px] font-bold text-text-sub">투입 기록</span>
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

              <div className="flex gap-2">
                <button
                  onClick={() => setAssignPartnerId(partner.user_id)}
                  className="flex-1 h-10 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                >
                  <UserPlus className="w-3.5 h-3.5" /> 현장 배정
                </button>
                <button
                  onClick={() => setDetailPartner(partner)}
                  className="flex-1 h-10 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]"
                >
                  <Eye className="w-3.5 h-3.5" /> 상세 보기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Partner Site Assignment Modal */}
      {assignPartnerId && (
        <PartnerSiteAssignModal partnerId={assignPartnerId} onClose={() => setAssignPartnerId(null)} />
      )}

      {/* Partner Detail Modal */}
      {detailPartner && (
        <PartnerDetailModal partner={detailPartner} onClose={() => setDetailPartner(null)} />
      )}
    </div>
  );
}

function PartnerSiteAssignModal({ partnerId, onClose }: { partnerId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: assignedSites = [] } = useQuery({
    queryKey: ["partner-sites", partnerId],
    queryFn: async () => {
      const { data } = await supabase.from("site_members").select("id, site_id, sites:site_id(name, status)").eq("user_id", partnerId);
      return data || [];
    },
  });

  const { data: allSites = [] } = useQuery({
    queryKey: ["all-sites-for-assign"],
    queryFn: async () => {
      const { data } = await supabase.from("sites").select("id, name, status");
      return data || [];
    },
  });

  const assignedSiteIds = new Set(assignedSites.map((s: any) => s.site_id));
  const availableSites = allSites.filter(s => !assignedSiteIds.has(s.id) && (!search || s.name.toLowerCase().includes(search.toLowerCase())));

  const assignMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const { error } = await supabase.from("site_members").insert({ site_id: siteId, user_id: partnerId, role: "partner" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-sites", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success("현장이 배정되었습니다");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("site_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-sites", partnerId] });
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success("배정이 해제되었습니다");
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-card rounded-t-[20px] md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-[800] text-header-navy">현장 배정 관리</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer"><X className="w-5 h-5 text-text-sub" /></button>
        </div>

        <div className="mb-4">
          <div className="text-[14px] font-bold text-text-sub mb-2">배정된 현장 ({assignedSites.length}개)</div>
          {assignedSites.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">배정된 현장이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {assignedSites.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-[14px] font-bold text-foreground">{(m as any).sites?.name || "미지정"}</span>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white",
                      (m as any).sites?.status === "진행중" ? "bg-blue-500" : (m as any).sites?.status === "예정" ? "bg-violet-500" : "bg-muted-foreground"
                    )}>{(m as any).sites?.status}</span>
                  </div>
                  <button onClick={() => removeMutation.mutate(m.id)} className="text-destructive text-[12px] font-bold bg-transparent border-none cursor-pointer">해제</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4">
          <div className="text-[14px] font-bold text-text-sub mb-2">현장 추가 배정</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="현장명 검색"
            className="w-full h-[44px] bg-card border border-border rounded-xl px-3 text-[14px] font-medium outline-none focus:border-primary mb-3" />
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {availableSites.map(site => (
              <div key={site.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-text-sub" />
                  <span className="text-[14px] font-bold text-foreground">{site.name}</span>
                </div>
                <button onClick={() => assignMutation.mutate(site.id)} className="h-8 px-3 bg-violet-100 text-violet-600 rounded-lg font-bold text-[12px] cursor-pointer active:scale-[0.98]">배정</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PartnerDetailModal({ partner, onClose }: { partner: PartnerUser; onClose: () => void }) {
  const { data: deployments = [] } = useQuery({
    queryKey: ["partner-deployments-detail", partner.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("partner_deployments")
        .select("*")
        .eq("partner_user_id", partner.user_id)
        .order("deploy_date", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-card rounded-t-[20px] md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-[800] text-header-navy">{partner.name} 상세</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer"><X className="w-5 h-5 text-text-sub" /></button>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 mb-4 border border-border/50">
          <div className="grid grid-cols-2 gap-3 text-[14px]">
            <div><span className="text-text-sub font-medium">이름</span><div className="font-bold text-foreground">{partner.name}</div></div>
            <div><span className="text-text-sub font-medium">소속</span><div className="font-bold text-foreground">{partner.affiliation || "-"}</div></div>
            <div><span className="text-text-sub font-medium">연락처</span><div className="font-bold text-foreground">{partner.phone || "-"}</div></div>
            <div><span className="text-text-sub font-medium">배정 현장</span><div className="font-bold text-foreground">{partner.siteCount}개</div></div>
          </div>
        </div>

        <div className="text-[14px] font-bold text-text-sub mb-2">최근 투입 기록 ({deployments.length}건)</div>
        {deployments.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center py-4">투입 기록이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {deployments.map((d: any) => (
              <div key={d.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-bold text-foreground">{d.site_name}</span>
                  <span className="text-[12px] text-text-sub">{d.deploy_date}</span>
                </div>
                <div className="text-[13px] text-text-sub font-medium">
                  투입 {d.people_count}명 {d.note && `· ${d.note}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
