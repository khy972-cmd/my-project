import type { Tables } from "@/integrations/supabase/types";

export type OperationalSiteRow = Tables<"sites">;
export type AdminDirectoryRow = Tables<"admin_user_directory">;
export type PendingRoleAssignmentRow = Tables<"pending_role_assignments">;

export const IMPORTED_SITE_SOURCE = "site.xlsx";
export const MANUAL_SITE_SOURCE = "manual";
export const OPERATIONAL_SITE_SOURCES = [IMPORTED_SITE_SOURCE, MANUAL_SITE_SOURCE] as const;

const IMPORTED_SITE_STATUS_MAP: Record<string, string> = {
  active: "진행중",
  scheduled: "예정",
  completed: "완료",
};

export function normalizeImportedSiteStatus(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return IMPORTED_SITE_STATUS_MAP[normalized] || String(value || "").trim() || "예정";
}

export function isMissingSchemaEntityError(
  error: { code?: string; message?: string; details?: string | null } | null | undefined,
  entityName: string,
) {
  const payload = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  const target = entityName.toLowerCase();
  return payload.includes(target) && (
    payload.includes("schema cache")
    || payload.includes("could not find the function")
    || payload.includes("pgrst202")
    || payload.includes("42883")
    || payload.includes("does not exist")
    || payload.includes("42p01")
  );
}
