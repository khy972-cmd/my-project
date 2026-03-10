import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type UserAccessScope = {
  orgIds: string[];
  siteIds: string[];
};

const accessScopeCache = new Map<string, UserAccessScope>();
const accessScopeRequestCache = new Map<string, Promise<UserAccessScope>>();
type OrgMemberScopeRow = Pick<Tables<"org_members">, "org_id">;
type SiteMemberScopeRow = Pick<Tables<"site_members">, "site_id">;

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0)));
}

function createEmptyScope(): UserAccessScope {
  return { orgIds: [], siteIds: [] };
}

export async function getUserOrgAndSites(userId: string): Promise<UserAccessScope> {
  if (!userId) return createEmptyScope();

  const cached = accessScopeCache.get(userId);
  if (cached) return cached;

  const inFlight = accessScopeRequestCache.get(userId);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const [orgResult, siteResult] = await Promise.allSettled([
        supabase.from("org_members").select("org_id").eq("user_id", userId),
        supabase.from("site_members").select("site_id").eq("user_id", userId),
      ]);

      const orgData: OrgMemberScopeRow[] =
        orgResult.status === "fulfilled" && !orgResult.value?.error
          ? (orgResult.value?.data ?? [])
          : [];
      const siteData: SiteMemberScopeRow[] =
        siteResult.status === "fulfilled" && !siteResult.value?.error
          ? (siteResult.value?.data ?? [])
          : [];

      if (import.meta.env.DEV) {
        if (orgResult.status === "rejected" || orgResult.value?.error) {
          console.warn("[access-scope] org_members fallback", orgResult.status === "rejected" ? orgResult.reason : orgResult.value.error);
        }
        if (siteResult.status === "rejected" || siteResult.value?.error) {
          console.warn("[access-scope] site_members fallback", siteResult.status === "rejected" ? siteResult.reason : siteResult.value.error);
        }
      }

      const scope: UserAccessScope = {
        orgIds: uniqueIds(orgData.map((row) => row.org_id)),
        siteIds: uniqueIds(siteData.map((row) => row.site_id)),
      };

      accessScopeCache.set(userId, scope);
      return scope;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[access-scope] fallback to empty scope", error);
      }
      const fallback = createEmptyScope();
      accessScopeCache.set(userId, fallback);
      return fallback;
    } finally {
      accessScopeRequestCache.delete(userId);
    }
  })();

  accessScopeRequestCache.set(userId, request);
  return request;
}

export function clearUserAccessScopeCache(userId?: string): void {
  if (userId) {
    accessScopeCache.delete(userId);
    accessScopeRequestCache.delete(userId);
    return;
  }

  accessScopeCache.clear();
  accessScopeRequestCache.clear();
}
