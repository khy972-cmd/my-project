import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isMissingSchemaEntityError } from "@/lib/operationalData";

export function useOperationalWorkerNames() {
  return useQuery({
    queryKey: ["operational-worker-names"],
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("admin_user_directory")
        .select("name, source_worker_id")
        .eq("is_active", true)
        .not("source_worker_id", "is", null)
        .order("name", { ascending: true });

      if (error) {
        if (isMissingSchemaEntityError(error, "admin_user_directory")) {
          return [];
        }
        throw error;
      }

      return [...new Set((data || []).map((row) => String(row.name || "").trim()).filter(Boolean))].sort((left, right) =>
        left.localeCompare(right, "ko-KR"),
      );
    },
  });
}
