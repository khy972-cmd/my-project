// Shared site list module for live site search helpers.
import { RECENT_SITE_STORAGE_KEY } from "@/constants/storageKeys";

export type SiteListItem = {
  site_id: string;
  site_name: string;
  dept?: string;
  builder?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
};

export { RECENT_SITE_STORAGE_KEY };
const RECENT_SITE_LIMIT = 5;

export type OperationalSiteLookup = {
  byId: Map<string, SiteListItem>;
  byNormalizedName: Map<string, SiteListItem>;
  liveSiteNames: Set<string>;
};

export function normalizeSiteSearch(s: string) {
  return (s || "").toLowerCase().replace(/\s+/g, "");
}

export function createSiteNameLookupSet(sites: Array<Pick<SiteListItem, "site_name">>) {
  return new Set(
    sites
      .map((site) => normalizeSiteSearch(site.site_name || ""))
      .filter(Boolean),
  );
}

export function createOperationalSiteLookup(sites: SiteListItem[]): OperationalSiteLookup {
  const byId = new Map<string, SiteListItem>();
  const byNormalizedName = new Map<string, SiteListItem>();

  sites.forEach((site) => {
    const siteId = String(site.site_id || "").trim();
    const siteName = String(site.site_name || "").trim();
    const normalizedName = normalizeSiteSearch(siteName);

    if (siteId && !byId.has(siteId)) {
      byId.set(siteId, site);
    }
    if (normalizedName && !byNormalizedName.has(normalizedName)) {
      byNormalizedName.set(normalizedName, site);
    }
  });

  return {
    byId,
    byNormalizedName,
    liveSiteNames: new Set(byNormalizedName.keys()),
  };
}

export function isOperationalSiteName(name: string, liveSiteNames?: Set<string>) {
  const raw = String(name || "").trim();
  if (!raw) return false;

  const normalized = normalizeSiteSearch(raw);
  if (!normalized) return false;
  if (normalized === "휴무" || normalized === "현장미지정") return false;
  if (normalized.includes("자재납품통폐합내역")) return false;
  if (normalized.includes("npc-1000") && normalized.includes("통폐합")) return false;

  if (liveSiteNames && liveSiteNames.size > 0) {
    return liveSiteNames.has(normalized);
  }

  return true;
}

export function resolveOperationalSite(
  siteValue: string | undefined,
  siteName: string | undefined,
  lookup: OperationalSiteLookup,
) {
  const siteId = String(siteValue || "").trim();
  if (siteId) {
    const matchedById = lookup.byId.get(siteId);
    if (matchedById) return matchedById;
  }

  const candidates = [siteName, siteValue]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const matchedByName = lookup.byNormalizedName.get(normalizeSiteSearch(candidate));
    if (matchedByName) return matchedByName;
  }

  return null;
}

export function resolveOperationalSiteName(
  siteValue: string | undefined,
  siteName: string | undefined,
  lookup: OperationalSiteLookup,
) {
  const resolved = resolveOperationalSite(siteValue, siteName, lookup);
  if (resolved?.site_name) return resolved.site_name;

  const fallback = String(siteName || siteValue || "").trim();
  if (!fallback) return "";

  return isOperationalSiteName(fallback, lookup.liveSiteNames) ? fallback : "";
}

// PATCH START: shared search util (used by upload autocomplete)
export function searchSites(sites: SiteListItem[], query: string, minChars = 2): SiteListItem[] {
  const q = (query || "").trim();
  if (q.length < minChars) return [];
  const needle = normalizeSiteSearch(q);
  return sites.filter((s) => normalizeSiteSearch(s.site_name).includes(needle));
}
// PATCH END

export function matchesSiteSearch(label: string, query: string, extraFields: string[] = []) {
  const needle = normalizeSiteSearch(query);
  if (!needle) return true;
  const haystacks = [label, ...extraFields].filter(Boolean).map((item) => normalizeSiteSearch(item));
  return haystacks.some((item) => item.includes(needle));
}

export function readRecentSiteValues(storageKey = RECENT_SITE_STORAGE_KEY) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  } catch {
    return [] as string[];
  }
}

export function writeRecentSiteValues(values: string[], storageKey = RECENT_SITE_STORAGE_KEY) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(values));
  } catch {
    // noop
  }
}

export function rememberRecentSiteValue(
  value: string,
  storageKey = RECENT_SITE_STORAGE_KEY,
  limit = RECENT_SITE_LIMIT,
) {
  const nextValue = String(value || "").trim();
  if (!nextValue) return readRecentSiteValues(storageKey);
  const next = [nextValue, ...readRecentSiteValues(storageKey).filter((item) => item !== nextValue)].slice(0, limit);
  writeRecentSiteValues(next, storageKey);
  return next;
}
