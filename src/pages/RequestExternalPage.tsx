import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_TARGET_URL = "https://pf.kakao.com/_xfgxdqX";
const DEFAULT_TITLE = "\uBCF8\uC0AC\uC694\uCCAD";
const BACK_LABEL = "\uC774\uC804";
const CLOSE_LABEL = "\uB2EB\uAE30";
const NEW_WINDOW_LABEL = "\uC0C8 \uCC3D";
const CLOSE_FALLBACK_MESSAGE = "\uCC3D \uB2EB\uAE30\uAC00 \uC81C\uD55C\uB418\uC5B4 \uC694\uCCAD \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4";

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

export default function RequestExternalPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { targetUrl, title } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const resolvedTitle = params.get("title")?.trim() || DEFAULT_TITLE;
    return {
      targetUrl: resolveTargetUrl(params.get("target")),
      title: resolvedTitle,
    };
  }, [location.search]);

  const handleBack = () => {
    navigate("/request", { replace: true });
  };

  const handleClose = () => {
    window.close();

    window.setTimeout(() => {
      if (!window.closed) {
        toast.message(CLOSE_FALLBACK_MESSAGE);
        handleBack();
      }
    }, 120);
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
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
