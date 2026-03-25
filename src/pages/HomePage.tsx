import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PartnerHomePage from "@/components/partner/PartnerHomePage";
import { HOME_DRAFT_KEY, HOME_SITE_STORAGE_KEY, HOME_WORKER_STORAGE_KEY } from "@/constants/storageKeys";
import { getHomeFallbackUrl, getHomeMainUrl } from "@/constants/env";
import { useAuth } from "@/contexts/AuthContext";
import { useOperationalWorkerNames } from "@/hooks/useOperationalWorkerNames";
import { useSaveWorklog } from "@/hooks/useSupabaseWorklogs";
import { useSiteList } from "@/hooks/useSiteList";
import { useUserRole } from "@/hooks/useUserRole";
import { getTodayYYYYMMDD } from "@/lib/dateFormat";
import {
  HOME_IFRAME_BRIDGE_IFRAME_SOURCE,
  HOME_IFRAME_BRIDGE_MESSAGE_TYPE,
  HOME_IFRAME_BRIDGE_PARENT_SOURCE,
  HOME_IFRAME_BRIDGE_PROTOCOL_VERSION,
  parseHomeDraftToWorklogInput,
  type HomeIframeBridgeMessage,
} from "@/lib/homeDraftBridge";
import { getSiteAffiliationLabel, getSiteBuilderLabel } from "@/lib/siteList";
import { WorkerHomePageLegacy } from "@/pages/HomePage.legacy";

const HOME_ALLOWED_ROUTES = new Set(["/", "/output", "/worklog", "/site", "/doc", "/request"]);
const HOME_IFRAME_CHECK_DELAY_MS = 1200;
const HOME_BRIDGE_BADGE_AUTO_HIDE_MS = 2600;
const HOME_BRIDGE_DUPLICATE_SAVE_WINDOW_MS = 1000;

type HomeIframeMode = "iframe-main" | "iframe-fallback" | "legacy";
type HomeRenderMode = "partner" | HomeIframeMode;
type HomeBridgeIndicatorPhase = "draft-changed" | "save-requested" | "save-succeeded" | "save-failed" | "draft-cleared";

type HomeBridgeIndicator = {
  phase: HomeBridgeIndicatorPhase;
  message: string;
};

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function isHomeBridgeMessage(value: unknown): value is HomeIframeBridgeMessage {
  return !!value && typeof value === "object" && (value as { type?: unknown }).type === HOME_IFRAME_BRIDGE_MESSAGE_TYPE;
}

function buildHomeBridgeMessage(phase: HomeBridgeIndicatorPhase, fallback?: string) {
  if (fallback) return fallback;
  if (phase === "draft-changed") return "홈 입력이 변경되었습니다. 저장을 누르면 작업일지에 반영됩니다.";
  if (phase === "save-requested") return "홈 입력 내용을 저장 중입니다.";
  if (phase === "save-succeeded") return "홈 입력 내용이 일지 목록과 출력현황에 반영되었습니다.";
  if (phase === "draft-cleared") return "홈 저장 초안을 초기화했습니다.";
  return "홈 저장 내용을 반영하지 못했습니다.";
}

