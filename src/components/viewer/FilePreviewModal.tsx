import { X } from "lucide-react";

export interface FilePreviewFile {
  id: string;
  name: string;
  url: string;
  mime?: string;
  ext?: string;
  size?: string;
  createdAt?: string;
  previewUrl?: string;
}

interface FilePreviewModalProps {
  open: boolean;
  file?: FilePreviewFile;
  title: string;
  onClose: () => void;
}

const isImage = (file?: FilePreviewFile) => {
  const ext = (file?.ext || "").toLowerCase();
  return (file?.mime || "").startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext);
};

const isPdf = (file?: FilePreviewFile) => {
  const ext = (file?.ext || "").toLowerCase();
  return (file?.mime || "").includes("pdf") || ext === "pdf";
};

export default function FilePreviewModal({ open, file, title, onClose }: FilePreviewModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10020] bg-black/70 backdrop-blur-sm">
      <div className="mx-auto mt-8 flex h-[calc(100vh-4rem)] w-[min(96vw,1100px)] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#111] text-white">
        <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
          <h3 className="truncate text-sm font-semibold">{title || file?.name || "파일 미리보기"}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {!file?.url && <div className="p-4 text-sm text-white/70">미리볼 파일이 없습니다.</div>}

          {!!file?.url && isImage(file) && (
            <img src={file.url} alt={file.name} className="mx-auto max-h-full max-w-full object-contain" />
          )}

          {!!file?.url && !isImage(file) && isPdf(file) && (
            <iframe src={file.url} title={file.name} className="h-full min-h-[70vh] w-full rounded border border-white/10 bg-white" />
          )}

          {!!file?.url && !isImage(file) && !isPdf(file) && (
            <div className="p-4 text-sm text-white/80">
              브라우저 미리보기를 지원하지 않는 형식입니다.
              <a href={file.url} target="_blank" rel="noreferrer" className="ml-2 underline">
                새 창에서 열기
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
