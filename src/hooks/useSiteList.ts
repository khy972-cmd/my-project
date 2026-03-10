import { useMemo } from "react";
import { useOperationalSites } from "@/hooks/useOperationalSites";
import { isOperationalSiteName, type SiteListItem } from "@/lib/siteList";

export function useSiteList() {
  const query = useOperationalSites();

  const data = useMemo<SiteListItem[]>(
    () =>
      (query.data || [])
        .map((site) => ({
          site_id: String(site.id),
          site_name: String(site.name || ""),
          dept: String(site.builder || site.company_name || "").trim() || undefined,
          builder: String(site.builder || "").trim() || undefined,
          company_name: String(site.company_name || "").trim() || undefined,
          created_at: typeof site.created_at === "string" ? site.created_at : undefined,
          updated_at: typeof site.updated_at === "string" ? site.updated_at : undefined,
        }))
        .filter((site) => !!site.site_id && !!site.site_name && isOperationalSiteName(site.site_name)),
    [query.data],
  );

  return {
    ...query,
    data,
  };
}
