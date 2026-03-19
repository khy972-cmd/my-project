import { useMemo } from "react";
import { useOperationalSites } from "@/hooks/useOperationalSites";
import { isOperationalSiteName, type SiteListItem } from "@/lib/siteList";

export function useSiteList() {
  const query = useOperationalSites();

  const data = useMemo<SiteListItem[]>(
    () =>
      (query.data || [])
        .map((site) => {
          const builder = String(site.builder || "").trim() || undefined;
          const companyName = String(site.company_name || "").trim() || undefined;

          return {
            site_id: String(site.id),
            site_name: String(site.name || ""),
            dept: companyName,
            builder,
            company_name: companyName,
            created_at: typeof site.created_at === "string" ? site.created_at : undefined,
            updated_at: typeof site.updated_at === "string" ? site.updated_at : undefined,
          };
        })
        .filter((site) => !!site.site_id && !!site.site_name && isOperationalSiteName(site.site_name)),
    [query.data],
  );

  return {
    ...query,
    data,
  };
}
