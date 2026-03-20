import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  OPERATIONAL_SITE_SOURCES,
  type OperationalSiteRow,
} from "@/lib/operationalData";

const SITE_SELECT_COLUMNS = [
  "id",
  "name",
  "address",
  "status",
  "manager_name",
  "manager_phone",
  "created_at",
  "updated_at",
  "builder",
  "company_name",
  "org_id",
  "source_dataset",
].join(", ");

export function useOperationalSites() {
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  return useQuery({
    queryKey: ["operational-sites", user?.id ?? "anon", role ?? "pending"],
    enabled: !!user && !roleLoading && !!role,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<OperationalSiteRow[]> => {
      const { data, error } = await supabase
        .from("sites")
        .select(SITE_SELECT_COLUMNS)
        .in("source_dataset", [...OPERATIONAL_SITE_SOURCES])
        .order("updated_at", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as OperationalSiteRow[];
    },
  });
}
