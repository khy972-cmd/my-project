import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Download } from "lucide-react";
import ConfirmHeader from "@/features/confirmSheet/components/ConfirmHeader";
import ConfirmHeaderIconButton from "@/features/confirmSheet/components/ConfirmHeaderIconButton";
import ConfirmDocumentViewer from "@/features/confirmSheet/components/ConfirmDocumentViewer";
import ConfirmViewerControls from "@/features/confirmSheet/components/ConfirmViewerControls";
import ConfirmSignatureModal from "@/features/confirmSheet/components/ConfirmSignatureModal";

export interface ConfirmSheetAppProps {
  onClose: () => void;
}

export default function ConfirmSheetApp({ onClose }: ConfirmSheetAppProps) {
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<{ reset: () => void }>(null);

  useEffect(() => {
    // 모바일/좁은 화면에서는 기본 확대 배율을 낮춰 가로폭에 더 잘 맞추기
    if (typeof window !== "undefined") {
      const vw = window.innerWidth;
      if (vw < 768) {
        setZoom(0.85);
      }
    }
  }, []);

  const handleReset = () => {
    if (confirm("모든 입력을 초기화하시겠습니까?")) {
      formRef.current?.reset();
      setSignatureDataUrl(null);
      toast("초기화 완료");
    }
  };

  const handleDownload = async () => {
    if (!documentRef.current) return;
    toast("PDF 생성 중...");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 비율을 유지하면서 페이지 안에 꽉 차도록(가로/세로 중 긴 쪽 기준) 스케일
      const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const renderWidth = imgWidth * scale;
      const renderHeight = imgHeight * scale;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = (pageHeight - renderHeight) / 2;

      pdf.addImage(imgData, "JPEG", offsetX, offsetY, renderWidth, renderHeight);

      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      pdf.save(`작업완료확인서_${dateStr}.pdf`);
      toast("저장되었습니다!");
    } catch (e) {
      console.error(e);
      toast("저장 실패");
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));
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
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#1e1e1e] overflow-hidden">
      <ConfirmHeader
        title="작업완료확인서"
        onBack={handleClose}
        rightActions={
          <>
            <ConfirmHeaderIconButton onClick={handleReset} label="초기화">
              <RotateCcw className="w-5 h-5" />
            </ConfirmHeaderIconButton>
            <ConfirmHeaderIconButton onClick={handleDownload} label="다운로드">
              <Download className="w-5 h-5" />
            </ConfirmHeaderIconButton>
          </>
        }
      />

      <ConfirmDocumentViewer
        zoom={zoom}
        isPanning={isPanning}
        documentRef={documentRef}
        formRef={formRef}
        signatureDataUrl={signatureDataUrl}
        onSignatureClick={() => setSignModalOpen(true)}
        onZoomChange={(next) => setZoom(Math.min(3, Math.max(0.3, next)))}
      />

      <ConfirmViewerControls
        isPanning={isPanning}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanToggle={handlePanToggle}
        onShare={async () => {
          if (!navigator.share) {
            toast("공유 기능을 지원하지 않는 브라우저입니다.");
            return;
          }
          if (!documentRef.current) return;
          toast("이미지 생성 중...");
          try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(documentRef.current, {
              scale: 2,
              useCORS: true,
            });
            canvas.toBlob(
              async (blob) => {
                if (!blob) return;
                const file = new File([blob], "confirmation.jpg", { type: "image/jpeg" });
                await navigator.share({ title: "작업확인서", files: [file] });
              },
              "image/jpeg",
              0.9,
            );
          } catch {
            toast("공유 실패");
          }
        }}
      />

      <ConfirmSignatureModal
        open={signModalOpen}
        onClose={() => setSignModalOpen(false)}
        onApply={(dataUrl) => {
          setSignatureDataUrl(dataUrl);
          setSignModalOpen(false);
          toast("서명이 적용되었습니다");
        }}
      />
    </div>
  );
}

