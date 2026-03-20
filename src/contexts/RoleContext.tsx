import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type AppRole } from "@/lib/roles";
import { clearUserRoleCache, getUserRole } from "@/lib/userRole";

interface RoleContextType {
  role: AppRole | null;
  roleLoading: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  roleLoading: true,
});

export const useRole = () => useContext(RoleContext);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user, initialized, isTestMode, testRole } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (!initialized) {
      setRoleLoading(true);
      return;
    }

    if (isTestMode) {
      setRole(testRole);
      setRoleLoading(false);
      return;
    }

    if (!user) {
      clearUserRoleCache();
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    void getUserRole(user.id)
      .then((resolvedRole) => {
        if (!isMounted) return;
        setRole(resolvedRole);
      })
      .finally(() => {
        if (!isMounted) return;
        setRoleLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialized, isTestMode, testRole, user?.id]);

  const value = useMemo(
    () => ({
      role,
      roleLoading,
    }),
    [role, roleLoading],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
