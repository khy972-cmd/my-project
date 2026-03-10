import React, { useRef } from "react";
import type { InfoRow, RepairTag } from "../types";
import { Minus, Plus } from "lucide-react";

interface InfoTableOverlayProps {
  rows: InfoRow[];
  tag: RepairTag;
  split: number;
  widthRatio: number;
  onUpdateRows: (rows: InfoRow[]) => void;
  onSplitChange: (next: number) => void;
  onWidthChange: (next: number) => void;
}

const MIN_SPLIT = 0.2;
const MAX_SPLIT = 0.8;
const MIN_WIDTH = 0.34;
const MAX_WIDTH = 0.86;

const InfoTableOverlay: React.FC<InfoTableOverlayProps> = ({
  rows,
  tag,
  split,
  widthRatio,
  onUpdateRows,
  onSplitChange,
  onWidthChange,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const updateRow = (index: number, field: "label" | "value", value: string) => {
    onUpdateRows(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateRows([...rows, { label: "", value: "" }]);
  };

  const removeRow = (event: React.MouseEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (rows.length <= 1) return;
    onUpdateRows(rows.filter((_, i) => i !== index));
  };

  const handleResizerPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (clientX: number) => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      if (!rect.width) return;
      const next = (clientX - rect.left) / rect.width;
      onSplitChange(Math.max(MIN_SPLIT, Math.min(MAX_SPLIT, next)));
    };
    move(event.clientX);
    const onPointerMove = (moveEvent: PointerEvent) => move(moveEvent.clientX);
    const onPointerUp = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
  };

  const handleWidthPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const move = (clientX: number) => {
      const parent = rootRef.current?.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (!rect.width) return;
      const next = (clientX - rect.left) / rect.width;
      onWidthChange(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, next)));
    };
    move(event.clientX);
    const onPointerMove = (moveEvent: PointerEvent) => move(moveEvent.clientX);
    const onPointerUp = () => {
      target.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
  };

  const tagLabel = tag === "before" ? "보수전" : tag === "after" ? "보수후" : null;
  const leftWidth = `${Math.round(split * 100)}%`;
  const rightWidth = `${Math.round((1 - split) * 100)}%`;

  return (
    <div
      ref={rootRef}
      className="ps-table-overlay absolute bottom-0 left-0 z-20 box-border text-[11px] text-slate-900"
      style={{
        width: `${Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, widthRatio)) * 100)}%`,
        minWidth: "160px",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="group relative w-full">
        <table className="w-full table-fixed border-collapse border border-slate-500" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
          <colgroup>
            <col style={{ width: leftWidth }} />
            <col style={{ width: rightWidth }} />
          </colgroup>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${index}-${row.label}`}>
                <td className="h-[24px] border border-slate-500 px-1.5 py-1 align-middle font-semibold text-white" style={{ backgroundColor: "rgba(11,40,97,0.92)" }}>
                  <input
                    className="h-[14px] w-full bg-transparent text-[10px] leading-[1.2] text-white placeholder:text-white/70 outline-none"
                    value={row.label}
                    onChange={(e) => updateRow(index, "label", e.target.value)}
                    placeholder="항목"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="relative h-[24px] border border-slate-500 px-1.5 py-1 align-middle" style={{ backgroundColor: "rgba(255,255,255,0.92)" }}>
                  <input
                    className="h-[14px] w-full bg-transparent pr-3 text-[10px] font-semibold leading-[1.2] text-slate-900 outline-none"
                    value={row.value}
                    onChange={(e) => updateRow(index, "value", e.target.value)}
                    placeholder="내용"
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    data-capture-hide="true"
                    onClick={(e) => removeRow(e, index)}
                    className="absolute right-0.5 top-1/2 inline-flex h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded text-red-700/85 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100"
                    aria-label="행 삭제"
                  >
                    <Minus size={9} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          data-capture-hide="true"
          className="absolute top-0 h-full w-[8px] -translate-x-1/2 cursor-col-resize"
          style={{ left: leftWidth }}
          onPointerDown={handleResizerPointerDown}
        >
          <div className="mx-auto h-full w-[2px] bg-[#0B2861]/65" />
        </div>
        <div
          data-capture-hide="true"
          className="absolute right-0 top-0 h-full w-[10px] translate-x-1/2 cursor-ew-resize"
          onPointerDown={handleWidthPointerDown}
        >
          <div className="mx-auto h-full w-[2px] bg-[#0B2861]/55" />
        </div>
        <div data-capture-hide="true" className="pointer-events-none absolute -top-6 left-0 right-0 flex items-center justify-between">
          {tagLabel ? (
            <span className="pointer-events-auto rounded bg-[#0B2861]/85 px-1.5 py-0.5 text-[9px] font-semibold text-white">{tagLabel}</span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={addRow}
            className="pointer-events-auto inline-flex items-center gap-1 rounded bg-[#0B2861]/90 px-1.5 py-0.5 text-[9px] font-semibold text-white hover:bg-[#0A2355]"
          >
            <Plus size={9} />
            행 추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoTableOverlay;
