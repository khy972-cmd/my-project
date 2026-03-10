/**
 * 사진대지 생성기 (smart-photo-sheet) 통합 페이지
 * Admin/매핑에서 진입 시 동일 기능을 100% 제공합니다.
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Minus, Plus } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createId } from "./createId";
import {
  createEmptyPage,
  type SheetPage,
  type InfoRow,
  type InfoTemplate,
  type MasterPreset,
  DEFAULT_INFO_ROWS,
  DEFAULT_TEMPLATES,
} from "./types";
import A4Page from "./components/A4Page";
import SheetToolbar from "./components/SheetToolbar";

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
const SHEET_PADDING_PX = 8;
const HEADER_HEIGHT_PX = 24;
const HEADER_MARGIN_BOTTOM_PX = 4;
const GRID_COLUMNS = 2;
const GRID_ROWS = 3;
const TABLE_ROW_HEIGHT_PX = 24;

const cloneRows = (rows: InfoRow[]) => rows.map((r) => ({ ...r }));
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface HeaderMetric {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableMetric {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TableStylePreset {
  id: string;
  name: string;
  rows: InfoRow[];
  split: number;
  width: number;
}

const makeMasterPreset = (name: string, rows: InfoRow[]): MasterPreset => ({
  id: createId(),
  name,
  rows: cloneRows(rows),
});

export interface SmartPhotoSheetPageProps {
  /** 초기 현장명 (URL 쿼리 또는 Admin에서 전달) */
  initialSiteName?: string;
  /** 닫기 콜백 (모달/드로어에서 사용 시) */
  onClose?: () => void;
}

