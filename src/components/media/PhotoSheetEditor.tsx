import { useMemo } from "react";
import { CheckCircle2, Loader2, RotateCcw, Save, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type {
  PhotoSheetDraft,
  PhotoSheetDraftItem,
  PhotoSheetItemStatus,
} from "@/lib/photoSheet/types";

type PhotoSheetEditorProps = {
  open: boolean;
  draft: PhotoSheetDraft | null;
  previewMap?: Record<string, string>;
  busy?: boolean;
  preparing?: boolean;
  canApprove?: boolean;
  onClose: () => void;
  onChange: (nextDraft: PhotoSheetDraft) => void;
  onTempSave: (draft: PhotoSheetDraft) => Promise<void> | void;
  onApprove?: (draft: PhotoSheetDraft) => Promise<void> | void;
  onUnapprove?: (draft: PhotoSheetDraft) => Promise<void> | void;
};

function statusLabel(status: PhotoSheetItemStatus) {
  if (status === "before") return "보수전";
  return "보수후";
}

function toEditableStatus(status: PhotoSheetItemStatus): "before" | "after" {
  return status === "before" ? "before" : "after";
}

export default function PhotoSheetEditor({
  open,
  draft,
  previewMap = {},
  busy = false,
  preparing = false,
  canApprove = false,
  onClose,
  onChange,
  onTempSave,
  onApprove,
  onUnapprove,
}: PhotoSheetEditorProps) {
  const statusCount = useMemo(() => {
    const base = {
      before: 0,
      after: 0,
    };
    if (!draft) return base;

    draft.items.forEach((item) => {
      const normalized = toEditableStatus(item.status);
      base[normalized] += 1;
    });

    return base;
  }, [draft]);

  const sortedItems = useMemo(
    () => [...(draft?.items || [])].sort((a, b) => a.order - b.order),
    [draft],
  );

  const updateItem = (itemId: string, patch: Partial<PhotoSheetDraftItem>) => {
    if (!draft) return;
    const nextPatch = {
      ...patch,
      ...(patch.status ? { status: toEditableStatus(patch.status) } : {}),
    };
    onChange({
      ...draft,
      updatedAt: new Date().toISOString(),
      items: draft.items.map((item) => (item.id === itemId ? { ...item, ...nextPatch } : item)),
    });
  };

  const updateAllStatus = (status: "before" | "after") => {
    if (!draft) return;
    onChange({
      ...draft,
      updatedAt: new Date().toISOString(),
      items: draft.items.map((item) => ({ ...item, status })),
    });
  };

  const actionDisabled = busy || preparing || !draft || draft.items.length === 0;
  const isFinalized = draft?.status === "finalized";

  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent className="z-[95] mx-auto max-w-[600px] rounded-t-2xl border-t border-border bg-white">
        <DrawerHeader className="flex flex-row items-center justify-between">
          <DrawerTitle className="text-base-app font-bold">사진대지 편집</DrawerTitle>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-border text-muted-foreground"
            aria-label="닫기"
          >
            <X className="mx-auto h-4 w-4" />
          </button>
        </DrawerHeader>

        <div className="max-h-[72dvh] space-y-3 overflow-y-auto px-4 pb-4">
          {!draft ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-3 py-8 text-center text-sm-app font-semibold text-text-sub">
              생성된 사진대지 초안이 없습니다.
            </div>
          ) : (
            <>
              <section className="rounded-xl border border-border bg-background px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm-app font-bold text-header-navy">{draft.siteName || "현장"}</p>
                  <span
                    className={cn(
                      "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-bold",
                      isFinalized
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700",
                    )}
                  >
                    {isFinalized ? "승인" : "임시저장"}
                  </span>
                </div>
                <p className="mt-1 text-tiny font-medium text-text-sub">
                  기준일 {draft.workDate || "-"} · 총 {draft.items.length}건
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-center text-[11px] font-bold text-rose-700">
                    보수전 {statusCount.before}
                  </div>
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-center text-[11px] font-bold text-sky-700">
                    보수후 {statusCount.after}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateAllStatus("before")}
                    disabled={actionDisabled}
                    className="h-7 rounded-md border border-rose-200 bg-rose-50 px-2 text-[11px] font-bold text-rose-700 disabled:opacity-50"
                  >
                    전체 보수전
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAllStatus("after")}
                    disabled={actionDisabled}
                    className="h-7 rounded-md border border-sky-200 bg-sky-50 px-2 text-[11px] font-bold text-sky-700 disabled:opacity-50"
                  >
                    전체 보수후
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {sortedItems.map((item, index) => {
                  const previewUrl = previewMap[item.attachmentRefId];
                  return (
                    <div key={item.id} className="rounded-xl border border-border bg-background px-2.5 py-2.5">
                      <p className="mb-1 text-[11px] font-bold text-text-sub">#{index + 1}</p>
                      <div className="flex gap-2">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                          {previewUrl ? (
                            <img
                              src={previewUrl}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-text-sub">
                              미리보기 없음
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <input
                            value={item.title}
                            onChange={(event) => updateItem(item.id, { title: event.target.value })}
                            placeholder="제목"
                            className="h-8 w-full rounded-md border border-border bg-white px-2 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                          />
                          <textarea
                            rows={2}
                            value={item.note}
                            onChange={(event) => updateItem(item.id, { note: event.target.value })}
                            placeholder="메모(선택)"
                            className="w-full resize-none rounded-md border border-border bg-white px-2 py-1.5 text-[12px] font-medium text-foreground outline-none focus:border-primary"
                          />
                          <div className="flex items-center gap-2">
                            <select
                              value={toEditableStatus(item.status)}
                              onChange={(event) =>
                                updateItem(item.id, { status: event.target.value as "before" | "after" })
                              }
                              className="h-8 rounded-md border border-border bg-white px-2 text-[12px] font-semibold text-foreground outline-none focus:border-primary"
                            >
                              <option value="before">보수전</option>
                              <option value="after">보수후</option>
                            </select>
                            <span className="truncate text-[11px] font-medium text-text-sub">
                              ref {item.attachmentRefId}
                            </span>
                            <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-text-sub">
                              {statusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-border px-4 py-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => draft && void onTempSave(draft)}
            disabled={actionDisabled}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-border bg-muted px-3 text-sm-app font-semibold text-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            임시저장
          </button>

          {canApprove ? (
            isFinalized ? (
              <button
                type="button"
                onClick={() => draft && void onUnapprove?.(draft)}
                disabled={actionDisabled}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 text-sm-app font-bold text-rose-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                승인해제
              </button>
            ) : (
              <button
                type="button"
                onClick={() => draft && void onApprove?.(draft)}
                disabled={actionDisabled}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-sm-app font-bold text-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                승인
              </button>
            )
          ) : (
            <div className="flex h-10 items-center justify-center rounded-lg border border-border bg-background px-3 text-[12px] font-semibold text-text-sub">
              승인 권한: 관리자/매니저
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-3 text-sm-app font-semibold text-text-sub"
          >
            닫기
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
