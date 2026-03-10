import React, { useState, useCallback } from "react";
import type { PhotoItem, SheetPage } from "../types";
import PhotoCell from "./PhotoCell";

type MoveDirection = "left" | "right" | "up" | "down";

interface A4PageProps {
  page: SheetPage;
  pageIndex: number;
  siteName: string;
  onUpdatePage: (page: SheetPage) => void;
  onMultiUpload: (files: File[], startIndex: number) => void;
  activeMasterName: string;
  onApplyActiveMasterToCell: (cellIndex: number) => void;
  selectedCellIndex: number;
  onSelectCell: (cellIndex: number) => void;
  isExporting?: boolean;
}

const A4Page = React.forwardRef<HTMLDivElement, A4PageProps>(
  (
    {
      page,
      pageIndex,
      siteName,
      onUpdatePage,
      onMultiUpload,
      activeMasterName,
      onApplyActiveMasterToCell,
      selectedCellIndex,
      onSelectCell,
      isExporting = false,
    },
    ref
  ) => {
    const [dragSourceId, setDragSourceId] = useState<string | null>(null);

    const updateCell = useCallback(
      (cellIndex: number, photo: PhotoItem) => {
        const newCells = [...page.cells] as SheetPage["cells"];
        newCells[cellIndex] = photo;
        onUpdatePage({ ...page, cells: newCells });
      },
      [page, onUpdatePage]
    );

    const handleDragStart = (e: React.DragEvent, photo: PhotoItem) => {
      setDragSourceId(photo.id);
      e.dataTransfer.setData("text/plain", photo.id);
    };

    const handleDrop = useCallback(
      (targetIndex: number) => (e: React.DragEvent) => {
        const sourceId = e.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === page.cells[targetIndex].id) return;
        const sourceIndex = page.cells.findIndex((c) => c.id === sourceId);
        if (sourceIndex === -1) return;
        const newCells = [...page.cells] as SheetPage["cells"];
        const temp = newCells[sourceIndex];
        newCells[sourceIndex] = newCells[targetIndex];
        newCells[targetIndex] = temp;
        onUpdatePage({ ...page, cells: newCells });
        setDragSourceId(null);
      },
      [page, onUpdatePage]
    );

    const moveCellByDirection = useCallback(
      (sourceIndex: number, direction: MoveDirection) => {
        const columns = 2;
        const rows = 3;
        const row = Math.floor(sourceIndex / columns);
        const col = sourceIndex % columns;
        let targetIndex = -1;
        if (direction === "left" && col > 0) targetIndex = sourceIndex - 1;
        if (direction === "right" && col < columns - 1) targetIndex = sourceIndex + 1;
        if (direction === "up" && row > 0) targetIndex = sourceIndex - columns;
        if (direction === "down" && row < rows - 1) targetIndex = sourceIndex + columns;
        if (targetIndex < 0 || targetIndex >= page.cells.length) return;
        const newCells = [...page.cells] as SheetPage["cells"];
        const temp = newCells[sourceIndex];
        newCells[sourceIndex] = newCells[targetIndex];
        newCells[targetIndex] = temp;
        onUpdatePage({ ...page, cells: newCells });
      },
      [onUpdatePage, page]
    );

    return (
      <div
        ref={ref}
        className="bg-card shadow-lg mx-auto flex flex-col a4-print-page border border-border"
        style={{
          width: "100%",
          maxWidth: "794px",
          aspectRatio: "210/297",
          padding: "8px",
        }}
      >
        <div className="ps-sheet-header bg-muted/50 text-foreground flex h-[24px] items-center justify-center px-2 text-sm font-semibold tracking-wide leading-[1.2] border-b border-border" style={{ marginBottom: "4px" }}>
          {siteName} <span className="text-[10px] font-normal opacity-70 ml-2">P.{pageIndex + 1}</span>
        </div>
        <div className="flex-1 grid grid-cols-2 grid-rows-3" style={{ minHeight: 0 }}>
          {page.cells.map((cell, i) => (
            <PhotoCell
              key={cell.id}
              photo={cell}
              cellIndex={i}
              onUpdate={(p) => updateCell(i, p)}
              onDragStart={handleDragStart}
              onDrop={handleDrop(i)}
              onDragOver={(e) => e.preventDefault()}
              onMultiFiles={(files) => onMultiUpload(files, i)}
              onMoveTo={(direction) => moveCellByDirection(i, direction)}
              activeMasterName={activeMasterName}
              onApplyActiveMaster={() => onApplyActiveMasterToCell(i)}
              isSelected={selectedCellIndex === i}
              onSelect={() => onSelectCell(i)}
              isExporting={isExporting}
            />
          ))}
        </div>
      </div>
    );
  }
);

A4Page.displayName = "A4Page";

export default A4Page;
