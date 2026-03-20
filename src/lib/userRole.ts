import { supabase } from "@/integrations/supabase/client";
import { type AppRole, ROLE_PRIORITY, coerceAppRole } from "@/lib/roles";

const userRoleCache = new Map<string, AppRole | null>();
const userRoleRequestCache = new Map<string, Promise<AppRole | null>>();

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const cachedRole = userRoleCache.get(userId);
  if (cachedRole !== undefined) return cachedRole;

  const inFlightRequest = userRoleRequestCache.get(userId);
  if (inFlightRequest) return inFlightRequest;

  const request = (async () => {
    if (import.meta.env.DEV) {
      console.info("[user-role] fetch", userId);
    }

    try {
      await supabase.auth.getSession();
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;

      const resolvedRole =
        (data || [])
          .map((row) => coerceAppRole(row.role))
          .filter((role): role is AppRole => Boolean(role))
          .sort((a, b) => ROLE_PRIORITY[b] - ROLE_PRIORITY[a])[0] ?? null;

      userRoleCache.set(userId, resolvedRole);
      return resolvedRole;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[user-role] no approved role", error);
      }
      userRoleCache.set(userId, null);
      return null;
    } finally {
      userRoleRequestCache.delete(userId);
    }
  })();

  userRoleRequestCache.set(userId, request);
  return request;
}

export function clearUserRoleCache(userId?: string): void {
  if (userId) {
    userRoleCache.delete(userId);
    userRoleRequestCache.delete(userId);
    return;
  }

  userRoleCache.clear();
  userRoleRequestCache.clear();
}
