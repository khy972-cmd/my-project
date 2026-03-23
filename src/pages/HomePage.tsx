import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PartnerHomePage from "@/components/partner/PartnerHomePage";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteList } from "@/hooks/useSiteList";
import { useOperationalWorkerNames } from "@/hooks/useOperationalWorkerNames";
import { useSaveWorklog, type WorklogMutationInput } from "@/hooks/useSupabaseWorklogs";
import { getSiteAffiliationLabel, getSiteBuilderLabel } from "@/lib/siteList";
import { getHomeMainUrl, getHomeFallbackUrl } from "@/constants/env";
import { HOME_DRAFT_KEY, HOME_SITE_STORAGE_KEY, HOME_WORKER_STORAGE_KEY } from "@/constants/storageKeys";
import { WorkerHomePageLegacy } from "@/pages/HomePage.legacy";
const HOME_ALLOWED_ROUTES = new Set(["/", "/output", "/worklog", "/site", "/doc", "/request"]);
const HOME_IFRAME_CHECK_DELAY_MS = 1200;

type HomeIframeMode = "iframe-main" | "iframe-fallback" | "legacy";
type HomeRenderMode = "partner" | HomeIframeMode;
type HomeDraftBridgeState = {
  selectedSite?: unknown;
  siteSearch?: unknown;
  dept?: unknown;
  workDate?: unknown;
  manpowerList?: unknown;
  workSets?: unknown;
  materials?: unknown;
  photos?: unknown;
  drawings?: unknown;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePhotoStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "before" || value === "보수전") return "before";
  if (value === "receipt" || value === "확인서" || value === "confirm" || value === "confirmation") return "receipt";
  return "after";
}

function normalizeDrawingStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "done" || value === "완료도면" || value === "완료") return "done";
  return "progress";
}

function parseHomeDraftToMutationInput(raw: string): WorklogMutationInput | null {
  try {
    const parsed = JSON.parse(raw) as HomeDraftBridgeState;
    if (!parsed || typeof parsed !== "object") return null;

    const workDate = asString(parsed.workDate).trim();
    const siteName = asString(parsed.siteSearch).trim();
    const siteValue = asString(parsed.selectedSite).trim();
    if (!workDate || !siteName) return null;

    const nowIso = new Date().toISOString();
    const manpower = Array.isArray(parsed.manpowerList)
      ? parsed.manpowerList
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            return {
              id: Date.now() + index,
              worker: asString(row.worker).trim(),
              workHours: asNumber(row.workHours, 0),
              isCustom: !!row.isCustom,
              locked: !!row.locked,
            };
          })
          .filter(Boolean)
      : [];

    const workSets = Array.isArray(parsed.workSets)
      ? parsed.workSets
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const location = row.location && typeof row.location === "object" ? (row.location as Record<string, unknown>) : {};
            return {
              id: Date.now() + index,
              member: asString(row.member),
              process: asString(row.process),
              type: asString(row.type),
              location: {
                block: asString(location.block),
                dong: asString(location.dong),
                floor: asString(location.floor),
              },
              customMemberValue: asString(row.customMemberValue),
              customProcessValue: asString(row.customProcessValue),
              customTypeValue: asString(row.customTypeValue),
            };
          })
          .filter(Boolean)
      : [];

    const materials = Array.isArray(parsed.materials)
      ? parsed.materials
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const name = asString(row.name).trim();
            if (!name) return null;
            return {
              id: Date.now() + index,
              name,
              qty: Math.max(0, asNumber(row.qty, 0)),
            };
          })
          .filter(Boolean)
      : [];

    const photos = Array.isArray(parsed.photos)
      ? parsed.photos
          .map((item, index) => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const url = asString(row.url || row.img).trim();
            if (!url) return null;
            return {
              id: `home_bridge_photo_${Date.now()}_${index}`,
              type: "photo" as const,
              status: normalizePhotoStatus(asString(row.status || row.desc || row.badge, "after")),
              timestamp: nowIso,
              url,
            };
          })
          .filter(Boolean)
      : [];

    const drawings = Array.isArray(parsed.drawings)
      ? parsed.drawings
          .map((item, index) => {
            const row = item && typeof item === "object" ? (item as Record<string, unknown>) : null;
            const url = asString(row?.url || row?.img || item).trim();
            if (!url) return null;
            return {
              id: `home_bridge_drawing_${Date.now()}_${index}`,
              type: "drawing" as const,
              status: normalizeDrawingStatus(asString(row?.status || row?.desc || row?.stage, "progress")),
              timestamp: nowIso,
              url,
            };
          })
          .filter(Boolean)
      : [];

    return {
      siteValue,
      siteName,
      dept: asString(parsed.dept).trim(),
      workDate,
      manpower,
      workSets,
      materials,
      photos,
      drawings,
      photoCount: photos.filter((item) => item.status !== "receipt").length,
      drawingCount: drawings.length,
      status: "draft",
      version: 1,
    };
  } catch {
    return null;
  }
}

