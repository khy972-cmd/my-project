import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
  "source_dataset",
].join(", ");

export function useOperationalSites() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["operational-sites", user?.id ?? "anon"],
    enabled: !!user,
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
