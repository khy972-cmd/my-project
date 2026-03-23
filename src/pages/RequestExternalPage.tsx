import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_TARGET_URL = "https://pf.kakao.com/_xfgxdqX";
const DEFAULT_TITLE = "\uBCF8\uC0AC\uC694\uCCAD";
const DEFAULT_RETURN_TO = "/request";
const BACK_LABEL = "\uC774\uC804";
const CLOSE_LABEL = "\uB2EB\uAE30";
const NEW_WINDOW_LABEL = "\uC0C8 \uCC3D";
const IFRAME_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups";

type RequestExternalLocationState = {
  historyGuard?: boolean;
  returnTo?: string;
};

function resolveTargetUrl(rawValue: string | null): string {
  const target = rawValue?.trim();
  if (!target) return DEFAULT_TARGET_URL;

  try {
    const parsed = new URL(target);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_TARGET_URL;
    }
    return parsed.toString();
  } catch {
    return DEFAULT_TARGET_URL;
  }
}

function resolveReturnTo(rawValue: string | undefined): string {
  if (!rawValue?.startsWith("/")) return DEFAULT_RETURN_TO;
  return rawValue;
}

export default function RequestExternalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as RequestExternalLocationState | null;

  const { targetUrl, title, returnTo } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const resolvedTitle = params.get("title")?.trim() || DEFAULT_TITLE;

    return {
      targetUrl: resolveTargetUrl(params.get("target")),
      title: resolvedTitle,
      returnTo: resolveReturnTo(locationState?.returnTo),
    };
  }, [location.search, locationState]);

  useEffect(() => {
    if (locationState?.historyGuard) return;

    navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      {
        state: { ...locationState, historyGuard: true, returnTo },
      },
    );
  }, [location.pathname, location.search, locationState, navigate, returnTo]);

  useEffect(() => {
    const handlePopState = () => {
      navigate(returnTo, { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, returnTo]);

  const handleBack = () => {
    navigate(returnTo, { replace: true });
  };

  const handleClose = () => {
    navigate(returnTo, { replace: true });
  };

  const handleOpenInNewWindow = () => {
    const popup = window.open(targetUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = targetUrl;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mt-3 mb-2">
        <Card className="overflow-hidden rounded-2xl shadow-soft mb-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Button type="button" variant="outline" className="h-9 px-3 text-sm font-semibold" onClick={handleBack}>
              {BACK_LABEL}
            </Button>
            <div className="min-w-0 flex-1 truncate text-sm font-bold text-header-navy">{title}</div>
            <Button type="button" variant="outline" className="h-9 px-3 text-sm font-semibold" onClick={handleOpenInNewWindow}>
              {NEW_WINDOW_LABEL}
            </Button>
            <Button type="button" variant="ghost" className="h-9 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground" onClick={handleClose}>
              {CLOSE_LABEL}
            </Button>
          </div>

          <div className="h-[68vh] max-[640px]:h-[62vh] bg-white">
            <iframe
              src={targetUrl}
              title={title}
              className="h-full w-full border-0"
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox={IFRAME_SANDBOX}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
