import { useState, useMemo } from "react";
import { Search, X, Plus, MapPin, Users, ChevronDown, Edit2, Trash2, UserPlus, ClipboardList } from "lucide-react";
import { ADMIN_CORNER_BADGE_BASE, ADMIN_CORNER_BADGE_TONES } from "@/lib/adminBadgeStyles";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { MANUAL_SITE_SOURCE } from "@/lib/operationalData";
import { useOperationalSites } from "@/hooks/useOperationalSites";

interface SiteRow {
  id: string;
  name: string;
  address: string | null;
  builder: string | null;
  company_name: string | null;
  status: string;
  manager_name: string | null;
  manager_phone: string | null;
  created_at: string;
  memberCount?: number;
}

export default function AdminSiteManager() {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "진행중" | "예정" | "완료">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editSite, setEditSite] = useState<SiteRow | null>(null);
  const [assignSiteId, setAssignSiteId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAddr, setFormAddr] = useState("");
  const [formBuilder, setFormBuilder] = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formStatus, setFormStatus] = useState("진행중");
  const [formManager, setFormManager] = useState("");
  const [formPhone, setFormPhone] = useState("");

  const operationalSitesQuery = useOperationalSites();
  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["admin-sites", operationalSitesQuery.dataUpdatedAt],
    enabled: !operationalSitesQuery.isLoading,
    queryFn: async () => {
      const rawSites = operationalSitesQuery.data || [];
      const { data: members, error } = await supabase.from("site_members").select("site_id");
      if (error) throw error;
      const countMap: Record<string, number> = {};
      members?.forEach((member) => {
        countMap[member.site_id] = (countMap[member.site_id] || 0) + 1;
      });

      return rawSites.map((site) => ({
        id: site.id,
        name: site.name,
        address: site.address,
        builder: site.builder,
        company_name: site.company_name,
        status: site.status,
        manager_name: site.manager_name,
        manager_phone: site.manager_phone,
        created_at: site.created_at,
        memberCount: countMap[site.id] || 0,
      })) as SiteRow[];
    },
  });

  const canManageSites = isAdmin || isManager;

  const assertManagerAccess = () => {
    if (canManageSites) return true;
    toast.error("관리자 권한이 없습니다.");
    return false;
  };

  const assertAdminOnly = () => {
    if (isAdmin) return true;
    toast.error("본사관리자 권한이 없습니다.");
    return false;
  };

  const createMutation = useMutation({
    mutationFn: async (site: {
      name: string;
      address: string;
      builder: string;
      company_name: string;
      status: string;
      manager_name: string;
      manager_phone: string;
    }) => {
      if (!assertManagerAccess()) throw new Error("manager_only");
      if (!user?.id) throw new Error("auth_required");
      const { data: created, error } = await supabase
        .from("sites")
        .insert({ ...site, created_by: user.id, source_dataset: MANUAL_SITE_SOURCE })
        .select("id")
        .single();
      if (error || !created?.id) throw error ?? new Error("site_lookup_failed");
      if (isManager && user?.id) {
        const { error: memberError } = await supabase
          .from("site_members")
          .upsert({ site_id: created.id, user_id: user.id, role: "manager" }, { onConflict: "site_id,user_id" });
        if (memberError) throw memberError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-sites"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sites"] });
      setShowCreateModal(false);
      resetForm();
      toast.success("현장이 등록되었습니다");
    },
    onError: () => toast.error("등록에 실패했습니다"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name: string;
      address: string;
      builder: string;
      company_name: string;
      status: string;
      manager_name: string;
      manager_phone: string;
    }) => {
      if (!assertManagerAccess()) throw new Error("manager_only");
      const { error } = await supabase.from("sites").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-sites"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sites"] });
      setEditSite(null);
      resetForm();
      toast.success("현장 정보가 수정되었습니다");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!assertAdminOnly()) throw new Error("admin_only");
      const { error } = await supabase.from("sites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-sites"] });
      queryClient.invalidateQueries({ queryKey: ["admin-sites"] });
      toast.success("현장이 삭제되었습니다");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormAddr("");
    setFormBuilder("");
    setFormCompanyName("");
    setFormStatus("진행중");
    setFormManager("");
    setFormPhone("");
  };

  const openEdit = (site: SiteRow) => {
    setEditSite(site);
    setFormName(site.name);
    setFormAddr(site.address || "");
    setFormBuilder(site.builder || "");
    setFormCompanyName(site.company_name || "");
    setFormStatus(site.status);
    setFormManager(site.manager_name || "");
    setFormPhone(site.manager_phone || "");
  };

  const filtered = useMemo(() => {
    return sites.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || s.name.toLowerCase().includes(q)
        || (s.address || "").toLowerCase().includes(q)
        || (s.builder || "").toLowerCase().includes(q)
        || (s.company_name || "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sites, search, statusFilter]);

  const stats = useMemo(() => ({
    total: sites.length,
    ing: sites.filter(s => s.status === "진행중").length,
    wait: sites.filter(s => s.status === "예정").length,
    done: sites.filter(s => s.status === "완료").length,
  }), [sites]);

  if (isLoading || operationalSitesQuery.isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">현장 관리</h1>
          <p className="text-[15px] text-text-sub font-medium">현장 등록, 수정, 인원 배정</p>
        </div>
        <button
          onClick={() => { if (!assertManagerAccess()) return; resetForm(); setShowCreateModal(true); }}
          className="h-10 px-4 bg-primary text-primary-foreground rounded-xl font-bold text-[14px] flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> 현장등록
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { key: "all" as const, label: "전체", val: stats.total, cls: "bg-slate-50 text-slate-700 border-slate-200" },
          { key: "진행중" as const, label: "진행", val: stats.ing, cls: "bg-sky-50 text-sky-700 border-sky-200" },
          { key: "예정" as const, label: "예정", val: stats.wait, cls: "bg-amber-50 text-amber-800 border-amber-200" },
          { key: "완료" as const, label: "완료", val: stats.done, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setStatusFilter(c.key)}
            className={cn("p-2.5 rounded-xl text-center border cursor-pointer transition-all active:scale-[0.98]", c.cls, statusFilter === c.key && "translate-y-[-1px] ring-1 ring-current/20 shadow-soft")}
          >
            <div className="text-[18px] font-[800]">{c.val}</div>
            <div className="text-[11px] font-bold">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="현장명 또는 주소 검색"
          className="w-full h-[48px] bg-card border border-border rounded-xl pl-4 pr-10 text-[15px] font-medium outline-none focus:border-primary focus:shadow-input-focus" />
        {search ? <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
          : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Site List */}
      <div className="space-y-3">
        {filtered.map(site => (
          <div key={site.id} className="relative overflow-hidden bg-card rounded-2xl shadow-soft p-4">
            <span className={cn(
              ADMIN_CORNER_BADGE_BASE,
              site.status === "진행중"
                ? ADMIN_CORNER_BADGE_TONES.sky
                : site.status === "예정"
                  ? ADMIN_CORNER_BADGE_TONES.amber
                  : ADMIN_CORNER_BADGE_TONES.emerald
            )}>{site.status}</span>
            <div className="mb-2 flex items-start">
              <div className="flex-1 min-w-0 pr-20">
                <div className="text-[17px] font-[800] text-header-navy truncate">{site.name}</div>
                {site.address && <div className="text-[13px] text-text-sub mt-0.5 truncate">{site.address}</div>}
              </div>
            </div>
            {(site.builder || site.company_name) && (
              <div className="mb-3 flex flex-wrap gap-1.5 text-[12px] font-medium text-text-sub">
                {site.builder && <span className="rounded-full bg-slate-100 px-2.5 py-1">시공사 {site.builder}</span>}
                {site.company_name && <span className="rounded-full bg-slate-100 px-2.5 py-1">업체명 {site.company_name}</span>}
              </div>
            )}
            <div className="flex items-center gap-3 text-[13px] text-text-sub font-medium mb-3">
              {site.manager_name && (
                <span className="inline-flex items-center gap-1.5 text-header-navy">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-500" />
                  {site.manager_name}
                </span>
              )}
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {site.memberCount}명</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (!assertManagerAccess()) return; openEdit(site); }} className="flex-1 h-9 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]">
                <Edit2 className="w-3.5 h-3.5" /> 수정
              </button>
              <button onClick={() => { if (!assertManagerAccess()) return; setAssignSiteId(site.id); }} className="flex-1 h-9 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer active:scale-[0.98]">
                <UserPlus className="w-3.5 h-3.5" /> 인원배정
              </button>
              <button onClick={() => { if (!assertAdminOnly()) return; if (confirm("정말 삭제하시겠습니까?")) deleteMutation.mutate(site.id); }} className="h-9 px-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg cursor-pointer active:scale-[0.98]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editSite) && (
        <SiteFormModal
          title={editSite ? "현장 수정" : "현장 등록"}
          name={formName} setName={setFormName}
          addr={formAddr} setAddr={setFormAddr}
          builder={formBuilder} setBuilder={setFormBuilder}
          companyName={formCompanyName} setCompanyName={setFormCompanyName}
          status={formStatus} setStatus={setFormStatus}
          manager={formManager} setManager={setFormManager}
          phone={formPhone} setPhone={setFormPhone}
          onClose={() => { setShowCreateModal(false); setEditSite(null); resetForm(); }}
          onSubmit={() => {
            if (!assertManagerAccess()) return;
            if (!formName.trim()) { toast.error("현장명을 입력하세요"); return; }
            if (editSite) {
              updateMutation.mutate({
                id: editSite.id,
                name: formName,
                address: formAddr,
                builder: formBuilder,
                company_name: formCompanyName,
                status: formStatus,
                manager_name: formManager,
                manager_phone: formPhone,
              });
            } else {
              createMutation.mutate({
                name: formName,
                address: formAddr,
                builder: formBuilder,
                company_name: formCompanyName,
                status: formStatus,
                manager_name: formManager,
                manager_phone: formPhone,
              });
            }
          }}
          isEdit={!!editSite}
        />
      )}

      {/* Member Assignment Modal */}
      {assignSiteId && (
        <MemberAssignModal siteId={assignSiteId} onClose={() => setAssignSiteId(null)} />
      )}
    </div>
  );
}

/* ─── Site Form Modal ─── */
function SiteFormModal({
  title,
  name,
  setName,
  addr,
  setAddr,
  builder,
  setBuilder,
  companyName,
  setCompanyName,
  status,
  setStatus,
  manager,
  setManager,
  phone,
  setPhone,
  onClose,
  onSubmit,
  isEdit,
}: {
  title: string;
  name: string;
  setName: (v: string) => void;
  addr: string;
  setAddr: (v: string) => void;
  builder: string;
  setBuilder: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  manager: string;
  setManager: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  isEdit: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-card rounded-t-[20px] md:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[18px] font-[800] text-header-navy">{title}</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer"><X className="w-5 h-5 text-text-sub" /></button>
        </div>
        <div className="space-y-3">
          <FormField label="현장명 *" value={name} onChange={setName} placeholder="현장명을 입력하세요" />
          <FormField label="주소" value={addr} onChange={setAddr} placeholder="주소를 입력하세요" />
          <FormField label="시공사" value={builder} onChange={setBuilder} placeholder="원청사/시공사를 입력하세요" />
          <FormField label="업체명" value={companyName} onChange={setCompanyName} placeholder="업체명을 입력하세요" />
          <div>
            <label className="block text-[13px] font-bold text-text-sub mb-1">상태</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-[44px] bg-card border border-border rounded-xl px-3 text-[14px] font-medium outline-none">
              <option value="진행중">진행중</option>
              <option value="예정">예정</option>
              <option value="완료">완료</option>
            </select>
          </div>
          <FormField label="현장소장" value={manager} onChange={setManager} placeholder="소장명" />
          <FormField label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
        </div>
        <button onClick={onSubmit} className="mt-5 flex h-10 w-full items-center justify-center rounded-xl bg-primary-bg px-3.5 text-[15px] font-bold text-header-navy transition-colors hover:bg-primary/20 active:scale-[0.98]">
          {isEdit ? "수정 완료" : "등록하기"}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: "text" | "tel";
}) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-text-sub mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-[44px] bg-card border border-border rounded-xl px-3 text-[14px] font-medium outline-none focus:border-primary" />
    </div>
  );
}

