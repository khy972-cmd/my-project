import { useMemo } from "react";
import { formatDateTimeCompact } from "@/lib/dateFormat";
import type { PhotoSheetFinal, PhotoSheetItemStatus } from "@/lib/photoSheet/types";
import { cn } from "@/lib/utils";

type PhotoSheetViewerProps = {
  finalDoc: PhotoSheetFinal;
  previewMap?: Record<string, string>;
};

function statusLabel(status: PhotoSheetItemStatus) {
  if (status === "before") return "보수전";
  return "보수후";
}

function statusClass(status: PhotoSheetItemStatus) {
  if (status === "before") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

export default function PhotoSheetViewer({
  finalDoc,
  previewMap = {},
}: PhotoSheetViewerProps) {
  const sortedItems = useMemo(
    () => [...(finalDoc.items || [])].sort((a, b) => a.order - b.order),
    [finalDoc.items],
  );

  const counts = useMemo(() => {
    const base = { before: 0, after: 0 };
    sortedItems.forEach((item) => {
      if (item.status === "before") {
        base.before += 1;
        return;
      }
      base.after += 1;
    });
    return base;
  }, [sortedItems]);

  return (
    <div className="space-y-3">
      <section className="rounded-xl border border-border bg-card px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm-app font-bold text-header-navy">
            {finalDoc.siteName || "현장"} · 사진대지(승인본)
          </p>
          <span className="inline-flex h-6 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700">
            승인
          </span>
        </div>
        <p className="mt-1 text-tiny font-medium text-text-sub">
          기준일 {finalDoc.workDate || "-"} · 승인시각 {formatDateTimeCompact(finalDoc.finalizedAt)}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-center text-[11px] font-bold text-rose-700">
            보수전 {counts.before}
          </div>
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1 text-center text-[11px] font-bold text-sky-700">
            보수후 {counts.after}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sortedItems.map((item, index) => {
          const url = previewMap[item.attachmentRefId];
          return (
            <div key={item.id} className="rounded-xl border border-border bg-card p-2.5">
              <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                {url ? (
                  <img
                    src={url}
                    alt={item.title || `사진 ${index + 1}`}
                    loading="lazy"
                    className="h-[180px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[180px] w-full items-center justify-center text-[11px] font-semibold text-text-sub">
                    미리보기 없음
                  </div>
                )}
                <span
                  className={cn(
                    "absolute left-2 top-2 inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-bold",
                    statusClass(item.status),
                  )}
                >
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-2 space-y-1">
                <p className="truncate text-sm-app font-semibold text-foreground">
                  {item.title || `사진 ${index + 1}`}
                </p>
                {item.note ? (
                  <p className="line-clamp-2 text-[12px] text-text-sub">{item.note}</p>
                ) : (
                  <p className="text-[12px] text-muted-foreground">메모 없음</p>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
