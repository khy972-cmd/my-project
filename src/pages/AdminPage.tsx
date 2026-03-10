import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import type { AppRole } from "@/lib/roles";
import {
  LayoutDashboard, ClipboardList, MapPin, Users, Handshake, FileText, Camera, AlertTriangle,
  ArrowLeft, Menu, X, UserPlus, Building2, Wallet, FileCheck, Megaphone, Settings, Sliders, Building, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminWorklogManager from "@/components/admin/AdminWorklogManager";
import AdminSiteManager from "@/components/admin/AdminSiteManager";
import AdminUserManager from "@/components/admin/AdminUserManager";
import AdminPartnerManager from "@/components/admin/AdminPartnerManager";
import AdminDocManager from "@/components/admin/AdminDocManager";
import AdminPhotoSheetManager from "@/components/admin/AdminPhotoSheetManager";
import AdminDeletionRequestManager from "@/components/admin/AdminDeletionRequestManager";
import AdminSignupRequestsManager from "@/components/admin/AdminSignupRequestsManager";
import AdminOrganizationsManager from "@/components/admin/AdminOrganizationsManager";
import AdminSalaryManager from "@/components/admin/AdminSalaryManager";
import AdminRequiredDocsManager from "@/components/admin/AdminRequiredDocsManager";
import AdminCommunicationManager from "@/components/admin/AdminCommunicationManager";
import AdminSystemSettings from "@/components/admin/AdminSystemSettings";
import AdminWorkOptionsManager from "@/components/admin/AdminWorkOptionsManager";
import AdminCompanySettings from "@/components/admin/AdminCompanySettings";
import AdminMaterialsManager from "@/components/admin/AdminMaterialsManager";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

/** 운영관리 | 계정/조직 | 정산/서류 | 시스템/공지 */
const ADMIN_TABS = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard, roles: ["admin"] as AppRole[], group: "운영" },
  { key: "worklog", label: "일지관리", icon: ClipboardList, roles: ["admin", "manager"] as AppRole[], group: "운영" },
  { key: "site", label: "현장관리", icon: MapPin, roles: ["admin", "manager"] as AppRole[], group: "운영" },
  { key: "user", label: "인력관리", icon: Users, roles: ["admin", "manager"] as AppRole[], group: "운영" },
  { key: "materials", label: "자재관리", icon: Package, roles: ["admin", "manager"] as AppRole[], group: "운영" },
  { key: "photosheet", label: "사진.도면", icon: Camera, roles: ["admin", "manager"] as AppRole[], group: "운영" },
  { key: "doc", label: "문서관리", icon: FileText, roles: ["admin"] as AppRole[], group: "운영" },
  { key: "signup-requests", label: "가입요청", icon: UserPlus, roles: ["admin"] as AppRole[], group: "계정" },
  { key: "partner", label: "파트너", icon: Handshake, roles: ["admin"] as AppRole[], group: "계정" },
  { key: "deletion", label: "탈퇴요청", icon: AlertTriangle, roles: ["admin", "manager"] as AppRole[], group: "계정" },
  { key: "organizations", label: "소속관리", icon: Building2, roles: ["admin"] as AppRole[], group: "계정" },
  { key: "salary", label: "급여관리", icon: Wallet, roles: ["admin"] as AppRole[], group: "정산" },
  { key: "required-docs", label: "필수서류", icon: FileCheck, roles: ["admin"] as AppRole[], group: "정산" },
  { key: "company-settings", label: "이노피앤씨", icon: Building, roles: ["admin"] as AppRole[], group: "정산" },
  { key: "communication", label: "공지사항", icon: Megaphone, roles: ["admin"] as AppRole[], group: "시스템" },
  { key: "system-settings", label: "시스템설정", icon: Settings, roles: ["admin"] as AppRole[], group: "시스템" },
  { key: "work-options", label: "작업옵션", icon: Sliders, roles: ["admin"] as AppRole[], group: "시스템" },
] as const;

