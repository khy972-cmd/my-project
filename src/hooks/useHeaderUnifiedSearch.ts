import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const HEADER_SEARCH_MIN_LENGTH = 2;
export const HEADER_SEARCH_MAX_REMOTE_RESULTS = 12;

export type HeaderSearchEntityType = "site" | "worklog" | "document" | "punch_group";

type HeaderUnifiedSearchRow = {
  entity_type: string;
  id: string;
  title: string;
  subtitle: string | null;
  site_id: string | null;
  site_name: string | null;
  work_date: string | null;
  status: string | null;
  route: string;
  score: number;
};

export type HeaderUnifiedSearchResult = {
  entity_type: HeaderSearchEntityType;
  id: string;
  title: string;
  subtitle: string | null;
  site_id: string | null;
  site_name: string | null;
  work_date: string | null;
  status: string | null;
  route: string;
  score: number;
};

interface HeaderUnifiedSearchOptions {
  enabled?: boolean;
}

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function dedupeResults(rows: HeaderUnifiedSearchResult[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.entity_type}:${row.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useHeaderUnifiedSearch(rawQuery: string, options?: HeaderUnifiedSearchOptions) {
  const { user } = useAuth();
  const queryText = useMemo(() => normalizeQuery(rawQuery), [rawQuery]);

  return useQuery({
    queryKey: ["header-unified-search", user?.id ?? "anon", queryText],
    enabled: (options?.enabled ?? true) && !!user && queryText.length >= HEADER_SEARCH_MIN_LENGTH,
    staleTime: 45_000,
    gcTime: 300_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }): Promise<HeaderUnifiedSearchResult[]> => {
      const request = supabase.rpc(
        "search_header_unified",
        {
          query_text: queryText,
          result_limit: HEADER_SEARCH_MAX_REMOTE_RESULTS,
        },
        { get: true },
      );

      const { data, error } = await request.abortSignal(signal);
      if (error) throw error;

      const rows = (data || []) as HeaderUnifiedSearchRow[];
      return dedupeResults(
        rows.map((row) => ({
          entity_type: row.entity_type as HeaderSearchEntityType,
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          site_id: row.site_id,
          site_name: row.site_name,
          work_date: row.work_date,
          status: row.status,
          route: row.route,
          score: Number(row.score || 0),
        })),
      );
    },
  });
}
