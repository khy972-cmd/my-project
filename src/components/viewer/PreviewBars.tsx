import type { CSSProperties, ReactNode } from "react";
import { ChevronLeft, Download, Hand, Minus, Plus, RefreshCw, RotateCcw, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewAppBarProps {
  title: string;
  onBack: () => void;
  onClose: () => void;
  onReset?: () => void;
  onSave?: () => void;
  resetDisabled?: boolean;
  saveDisabled?: boolean;
  backAriaLabel?: string;
  resetAriaLabel?: string;
  saveAriaLabel?: string;
  closeAriaLabel?: string;
  titleClassName?: string;
  className?: string;
  style?: CSSProperties;
}

export function PreviewAppBar({
  title,
  onBack,
  onClose,
  onReset,
  onSave,
  resetDisabled,
  saveDisabled,
  backAriaLabel = "이전",
  resetAriaLabel = "입력 초기화",
  saveAriaLabel = "저장 또는 다운로드",
  closeAriaLabel = "닫기",
  titleClassName,
  className,
  style,
}: PreviewAppBarProps) {
  return (
    <header className={cn("flex items-center justify-between border-b border-white/15 bg-black px-2", className)} style={style}>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button type="button" onClick={onBack} className="rounded-full p-2 text-white transition active:bg-white/15" aria-label={backAriaLabel}>
          <ChevronLeft className="h-6 w-6" />
        </button>
        <span className={cn("truncate text-lg-app font-bold text-white", titleClassName)}>{title}</span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={resetDisabled}
            className="rounded-full p-2 text-white transition active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={resetAriaLabel}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        )}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="rounded-full p-2 text-white transition active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={saveAriaLabel}
          >
            <Download className="h-5 w-5" />
          </button>
        )}

        <button type="button" onClick={onClose} className="rounded-full p-2 text-white transition active:bg-white/15" aria-label={closeAriaLabel}>
          <X className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

interface FloatingToolbarProps {
  onZoomOut: () => void;
  onFit: () => void;
  onTogglePan: () => void;
  onZoomIn: () => void;
  onShare: () => void;
  panActive?: boolean;
  fitActive?: boolean;
  zoomOutDisabled?: boolean;
  zoomInDisabled?: boolean;
  className?: string;
}

export function FloatingToolbar({
  onZoomOut,
  onFit,
  onTogglePan,
  onZoomIn,
  onShare,
  panActive = false,
  fitActive = false,
  zoomOutDisabled = false,
  zoomInDisabled = false,
  className,
}: FloatingToolbarProps) {
  return (
    <div
      data-no-pan="1"
      className={cn(
        "fixed bottom-[calc(env(safe-area-inset-bottom,0px)+12px)] left-1/2 z-[10005] flex w-[min(92vw,420px)] -translate-x-1/2 items-center justify-between gap-2 rounded-[50px] border border-[#333] bg-[#222] px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur",
        className,
      )}
    >
      <button
        data-no-pan="1"
        type="button"
        onClick={onZoomOut}
        disabled={zoomOutDisabled}
        className="flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent text-[10px] font-medium text-white opacity-80 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="w-5 h-5" />
        축소
      </button>

      <button
        data-no-pan="1"
        type="button"
        onClick={onFit}
        className={cn(
          "flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent text-[10px] font-medium transition-opacity",
          fitActive ? "text-primary opacity-100 font-bold" : "text-white opacity-80 hover:opacity-100",
        )}
      >
        <RefreshCw className="w-5 h-5" />
        맞춤
      </button>

      <button
        data-no-pan="1"
        type="button"
        onClick={onTogglePan}
        className={cn(
          "flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent text-[10px] font-medium transition-opacity",
          panActive ? "text-primary opacity-100 font-bold" : "text-white opacity-80 hover:opacity-100",
        )}
      >
        <Hand className="w-5 h-5" />
        이동
      </button>

      <button
        data-no-pan="1"
        type="button"
        onClick={onZoomIn}
        disabled={zoomInDisabled}
        className="flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent text-[10px] font-medium text-white opacity-80 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="w-5 h-5" />
        확대
      </button>

      <button
        data-no-pan="1"
        type="button"
        onClick={onShare}
        className="flex min-h-11 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full border-none bg-transparent text-[10px] font-medium text-white opacity-80 transition-opacity hover:opacity-100"
      >
        <Share2 className="w-5 h-5" />
        공유
      </button>
    </div>
  );
}

export function PreviewControlBar(props: FloatingToolbarProps) {
  return <FloatingToolbar {...props} />;
}

interface PreviewViewportProps {
  children: ReactNode;
  headerHeightPx: number;
  toolbarHeightPx: number;
  className?: string;
  style?: CSSProperties;
}

export function PreviewViewport({
  children,
  headerHeightPx,
  toolbarHeightPx,
  className,
  style,
}: PreviewViewportProps) {
  return (
    <div
      className={cn("relative flex-1 overflow-auto overscroll-contain bg-[#333]", className)}
      style={{
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x pan-y pinch-zoom",
        paddingTop: `calc(${headerHeightPx}px + env(safe-area-inset-top))`,
        paddingBottom: `calc(${toolbarHeightPx}px + env(safe-area-inset-bottom) + 12px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
