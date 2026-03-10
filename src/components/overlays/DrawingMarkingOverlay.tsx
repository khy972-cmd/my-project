import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";

type DrawingMarkingOverlayProps = {
  isOpen: boolean;
  imageSrc: string;
  onPrev?: () => void;
  onDeleteSelected?: () => void;
  onSave?: (markedImage: string) => void;
  contextKey?: string;
};

type DrawingPoint = { x: number; y: number };
type DrawingTool = "brush" | "polygon";
type DrawingBrushStroke = { type: "brush"; points: DrawingPoint[]; width: number; color: string };
type DrawingPolygonArea = {
  type: "polygon-area";
  points: DrawingPoint[];
  lineWidth: number;
  strokeColor: string;
  fillColor: string;
};
type DrawingMark = DrawingBrushStroke | DrawingPolygonArea;

const LABEL_PREV = "이전";
const LABEL_TITLE = "도면마킹";
const LABEL_TOOL_BRUSH = "펜";
const LABEL_TOOL_POLYGON = "영역";
const LABEL_COMPLETE = "완료";
const LABEL_CANCEL = "취소";
const LABEL_CLEAR = "지우기";
const LABEL_DELETE = "삭제";
const LABEL_SAVE = "저장";
const ALT_DRAWING = "도면";
const BRUSH_COLOR = "#ff3b30";
const BRUSH_WIDTH_RATIO = 0.006;
const POLYGON_STROKE_COLOR = "#ff3b30";
const POLYGON_FILL_COLOR = "rgba(255, 59, 48, 0.18)";
const POLYGON_LINE_WIDTH_RATIO = 0.004;
const MIN_POLYGON_POINTS = 3;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function fitRect(containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) {
  const safeImageWidth = Math.max(1, imageWidth);
  const safeImageHeight = Math.max(1, imageHeight);
  const scale = Math.min(containerWidth / safeImageWidth, containerHeight / safeImageHeight);
  const width = safeImageWidth * scale;
  const height = safeImageHeight * scale;
  return {
    x: (containerWidth - width) / 2,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}

function drawStrokeSet(
  ctx: CanvasRenderingContext2D,
  strokes: DrawingBrushStroke[],
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  strokes.forEach((stroke) => {
    if (!stroke.points.length) return;
    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(2, stroke.width * Math.min(width, height));
    ctx.beginPath();
    stroke.points.forEach((point, index) => {
      const x = offsetX + point.x * width;
      const y = offsetY + point.y * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
  });
}

function drawPolygonSet(
  ctx: CanvasRenderingContext2D,
  polygons: DrawingPolygonArea[],
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  polygons.forEach((polygon) => {
    if (polygon.points.length < MIN_POLYGON_POINTS) return;
    const lineWidth = Math.max(2, polygon.lineWidth * Math.min(width, height));
    ctx.save();
    ctx.beginPath();
    polygon.points.forEach((point, index) => {
      const x = offsetX + point.x * width;
      const y = offsetY + point.y * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = polygon.fillColor;
    ctx.strokeStyle = polygon.strokeColor;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.fill();
    ctx.stroke();
    polygon.points.forEach((point) => {
      const x = offsetX + point.x * width;
      const y = offsetY + point.y * height;
      ctx.beginPath();
      ctx.fillStyle = polygon.strokeColor;
      ctx.arc(x, y, Math.max(2.5, lineWidth * 0.9), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  });
}

function drawMarkSet(
  ctx: CanvasRenderingContext2D,
  marks: DrawingMark[],
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  drawStrokeSet(
    ctx,
    marks.filter((mark): mark is DrawingBrushStroke => mark.type === "brush"),
    width,
    height,
    offsetX,
    offsetY,
  );
  drawPolygonSet(
    ctx,
    marks.filter((mark): mark is DrawingPolygonArea => mark.type === "polygon-area"),
    width,
    height,
    offsetX,
    offsetY,
  );
}

function drawDraftPolygon(
  ctx: CanvasRenderingContext2D,
  points: DrawingPoint[],
  previewPoint: DrawingPoint | null,
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
) {
  if (!points.length) return;

  const lineWidth = Math.max(2, POLYGON_LINE_WIDTH_RATIO * Math.min(width, height));
  const pathPoints = previewPoint ? [...points, previewPoint] : points;

  ctx.save();
  ctx.beginPath();
  pathPoints.forEach((point, index) => {
    const x = offsetX + point.x * width;
    const y = offsetY + point.y * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  if (points.length >= MIN_POLYGON_POINTS && previewPoint) {
    const first = points[0];
    ctx.lineTo(offsetX + first.x * width, offsetY + first.y * height);
    ctx.fillStyle = POLYGON_FILL_COLOR;
    ctx.fill();
  }

  ctx.strokeStyle = POLYGON_STROKE_COLOR;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  points.forEach((point) => {
    const x = offsetX + point.x * width;
    const y = offsetY + point.y * height;
    ctx.beginPath();
    ctx.fillStyle = POLYGON_STROKE_COLOR;
    ctx.arc(x, y, Math.max(2.5, lineWidth * 0.9), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export default function DrawingMarkingOverlay({
  isOpen,
  imageSrc,
  onPrev,
  onDeleteSelected,
  onSave,
  contextKey = "react-drawing-overlay",
}: DrawingMarkingOverlayProps) {
  const [mounted, setMounted] = useState(isOpen);
  const [active, setActive] = useState(false);
  const [tool, setTool] = useState<DrawingTool>("brush");
  const [marks, setMarks] = useState<DrawingMark[]>([]);
  const [draftStroke, setDraftStroke] = useState<DrawingBrushStroke | null>(null);
  const [draftPolygonPoints, setDraftPolygonPoints] = useState<DrawingPoint[]>([]);
  const [draftPolygonPreview, setDraftPolygonPreview] = useState<DrawingPoint | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drawFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setActive(true));
      return () => cancelAnimationFrame(frame);
    }

    setActive(false);
    const timeout = window.setTimeout(() => setMounted(false), 260);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.postMessage({ type: "inopnc-drawing", source: contextKey, open: isOpen }, window.location.origin);
  }, [contextKey, isOpen]);

  const drawCanvas = useCallback(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!viewport || !canvas || !image) return;

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;

    const dpr = window.devicePixelRatio || 1;
    const renderWidth = Math.max(1, Math.floor(width * dpr));
    const renderHeight = Math.max(1, Math.floor(height * dpr));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);

    const rect = fitRect(width, height, image.naturalWidth || image.width, image.naturalHeight || image.height);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
    drawMarkSet(ctx, marks, rect.width, rect.height, rect.x, rect.y);
    if (draftStroke) {
      drawStrokeSet(ctx, [draftStroke], rect.width, rect.height, rect.x, rect.y);
    }
    if (draftPolygonPoints.length > 0) {
      drawDraftPolygon(
        ctx,
        draftPolygonPoints,
        draftPolygonPreview,
        rect.width,
        rect.height,
        rect.x,
        rect.y,
      );
    }
  }, [draftPolygonPoints, draftPolygonPreview, draftStroke, marks]);

  const requestDraw = useCallback(() => {
    if (drawFrameRef.current !== null) cancelAnimationFrame(drawFrameRef.current);
    drawFrameRef.current = requestAnimationFrame(() => {
      drawCanvas();
      drawFrameRef.current = null;
    });
  }, [drawCanvas]);

  useEffect(() => {
    if (!mounted || !isOpen) return;
    requestDraw();
  }, [isOpen, mounted, requestDraw]);

  useEffect(() => {
    if (!isOpen) return;

    setTool("brush");
    setMarks([]);
    setDraftStroke(null);
    setDraftPolygonPoints([]);
    setDraftPolygonPreview(null);

    if (!imageSrc) {
      imageRef.current = null;
      return;
    }

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
      requestDraw();
    };
    image.onerror = () => {
      imageRef.current = null;
    };
    image.src = imageSrc;

    return () => {
      imageRef.current = null;
    };
  }, [imageSrc, isOpen, requestDraw]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setDraftPolygonPoints((prev) => {
        if (!prev.length) return prev;
        event.preventDefault();
        return [];
      });
      setDraftPolygonPreview(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => requestDraw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, requestDraw]);

  useEffect(
    () => () => {
      if (drawFrameRef.current !== null) cancelAnimationFrame(drawFrameRef.current);
    },
    [],
  );

  const resolveRelativePoint = useCallback((event: ReactPointerEvent<HTMLCanvasElement>): DrawingPoint | null => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    const image = imageRef.current;
    if (!canvas || !viewport || !image) return null;

    const bounds = canvas.getBoundingClientRect();
    const cursorX = event.clientX - bounds.left;
    const cursorY = event.clientY - bounds.top;
    const rect = fitRect(
      viewport.clientWidth,
      viewport.clientHeight,
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
    );

    if (
      cursorX < rect.x ||
      cursorY < rect.y ||
      cursorX > rect.x + rect.width ||
      cursorY > rect.y + rect.height
    ) {
      return null;
    }

    return {
      x: clamp((cursorX - rect.x) / rect.width),
      y: clamp((cursorY - rect.y) / rect.height),
    };
  }, []);

  const finishStroke = useCallback(() => {
    setDraftStroke((prev) => {
      if (!prev || prev.points.length === 0) return null;
      setMarks((current) => [...current, prev]);
      return null;
    });
  }, []);

  const cancelDraftPolygon = useCallback(() => {
    setDraftPolygonPoints([]);
    setDraftPolygonPreview(null);
  }, []);

  const finishPolygon = useCallback(() => {
    setDraftPolygonPoints((prev) => {
      if (prev.length < MIN_POLYGON_POINTS) return prev;
      setMarks((current) => [
        ...current,
        {
          type: "polygon-area",
          points: prev,
          lineWidth: POLYGON_LINE_WIDTH_RATIO,
          strokeColor: POLYGON_STROKE_COLOR,
          fillColor: POLYGON_FILL_COLOR,
        },
      ]);
      return [];
    });
    setDraftPolygonPreview(null);
  }, []);

  const selectTool = useCallback(
    (nextTool: DrawingTool) => {
      if (nextTool === tool) return;
      finishStroke();
      cancelDraftPolygon();
      setTool(nextTool);
    },
    [cancelDraftPolygon, finishStroke, tool],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = resolveRelativePoint(event);
    if (!point) return;
    event.preventDefault();
    if (tool === "polygon") {
      setDraftPolygonPoints((prev) => [...prev, point]);
      setDraftPolygonPreview(null);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftStroke({
      type: "brush",
      points: [point],
      width: BRUSH_WIDTH_RATIO,
      color: BRUSH_COLOR,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === "polygon") {
      const point = resolveRelativePoint(event);
      setDraftPolygonPreview(point);
      return;
    }

    setDraftStroke((prev) => {
      if (!prev) return prev;
      const point = resolveRelativePoint(event);
      if (!point) return prev;
      const last = prev.points[prev.points.length - 1];
      const distance = Math.hypot(last.x - point.x, last.y - point.y);
      if (distance < 0.001) return prev;
      return { ...prev, points: [...prev.points, point] };
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === "polygon") return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishStroke();
  };

  const handlePointerLeave = () => {
    if (tool === "polygon") {
      setDraftPolygonPreview(null);
    }
  };

  const handleCanvasDoubleClick = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool !== "polygon") return;
    event.preventDefault();
    finishPolygon();
  };

  const clearMarks = () => {
    setDraftStroke(null);
    setMarks([]);
    setDraftPolygonPoints([]);
    setDraftPolygonPreview(null);
  };

  const handleSave = () => {
    const image = imageRef.current;
    if (!image) {
      onSave?.(imageSrc);
      return;
    }

    try {
      const width = Math.max(1, image.naturalWidth || image.width);
      const height = Math.max(1, image.naturalHeight || image.height);
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width;
      exportCanvas.height = height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) {
        onSave?.(imageSrc);
        return;
      }

      const mergedMarks: DrawingMark[] = [
        ...marks,
        ...(draftStroke ? [draftStroke] : []),
        ...(draftPolygonPoints.length >= MIN_POLYGON_POINTS
          ? [
              {
                type: "polygon-area" as const,
                points: draftPolygonPoints,
                lineWidth: POLYGON_LINE_WIDTH_RATIO,
                strokeColor: POLYGON_STROKE_COLOR,
                fillColor: POLYGON_FILL_COLOR,
              },
            ]
          : []),
      ];
      ctx.drawImage(image, 0, 0, width, height);
      drawMarkSet(ctx, mergedMarks, width, height);
      onSave?.(exportCanvas.toDataURL("image/png"));
    } catch {
      onSave?.(imageSrc);
    }
  };

  const canCompletePolygon = tool === "polygon" && draftPolygonPoints.length >= MIN_POLYGON_POINTS;

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-drawing-context={contextKey}
      className={cn(
        "fixed inset-0 z-[2000] flex flex-col bg-black/70 text-white transition-transform duration-300 ease-out",
        active ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/60 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs"
          >
            {LABEL_PREV}
          </button>
          <span className="shrink-0 whitespace-nowrap text-sm font-bold leading-none sm:text-lg">{LABEL_TITLE}</span>
        </div>
        <div className="flex max-w-[64vw] items-center gap-1 overflow-x-auto overscroll-contain pr-0.5 sm:max-w-none sm:gap-2 sm:overflow-visible sm:pr-0">
          <button
            type="button"
            onClick={() => selectTool("brush")}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-bold sm:text-xs",
              tool === "brush" ? "bg-primary text-primary-foreground" : "bg-white/10",
            )}
          >
            {LABEL_TOOL_BRUSH}
          </button>
          <button
            type="button"
            onClick={() => selectTool("polygon")}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-bold sm:text-xs",
              tool === "polygon" ? "bg-primary text-primary-foreground" : "bg-white/10",
            )}
          >
            {LABEL_TOOL_POLYGON}
          </button>
          {tool === "polygon" && draftPolygonPoints.length > 0 && (
            <>
              <button
                type="button"
                onClick={cancelDraftPolygon}
                className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs"
              >
                {LABEL_CANCEL}
              </button>
              <button
                type="button"
                onClick={finishPolygon}
                disabled={!canCompletePolygon}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[11px] font-bold sm:text-xs",
                  canCompletePolygon
                    ? "bg-emerald-500 text-white"
                    : "cursor-not-allowed bg-white/10 text-white/50",
                )}
              >
                {LABEL_COMPLETE}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={clearMarks}
            className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs"
          >
            {LABEL_CLEAR}
          </button>
          {onDeleteSelected && (
            <button
              type="button"
              onClick={onDeleteSelected}
              className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white/10 px-2 text-[11px] font-bold sm:text-xs"
            >
              {LABEL_DELETE}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 text-[11px] font-bold text-primary-foreground sm:text-xs"
          >
            {LABEL_SAVE}
          </button>
        </div>
      </div>

      <div ref={viewportRef} className="relative flex-1 overflow-hidden bg-black">
        {tool === "polygon" && (
          <div className="absolute left-3 top-3 z-10 rounded-lg bg-black/55 px-3 py-2 text-[11px] font-semibold text-white/90 sm:text-xs">
            꼭짓점을 순서대로 찍고 더블클릭 또는 완료로 영역을 닫습니다.
          </div>
        )}
        {!imageSrc && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/70">
            {ALT_DRAWING}을 불러올 수 없습니다.
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onDoubleClick={handleCanvasDoubleClick}
        />
      </div>
    </div>
  );
}