type AdminTab = typeof ADMIN_TABS[number]["key"];

const TAB_TONES: Record<AdminTab, { active: string; mobile: string }> = {
  dashboard: { active: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", mobile: "border-slate-200 bg-slate-100 text-slate-700" },
  worklog: { active: "bg-sky-50 text-sky-700 ring-1 ring-sky-200", mobile: "border-sky-200 bg-sky-50 text-sky-700" },
  site: { active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", mobile: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  user: { active: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200", mobile: "border-cyan-200 bg-cyan-50 text-cyan-700" },
  photosheet: { active: "bg-amber-50 text-amber-800 ring-1 ring-amber-200", mobile: "border-amber-200 bg-amber-50 text-amber-800" },
  deletion: { active: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", mobile: "border-rose-200 bg-rose-50 text-rose-700" },
  partner: { active: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", mobile: "border-violet-200 bg-violet-50 text-violet-700" },
  doc: { active: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", mobile: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  "signup-requests": { active: "bg-teal-50 text-teal-700 ring-1 ring-teal-200", mobile: "border-teal-200 bg-teal-50 text-teal-700" },
  organizations: { active: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200", mobile: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700" },
  salary: { active: "bg-lime-50 text-lime-700 ring-1 ring-lime-200", mobile: "border-lime-200 bg-lime-50 text-lime-700" },
  "required-docs": { active: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", mobile: "border-blue-200 bg-blue-50 text-blue-700" },
  communication: { active: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", mobile: "border-orange-200 bg-orange-50 text-orange-700" },
  "system-settings": { active: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200", mobile: "border-zinc-200 bg-zinc-100 text-zinc-700" },
  "work-options": { active: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", mobile: "border-slate-200 bg-slate-100 text-slate-700" },
  "company-settings": { active: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", mobile: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  materials: { active: "bg-teal-50 text-teal-700 ring-1 ring-teal-200", mobile: "border-teal-200 bg-teal-50 text-teal-700" },
};

export default function AdminPage() {
  const { isAdmin, isManager, loading } = useUserRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const canAccessAdminConsole = isAdmin || isManager;
  const visibleTabs = useMemo(
    () => ADMIN_TABS.filter((tab) => (isAdmin ? true : tab.roles.includes("manager"))),
    [isAdmin, isManager],
  );
  const resolvedActiveTab =
    visibleTabs.find((tab) => tab.key === activeTab)?.key ?? visibleTabs[0]?.key ?? "worklog";

  const groupedNav = useMemo(() => {
    const order = ["운영", "계정", "정산", "시스템"];
    const sectionLabel: Record<string, string> = { 운영: "운영관리", 계정: "계정/조직", 정산: "정산/서류", 시스템: "시스템/공지" };
    const byGroup = new Map<string, typeof visibleTabs>();
    visibleTabs.forEach((tab) => {
      const g = (tab as { group?: string }).group ?? "운영";
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(tab);
    });
    return order.map((section) => ({ section: sectionLabel[section] || section, tabs: byGroup.get(section) || [] })).filter((x) => x.tabs.length > 0);
  }, [visibleTabs]);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (resolvedActiveTab !== activeTab) {
      setActiveTab(resolvedActiveTab);
    }
  }, [activeTab, resolvedActiveTab, visibleTabs]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!canAccessAdminConsole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-6">
        <div className="text-[48px]">🔒</div>
        <h2 className="text-xl-app font-[800] text-header-navy">접근 권한 없음</h2>
        <p className="text-text-sub text-center">본사관리자 또는 관리자 권한이 필요합니다.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 h-12 px-6 bg-primary text-primary-foreground rounded-xl font-bold cursor-pointer"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (resolvedActiveTab) {
      case "dashboard": return <AdminDashboard onNavigate={(tab: string) => setActiveTab(tab as AdminTab)} />;
      case "worklog": return <AdminWorklogManager />;
      case "site": return <AdminSiteManager />;
      case "user": return <AdminUserManager />;
      case "photosheet": return <AdminPhotoSheetManager />;
      case "deletion": return <AdminDeletionRequestManager />;
      case "partner": return <AdminPartnerManager />;
      case "doc": return <AdminDocManager />;
      case "materials": return <AdminMaterialsManager />;
      case "signup-requests": return <AdminSignupRequestsManager />;
      case "organizations": return <AdminOrganizationsManager />;
      case "salary": return <AdminSalaryManager />;
      case "required-docs": return <AdminRequiredDocsManager />;
      case "communication": return <AdminCommunicationManager />;
      case "system-settings": return <AdminSystemSettings />;
      case "work-options": return <AdminWorkOptionsManager />;
      case "company-settings": return <AdminCompanySettings />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Desktop Sidebar (≥768px) ─── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[240px] bg-card border-r border-border flex-col z-50">
        <div className="h-[60px] px-5 flex items-center border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 bg-transparent border-none cursor-pointer">
            <ArrowLeft className="w-5 h-5 text-text-sub" />
          </button>
          <span className="text-lg-app font-[800] text-header-navy ml-2">관리자 콘솔</span>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-3 overflow-y-auto">
          {groupedNav.map(({ section, tabs }) => (
            <div key={section}>
              <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{section}</div>
              <div className="space-y-1">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "w-full h-[46px] flex items-center gap-3 px-4 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all",
                      resolvedActiveTab === tab.key
                        ? cn("font-[800]", TAB_TONES[tab.key].active)
                        : "bg-transparent text-text-sub hover:bg-muted/80 hover:text-header-navy"
                    )}
                  >
                    <tab.icon className="w-5 h-5 flex-shrink-0" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-[12px] text-muted-foreground text-center">INOPNC 관리자 v1.0</div>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50">
        <div className="h-[56px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="bg-transparent border-none cursor-pointer p-1">
              <ArrowLeft className="w-5 h-5 text-text-sub" />
            </button>
            <span className="text-lg-app font-[800] text-header-navy">관리자 콘솔</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-transparent border-none cursor-pointer p-1"
          >
            {sidebarOpen ? <X className="w-6 h-6 text-text-sub" /> : <Menu className="w-6 h-6 text-text-sub" />}
          </button>
        </div>
        {/* Mobile Tab Scroll */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-border/50 px-2.5 py-2">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
              className={cn(
                "flex h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 text-[14px] font-bold transition-colors",
                resolvedActiveTab === tab.key
                  ? TAB_TONES[tab.key].mobile
                  : "border-transparent bg-transparent text-text-sub hover:bg-muted/80 hover:text-header-navy"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-0 right-0 w-[260px] h-full bg-card shadow-lg animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-[56px] px-5 flex items-center justify-between border-b border-border">
              <span className="text-lg-app font-[800] text-header-navy">메뉴</span>
              <button onClick={() => setSidebarOpen(false)} className="bg-transparent border-none cursor-pointer">
                <X className="w-5 h-5 text-text-sub" />
              </button>
            </div>
            <nav className="py-3 px-3 space-y-3">
              {groupedNav.map(({ section, tabs }) => (
                <div key={section}>
                  <div className="px-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{section}</div>
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
                      className={cn(
                        "w-full h-[46px] flex items-center gap-3 px-4 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all",
                        resolvedActiveTab === tab.key
                          ? cn("font-[800]", TAB_TONES[tab.key].active)
                          : "bg-transparent text-text-sub hover:bg-muted/80 hover:text-header-navy"
                      )}
                    >
                      <tab.icon className="w-5 h-5 flex-shrink-0" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ─── Content Area ─── */}
      <main className={cn(
        "min-h-screen pt-[116px] md:pt-0 md:ml-[240px]",
        "px-4 md:px-8 pb-8 md:py-8"
      )}>
        <div className="max-w-[960px] mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
