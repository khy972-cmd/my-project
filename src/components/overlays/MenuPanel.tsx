import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { MENU_PANEL_ITEMS } from "@/constants/navigation";
import { canSeeRoleRestrictedItem } from "@/lib/rbac";

interface MenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccount: () => void;
}

export default function MenuPanel({ isOpen, onClose, onOpenAccount }: MenuPanelProps) {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { profile } = useUserProfile();
  const { user, signOut } = useAuth();

  const handleNav = (path: string) => {
    onClose();
    navigate(path);
  };

  const visibleMenuItems = useMemo(
    () =>
      MENU_PANEL_ITEMS.filter((item) => {
        return canSeeRoleRestrictedItem(role, roleLoading, "roles" in item ? item.roles : undefined);
      }),
    [roleLoading, role],
  );

  const resolvedRole: AppRole = role ?? "worker";
  const displayName = profile?.name || user?.user_metadata?.name || user?.email || "사용자";
  const email = user?.email ?? "user@inopnc.com";
  const affiliation = profile?.affiliation || user?.user_metadata?.affiliation || "소속 미지정";

  return (
    <>
      <div
        className={`fixed inset-0 bg-foreground/40 z-[1500] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 bottom-0 left-0 w-[85%] max-w-[320px] bg-card z-[2500] flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0 visible" : "-translate-x-full invisible"
        }`}
        style={{
          left: "max(0px, calc(50% - 300px))",
          transitionTimingFunction: "cubic-bezier(0.33,1,0.68,1)",
        }}
      >
        <div className="px-6 pt-[34px] pb-6 border-b border-border">
          <div className="flex justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl-app font-[800] text-foreground">{displayName}</span>
              <span className="text-tiny font-bold text-primary bg-primary-bg px-2 py-1 rounded">
                {ROLE_LABELS[resolvedRole]}
              </span>
            </div>
            <button
              onClick={onClose}
              className="border border-border bg-transparent rounded-lg px-3.5 py-1.5 text-sm-app text-text-sub cursor-pointer"
            >
              닫기
            </button>
          </div>
          <div className="text-sm-app text-text-sub">{email}</div>
          <div className="mt-1 text-[12px] text-muted-foreground">{affiliation}</div>
        </div>

        <ul className="list-none p-6 m-0 flex-1 overflow-y-auto">
          {visibleMenuItems.map((item) => (
            <li key={item.label} className="mb-6">
              <button
                onClick={() => handleNav(item.path)}
                className="text-lg-app font-bold text-foreground cursor-pointer bg-transparent border-none p-0"
              >
                {item.label}
              </button>
            </li>
          ))}
          <li className="mb-6 flex justify-between items-center">
            <span className="text-lg-app font-bold text-foreground">내정보</span>
            <button
              onClick={() => {
                onClose();
                onOpenAccount();
              }}
              className="text-sm-app font-bold text-primary bg-card border border-primary px-3.5 py-2 rounded-lg cursor-pointer"
            >
              계정관리
            </button>
          </li>
        </ul>

        <div className="px-6 py-6 border-t border-border">
          <button
            onClick={async () => {
              onClose();
              await signOut();
              navigate("/auth");
            }}
            className="w-full h-14 bg-header-navy text-white border-none rounded-xl text-base-app font-bold cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