export default function SmartPhotoSheetPage({ initialSiteName: initialSiteNameProp, onClose }: SmartPhotoSheetPageProps) {
  const [searchParams] = useSearchParams();
  const siteNameFromUrl = searchParams.get("siteName") || "";
  const initialSiteName = initialSiteNameProp ?? (siteNameFromUrl || "현장명을 입력하세요");
  const [siteName, setSiteName] = useState(initialSiteName);
  const [pages, setPages] = useState<SheetPage[]>([createEmptyPage()]);
  const [currentPage, setCurrentPage] = useState(0);
  const [templates] = useState<InfoTemplate[]>(DEFAULT_TEMPLATES);
  const [masterPresets, setMasterPresets] = useState<MasterPreset[]>(() => [makeMasterPreset("기본 마스터", DEFAULT_INFO_ROWS)]);
  const [activeMasterId, setActiveMasterId] = useState("");
  const [selectedCellIndex, setSelectedCellIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [tableStyles, setTableStyles] = useState<TableStylePreset[]>(() => [
    { id: createId(), name: "스타일1", rows: cloneRows(DEFAULT_TEMPLATES[0]?.rows ?? DEFAULT_INFO_ROWS), split: 0.38, width: 0.52 },
    { id: createId(), name: "스타일2", rows: cloneRows(DEFAULT_TEMPLATES[1]?.rows ?? DEFAULT_INFO_ROWS), split: 0.42, width: 0.56 },
  ]);
  const [activeStyleId, setActiveStyleId] = useState("");
  const [isStyleApplyMode, setIsStyleApplyMode] = useState(false);

  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (initialSiteName) setSiteName((prev) => initialSiteName || prev);
  }, [initialSiteName]);

  useEffect(() => {
    if (currentPage > pages.length - 1) setCurrentPage(Math.max(0, pages.length - 1));
  }, [currentPage, pages.length]);

  useEffect(() => {
    if (!activeMasterId && masterPresets.length > 0) setActiveMasterId(masterPresets[0].id);
    if (activeMasterId && !masterPresets.some((p) => p.id === activeMasterId)) setActiveMasterId(masterPresets[0]?.id || "");
  }, [activeMasterId, masterPresets]);

  useEffect(() => {
    if (!activeStyleId && tableStyles.length > 0) setActiveStyleId(tableStyles[0].id);
    if (activeStyleId && !tableStyles.some((s) => s.id === activeStyleId)) setActiveStyleId(tableStyles[0]?.id || "");
  }, [activeStyleId, tableStyles]);

  const activeMaster = useMemo(() => masterPresets.find((p) => p.id === activeMasterId) || masterPresets[0] || null, [activeMasterId, masterPresets]);
  const activeStyle = useMemo(() => tableStyles.find((s) => s.id === activeStyleId) || tableStyles[0] || null, [activeStyleId, tableStyles]);
  const activeMasterRows = activeMaster?.rows ?? [];
  const currentSheet = pages[currentPage] ?? pages[0];
  const selectedCell = currentSheet?.cells[selectedCellIndex] ?? null;

  const activeLinkedCellCount = useMemo(() => {
    if (!activeMaster) return 0;
    let count = 0;
    pages.forEach((page) => {
      page.cells.forEach((cell) => {
        if (cell.masterLinked && cell.masterPresetId === activeMaster.id) count += 1;
      });
    });
    return count;
  }, [activeMaster, pages]);

  const waitForDomPaint = useCallback(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))), []);
  const waitForImages = useCallback(async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          })
      )
    );
  }, []);

  const materializeInputsForCapture = useCallback((root: HTMLElement) => {
    root.querySelectorAll<HTMLElement>('[data-capture-hide="true"]').forEach((el) => {
      el.style.display = "none";
    });
    const toStaticText = (node: HTMLInputElement | HTMLTextAreaElement) => {
      const view = root.ownerDocument?.defaultView ?? window;
      const computed = view.getComputedStyle(node);
      const fontSize = Number.parseFloat(computed.fontSize || "12") || 12;
      const lineHeight = Number.parseFloat(computed.lineHeight || "") || Math.round(fontSize * 1.35 * 100) / 100;
      const computedHeight = Number.parseFloat(computed.height || "");
      const nodeHeight = Number.isFinite(computedHeight) && computedHeight > 0 ? computedHeight : lineHeight + 4;
      const mirror = root.ownerDocument!.createElement("div");
      mirror.textContent = (node as HTMLInputElement).value || (node as HTMLInputElement).placeholder || "";
      mirror.style.cssText = `width:100%;height:${nodeHeight}px;min-height:${nodeHeight}px;padding-left:${computed.paddingLeft};padding-right:${computed.paddingRight};padding-top:0;padding-bottom:0;box-sizing:border-box;font-family:${computed.fontFamily};font-size:${fontSize}px;font-weight:${computed.fontWeight};letter-spacing:${computed.letterSpacing};line-height:1.2;color:${computed.color || "#111827"};background:transparent;border:0;display:flex;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:${computed.textAlign};`;
      node.replaceWith(mirror);
    };
    root.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      const type = input.type?.toLowerCase();
      if (!type || type === "text" || type === "search" || type === "email" || type === "number") toStaticText(input);
    });
    root.querySelectorAll<HTMLTextAreaElement>("textarea").forEach((textarea) => toStaticText(textarea));
  }, []);

  const isCanvasLikelyBlank = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return true;
    const step = 16;
    let nonWhiteCount = 0;
    let sampleCount = 0;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        sampleCount += 1;
        if (pixel[3] > 8 && (pixel[0] < 245 || pixel[1] < 245 || pixel[2] < 245)) nonWhiteCount += 1;
      }
    }
    return nonWhiteCount < Math.max(12, sampleCount * 0.0005);
  }, []);

  const capturePageCanvas = useCallback(
    async (sourceEl: HTMLDivElement, scale: number) => {
      const captureToken = createId();
      sourceEl.dataset.captureToken = captureToken;
      try {
        return await html2canvas(sourceEl, {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          scrollX: 0,
          scrollY: 0,
          foreignObjectRendering: false,
          ignoreElements: (el) =>
            el instanceof HTMLElement && (el.dataset.captureHide === "true" || el.classList.contains("ps-table-overlay")),
          onclone: (clonedDoc) => {
            const cloneRoot = clonedDoc.querySelector<HTMLElement>(`[data-capture-token="${captureToken}"]`);
            if (!cloneRoot) return;
            cloneRoot.classList.add("ps-capture-mode");
            cloneRoot.style.width = `${A4_WIDTH_PX}px`;
            cloneRoot.style.maxWidth = `${A4_WIDTH_PX}px`;
            cloneRoot.style.height = `${A4_HEIGHT_PX}px`;
            cloneRoot.style.aspectRatio = "210 / 297";
            cloneRoot.style.margin = "0";
            cloneRoot.style.transform = "none";
            materializeInputsForCapture(cloneRoot);
            cloneRoot.querySelectorAll<HTMLElement>(".ps-sheet-header").forEach((header) => {
              header.style.color = "transparent";
              header.querySelectorAll<HTMLElement>("span").forEach((child) => {
                child.style.color = "transparent";
              });
            });
          },
        });
      } finally {
        delete sourceEl.dataset.captureToken;
      }
    },
    [materializeInputsForCapture]
  );

  const getHeaderMetric = useCallback(
    (): HeaderMetric => ({
      x: SHEET_PADDING_PX,
      y: SHEET_PADDING_PX,
      width: A4_WIDTH_PX - SHEET_PADDING_PX * 2,
      height: HEADER_HEIGHT_PX,
    }),
    []
  );

  const getTableMetric = useCallback((cellIndex: number, rowCount: number, widthRatio: number): TableMetric => {
    const gridTop = SHEET_PADDING_PX + HEADER_HEIGHT_PX + HEADER_MARGIN_BOTTOM_PX;
    const gridWidth = A4_WIDTH_PX - SHEET_PADDING_PX * 2;
    const gridHeight = A4_HEIGHT_PX - SHEET_PADDING_PX * 2 - HEADER_HEIGHT_PX - HEADER_MARGIN_BOTTOM_PX;
    const cellWidth = gridWidth / GRID_COLUMNS;
    const cellHeight = gridHeight / GRID_ROWS;
    const col = cellIndex % GRID_COLUMNS;
    const row = Math.floor(cellIndex / GRID_COLUMNS);
    const clampedWidthRatio = Math.max(0.34, Math.min(0.86, widthRatio || 0.52));
    const tableWidth = Math.round(cellWidth * clampedWidthRatio);
    const rawHeight = Math.max(TABLE_ROW_HEIGHT_PX, rowCount * TABLE_ROW_HEIGHT_PX);
    const tableHeight = Math.min(Math.round(cellHeight), rawHeight);
    const x = Math.round(SHEET_PADDING_PX + col * cellWidth);
    const cellTop = gridTop + row * cellHeight;
    const y = Math.round(cellTop + cellHeight - tableHeight);
    return { x, y, width: tableWidth, height: tableHeight };
  }, []);

  const createHeaderSnapshotCanvas = useCallback((title: string, pageNum: number, widthPx: number, heightPx: number) => {
    const width = Math.max(120, Math.round(widthPx));
    const height = Math.max(20, Math.round(heightPx));
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.font = '600 14px "Noto Sans KR", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(title || "현장명을 입력하세요", width / 2, height / 2);
    ctx.font = '400 10px "Noto Sans KR", sans-serif';
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(`P.${pageNum}`, width - 6, height / 2);
    return canvas;
  }, []);

  const createTableSnapshotCanvas = useCallback((rows: InfoRow[], split: number, widthPx: number, heightPx: number) => {
    const width = Math.max(80, Math.round(widthPx));
    const height = Math.max(40, Math.round(heightPx));
    const rowCount = Math.max(1, rows.length);
    const leftRatio = Math.max(0.2, Math.min(0.8, split));
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.scale(2, 2);
    const leftWidth = Math.max(26, Math.round(width * leftRatio));
    const drawRows = rows.length > 0 ? rows : [{ label: "항목", value: "" }];
    const fitText = (text: string, maxW: number) => {
      const raw = text ?? "";
      if (ctx.measureText(raw).width <= maxW) return raw;
      let cut = raw;
      while (cut.length > 0 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
      return cut ? `${cut}…` : "";
    };
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    drawRows.forEach((row, index) => {
      const y0 = Math.round((index * height) / rowCount);
      const y1 = Math.round(((index + 1) * height) / rowCount);
      const rowHeight = Math.max(1, y1 - y0);
      const centerY = y0 + rowHeight / 2;
      ctx.fillStyle = "rgba(11, 40, 97, 0.9)";
      ctx.fillRect(1, y0 + 1, Math.max(1, leftWidth - 2), Math.max(1, rowHeight - 2));
      ctx.fillStyle = "#ffffff";
      ctx.font = '600 10px "Noto Sans KR", sans-serif';
      ctx.textBaseline = "middle";
      ctx.fillText(fitText(row.label || "", Math.max(8, leftWidth - 8)), 4, centerY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(leftWidth + 1, y0 + 1, Math.max(1, width - leftWidth - 2), Math.max(1, rowHeight - 2));
      ctx.fillStyle = "#0f172a";
      ctx.font = '600 10px "Noto Sans KR", sans-serif';
      ctx.fillText(fitText(row.value || "", Math.max(8, width - leftWidth - 10)), leftWidth + 4, centerY);
    });
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(0.5, 0.5, width - 1, height - 1);
    ctx.moveTo(leftWidth + 0.5, 0.5);
    ctx.lineTo(leftWidth + 0.5, height - 0.5);
    for (let i = 1; i < rowCount; i += 1) {
      const y = Math.round((i * height) / rowCount) + 0.5;
      ctx.moveTo(0.5, y);
      ctx.lineTo(width - 0.5, y);
    }
    ctx.stroke();
    return canvas;
  }, []);

  const setPageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) pageRefs.current.set(id, el);
    else pageRefs.current.delete(id);
  }, []);

  const updatePage = useCallback((updatedPage: SheetPage) => {
    setPages((prev) => prev.map((p) => (p.id === updatedPage.id ? updatedPage : p)));
  }, []);

  const handleMultiUpload = useCallback(
    (files: File[], startIndex: number) => {
      setPages((prev) => {
        const nextPages = [...prev];
        let pageIndex = currentPage;
        let cellIndex = startIndex;
        files.forEach((file) => {
          const url = URL.createObjectURL(file);
          if (cellIndex >= 6) {
            nextPages.push(createEmptyPage());
            pageIndex = nextPages.length - 1;
            cellIndex = 0;
          }
          const targetPage = nextPages[pageIndex];
          const nextCells = [...targetPage.cells] as SheetPage["cells"];
          nextCells[cellIndex] = { ...nextCells[cellIndex], imageUrl: url };
          nextPages[pageIndex] = { ...targetPage, cells: nextCells };
          cellIndex += 1;
        });
        return nextPages;
      });
    },
    [currentPage]
  );

  const addPage = useCallback(() => {
    setPages((prev) => {
      const next = [...prev, createEmptyPage()];
      setCurrentPage(next.length - 1);
      setSelectedCellIndex(0);
      return next;
    });
  }, []);

  const deletePage = useCallback(() => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== currentPage));
    setCurrentPage((prev) => Math.max(0, Math.min(prev, pages.length - 2)));
    setSelectedCellIndex(0);
  }, [currentPage, pages.length]);

  const syncLinkedCellsForMaster = useCallback((masterId: string, rows: InfoRow[]) => {
    const syncedRows = cloneRows(rows);
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        cells: page.cells.map((cell) =>
          cell.masterLinked && cell.masterPresetId === masterId ? { ...cell, infoRows: cloneRows(syncedRows) } : cell
        ) as SheetPage["cells"],
      }))
    );
  }, []);

  const updateActiveMasterRows = useCallback(
    (nextRows: InfoRow[]) => {
      if (!activeMaster) return;
      const normalizedRows = cloneRows(nextRows);
      setMasterPresets((prev) =>
        prev.map((preset) => (preset.id === activeMaster.id ? { ...preset, rows: cloneRows(normalizedRows) } : preset))
      );
      syncLinkedCellsForMaster(activeMaster.id, normalizedRows);
    },
    [activeMaster, syncLinkedCellsForMaster]
  );

  const applyTemplate = useCallback((template: InfoTemplate) => updateActiveMasterRows(template.rows), [updateActiveMasterRows]);
  const normalizeLabel = useCallback((label: string) => label.replace(/\s+/g, ""), []);

  const getMappedMasterValue = useCallback(
    (keys: string[]) => {
      if (!activeMaster) return "";
      const idx = activeMaster.rows.findIndex((row) => keys.some((key) => normalizeLabel(row.label).includes(key)));
      return idx >= 0 ? activeMaster.rows[idx].value : "";
    },
    [activeMaster, normalizeLabel]
  );

  const setMappedMasterValue = useCallback(
    (keys: string[], label: string, value: string) => {
      if (!activeMaster) return;
      const nextRows = cloneRows(activeMaster.rows);
      const idx = nextRows.findIndex((row) => keys.some((key) => normalizeLabel(row.label).includes(key)));
      if (idx >= 0) nextRows[idx] = { ...nextRows[idx], label, value };
      else nextRows.unshift({ label, value });
      updateActiveMasterRows(nextRows);
    },
    [activeMaster, normalizeLabel, updateActiveMasterRows]
  );

  const updateMasterRow = useCallback(
    (index: number, field: "label" | "value", value: string) => {
      if (!activeMaster) return;
      const nextRows = activeMaster.rows.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      updateActiveMasterRows(nextRows);
    },
    [activeMaster, updateActiveMasterRows]
  );

  const addMasterRow = useCallback(() => {
    if (!activeMaster) return;
    updateActiveMasterRows([...activeMaster.rows, { label: "", value: "" }]);
  }, [activeMaster, updateActiveMasterRows]);

  const removeMasterRow = useCallback(
    (index: number) => {
      if (!activeMaster || activeMaster.rows.length <= 1) return;
      updateActiveMasterRows(activeMaster.rows.filter((_, i) => i !== index));
    },
    [activeMaster, updateActiveMasterRows]
  );

  const saveSelectedCellToMaster = useCallback(() => {
    if (!activeMaster || !selectedCell) return;
    const nextRows = cloneRows(selectedCell.infoRows);
    setMasterPresets((prev) =>
      prev.map((preset) => (preset.id === activeMaster.id ? { ...preset, rows: cloneRows(nextRows) } : preset))
    );
    syncLinkedCellsForMaster(activeMaster.id, nextRows);
    setPages((prev) =>
      prev.map((page, pageIndex) =>
        pageIndex !== currentPage
          ? page
          : {
              ...page,
              cells: page.cells.map((cell, cellIndex) =>
                cellIndex === selectedCellIndex ? { ...cell, masterPresetId: activeMaster.id, masterLinked: true } : cell
              ) as SheetPage["cells"],
            }
      )
    );
  }, [activeMaster, currentPage, selectedCell, selectedCellIndex, syncLinkedCellsForMaster]);

  const syncMasterToCurrentPage = useCallback(() => {
    if (!activeMaster) return;
    const syncedRows = cloneRows(activeMaster.rows);
    setPages((prev) =>
      prev.map((page, index) =>
        index !== currentPage
          ? page
          : {
              ...page,
              cells: page.cells.map((cell) => ({
                ...cell,
                infoRows: cloneRows(syncedRows),
                masterPresetId: activeMaster.id,
                masterLinked: true,
              })) as SheetPage["cells"],
            }
      )
    );
  }, [activeMaster, currentPage]);

  const syncMasterToAllPages = useCallback(() => {
    if (!activeMaster) return;
    const syncedRows = cloneRows(activeMaster.rows);
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        cells: page.cells.map((cell) => ({
          ...cell,
          infoRows: cloneRows(syncedRows),
          masterPresetId: activeMaster.id,
          masterLinked: true,
        })) as SheetPage["cells"],
      }))
    );
  }, [activeMaster]);

  const applyActiveMasterToCell = useCallback(
    (cellIndex: number) => {
      if (!activeMaster) return;
      const syncedRows = cloneRows(activeMaster.rows);
      setPages((prev) =>
        prev.map((page, index) =>
          index !== currentPage
            ? page
            : {
                ...page,
                cells: page.cells.map((cell, i) =>
                  i === cellIndex
                    ? { ...cell, infoRows: cloneRows(syncedRows), masterPresetId: activeMaster.id, masterLinked: true }
                    : cell
                ) as SheetPage["cells"],
              }
        )
      );
    },
    [activeMaster, currentPage]
  );

  const applyStyleToCell = useCallback(
    (cellIndex: number, style: TableStylePreset) => {
      setPages((prev) =>
        prev.map((page, index) =>
          index !== currentPage
            ? page
            : {
                ...page,
                cells: page.cells.map((cell, cIndex) =>
                  cIndex === cellIndex
                    ? { ...cell, infoRows: cloneRows(style.rows), tableSplit: style.split, tableWidth: style.width, masterLinked: false }
                    : cell
                ) as SheetPage["cells"],
              }
        )
      );
    },
    [currentPage]
  );

  const saveSelectedCellAsStyle = useCallback(() => {
    if (!selectedCell) return;
    const nextStyle: TableStylePreset = {
      id: createId(),
      name: `스타일${tableStyles.length + 1}`,
      rows: cloneRows(selectedCell.infoRows),
      split: selectedCell.tableSplit,
      width: selectedCell.tableWidth,
    };
    setTableStyles((prev) => [...prev, nextStyle]);
    setActiveStyleId(nextStyle.id);
  }, [selectedCell, tableStyles.length]);

  const overwriteActiveStyleFromSelectedCell = useCallback(() => {
    if (!selectedCell || !activeStyle) return;
    setTableStyles((prev) =>
      prev.map((style) =>
        style.id === activeStyle.id
          ? { ...style, rows: cloneRows(selectedCell.infoRows), split: selectedCell.tableSplit, width: selectedCell.tableWidth }
          : style
      )
    );
  }, [activeStyle, selectedCell]);

  const applyActiveStyleToSelectedCell = useCallback(() => {
    if (!activeStyle) return;
    applyStyleToCell(selectedCellIndex, activeStyle);
  }, [activeStyle, applyStyleToCell, selectedCellIndex]);

  const handleSelectCell = useCallback(
    (cellIndex: number) => {
      setSelectedCellIndex(cellIndex);
      if (isStyleApplyMode && activeStyle) applyStyleToCell(cellIndex, activeStyle);
    },
    [activeStyle, applyStyleToCell, isStyleApplyMode]
  );

  const exportPdf = useCallback(async () => {
    if (isExporting || pages.length === 0) return;
    setIsExporting(true);
    const savedPage = currentPage;
    try {
      const fontFaceSet = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts;
      if (fontFaceSet?.ready) await fontFaceSet.ready;

      const capturedPages: Array<{ canvas: HTMLCanvasElement; sheet: SheetPage; pageNumber: number }> = [];

      for (let i = 0; i < pages.length; i += 1) {
        setCurrentPage(i);
        await waitForDomPaint();
        await delay(80);

        let sourceEl = pageRefs.current.get(pages[i].id);
        if (!sourceEl) {
          for (let retry = 0; retry < 10; retry += 1) {
            await delay(50);
            sourceEl = pageRefs.current.get(pages[i].id);
            if (sourceEl) break;
          }
        }
        if (!sourceEl) continue;

        await waitForImages(sourceEl);

        let canvas = await capturePageCanvas(sourceEl, 2);
        if (isCanvasLikelyBlank(canvas)) canvas = await capturePageCanvas(sourceEl, 1.75);
        if (isCanvasLikelyBlank(canvas)) canvas = await capturePageCanvas(sourceEl, 1.5);

        if (!isCanvasLikelyBlank(canvas)) {
          capturedPages.push({ canvas, sheet: pages[i], pageNumber: i + 1 });
        }
      }

      if (capturedPages.length === 0) throw new Error("PDF로 저장할 페이지를 캡처하지 못했습니다.");

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const mmPerPxX = 210 / A4_WIDTH_PX;
      const mmPerPxY = 297 / A4_HEIGHT_PX;
      const headerMetric = getHeaderMetric();

      capturedPages.forEach((entry, index) => {
        if (index > 0) pdf.addPage("a4", "portrait");
        pdf.addImage(entry.canvas, "PNG", 0, 0, 210, 297, undefined, "FAST");

        const headerCanvas = createHeaderSnapshotCanvas(
          siteName || "현장명을 입력하세요",
          entry.pageNumber,
          headerMetric.width,
          headerMetric.height
        );
        if (headerCanvas) {
          pdf.addImage(
            headerCanvas,
            "PNG",
            headerMetric.x * mmPerPxX,
            headerMetric.y * mmPerPxY,
            headerMetric.width * mmPerPxX,
            headerMetric.height * mmPerPxY,
            undefined,
            "FAST"
          );
        }

        entry.sheet.cells.forEach((cell, cellIndex) => {
          const metric = getTableMetric(cellIndex, Math.max(1, cell.infoRows.length), cell.tableWidth);
          const tableCanvas = createTableSnapshotCanvas(cell.infoRows, cell.tableSplit, metric.width, metric.height);
          if (!tableCanvas) return;
          pdf.addImage(
            tableCanvas,
            "PNG",
            metric.x * mmPerPxX,
            metric.y * mmPerPxY,
            metric.width * mmPerPxX,
            metric.height * mmPerPxY,
            undefined,
            "FAST"
          );
        });
      });

      pdf.save(`${siteName || "사진대지"}_사진대지.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setCurrentPage(savedPage);
      setIsExporting(false);
    }
  }, [
    capturePageCanvas,
    createHeaderSnapshotCanvas,
    createTableSnapshotCanvas,
    currentPage,
    getHeaderMetric,
    getTableMetric,
    isCanvasLikelyBlank,
    isExporting,
    pages,
    siteName,
    waitForDomPaint,
    waitForImages,
  ]);

  if (!currentSheet) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SheetToolbar
        siteName={siteName}
        onSiteNameChange={setSiteName}
        onAddPage={addPage}
        onDeletePage={deletePage}
        pageCount={pages.length}
        currentPage={currentPage}
        onSelectPage={(index) => {
          setCurrentPage(index);
          setSelectedCellIndex(0);
        }}
        templates={templates}
        onApplyTemplate={applyTemplate}
        onExportPdf={exportPdf}
        isExporting={isExporting}
      />

      <section className="border-b border-border bg-card/95 px-3 py-2 shadow-sm">
        <div className="mx-auto max-w-[920px] rounded border border-border bg-card px-3 py-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <strong className="text-[12px] font-semibold text-primary">간편 매핑/스타일</strong>
              <p className="text-[11px] text-muted-foreground">부재명, 작업내용(공정) 입력 후 선택한 스타일을 셀 클릭만으로 바로 적용합니다.</p>
            </div>
            <span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">선택 셀 {selectedCellIndex + 1}번</span>
          </div>

          <div className="mb-2 grid max-w-[620px] gap-1 sm:grid-cols-2">
            <input
              className="rounded border border-input px-2 py-1 text-[12px] outline-none focus:border-primary"
              value={getMappedMasterValue(["부재명"])}
              onChange={(e) => setMappedMasterValue(["부재명"], "부재명", e.target.value)}
              placeholder="부재명"
            />
            <input
              className="rounded border border-input px-2 py-1 text-[12px] outline-none focus:border-primary"
              value={getMappedMasterValue(["작업내용", "내용", "공정"])}
              onChange={(e) => setMappedMasterValue(["작업내용", "내용", "공정"], "작업내용(공정)", e.target.value)}
              placeholder="작업내용(공정)"
            />
          </div>

          <div className="mb-2 grid gap-1 sm:grid-cols-[170px_auto_auto]">
            <select
              className="rounded border border-input pl-2 pr-8 py-1 text-[12px] outline-none focus:border-primary"
              value={activeStyle?.id ?? ""}
              onChange={(e) => setActiveStyleId(e.target.value)}
            >
              {tableStyles.map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
            <button type="button" onClick={applyActiveStyleToSelectedCell} className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
              선택 셀 적용
            </button>
            <button
              type="button"
              onClick={() => setIsStyleApplyMode((prev) => !prev)}
              className={`rounded px-2 py-1 text-[11px] font-semibold ${isStyleApplyMode ? "bg-primary text-primary-foreground" : "border border-primary/40 text-primary hover:bg-primary/5"}`}
            >
              클릭 즉시 적용 {isStyleApplyMode ? "ON" : "OFF"}
            </button>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-1">
            <button type="button" onClick={saveSelectedCellAsStyle} className="rounded border border-primary/40 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/5">
              선택 셀로 새 스타일 저장
            </button>
            <button type="button" onClick={overwriteActiveStyleFromSelectedCell} disabled={!activeStyle} className="rounded border border-input px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-50">
              현재 스타일 덮어쓰기
            </button>
            <span className="text-[11px] text-muted-foreground">클릭 즉시 적용이 ON이면 이미지 박스를 누르는 즉시 동일 스타일이 적용됩니다.</span>
          </div>

          <details className="max-w-[560px] rounded border border-border bg-muted/40 px-2 py-1">
            <summary className="cursor-pointer text-[11px] font-semibold text-foreground">고급 기능(마스터/전체 적용/행 편집)</summary>
            <div className="mt-2 space-y-2">
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={saveSelectedCellToMaster} className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90">
                  M 저장(선택 셀)
                </button>
                <button type="button" onClick={syncMasterToCurrentPage} className="rounded border border-input px-2 py-1 text-[11px] font-semibold hover:bg-muted">
                  M 적용(현재 페이지)
                </button>
                <button type="button" onClick={syncMasterToAllPages} className="rounded border border-input px-2 py-1 text-[11px] font-semibold hover:bg-muted">
                  M 적용(전체)
                </button>
                <button type="button" onClick={addMasterRow} className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-[11px] font-semibold hover:bg-muted">
                  <Plus size={12} /> 행 추가
                </button>
                <span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">연결 {activeLinkedCellCount}개</span>
              </div>
              {activeMasterRows.map((row, idx) => (
                <div key={`${activeMaster?.id ?? "master"}-${idx}`} className="grid w-full max-w-full grid-cols-[40%_minmax(0,1fr)_32px] items-center gap-1 sm:grid-cols-[42%_minmax(0,1fr)_32px]">
                  <input
                    className="min-w-0 w-full rounded border border-input px-2 py-1 text-[12px] outline-none focus:border-primary"
                    value={row.label}
                    onChange={(e) => updateMasterRow(idx, "label", e.target.value)}
                    placeholder="항목명"
                  />
                  <input
                    className="min-w-0 w-full rounded border border-input px-2 py-1 text-[12px] outline-none focus:border-primary"
                    value={row.value}
                    onChange={(e) => updateMasterRow(idx, "value", e.target.value)}
                    placeholder="내용"
                  />
                  <button type="button" onClick={() => removeMasterRow(idx)} className="inline-flex h-8 w-8 items-center justify-center rounded border border-input text-muted-foreground hover:bg-muted" aria-label="행 삭제">
                    <Minus size={12} />
                  </button>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      <div className="flex-1 overflow-auto py-4 px-2 sm:px-4">
        <div className="mx-auto max-w-[794px]">
          <A4Page
            ref={(el) => setPageRef(currentSheet.id, el)}
            page={currentSheet}
            pageIndex={currentPage}
            siteName={siteName}
            onUpdatePage={updatePage}
            onMultiUpload={handleMultiUpload}
            activeMasterName={activeMaster?.name ?? "마스터"}
            onApplyActiveMasterToCell={applyActiveMasterToCell}
            selectedCellIndex={selectedCellIndex}
            onSelectCell={handleSelectCell}
            isExporting={isExporting}
          />
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          {currentPage + 1} / {pages.length} 페이지
        </div>
      </div>
    </div>
  );
}
