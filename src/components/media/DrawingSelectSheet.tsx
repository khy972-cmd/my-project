import { Camera, Map as MapIcon, X } from "lucide-react";

interface DrawingSelectSheetProps {
  open: boolean;
  onClose: () => void;
  onUploadFiles: (files: FileList | null) => void;
  onLoadSiteDrawings?: () => void;
  title?: string;
  uploadLabel?: string;
  loadLabel?: string;
  closeLabel?: string;
  loadDisabled?: boolean;
}

export default function DrawingSelectSheet({
  open,
  onClose,
  onUploadFiles,
  onLoadSiteDrawings,
  title = "도면 선택",
  uploadLabel = "도면 업로드",
  loadLabel = "현장 도면 불러오기",
  closeLabel = "닫기",
  loadDisabled = false,
}: DrawingSelectSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50" onClick={onClose}>
      <div
        className="fixed bottom-0 left-0 right-0 z-[2001] mx-auto max-w-[600px] rounded-t-2xl border-t border-border bg-card p-6 animate-[slideDown_0.3s_ease-out]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative mb-5">
          <div className="text-center text-lg font-bold text-foreground">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg border border-border text-muted-foreground"
          >
            <X className="h-4 w-4 mx-auto" />
          </button>
        </div>

        <label className="mb-2.5 flex h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 font-bold text-primary transition-colors hover:bg-primary/10">
          <Camera className="h-[18px] w-[18px]" /> {uploadLabel}
          <input
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              onUploadFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={onLoadSiteDrawings}
          disabled={loadDisabled}
          className="mb-2.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background font-bold text-foreground transition-colors hover:bg-[hsl(var(--bg-input))] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MapIcon className="h-[18px] w-[18px]" /> {loadLabel}
        </button>

      </div>
    </div>
  );
}
