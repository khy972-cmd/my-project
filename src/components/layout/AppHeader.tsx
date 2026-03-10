import { useMemo } from "react";
import { Search, FileCheck, Bell, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { APP_HEADER_TABS } from "@/constants/navigation";
import { canSeeRoleRestrictedItem } from "@/lib/rbac";

interface AppHeaderProps {
  onSearch?: () => void;
  onCert?: () => void;
  onNotify?: () => void;
  onMenu?: () => void;
  notificationCount?: number;
}

export default function AppHeader({ onSearch, onCert, onNotify, onMenu, notificationCount = 2 }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();

  const visibleTabs = useMemo(
    () =>
      APP_HEADER_TABS.filter((tab) => {
        return canSeeRoleRestrictedItem(role, roleLoading, "roles" in tab ? tab.roles : undefined);
      }),
    [roleLoading, role],
  );

  const activeTab = visibleTabs.find((tab) =>
    tab.path === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.path),
  )?.key || "home";

  const ACTIONS = [
    { key: "search", label: "통합검색", icon: Search, badge: 0, onClick: onSearch },
    { key: "cert", label: "확인서", icon: FileCheck, badge: 0, onClick: onCert },
    { key: "notify", label: "알림", icon: Bell, badge: notificationCount, onClick: onNotify },
    { key: "menu", label: "내정보", icon: Menu, badge: 0, onClick: onMenu },
  ] as const;

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-app bg-card border-b border-border z-[100]">
      <div className="h-[60px] px-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-xl-app font-[800] text-header-navy tracking-[-0.5px] bg-transparent border-none cursor-pointer p-0"
        >
          INOPNC
        </button>

        <div className="flex items-center gap-0.5">
          {ACTIONS.map(({ key, icon: Icon, badge, onClick }) => (
            <button
              key={key}
              onClick={onClick}
              className="relative w-[42px] h-[42px] min-w-[42px] inline-flex items-center justify-center bg-transparent border-none text-header-navy rounded-[10px] cursor-pointer active:opacity-60"
              aria-label={key}
            >
              <Icon className="w-[21px] h-[21px]" strokeWidth={2.1} />
              {badge > 0 && (
                <span className="absolute top-0 -right-0.5 min-w-[18px] h-[18px] rounded-full px-[5px] inline-flex items-center justify-center text-[11px] font-[800] text-white bg-destructive border-2 border-card">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <nav className="h-[54px] border-t border-border/50 flex items-center gap-0 overflow-hidden px-1.5">
        {visibleTabs.map((tab) => (
          <div key={tab.key} className="contents">
            {tab.key === "request" && <div className="w-px h-[18px] bg-muted-foreground/30 mx-0.5 flex-shrink-0" />}
            <button
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex-1 min-w-0 h-full inline-flex items-center justify-center px-1 bg-transparent border-none text-[17px] font-bold tracking-[-0.2px] whitespace-nowrap cursor-pointer transition-colors duration-150",
                activeTab === tab.key ? "text-header-navy" : "text-muted-foreground hover:text-foreground/70",
                tab.key === "request" && "flex-[1.2]",
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute left-1 right-1 bottom-0 h-[3px] rounded-full bg-header-navy" />
              )}
            </button>
          </div>
        ))}
      </nav>
    </header>
  );
}
