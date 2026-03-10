import { useCallback, useRef, useState } from "react";

interface UsePreviewZoomPanOptions {
  open?: boolean;
  defaultScale?: number;
  defaultMinScale?: number;
  defaultMaxScale?: number;
}

export function usePreviewZoomPan(options?: UsePreviewZoomPanOptions) {
  const defaultScale = options?.defaultScale ?? 1;
  const minScale = options?.defaultMinScale ?? 0.5;
  const maxScale = options?.defaultMaxScale ?? 4;
  const [scale, setScale] = useState(defaultScale);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const touchRef = useRef<{ x: number; y: number; pinchDistance?: number; pinchScale?: number } | null>(null);

  const clamp = useCallback((value: number) => Math.min(maxScale, Math.max(minScale, value)), [maxScale, minScale]);

  const reset = useCallback((nextScale?: number) => {
    setScale(clamp(nextScale ?? defaultScale));
    setPanX(0);
    setPanY(0);
  }, [clamp, defaultScale]);

  const zoomIn = useCallback(() => {
    setScale((prev) => clamp(prev + 0.1));
  }, [clamp]);

  const zoomOut = useCallback(() => {
    setScale((prev) => clamp(prev - 0.1));
  }, [clamp]);

  const onWheel = useCallback((e: { preventDefault: () => void; deltaY: number }) => {
    e.preventDefault();
    setScale((prev) => clamp(prev + (e.deltaY < 0 ? 0.1 : -0.1)));
  }, [clamp]);

  const onTouchStart = useCallback((e: { touches: { clientX: number; clientY: number }[] }) => {
    if (e.touches.length >= 2) {
      const [a, b] = e.touches;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      touchRef.current = { x: 0, y: 0, pinchDistance: Math.hypot(dx, dy), pinchScale: scale };
      return;
    }
    if (e.touches.length === 1) {
      touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const onTouchMove = useCallback((e: { preventDefault: () => void; touches: { clientX: number; clientY: number }[] }) => {
    if (!touchRef.current) return;

    if (e.touches.length >= 2 && touchRef.current.pinchDistance && touchRef.current.pinchScale) {
      const [a, b] = e.touches;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      const distance = Math.hypot(dx, dy);
      setScale(clamp((touchRef.current.pinchScale * distance) / touchRef.current.pinchDistance));
      return;
    }

    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchRef.current.x;
    const dy = touch.clientY - touchRef.current.y;
    touchRef.current = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  }, [clamp]);

  const onTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  return {
    scale,
    panX,
    panY,
    minScale,
    maxScale,
    containerRef,
    contentRef,
    setScale,
    setPanX,
    setPanY,
    reset,
    zoomIn,
    zoomOut,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
