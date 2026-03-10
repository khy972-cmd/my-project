import { useState, useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  X,
  Search,
  ClipboardList,
  MapPin,
  House,
  FileText,
  FolderOpen,
  FileCheck,
  Building2,
  LayoutDashboard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { RECENT_SEARCHES_KEY } from "@/constants/storageKeys";
import { useAuth } from "@/contexts/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUserRole } from "@/hooks/useUserRole";
import {
  HEADER_SEARCH_MIN_LENGTH,
  useHeaderUnifiedSearch,
  type HeaderUnifiedSearchResult,
} from "@/hooks/useHeaderUnifiedSearch";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCert?: () => void;
}

type OverlayEntityType = HeaderUnifiedSearchResult["entity_type"] | "action";

type QuickAction = {
  id: string;
  label: string;
  to?: string;
  icon: LucideIcon;
  action?: "cert";
  keywords?: readonly string[];
};

type OverlaySearchResult = {
  entity_type: OverlayEntityType;
  id: string;
  title: string;
  subtitle: string | null;
  site_id: string | null;
  site_name: string | null;
  work_date: string | null;
  status: string | null;
  route: string;
  score: number;
  action?: QuickAction["action"];
};

const MAX_RECENT = 8;
const MAX_ACTION_RESULTS = 4;
const MAX_TOTAL_RESULTS = 12;
const MAX_VISIBLE_RESULTS = MAX_TOTAL_RESULTS + MAX_ACTION_RESULTS;

const QUICK_ACTIONS: { id: string; label: string; to?: string; icon: LucideIcon; action?: "cert" }[] = [
  { id: "home", label: "홈", to: "/", icon: House },
  { id: "worklog", label: "작업일지", to: "/worklog", icon: ClipboardList },
  { id: "site", label: "현장정보", to: "/site", icon: MapPin },
  { id: "doc", label: "문서함", to: "/doc", icon: FolderOpen },
  { id: "output", label: "출력현황", to: "/output", icon: FileText },
  { id: "cert", label: "확인서", icon: FileCheck, action: "cert" },
  { id: "request", label: "본사요청", to: "/request", icon: Building2 },
];

const QUICK_ACTION_KEYWORDS: Record<string, readonly string[]> = {
  home: ["메인", "대시보드", "dashboard"],
  worklog: ["일지", "worklog"],
  site: ["현장", "site"],
  doc: ["문서", "doc"],
  output: ["출력", "보고서", "pdf"],
  cert: ["확인서", "작업완료확인서", "cert"],
  request: ["요청", "request"],
};

const ENTITY_LABEL: Record<OverlayEntityType, string> = {
  site: "현장",
  worklog: "작업일지",
  document: "문서",
  punch_group: "펀치/조치",
  action: "기능",
};

