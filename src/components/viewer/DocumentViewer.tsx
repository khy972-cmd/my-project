import { useCallback, useRef } from "react";
import { toast } from "sonner";
import PreviewModal from "@/components/preview/PreviewModal";
import { usePreviewZoomPan } from "@/hooks/usePreviewZoomPan";

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function DocumentViewer({ open, onClose, title, children }: DocumentViewerProps) {
  const zoom = usePreviewZoomPan({ open });
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleSave = useCallback(async () => {
    if (!contentRef.current) {
      toast.error("저장할 문서를 찾지 못했습니다.");
      return;
    }
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!blob) throw new Error("blob_failed");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(title || "document").replace(/[\\/:*?"<>|]+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch {
      toast.error("문서 저장에 실패했습니다.");
    }
  }, [title]);

  const handleShare = useCallback(async () => {
    if (!contentRef.current) {
      toast.error("공유할 문서를 찾지 못했습니다.");
      return;
    }

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
      if (!blob) throw new Error("blob_failed");

      const file = new File([blob], `${(title || "document").replace(/[\\/:*?"<>|]+/g, "_")}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] });
        return;
      }

      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("링크를 복사했습니다.");
        return;
      }

      toast.error("공유를 지원하지 않는 환경입니다.");
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      toast.error("공유에 실패했습니다.");
    }
  }, [title]);

  return (
    <PreviewModal
      open={open}
      title={title}
      onBack={onClose}
      onClose={onClose}
      onSave={handleSave}
      onShare={handleShare}
      zoom={zoom}
      contentRef={contentRef as unknown as { current: HTMLElement | null }}
    >
      <div className="flex flex-col items-center gap-5 p-5">{children}</div>
    </PreviewModal>
  );
}

/* ??? A4 Page Templates ??? */
export function A4Page({ children, pageNum, totalPages }: { children: React.ReactNode; pageNum: number; totalPages: number }) {
  return (
    <div className="bg-white shadow-lg" style={{ width: "210mm", minHeight: "297mm", padding: "20mm", boxSizing: "border-box" }}>
      <div style={{ border: "2px solid #1a254f", height: "100%", padding: "15mm", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        {children}
        <div className="mt-auto pt-4 flex justify-between text-[12px] text-[#999] border-t border-[#ddd]">
          <span>INOPNC Safety Management System</span>
          <span>{pageNum} / {totalPages}</span>
        </div>
      </div>
    </div>
  );
}

export function PhotoGrid({ photos, siteName }: { photos: { url: string; date?: string }[]; siteName: string }) {
  const totalPages = Math.ceil(photos.length / 4);
  return (
    <>
      {Array.from({ length: totalPages }, (_, page) => {
        const start = page * 4;
        const pagePhotos = photos.slice(start, start + 4);
        return (
          <A4Page key={page} pageNum={page + 1} totalPages={totalPages}>
            <div className="text-center border-b-2 border-[#1a254f] pb-3 mb-4">
              <div className="text-[24px] font-[800] text-[#1a254f]">怨듭궗 ?ъ쭊?吏</div>
              <div className="text-[14px] text-[#666] mt-1">{siteName}</div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              {pagePhotos.map((photo, idx) => (
                <div key={idx} className="border border-[#ddd] rounded-lg overflow-hidden flex flex-col bg-white">
                  <div className="flex-1 bg-[#f8fafc] flex items-center justify-center" style={{ minHeight: "80mm" }}>
                    <img src={photo.url} className="max-w-full max-h-full object-contain" alt={`?ъ쭊 ${start + idx + 1}`} />
                  </div>
                  <div className="p-2 border-t border-[#ddd] bg-white">
                    <div className="text-[12px] font-bold text-[#1a254f]">?ъ쭊 {start + idx + 1}</div>
                    <div className="text-[11px] text-[#666]">珥ъ쁺?쇱떆: {photo.date || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          </A4Page>
        );
      })}
    </>
  );
}

export function WorklogDocument({ entry }: { entry: { siteName: string; workDate: string; manpower: any[]; workSets: any[]; materials?: any[] } }) {
  const totalWorkers = entry.manpower?.length || 0;
  const totalHours = entry.manpower?.reduce((s: number, m: any) => s + (m.workHours || 0), 0) || 0;

  return (
    <A4Page pageNum={1} totalPages={1}>
      <div className="text-center border-b-2 border-[#1a254f] pb-3 mb-4">
        <div className="text-[24px] font-[800] text-[#1a254f]">?묒뾽?쇱?</div>
        <div className="text-[14px] text-[#666] mt-1">{entry.siteName}</div>
      </div>
      <div className="grid grid-cols-[120px_1fr] gap-2 text-[14px] mb-6">
        <div className="font-bold text-[#1a254f]">?묒뾽?쇱옄</div>
        <div className="border-b border-[#ddd] py-1">{entry.workDate}</div>
        <div className="font-bold text-[#1a254f]">현장명</div>
        <div className="border-b border-[#ddd] py-1">{entry.siteName}</div>
        <div className="font-bold text-[#1a254f]">?ъ엯?몄썝</div>
        <div className="border-b border-[#ddd] py-1">{totalWorkers}紐?({totalHours.toFixed(1)}怨듭닔)</div>
      </div>

      {entry.workSets?.map((ws: any, i: number) => (
        <div key={i} className="mb-4 p-3 bg-[#f8fafc] rounded-lg">
          <div className="text-[13px] font-bold text-[#1a254f] mb-1">?묒뾽 ?명듃 {i + 1}</div>
          <div className="grid grid-cols-[80px_1fr] gap-1 text-[12px]">
            <span className="text-[#666]">遺?щ챸</span>
            <span>{ws.member === "湲고?" ? ws.customMemberValue : ws.member}</span>
            <span className="text-[#666]">怨듭젙</span>
            <span>{ws.process === "湲고?" ? ws.customProcessValue : ws.process}</span>
            <span className="text-[#666]">?좏삎</span>
            <span>{ws.type === "湲고?" ? ws.customTypeValue : ws.type}</span>
            <span className="text-[#666]">?꾩튂</span>
            <span>{[ws.location?.block, ws.location?.dong, ws.location?.floor].filter(Boolean).join(" / ") || "-"}</span>
          </div>
        </div>
      ))}

      {entry.materials && entry.materials.length > 0 && (
        <div className="mt-4">
          <div className="text-[13px] font-bold text-[#1a254f] mb-2">?먯옱 ?ъ슜 ?댁뿭</div>
          {entry.materials.map((m: any, i: number) => (
            <div key={i} className="flex justify-between text-[12px] py-1 border-b border-[#eee]">
              <span>{m.name}</span>
              <span>{m.qty}매</span>
            </div>
          ))}
        </div>
      )}
    </A4Page>
  );
}