function buildHomeBridgeBadgeClass(phase: HomeBridgeIndicatorPhase) {
  if (phase === "save-succeeded") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (phase === "save-failed") return "border-red-200 bg-red-50 text-red-700";
  if (phase === "save-requested") return "border-sky-200 bg-sky-50 text-sky-700";
  if (phase === "draft-cleared") return "border-slate-200 bg-white text-slate-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

// HomePage is only the entry switch for home rendering.
// The primary worker home lives in the committed iframe app under public/home-v2/main-v2-app.
// Before loading the iframe, sync the live site list into same-origin storage so the static app
// can render the same operational site search data as the rest of the product.
export default function HomePage() {
  const today = useMemo(() => getTodayYYYYMMDD(), []);
  const { user } = useAuth();
  const { isPartner, loading: roleLoading } = useUserRole();
  const { data: siteList = [], isLoading: siteListLoading, dataUpdatedAt } = useSiteList();
  const { data: workerNames = [], isLoading: workerNamesLoading, dataUpdatedAt: workerNamesUpdatedAt } = useOperationalWorkerNames();
  const navigate = useNavigate();
  const [iframeMode, setIframeMode] = useState<HomeIframeMode>("iframe-main");
  const [siteSyncReady, setSiteSyncReady] = useState(false);
  const [bridgeIndicator, setBridgeIndicator] = useState<HomeBridgeIndicator | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadCheckTimerRef = useRef<number | null>(null);
  const lastHomeDraftRawRef = useRef("");
  const homeDraftPollRef = useRef<number | null>(null);
  const homeDraftSyncChainRef = useRef<Promise<void>>(Promise.resolve());
  const homeBridgeRequestIdsRef = useRef<Set<string>>(new Set());
  const homeBridgeReadyRef = useRef(false);
  const recentHomeBridgeSaveRef = useRef<{ raw: string; at: number } | null>(null);

  const homeSiteOptions = useMemo(
    () =>
      siteList
        .map((site) => {
          const affiliation = getSiteAffiliationLabel(site);
          const contractor = getSiteBuilderLabel(site) || affiliation;
          return {
            value: site.site_id,
            text: site.site_name,
            dept: affiliation,
            contractor: contractor || undefined,
          };
        })
        .filter((site) => site.value && site.text),
    [siteList],
  );

  const currentWorkerName = useMemo(() => {
    const metadataName = typeof user?.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
    if (metadataName) return metadataName;

    const email = typeof user?.email === "string" ? user.email.trim() : "";
    if (!email) return "";

    return email.split("@")[0]?.trim() || email;
  }, [user?.email, user?.user_metadata?.name]);

  const homeWorkerOptions = useMemo(
    () =>
      [...new Set([currentWorkerName, ...workerNames].map((name) => String(name || "").trim()).filter(Boolean))],
    [currentWorkerName, workerNames],
  );

  const saveWorklogMutation = useSaveWorklog();

  const setHomeBridgeIndicator = useCallback((phase: HomeBridgeIndicatorPhase, fallback?: string) => {
    setBridgeIndicator({
      phase,
      message: buildHomeBridgeMessage(phase, fallback),
    });
  }, []);

  const postHomeBridgeStatusToIframe = useCallback(
    (message: Omit<HomeIframeBridgeMessage, "type" | "source" | "protocolVersion">) => {
      if (typeof window === "undefined") return;
      const target = iframeRef.current?.contentWindow;
      if (!target) return;

      target.postMessage(
        {
          ...message,
          type: HOME_IFRAME_BRIDGE_MESSAGE_TYPE,
          source: HOME_IFRAME_BRIDGE_PARENT_SOURCE,
          protocolVersion: HOME_IFRAME_BRIDGE_PROTOCOL_VERSION,
        } satisfies HomeIframeBridgeMessage,
        window.location.origin,
      );
    },
    [],
  );

  const isDuplicateHomeBridgeSave = useCallback((raw: string) => {
    const now = Date.now();
    const recent = recentHomeBridgeSaveRef.current;
    if (recent && recent.raw === raw && now - recent.at < HOME_BRIDGE_DUPLICATE_SAVE_WINDOW_MS) {
      return true;
    }

    recentHomeBridgeSaveRef.current = { raw, at: now };
    return false;
  }, []);

  const bridgeHomeDraftSave = useCallback(
    (raw: string, meta: { source: "message" | "poll" | "storage"; requestId?: string }) => {
      homeDraftSyncChainRef.current = homeDraftSyncChainRef.current
        .catch(() => undefined)
        .then(async () => {
          if (isDuplicateHomeBridgeSave(raw)) {
            if (import.meta.env.DEV) {
              console.info("[home-bridge] save:deduped", {
                source: meta.source,
                requestId: meta.requestId || "",
              });
            }
            return;
          }

          const parsed = parseHomeDraftToWorklogInput(raw, today);
          if (!parsed.ok) {
            if (import.meta.env.DEV) {
              console.error("[home-bridge] parse:error", {
                source: meta.source,
                requestId: meta.requestId || "",
                code: parsed.code,
                message: parsed.devMessage,
                raw,
              });
            }

            setHomeBridgeIndicator("save-failed", parsed.userMessage);
            postHomeBridgeStatusToIframe({
              phase: "save-failed",
              requestId: meta.requestId,
              code: parsed.code,
              message: parsed.userMessage,
            });
            toast.error(parsed.userMessage);
            return;
          }

          const payload = parsed.value;
          setHomeBridgeIndicator("save-requested");

          if (import.meta.env.DEV) {
            console.info("[home-bridge] save:start", {
              source: meta.source,
              requestId: meta.requestId || "",
              workDate: payload.workDate,
              siteName: payload.siteName,
              manpowerCount: payload.manpower.length,
              workSetCount: payload.workSets.length,
              materialCount: payload.materials.length,
            });
          }

          const saved = await saveWorklogMutation.mutateAsync(payload);

          if (import.meta.env.DEV) {
            console.info("[home-bridge] save:success", {
              source: meta.source,
              requestId: meta.requestId || "",
              worklogId: saved.id,
              workDate: saved.workDate,
              status: saved.status,
            });
          }

          setHomeBridgeIndicator("save-succeeded");
          postHomeBridgeStatusToIframe({
            phase: "save-succeeded",
            requestId: meta.requestId,
            message: buildHomeBridgeMessage("save-succeeded"),
          });
        })
        .catch((error) => {
          const message = errorMessage(error, "홈 저장 내용을 작업일지에 반영하지 못했습니다.");
          if (import.meta.env.DEV) {
            console.error("[home-bridge] save:error", {
              source: meta.source,
              requestId: meta.requestId || "",
              error,
            });
          }

          setHomeBridgeIndicator("save-failed", message);
          postHomeBridgeStatusToIframe({
            phase: "save-failed",
            requestId: meta.requestId,
            code: "supabase-save-failed",
            message,
          });
          toast.error(message);
        });
    },
    [isDuplicateHomeBridgeSave, postHomeBridgeStatusToIframe, saveWorklogMutation, setHomeBridgeIndicator, today],
  );

  const clearLoadCheckTimer = useCallback(() => {
    if (loadCheckTimerRef.current === null) return;
    window.clearTimeout(loadCheckTimerRef.current);
    loadCheckTimerRef.current = null;
  }, []);

  const promoteIframeFailure = useCallback(() => {
    clearLoadCheckTimer();
    setIframeMode((prev) => {
      if (prev === "iframe-main") return "iframe-fallback";
      if (prev === "iframe-fallback") return "legacy";
      return prev;
    });
  }, [clearLoadCheckTimer]);

  useEffect(() => {
    return () => clearLoadCheckTimer();
  }, [clearLoadCheckTimer]);

  useEffect(() => {
    if (!bridgeIndicator) return;
    if (bridgeIndicator.phase !== "save-succeeded" && bridgeIndicator.phase !== "draft-cleared") return;

    const timer = window.setTimeout(() => {
      setBridgeIndicator((current) => {
        if (!current || current.phase !== bridgeIndicator.phase) return current;
        return null;
      });
    }, HOME_BRIDGE_BADGE_AUTO_HIDE_MS);

    return () => window.clearTimeout(timer);
  }, [bridgeIndicator]);

  useEffect(() => {
    if (!roleLoading && !isPartner) return;
    clearLoadCheckTimer();
    setIframeMode("iframe-main");
  }, [clearLoadCheckTimer, roleLoading, isPartner]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPartner || roleLoading) {
      setSiteSyncReady(true);
      return;
    }
    if (siteListLoading || workerNamesLoading) {
      setSiteSyncReady(false);
      return;
    }
    try {
      window.localStorage.setItem(HOME_SITE_STORAGE_KEY, JSON.stringify(homeSiteOptions));
      window.localStorage.setItem(HOME_WORKER_STORAGE_KEY, JSON.stringify(homeWorkerOptions));
    } catch {
      // ignore storage failures; the iframe will fall back to empty live data
    }
    setSiteSyncReady(true);
  }, [homeSiteOptions, homeWorkerOptions, isPartner, roleLoading, siteListLoading, workerNamesLoading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isPartner || roleLoading || iframeMode === "legacy") return;

    const syncLatestHomeDraft = () => {
      if (homeBridgeReadyRef.current) return;
      const raw = window.localStorage.getItem(HOME_DRAFT_KEY) || "";
      if (!raw || raw === lastHomeDraftRawRef.current) return;
      lastHomeDraftRawRef.current = raw;
      void bridgeHomeDraftSave(raw, { source: "poll" });
    };

    lastHomeDraftRawRef.current = window.localStorage.getItem(HOME_DRAFT_KEY) || "";
    homeDraftPollRef.current = window.setInterval(syncLatestHomeDraft, 700);

    return () => {
      if (homeDraftPollRef.current !== null) {
        window.clearInterval(homeDraftPollRef.current);
        homeDraftPollRef.current = null;
      }
    };
  }, [bridgeHomeDraftSave, iframeMode, isPartner, roleLoading]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (isHomeBridgeMessage(event.data)) {
        const data = event.data;
        if (data.source === HOME_IFRAME_BRIDGE_PARENT_SOURCE) return;
        homeBridgeReadyRef.current = true;
        if (homeDraftPollRef.current !== null) {
          window.clearInterval(homeDraftPollRef.current);
          homeDraftPollRef.current = null;
        }

        if (data.phase === "draft-changed") {
          setHomeBridgeIndicator("draft-changed");
          return;
        }

        if (data.phase === "save-requested") {
          const requestId = typeof data.requestId === "string" ? data.requestId : "";
          if (requestId && homeBridgeRequestIdsRef.current.has(requestId)) return;
          if (requestId) homeBridgeRequestIdsRef.current.add(requestId);

          const raw =
            typeof data.raw === "string" && data.raw
              ? data.raw
              : typeof window !== "undefined"
                ? window.localStorage.getItem(HOME_DRAFT_KEY) || ""
                : "";

          if (!raw) {
            const message = "홈 저장 초안이 비어 있어 작업일지에 반영하지 못했습니다.";
            if (import.meta.env.DEV) {
              console.error("[home-bridge] save-requested:empty", {
                requestId,
                source: data.source || HOME_IFRAME_BRIDGE_IFRAME_SOURCE,
              });
            }
            setHomeBridgeIndicator("save-failed", message);
            postHomeBridgeStatusToIframe({
              phase: "save-failed",
              requestId,
              code: "empty-draft",
              message,
            });
            toast.error(message);
            return;
          }

          lastHomeDraftRawRef.current = raw;
          void bridgeHomeDraftSave(raw, { source: "message", requestId });
          return;
        }

        if (data.phase === "storage-save-failed") {
          const message = data.message || "홈 초안을 브라우저 저장소에 저장하지 못했습니다.";
          if (import.meta.env.DEV) {
            console.error("[home-bridge] storage:error", {
              code: data.code || "storage-save-failed",
              message,
            });
          }
          setHomeBridgeIndicator("save-failed", message);
          postHomeBridgeStatusToIframe({
            phase: "save-failed",
            requestId: data.requestId,
            code: data.code || "storage-save-failed",
            message,
          });
          toast.error(message);
          return;
        }

        if (data.phase === "draft-cleared") {
          lastHomeDraftRawRef.current = "";
          setHomeBridgeIndicator("draft-cleared");
          postHomeBridgeStatusToIframe({
            phase: "draft-cleared",
            message: buildHomeBridgeMessage("draft-cleared"),
          });
          return;
        }

        return;
      }

      const data = event.data as { type?: string; path?: string } | null;
      if (!data || data.type !== "inopnc:navigate") return;
      const path = typeof data.path === "string" ? data.path : "";
      if (!HOME_ALLOWED_ROUTES.has(path)) {
        console.warn("[inopnc] invalid path", path);
        return;
      }
      navigate(path);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [bridgeHomeDraftSave, navigate, postHomeBridgeStatusToIframe, setHomeBridgeIndicator]);

  if (roleLoading || (!isPartner && !siteSyncReady)) {
    return (
      <section
        className="-mx-4"
        style={{
          marginTop: "var(--home-section-mt, -0.5rem)",
          marginBottom: "var(--home-section-mb, -1.5rem)",
          minHeight: "calc(100dvh - var(--app-header-height, 114px))",
        }}
      />
    );
  }

  const renderMode: HomeRenderMode = isPartner ? "partner" : iframeMode;
  const siteVersion = dataUpdatedAt || 0;
  const workerVersion = workerNamesUpdatedAt || 0;
  const fallbackUrl = getHomeFallbackUrl();
  const iframeSrc =
    renderMode === "iframe-fallback"
      ? `${fallbackUrl}${fallbackUrl.includes("?") ? "&" : "?"}sites=${siteVersion}&workers=${workerVersion}`
      : `${getHomeMainUrl()}&sites=${siteVersion}&workers=${workerVersion}`;

  if (renderMode === "partner") {
    return <PartnerHomePage />;
  }

  if (renderMode === "legacy") {
    return <WorkerHomePageLegacy />;
  }

  return (
    <section
      className="relative -mx-4"
      style={{
        marginTop: "var(--home-section-mt, -0.5rem)",
        marginBottom: "var(--home-section-mb, -1.5rem)",
      }}
    >
      {bridgeIndicator && (
        <div className="pointer-events-none absolute right-4 top-4 z-10">
          <div
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur ${buildHomeBridgeBadgeClass(bridgeIndicator.phase)}`}
          >
            {bridgeIndicator.message}
          </div>
        </div>
      )}

      <iframe
        key={`${renderMode}-${siteVersion}-${workerVersion}-${homeSiteOptions.length}-${homeWorkerOptions.length}-${currentWorkerName}-${today}`}
        ref={iframeRef}
        title="INOPNC Home Main"
        src={iframeSrc}
        className="block w-full border-0 bg-background"
        style={{ height: "calc(100dvh - var(--app-header-height, 114px))" }}
        onLoad={() => {
          clearLoadCheckTimer();
          loadCheckTimerRef.current = window.setTimeout(() => {
            try {
              const doc = iframeRef.current?.contentDocument;
              const root = doc?.getElementById("root");
              const hasRendered = !!root && root.childElementCount > 0;
              if (hasRendered) return;
              promoteIframeFailure();
            } catch {
              promoteIframeFailure();
            }
          }, HOME_IFRAME_CHECK_DELAY_MS);
        }}
        onError={() => {
          promoteIframeFailure();
        }}
      />
    </section>
  );
}