// HomePage is only the entry switch for home rendering.
// The primary worker home lives in the committed iframe app under public/home-v2/main-v2-app.
// Before loading the iframe, sync the live site list into same-origin storage so the static app
// can render the same operational site search data as the rest of the product.
export default function HomePage() {
  const { user } = useAuth();
  const { isPartner, loading: roleLoading } = useUserRole();
  const { data: siteList = [], isLoading: siteListLoading, dataUpdatedAt } = useSiteList();
  const { data: workerNames = [], isLoading: workerNamesLoading, dataUpdatedAt: workerNamesUpdatedAt } = useOperationalWorkerNames();
  const navigate = useNavigate();
  const [iframeMode, setIframeMode] = useState<HomeIframeMode>("iframe-main");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadCheckTimerRef = useRef<number | null>(null);
  const [siteSyncReady, setSiteSyncReady] = useState(false);

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
  const lastHomeDraftRawRef = useRef("");
  const homeDraftPollRef = useRef<number | null>(null);
  const homeDraftSyncChainRef = useRef<Promise<void>>(Promise.resolve());

  const bridgeHomeDraftSave = useCallback(
    (raw: string) => {
      homeDraftSyncChainRef.current = homeDraftSyncChainRef.current
        .catch(() => undefined)
        .then(async () => {
          const payload = parseHomeDraftToMutationInput(raw);
          if (!payload) return;

          if (import.meta.env.DEV) {
            console.info("[home-bridge] save:start", {
              workDate: payload.workDate,
              siteName: payload.siteName,
              manpowerCount: payload.manpower.length,
              workSetCount: payload.workSets.length,
            });
          }

          const saved = await saveWorklogMutation.mutateAsync(payload);

          if (import.meta.env.DEV) {
            console.info("[home-bridge] save:success", {
              worklogId: saved.id,
              workDate: saved.workDate,
              status: saved.status,
            });
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("[home-bridge] save:error", error);
          }
          toast.error("홈 저장 내용을 작업일지에 반영하지 못했습니다.");
        });
    },
    [saveWorklogMutation],
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
      const raw = window.localStorage.getItem(HOME_DRAFT_KEY) || "";
      if (!raw || raw === lastHomeDraftRawRef.current) return;
      lastHomeDraftRawRef.current = raw;
      bridgeHomeDraftSave(raw);
    };

    lastHomeDraftRawRef.current = window.localStorage.getItem(HOME_DRAFT_KEY) || "";
    homeDraftPollRef.current = window.setInterval(syncLatestHomeDraft, 700);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== HOME_DRAFT_KEY) return;
      if (!event.newValue || event.newValue === lastHomeDraftRawRef.current) return;
      lastHomeDraftRawRef.current = event.newValue;
      bridgeHomeDraftSave(event.newValue);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (homeDraftPollRef.current !== null) {
        window.clearInterval(homeDraftPollRef.current);
        homeDraftPollRef.current = null;
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [bridgeHomeDraftSave, iframeMode, isPartner, roleLoading]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
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
  }, [navigate]);

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
      className="-mx-4"
      style={{
        marginTop: "var(--home-section-mt, -0.5rem)",
        marginBottom: "var(--home-section-mb, -1.5rem)",
      }}
    >
      <iframe
        key={`${renderMode}-${siteVersion}-${workerVersion}-${homeSiteOptions.length}-${homeWorkerOptions.length}-${currentWorkerName}`}
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
