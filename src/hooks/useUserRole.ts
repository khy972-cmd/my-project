import { useRole } from "@/contexts/RoleContext";
import { normalizeAppRole, type AppRole } from "@/lib/roles";

export function useUserRole() {
  const { role, roleLoading } = useRole();
  const canonicalRole: AppRole | null = role ? normalizeAppRole(role) : null;

  return {
    role: canonicalRole,
    isAdmin: canonicalRole === "admin",
    isManager: canonicalRole === "manager",
    isPartner: canonicalRole === "partner",
    isWorker: canonicalRole === "worker",
    loading: roleLoading,
  };
}