/* ─── Member Assignment Modal ─── */
function MemberAssignModal({ siteId, onClose }: { siteId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: ["site-members", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_members").select("*, profiles:user_id(name, affiliation, phone)").eq("site_id", siteId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users-for-assign"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, name, affiliation, phone");
      if (error) throw error;
      return data || [];
    },
  });

  const memberUserIds = new Set(members.map((m: any) => m.user_id));
  const availableUsers = allUsers.filter(u => !memberUserIds.has(u.user_id) && (
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.affiliation || "").toLowerCase().includes(search.toLowerCase())
  ));

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("site_members").insert({ site_id: siteId, user_id: userId, role: "worker" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-members", siteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sites"] });
      toast.success("인원이 배정되었습니다");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("site_members").delete().eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-members", siteId] });
      queryClient.invalidateQueries({ queryKey: ["admin-sites"] });
      toast.success("인원이 제외되었습니다");
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-[500px] bg-card rounded-t-[20px] md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-[800] text-header-navy">인원 배정</h3>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer"><X className="w-5 h-5 text-text-sub" /></button>
        </div>

        {/* Current Members */}
        <div className="mb-4">
          <div className="text-[14px] font-bold text-text-sub mb-2">현재 배정 인원 ({members.length}명)</div>
          {members.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">배정된 인원이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-muted/50 rounded-xl p-3">
                  <div>
                    <span className="text-[14px] font-bold text-foreground">{(m as any).profiles?.name || "미지정"}</span>
                    <span className="text-[12px] text-text-sub ml-2">{(m as any).profiles?.affiliation || ""}</span>
                  </div>
                  <button onClick={() => removeMutation.mutate(m.id)} className="text-destructive bg-transparent border-none cursor-pointer p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Members */}
        <div className="border-t border-border pt-4">
          <div className="text-[14px] font-bold text-text-sub mb-2">인원 추가</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름 또는 소속 검색"
            className="w-full h-[44px] bg-card border border-border rounded-xl px-3 text-[14px] font-medium outline-none focus:border-primary mb-3" />
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {availableUsers.slice(0, 20).map(u => (
              <div key={u.user_id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
                <div>
                  <span className="text-[14px] font-bold text-foreground">{u.name}</span>
                  <span className="text-[12px] text-text-sub ml-2">{u.affiliation || ""}</span>
                </div>
                <button onClick={() => assignMutation.mutate(u.user_id)} className="h-8 px-3 bg-primary/10 text-primary rounded-lg font-bold text-[12px] cursor-pointer active:scale-[0.98]">
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
