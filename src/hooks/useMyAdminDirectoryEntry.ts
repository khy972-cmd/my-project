import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { AdminDirectoryRow } from "@/lib/operationalData";
import { isMissingSchemaEntityError } from "@/lib/operationalData";

type MyAdminDirectoryEntry = Pick<
  AdminDirectoryRow,
  "id" | "linked_user_id" | "name" | "role" | "daily" | "source_worker_id" | "is_active" | "affiliation"
>;

export function useMyAdminDirectoryEntry() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-admin-directory-entry", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<MyAdminDirectoryEntry | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("admin_user_directory")
        .select("id, linked_user_id, name, role, daily, source_worker_id, is_active, affiliation")
        .eq("linked_user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        if (isMissingSchemaEntityError(error, "admin_user_directory")) {
          return null;
        }
        throw error;
      }

      return (data as MyAdminDirectoryEntry | null) ?? null;
    },
  });
}
