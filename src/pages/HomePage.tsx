import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PartnerHomePage from "@/components/partner/PartnerHomePage";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteList } from "@/hooks/useSiteList";
import { useOperationalWorkerNames } from "@/hooks/useOperationalWorkerNames";
import { getSiteAffiliationLabel, getSiteBuilderLabel } from "@/lib/siteList";
import { getHomeMainUrl, getHomeFallbackUrl } from "@/constants/env";
import { HOME_SITE_STORAGE_KEY, HOME_WORKER_STORAGE_KEY } from "@/constants/storageKeys";
import { WorkerHomePageLegacy } from "@/pages/HomePage.legacy";
const HOME_ALLOWED_ROUTES = new Set(["/", "/output", "/worklog", "/site", "/doc", "/request"]);
const HOME_IFRAME_CHECK_DELAY_MS = 1200;

type HomeIframeMode = "iframe-main" | "iframe-fallback" | "legacy";
type HomeRenderMode = "partner" | HomeIframeMode;

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