function dedupeByEntityAndId<T extends { entity_type: string; id: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.entity_type}:${row.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function matchesQuickAction(action: QuickAction, rawQuery: string) {
  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return false;

  const candidates = [
    action.id,
    action.label,
    action.to ?? "",
    ...(action.keywords ?? []),
    ...(QUICK_ACTION_KEYWORDS[action.id] ?? []),
  ];

  return candidates.some((candidate) => normalizeSearchText(candidate).includes(normalizedQuery));
}

function buildSubtitle(result: OverlaySearchResult) {
  if (result.subtitle && result.subtitle.trim()) return result.subtitle;
  const meta = [result.site_name, result.work_date, result.status].filter(Boolean);
  return meta.length > 0 ? meta.join(" · ") : "";
}

function resolveRouteByEntity(result: Pick<OverlaySearchResult, "entity_type" | "id">) {
  if (result.entity_type === "worklog") {
    return result.id ? `/worklog?focus=${encodeURIComponent(result.id)}` : "/worklog";
  }
  if (result.entity_type === "site") {
    return "/site";
  }
  if (result.entity_type === "document" || result.entity_type === "punch_group") {
    return "/doc";
  }
  return null;
}

export default function SearchOverlay({ isOpen, onClose, onOpenCert }: SearchOverlayProps) {
  const { user } = useAuth();
  const { isAdmin, isManager } = useUserRole();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebouncedValue(query, 300);
  const remoteSearch = useHeaderUnifiedSearch(debouncedQuery, { enabled: isOpen });

  const quickActions = useMemo<QuickAction[]>(() => {
    const items: QuickAction[] = [...QUICK_ACTIONS];
    if (isAdmin || isManager) {
      items.push({
        id: "admin",
        label: "관리자 콘솔",
        to: "/admin",
        icon: LayoutDashboard,
        keywords: ["관리자", "admin", "대시보드", "현장관리", "인력관리", "일지관리"],
      });
    }
    return items;
  }, [isAdmin, isManager]);

  const searchTerm = query.trim();
  const debouncedTerm = debouncedQuery.trim();
  const hasQuery = searchTerm.length > 0;
  const isShortQuery = hasQuery && searchTerm.length < HEADER_SEARCH_MIN_LENGTH;
  const isDebouncing = hasQuery && searchTerm !== debouncedTerm;
  const canRunRemoteSearch = !!user && debouncedQuery.trim().length >= HEADER_SEARCH_MIN_LENGTH;

  const remoteResults = useMemo<OverlaySearchResult[]>(
    () => {
      if (!user || isShortQuery || isDebouncing) return [];

      return (remoteSearch.data || [])
        .map((item) => {
          const route = resolveRouteByEntity(item);
          if (!route) return null;
          return {
            entity_type: item.entity_type,
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            site_id: item.site_id,
            site_name: item.site_name,
            work_date: item.work_date,
            status: item.status,
            route,
            score: item.score,
          };
        })
        .filter((item): item is OverlaySearchResult => !!item);
    },
    [isDebouncing, isShortQuery, remoteSearch.data, user],
  );

  const actionResults = useMemo<OverlaySearchResult[]>(() => {
    if (!hasQuery) return [];

    return quickActions
      .filter((item) => matchesQuickAction(item, searchTerm))
      .slice(0, MAX_ACTION_RESULTS)
      .map((item, index) => ({
        entity_type: "action",
        id: item.id,
        title: item.label,
        subtitle: item.to ?? null,
        site_id: null,
        site_name: null,
        work_date: null,
        status: null,
        route: item.to ?? "/doc",
        score: 10_000 - index,
        action: item.action,
      }));
  }, [hasQuery, quickActions, searchTerm]);

  const mergedResults = useMemo(() => {
    const deduped = dedupeByEntityAndId<OverlaySearchResult>([...actionResults, ...remoteResults]);
    return deduped.slice(0, MAX_VISIBLE_RESULTS);
  }, [actionResults, remoteResults]);

  const sections = useMemo(
    () => [
      { key: "action", label: "기능", items: mergedResults.filter((item) => item.entity_type === "action") },
      { key: "site", label: "현장", items: mergedResults.filter((item) => item.entity_type === "site") },
      { key: "worklog", label: "작업일지", items: mergedResults.filter((item) => item.entity_type === "worklog") },
      { key: "document", label: "문서", items: mergedResults.filter((item) => item.entity_type === "document") },
      { key: "punch_group", label: "펀치/조치", items: mergedResults.filter((item) => item.entity_type === "punch_group") },
    ],
    [mergedResults],
  );

  const visibleResults = useMemo(() => sections.flatMap((section) => section.items), [sections]);

  const visibleIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    visibleResults.forEach((result, index) => {
      map.set(`${result.entity_type}:${result.id}`, index);
    });
    return map;
  }, [visibleResults]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, visibleResults.length]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
      try {
        const saved = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
        setRecentSearches(Array.isArray(saved) ? saved : []);
      } catch {
        setRecentSearches([]);
      }
      return () => window.clearTimeout(timer);
    }

    setQuery("");
    setActiveIndex(-1);
  }, [isOpen]);

  const saveRecentSearch = useCallback((term: string) => {
    const normalized = term.trim();
    if (normalized.length < HEADER_SEARCH_MIN_LENGTH) return;

    const buildNext = (list: string[]) =>
      [normalized, ...list.filter((item) => item !== normalized)].slice(0, MAX_RECENT);

    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      const next = buildNext(Array.isArray(recent) ? recent : []);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      setRecentSearches(next);
    } catch {
      setRecentSearches((prev) => buildNext(prev));
    }
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    const removeFrom = (list: string[]) => list.filter((item) => item !== term);
    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
      const next = removeFrom(Array.isArray(recent) ? recent : []);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      setRecentSearches(next);
    } catch {
      setRecentSearches((prev) => removeFrom(prev));
    }
  }, []);

  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
    setRecentSearches([]);
  }, []);

  const handleNavigate = useCallback(
    (to: string, result?: OverlaySearchResult) => {
      if (searchTerm.length >= HEADER_SEARCH_MIN_LENGTH) {
        saveRecentSearch(searchTerm);
      }

      onClose();
      navigate(to, {
        state: result && result.entity_type !== "action"
          ? {
              fromHeaderSearch: true,
              headerSearch: {
                entity_type: result.entity_type,
                id: result.id,
                site_id: result.site_id,
                site_name: result.site_name,
                work_date: result.work_date,
                status: result.status,
              },
            }
          : undefined,
      });
    },
    [navigate, onClose, saveRecentSearch, searchTerm],
  );

  const handleResultSelect = useCallback(
    (result: OverlaySearchResult) => {
      if (result.action === "cert") {
        if (searchTerm.length >= HEADER_SEARCH_MIN_LENGTH) {
          saveRecentSearch(searchTerm);
        }
        if (onOpenCert) {
          onOpenCert();
          onClose();
          return;
        }
        handleNavigate("/doc");
        return;
      }

      if (result.entity_type === "action") {
        handleNavigate(result.route);
        return;
      }

      const to = resolveRouteByEntity(result);
      if (to) {
        handleNavigate(to, result);
      }
    },
    [handleNavigate, onClose, onOpenCert, saveRecentSearch, searchTerm],
  );

  const handleQuickAction = useCallback(
    (action: QuickAction) => {
      if (action.action === "cert") {
        if (searchTerm.length >= HEADER_SEARCH_MIN_LENGTH) {
          saveRecentSearch(searchTerm);
        }
        if (onOpenCert) {
          onOpenCert();
          onClose();
          return;
        }
        handleNavigate("/doc");
        return;
      }

      if (action.to) {
        handleNavigate(action.to);
      }
    },
    [handleNavigate, onClose, onOpenCert, saveRecentSearch, searchTerm],
  );

  const triggerSearch = useCallback(() => {
    if (searchTerm.length >= HEADER_SEARCH_MIN_LENGTH) {
      saveRecentSearch(searchTerm);
    }

    if (visibleResults.length === 1) {
      handleResultSelect(visibleResults[0]);
    }
  }, [handleResultSelect, saveRecentSearch, searchTerm, visibleResults]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (!hasQuery) {
      if (event.key === "Enter") triggerSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      if (visibleResults.length === 0) return;
      event.preventDefault();
      setActiveIndex((prev) => (prev < visibleResults.length - 1 ? prev + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      if (visibleResults.length === 0) return;
      event.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : visibleResults.length - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && visibleResults[activeIndex]) {
        handleResultSelect(visibleResults[activeIndex]);
        return;
      }
      if (visibleResults.length > 0) {
        handleResultSelect(visibleResults[0]);
        return;
      }
      triggerSearch();
    }
  };

  const remoteError = remoteSearch.error instanceof Error ? remoteSearch.error.message : "";
  const canSearchCurrentInput = !!user && searchTerm.length >= HEADER_SEARCH_MIN_LENGTH;
  const shouldShowRemoteError = canRunRemoteSearch && !isDebouncing && remoteError.length > 0;
  const shouldShowLoading = canSearchCurrentInput && (isDebouncing || remoteSearch.isFetching);
  const shouldShowEmpty =
    hasQuery &&
    !isShortQuery &&
    !shouldShowLoading &&
    !shouldShowRemoteError &&
    visibleResults.length === 0;

  return (
    <div
      className={`fixed inset-0 left-0 right-0 mx-auto max-w-app bg-background z-[2000] flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-y-0 visible" : "translate-y-full invisible"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.33,1,0.68,1)" }}
    >
      <div className="flex items-center gap-2.5 h-[70px] px-4 bg-card border-b border-border shrink-0">
        <button onClick={onClose} className="bg-transparent border-none p-1">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="검색어를 입력하세요"
            className="w-full h-[50px] rounded-full bg-[hsl(var(--bg-input))] border border-border px-5 pr-[76px] text-base-app font-medium text-foreground outline-none transition-all focus:bg-card focus:border-primary focus:shadow-input-focus"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="w-6 h-6 rounded-full bg-muted-foreground/40 text-card flex items-center justify-center border-none cursor-pointer transition-transform hover:scale-110"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={triggerSearch}
          className="bg-transparent border-none text-primary font-bold text-base-app cursor-pointer whitespace-nowrap pl-3"
        >
          검색
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {!hasQuery ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base-app font-bold text-text-sub">최근 검색어</span>
                <span className="text-xs text-muted-foreground">
                  ({recentSearches.length}/{MAX_RECENT})
                </span>
              </div>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  전체 삭제
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
              {recentSearches.length === 0 ? (
                <div className="text-sm-app text-muted-foreground">최근 검색어가 없습니다.</div>
              ) : (
                recentSearches.map((term) => (
                  <div
                    key={term}
                    className="inline-flex items-center gap-1 rounded-full bg-card/70 border border-border px-2.5 py-1.5"
                  >
                    <button
                      onClick={() => {
                        setQuery(term);
                        setActiveIndex(-1);
                      }}
                      className="text-sm-app text-foreground font-semibold"
                    >
                      {term}
                    </button>
                    <button
                      onClick={() => removeRecentSearch(term)}
                      className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
                      aria-label="최근 검색어 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <span className="text-base-app font-bold text-text-sub block mb-3">바로가기</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickAction(item)}
                    className="group h-[50px] w-full rounded-xl border border-border bg-[hsl(var(--bg-input))] px-3 flex items-center gap-2 text-sm-app font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 active:scale-[0.98]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[15px] font-semibold text-foreground">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-base-app font-bold text-text-sub block mb-2">
              검색 결과 {visibleResults.length}건
            </span>

            {isShortQuery && (
              <p className="mb-3 text-sm-app text-muted-foreground">
                2자 이상 입력하면 현장/작업일지/문서/펀치 데이터를 통합 검색합니다.
              </p>
            )}

            {!user && !isShortQuery && (
              <p className="mb-3 text-sm-app text-muted-foreground">
                로그인하면 통합 검색 결과(현장/작업일지/문서/펀치)를 확인할 수 있습니다.
              </p>
            )}

            {shouldShowLoading && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-text-sub">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                검색 중
              </div>
            )}

            {shouldShowRemoteError && (
              <div className="mb-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>원격 검색 실패: {remoteError}</span>
              </div>
            )}

            {shouldShowEmpty ? (
              <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-[hsl(var(--bg-input))] flex items-center justify-center mb-5">
                  <Search className="w-8 h-8 opacity-60" />
                </div>
                <p className="text-base font-medium mb-2">검색 결과가 없습니다</p>
                <p className="text-sm">검색어를 바꾸거나 잠시 후 다시 시도해 주세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections
                  .filter((section) => section.items.length > 0)
                  .map((section) => (
                    <div key={section.key}>
                      <div className="mb-2 text-sm font-bold text-text-sub">{section.label}</div>
                      <div className="space-y-2">
                        {section.items.map((item) => {
                          const key = `${item.entity_type}:${item.id}`;
                          const globalIndex = visibleIndexByKey.get(key) ?? -1;
                          const subtitle = buildSubtitle(item);
                          return (
                            <button
                              key={key}
                              type="button"
                              onMouseEnter={() => setActiveIndex(globalIndex)}
                              onClick={() => handleResultSelect(item)}
                              className={`w-full text-left bg-card rounded-2xl p-4 shadow-soft transition-transform border ${
                                activeIndex === globalIndex
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-transparent"
                              } active:scale-[0.98]`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[16px] font-[800] text-foreground leading-tight mb-0.5 truncate">
                                    {item.title}
                                  </div>
                                  {subtitle && (
                                    <div className="text-[13px] text-text-sub font-medium truncate">{subtitle}</div>
                                  )}
                                </div>
                                <span className="bg-primary-bg text-primary text-tiny font-bold px-2.5 py-1 rounded-md whitespace-nowrap">
                                  {ENTITY_LABEL[item.entity_type]}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
