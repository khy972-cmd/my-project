import { type ReactNode, useMemo, useState } from "react";
import { PreviewAppBar, PreviewControlBar, PreviewViewport } from "@/components/viewer/PreviewBars";
import { cn } from "@/lib/utils";

interface ZoomLike {
  scale: number;
  panX: number;
  panY: number;
  minScale: number;
  maxScale: number;
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLElement>;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: (nextScale?: number) => void;
  onWheel: (e: React.WheelEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface PreviewModalProps {
  open: boolean;
  title: string;
  onBack: () => void;
  onClose: () => void;
  onSave?: () => void;
  onShare?: () => void;
  zoom: ZoomLike;
  contentRef?: { current: HTMLElement | null };
  children: ReactNode;
  titleClassName?: string;
  maxWidthClassName?: string;
}

export default function PreviewModal({
  open,
  title,
  onBack,
  onClose,
  onSave,
  onShare,
  zoom,
  contentRef,
  children,
  titleClassName,
  maxWidthClassName,
}: PreviewModalProps) {
  const [panMode, setPanMode] = useState(false);

  const mergedContentRef = useMemo(() => {
    return (node: HTMLDivElement | null) => {
      zoom.contentRef.current = node;
      if (contentRef) contentRef.current = node;
    };
  }, [contentRef, zoom.contentRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black text-white">
      <PreviewAppBar title={title} onBack={onBack} onClose={onClose} onSave={onSave} titleClassName={titleClassName} />

      <PreviewViewport headerHeightPx={56} toolbarHeightPx={72}>
        <div
          ref={zoom.containerRef}
          className="mx-auto flex min-h-full w-full items-start justify-center px-3 py-5"
          onWheel={zoom.onWheel}
          onTouchStart={zoom.onTouchStart}
          onTouchMove={zoom.onTouchMove}
          onTouchEnd={zoom.onTouchEnd}
        >
          <div
            ref={mergedContentRef}
            className={cn("origin-top transition-transform", maxWidthClassName ?? "max-w-[900px]", panMode ? "cursor-grab" : "")}
            style={{ transform: `translate(${zoom.panX}px, ${zoom.panY}px) scale(${zoom.scale})` }}
          >
            {children}
          </div>
        </div>
      </PreviewViewport>

      <PreviewControlBar
        onZoomOut={zoom.zoomOut}
        onZoomIn={zoom.zoomIn}
        onFit={() => zoom.reset()}
        onTogglePan={() => setPanMode((prev) => !prev)}
        panActive={panMode}
        fitActive={false}
        onShare={() => onShare?.()}
        zoomOutDisabled={zoom.scale <= zoom.minScale + 0.001}
        zoomInDisabled={zoom.scale >= zoom.maxScale - 0.001}
      />
    </div>
  );
}
