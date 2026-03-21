import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ConfirmDocumentViewer from "@/features/confirmSheet/components/ConfirmDocumentViewer";
import ConfirmSignatureModal from "@/features/confirmSheet/components/ConfirmSignatureModal";
import { PreviewAppBar, PreviewControlBar, PreviewViewport } from "@/components/viewer/PreviewBars";

export interface ConfirmSheetAppProps {
  onClose: () => void;
}

export default function ConfirmSheetApp({ onClose }: ConfirmSheetAppProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [viewerResetKey, setViewerResetKey] = useState(0);
  const documentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<{ reset: () => void }>(null);

  const getDefaultZoom = () => {
    if (typeof window === "undefined") return 1;
    return window.innerWidth < 768 ? 0.85 : 1;
  };

  useEffect(() => {
    setZoom(getDefaultZoom());
  }, []);

  const captureDocumentCanvas = async () => {
    if (!documentRef.current) {
      throw new Error("missing_document");
    }

    const html2canvas = (await import("html2canvas")).default;
    const source = documentRef.current;
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-100000px";
    host.style.top = "0";
    host.style.margin = "0";
    host.style.padding = "0";
    host.style.background = "#ffffff";
    host.style.zIndex = "-1";

    const clone = source.cloneNode(true) as HTMLDivElement;
    clone.style.transform = "none";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.maxWidth = "none";

    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      const width = clone.scrollWidth || source.scrollWidth || source.offsetWidth;
      const height = clone.scrollHeight || source.scrollHeight || source.offsetHeight;

      return await html2canvas(clone, {
        scale: Math.max(2, window.devicePixelRatio || 1),
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width,
        height,
        windowWidth: width,
        windowHeight: height,
        scrollX: 0,
        scrollY: 0,
      });
    } finally {
      document.body.removeChild(host);
    }
  };

  const handleReset = () => {
    if (confirm("모든 입력을 초기화하시겠습니까?")) {
      formRef.current?.reset();
      setSignatureDataUrl(null);
      toast.success("초기화 완료");
    }
  };

  const handleDownload = async () => {
    toast("PDF 생성 중...");

    try {
      const canvas = await captureDocumentCanvas();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageRatio = canvas.width / canvas.height;
      const pageRatio = pageWidth / pageHeight;

      const renderWidth = imageRatio > pageRatio ? pageWidth : pageHeight * imageRatio;
      const renderHeight = imageRatio > pageRatio ? pageWidth / imageRatio : pageHeight;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(canvas.toDataURL("image/png", 1), "PNG", offsetX, offsetY, renderWidth, renderHeight, undefined, "FAST");

      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      pdf.save(`작업완료확인서_${dateStr}.pdf`);
      toast.success("저장되었습니다!");
    } catch (error) {
      console.error(error);
      toast.error("저장 실패");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      toast.error("공유 기능을 지원하지 않는 브라우저입니다.");
      return;
    }

    toast("이미지 생성 중...");

    try {
      const canvas = await captureDocumentCanvas();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) throw new Error("blob_failed");

      const file = new File([blob], "confirmation.jpg", { type: "image/jpeg" });
      await navigator.share({ title: "작업확인서", files: [file] });
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      toast.error("공유 실패");
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
  const handleFit = () => {
    setZoom(getDefaultZoom());
    setViewerResetKey((prev) => prev + 1);
  };
  const handlePanToggle = () => {
    setIsPanning((p) => {
      toast(!p ? "이동 모드" : "입력 모드");
      return !p;
    });
  };

  const handleClose = () => {
    if (confirm("종료하시겠습니까?")) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col overflow-hidden bg-[#1e1e1e]">
      <PreviewAppBar
        title="작업완료확인서"
        onBack={handleClose}
        onClose={handleClose}
        onReset={handleReset}
        onSave={handleDownload}
      />

      <PreviewViewport headerHeightPx={56} toolbarHeightPx={72}>
        <ConfirmDocumentViewer
          zoom={zoom}
          isPanning={isPanning}
          documentRef={documentRef}
          formRef={formRef}
          signatureDataUrl={signatureDataUrl}
          onSignatureClick={() => setSignModalOpen(true)}
          onZoomChange={(next) => setZoom(Math.min(3, Math.max(0.3, next)))}
          resetKey={viewerResetKey}
        />
      </PreviewViewport>

      <PreviewControlBar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onTogglePan={handlePanToggle}
        onFit={handleFit}
        onShare={handleShare}
        panActive={isPanning}
      />

      <ConfirmSignatureModal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        onApply={(dataUrl) => {
          setSignatureDataUrl(dataUrl);
          setSignModalOpen(false);
          toast.success("서명이 적용되었습니다");
        }}
      />
    </div>
  );
}
