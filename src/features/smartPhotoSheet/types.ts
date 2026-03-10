/**
 * 사진대지 생성기(smart-photo-sheet) 전용 타입
 * 기존 lib/photoSheet(드래프트/승인)와 구분하기 위해 이 모듈에서만 사용합니다.
 */
import { createId } from "./createId";

export type RepairTag = "before" | "after" | null;

export interface InfoRow {
  label: string;
  value: string;
}

export interface PhotoItem {
  id: string;
  imageUrl: string | null;
  tag: RepairTag;
  memberName: string;
  workProcess: string;
  infoRows: InfoRow[];
  masterPresetId: string | null;
  masterLinked: boolean;
  zoom: number;
  panX: number;
  panY: number;
  tableSplit: number;
  tableWidth: number;
}

export interface SheetPage {
  id: string;
  cells: [PhotoItem, PhotoItem, PhotoItem, PhotoItem, PhotoItem, PhotoItem];
}

export interface InfoTemplate {
  id: string;
  name: string;
  rows: InfoRow[];
}

export interface MasterPreset {
  id: string;
  name: string;
  rows: InfoRow[];
}

export const DEFAULT_INFO_ROWS: InfoRow[] = [
  { label: "부재명", value: "" },
  { label: "작업내용(공정)", value: "" },
];

export const DEFAULT_TEMPLATES: InfoTemplate[] = [
  {
    id: "tpl-1",
    name: "기본",
    rows: [
      { label: "부재명", value: "" },
      { label: "작업내용(공정)", value: "" },
    ],
  },
  {
    id: "tpl-2",
    name: "상세",
    rows: [
      { label: "부재명", value: "" },
      { label: "위치", value: "" },
      { label: "작업내용(공정)", value: "" },
      { label: "상태", value: "" },
      { label: "비고", value: "" },
    ],
  },
  {
    id: "tpl-3",
    name: "간략",
    rows: [
      { label: "위치", value: "" },
      { label: "내용", value: "" },
    ],
  },
];

export function createEmptyPhoto(): PhotoItem {
  return {
    id: createId(),
    imageUrl: null,
    tag: null,
    memberName: "",
    workProcess: "",
    infoRows: [...DEFAULT_INFO_ROWS.map((r) => ({ ...r }))],
    masterPresetId: null,
    masterLinked: false,
    zoom: 1,
    panX: 0,
    panY: 0,
    tableSplit: 0.38,
    tableWidth: 0.52,
  };
}

export function createEmptyPage(): SheetPage {
  return {
    id: createId(),
    cells: [
      createEmptyPhoto(),
      createEmptyPhoto(),
      createEmptyPhoto(),
      createEmptyPhoto(),
      createEmptyPhoto(),
      createEmptyPhoto(),
    ],
  };
}
