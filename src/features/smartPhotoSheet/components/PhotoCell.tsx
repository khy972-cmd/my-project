import React, { useCallback, useEffect, useRef, useState } from "react";
import type { InfoRow, PhotoItem, RepairTag } from "../types";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ImagePlus,
  Layers,
  Tag,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import InfoTableOverlay from "./InfoTableOverlay";

type MoveDirection = "left" | "right" | "up" | "down";

interface PhotoCellProps {
  photo: PhotoItem;
  cellIndex: number;
  onUpdate: (photo: PhotoItem) => void;
  onDragStart: (e: React.DragEvent, photo: PhotoItem) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onMultiFiles: (files: File[]) => void;
  onMoveTo: (direction: MoveDirection) => void;
  activeMasterName: string;
  onApplyActiveMaster: () => void;
  isSelected: boolean;
  onSelect: () => void;
  isExporting?: boolean;
}

const TAG_LABELS: Record<string, string> = {
  before: "보수전",
  after: "보수후",
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;

const PhotoCell: React.FC<PhotoCellProps> = ({
  photo,
  cellIndex,
  onUpdate,
  onDragStart,
  onDrop,
  onDragOver,
  onMultiFiles,
  onMoveTo,
  activeMasterName,
  onApplyActiveMaster,
  isSelected,
  onSelect,
  isExporting = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isImageActive, setIsImageActive] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchState = useRef({ isTouching: false, lastX: 0, lastY: 0, lastDist: 0 });

  const revokeIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const openPicker = (event?: React.MouseEvent | React.KeyboardEvent) => {
    event?.stopPropagation();
    fileInputRef.current?.click();
  };

  const applyImageFile = useCallback(
    (file: File) => {
      const nextUrl = URL.createObjectURL(file);
      revokeIfBlob(photo.imageUrl);
      onUpdate({ ...photo, imageUrl: nextUrl, zoom: 1, panX: 0, panY: 0 });
    },
    [onUpdate, photo, revokeIfBlob]
  );

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (files.length > 1) {
        onMultiFiles(Array.from(files));
        return;
      }
      applyImageFile(files[0]);
    },
    [applyImageFile, onMultiFiles]
  );

  const handleRootDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      if (event.dataTransfer.files.length > 0) {
        handleFileSelect(event.dataTransfer.files);
        return;
      }
      onDrop(event);
    },
    [handleFileSelect, onDrop]
  );

  const updateZoom = useCallback(
    (delta: number) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, photo.zoom + delta));
      onUpdate({ ...photo, zoom: nextZoom });
    },
    [onUpdate, photo]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!photo.imageUrl || !isImageActive) return;
      event.preventDefault();
      event.stopPropagation();
      updateZoom(event.deltaY > 0 ? -0.12 : 0.12);
    },
    [isImageActive, photo.imageUrl, updateZoom]
  );

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (photo.imageUrl) setIsImageActive(true);
    if (!photo.imageUrl || event.button !== 0 || photo.zoom <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    setIsPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY, panX: photo.panX, panY: photo.panY };
  };

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning) return;
      event.preventDefault();
      const dx = event.clientX - panStart.current.x;
      const dy = event.clientY - panStart.current.y;
      onUpdate({ ...photo, panX: panStart.current.panX + dx, panY: panStart.current.panY + dy });
    },
    [isPanning, onUpdate, photo]
  );

  const stopPan = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!photo.imageUrl || !isImageActive) return;
      if (event.touches.length === 2) {
        event.preventDefault();
        event.stopPropagation();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        touchState.current.lastDist = Math.sqrt(dx * dx + dy * dy);
        return;
      }
      if (event.touches.length === 1 && photo.zoom > 1) {
        touchState.current.isTouching = true;
        touchState.current.lastX = event.touches[0].clientX;
        touchState.current.lastY = event.touches[0].clientY;
      }
    },
    [isImageActive, photo.imageUrl, photo.zoom]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (!photo.imageUrl || !isImageActive) return;
      if (event.touches.length === 2) {
        event.preventDefault();
        event.stopPropagation();
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchState.current.lastDist > 0) {
          const scale = dist / touchState.current.lastDist;
          const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, photo.zoom * scale));
          onUpdate({ ...photo, zoom: nextZoom });
        }
        touchState.current.lastDist = dist;
        return;
      }
      if (event.touches.length === 1 && touchState.current.isTouching && photo.zoom > 1) {
        event.preventDefault();
        event.stopPropagation();
        const dx = event.touches[0].clientX - touchState.current.lastX;
        const dy = event.touches[0].clientY - touchState.current.lastY;
        onUpdate({ ...photo, panX: photo.panX + dx, panY: photo.panY + dy });
        touchState.current.lastX = event.touches[0].clientX;
        touchState.current.lastY = event.touches[0].clientY;
      }
    },
    [isImageActive, onUpdate, photo]
  );

  const handleTouchEnd = useCallback(() => {
    touchState.current.isTouching = false;
    touchState.current.lastDist = 0;
  }, []);

  useEffect(() => {
    if (!photo.imageUrl && isImageActive) setIsImageActive(false);
  }, [isImageActive, photo.imageUrl]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current) return;
      const target = event.target as Node | null;
      if (target && rootRef.current.contains(target)) return;
      setIsImageActive(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const cycleTag = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const order: RepairTag[] = [null, "before", "after"];
    const idx = order.indexOf(photo.tag);
    const nextTag = order[(idx + 1) % order.length];
    const nextTagLabel = nextTag === "before" ? "보수전" : nextTag === "after" ? "보수후" : "";
    const prevTagLabel = photo.tag === "before" ? "보수전" : photo.tag === "after" ? "보수후" : "";
    const nextRows = photo.infoRows.map((row) => {
      const normalized = row.label.replace(/\s+/g, "");
      const isWorkRow = normalized.includes("작업내용") || normalized.includes("공정") || normalized === "내용";
      if (!isWorkRow) return row;
      const currentValue = (row.value || "").trim();
      if (!currentValue || currentValue === prevTagLabel) return { ...row, value: nextTagLabel };
      return row;
    });
    onUpdate({ ...photo, tag: nextTag, infoRows: nextRows });
  };

  const removeImage = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    revokeIfBlob(photo.imageUrl);
    onUpdate({ ...photo, imageUrl: null, zoom: 1, panX: 0, panY: 0, tag: null });
  };

  const handleStageDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!photo.imageUrl) return;
    onDragStart(event, photo);
  };

  return (
    <div
      ref={rootRef}
      className={`photo-cell relative flex min-h-0 flex-col overflow-hidden bg-card border border-border box-border ${
        isDragOver ? "ring-2 ring-inset ring-primary/50 bg-primary/5" : ""
      }`}
      style={{
        borderLeftWidth: "1px",
        borderTopWidth: "1px",
        borderRightWidth: cellIndex % 2 === 1 ? "1px" : "0px",
        borderBottomWidth: cellIndex >= 4 ? "1px" : "0px",
        boxShadow: isSelected && !isExporting ? "inset 0 0 0 2px #0B2861" : "none",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleRootDrop}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onPointerDownCapture={onSelect}
    >
      <div
        className="relative min-h-0 flex-1 overflow-hidden bg-slate-100"
        style={{
          cursor: photo.imageUrl
            ? photo.zoom > 1 && isImageActive
              ? isPanning
                ? "grabbing"
                : "grab"
              : "default"
            : "pointer",
          outline: isImageActive ? "2px solid rgba(11, 40, 97, 0.55)" : "none",
          outlineOffset: "-2px",
        }}
        onClick={() => (!photo.imageUrl ? openPicker() : null)}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        draggable={!!photo.imageUrl}
        onDragStart={handleStageDragStart}
      >
        {photo.imageUrl ? (
          <>
            <img
              src={photo.imageUrl}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              style={{
                transform: `scale(${photo.zoom}) translate(${photo.panX / photo.zoom}px, ${photo.panY / photo.zoom}px)`,
                transformOrigin: "center center",
              }}
              draggable={false}
            />
            {photo.tag ? (
              <div
                className={`absolute right-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white ${
                  photo.tag === "before" ? "bg-orange-500/90" : "bg-emerald-600/90"
                }`}
              >
                {TAG_LABELS[photo.tag]}
              </div>
            ) : null}
            <div
              data-capture-hide="true"
              className={`absolute left-1 top-1 flex gap-0.5 rounded-md bg-[#0B2861]/85 p-0.5 text-white transition-opacity sm:gap-1 sm:p-1 ${isHovering ? "opacity-100" : "opacity-20"}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={(e) => openPicker(e)} className="rounded p-1 hover:bg-white/15" title="이미지 교체">
                <Upload size={13} />
              </button>
              <button type="button" onClick={() => updateZoom(0.2)} className="rounded p-1 hover:bg-white/15" title="확대">
                <ZoomIn size={13} />
              </button>
              <button type="button" onClick={() => updateZoom(-0.2)} className="rounded p-1 hover:bg-white/15" title="축소">
                <ZoomOut size={13} />
              </button>
              <button type="button" onClick={cycleTag} className="rounded p-1 hover:bg-white/15" title="태그 전환">
                <Tag size={13} />
              </button>
              <button type="button" onClick={removeImage} className="rounded p-1 hover:bg-red-500/50" title="삭제">
                <Trash2 size={13} />
              </button>
            </div>
            {!isImageActive ? (
              <div data-capture-hide="true" className="absolute bottom-[54px] left-1 rounded bg-[#0B2861]/70 px-1.5 py-0.5 text-[8px] font-medium text-white">
                이미지 클릭 후 휠 확대/축소
              </div>
            ) : null}
            <div
              data-capture-hide="true"
              className={`absolute right-1 top-9 flex rounded-md bg-[#0B2861]/85 p-0.5 text-white transition-opacity sm:top-1 ${isHovering ? "opacity-100" : "opacity-20"}`}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button type="button" className="rounded p-1 hover:bg-white/15" title={`현재 마스터(${activeMasterName}) 적용`} onClick={onApplyActiveMaster}>
                <Layers size={12} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-white/15" title="왼쪽 박스로 이동" onClick={() => onMoveTo("left")}>
                <ArrowLeft size={12} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-white/15" title="오른쪽 박스로 이동" onClick={() => onMoveTo("right")}>
                <ArrowRight size={12} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-white/15" title="위 박스로 이동" onClick={() => onMoveTo("up")}>
                <ArrowUp size={12} />
              </button>
              <button type="button" className="rounded p-1 hover:bg-white/15" title="아래 박스로 이동" onClick={() => onMoveTo("down")}>
                <ArrowDown size={12} />
              </button>
            </div>
          </>
        ) : (
          <div data-capture-hide="true" className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500">
            <ImagePlus size={20} strokeWidth={1.7} />
            <span className="text-[9px]">클릭 또는 드래그 업로드</span>
          </div>
        )}
        <InfoTableOverlay
          rows={photo.infoRows}
          tag={photo.tag}
          split={photo.tableSplit}
          widthRatio={photo.tableWidth}
          onUpdateRows={(rows: InfoRow[]) => onUpdate({ ...photo, infoRows: rows, masterLinked: false })}
          onSplitChange={(next) => onUpdate({ ...photo, tableSplit: next })}
          onWidthChange={(next) => onUpdate({ ...photo, tableWidth: next })}
        />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
};

export default PhotoCell;
