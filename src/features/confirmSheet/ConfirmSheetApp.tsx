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

  const waitForImages = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  };

  const fixCaptureFields = (clonedDoc: Document) => {
    const root = clonedDoc.querySelector('[data-confirm-capture-root="1"]') as HTMLElement | null;
    if (!root) return;

    root.querySelectorAll("table").forEach((table) => {
      const el = table as HTMLElement;
      el.style.tableLayout = "fixed";
      el.style.width = "100%";
      el.style.borderCollapse = "collapse";
    });

    root.querySelectorAll("td, th").forEach((cell) => {
      const el = cell as HTMLElement;
      el.style.verticalAlign = "middle";
      el.style.lineHeight = "1.4";
      el.style.boxSizing = "border-box";
    });

    root.querySelectorAll("input[type='text'], textarea").forEach((field) => {
      const el = field as HTMLInputElement | HTMLTextAreaElement;
      const styles = clonedDoc.defaultView?.getComputedStyle(el);
      const replacement = clonedDoc.createElement("div");
      const isTextArea = el.tagName === "TEXTAREA";
      const textAlign = styles?.textAlign || "left";

      replacement.textContent = el.value || "";
      replacement.style.boxSizing = "border-box";
      replacement.style.display = isTextArea ? "block" : "flex";
      replacement.style.alignItems = isTextArea ? "stretch" : "center";
      replacement.style.justifyContent = textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start";
      replacement.style.width = styles?.width || "100%";
      replacement.style.minHeight = styles?.minHeight || `${el.clientHeight || 24}px`;
      replacement.style.height = !isTextArea ? styles?.height || `${el.clientHeight || 24}px` : "auto";
      replacement.style.padding = styles?.padding || "0";
      replacement.style.margin = styles?.margin || "0";
      replacement.style.border = styles?.border || "none";
      replacement.style.borderTop = styles?.borderTop || "none";
      replacement.style.borderRight = styles?.borderRight || "none";
      replacement.style.borderBottom = styles?.borderBottom || "none";
      replacement.style.borderLeft = styles?.borderLeft || "none";
      replacement.style.borderRadius = styles?.borderRadius || "0";
      replacement.style.background = "transparent";
      replacement.style.color = styles?.color || "#000000";
      replacement.style.fontFamily = styles?.fontFamily || "inherit";
      replacement.style.fontSize = styles?.fontSize || "16px";
      replacement.style.fontWeight = styles?.fontWeight || "600";
      replacement.style.lineHeight = styles?.lineHeight || (isTextArea ? "1.4" : styles?.height || "1.4");
      replacement.style.letterSpacing = styles?.letterSpacing || "normal";
      replacement.style.textAlign = textAlign;
      replacement.style.whiteSpace = isTextArea ? "pre-wrap" : "nowrap";
      replacement.style.wordBreak = isTextArea ? "break-word" : "keep-all";
      replacement.style.overflowWrap = isTextArea ? "anywhere" : "normal";
      replacement.style.overflow = "hidden";

      el.parentNode?.replaceChild(replacement, el);
    });
  };

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
    clone.setAttribute("data-confirm-capture-root", "1");

    host.appendChild(clone);
    document.body.appendChild(host);

    try {
      const width = clone.scrollWidth || source.scrollWidth || source.offsetWidth;
      const height = clone.scrollHeight || source.scrollHeight || source.offsetHeight;
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await waitForImages(clone);

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
        onclone: (clonedDoc) => {
          if (clonedDoc.body) {
            clonedDoc.body.style.fontFamily = `"Pretendard Variable", Pretendard, Arial, sans-serif`;
          }
          fixCaptureFields(clonedDoc);
        },
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
