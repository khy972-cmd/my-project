import { normalizeAppRole, type AppRole } from "@/lib/roles";
export type { AppRole } from "@/lib/roles";

function roleMatchesAllowed(role: AppRole, allowedRoles: AppRole[]): boolean {
  if (role === "admin") return true;
  return allowedRoles.includes(role);
}

export function canSeeRoleRestrictedItem(
  role: AppRole | null,
  roleLoading: boolean,
  allowed?: AppRole[],
): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (roleLoading || !role) return false;
  return roleMatchesAllowed(normalizeAppRole(role), allowed);
}

export function canViewLodgingAddress(role: AppRole | null): boolean {
  if (!role) return false;
  if (role === "partner") return false;
  return true;
}
