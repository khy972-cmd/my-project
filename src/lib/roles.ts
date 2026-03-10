import type { Enums } from "@/integrations/supabase/types";

export type AppRole = Enums<"app_role">;
export type LegacyAppRoleInput = AppRole | "site_manager";

export const ROLE_PRIORITY: Record<AppRole, number> = {
  admin: 4,
  manager: 3,
  partner: 2,
  worker: 1,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "본사관리자",
  manager: "관리자",
  partner: "파트너",
  worker: "작업자",
};

export function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "manager" || value === "partner" || value === "worker";
}

export function normalizeAppRole(value: unknown): AppRole {
  if (value === "site_manager") return "manager";
  if (isAppRole(value)) return value;
  return "worker";
}
