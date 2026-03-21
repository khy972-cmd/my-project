import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import SignaturePad from "signature_pad";
import { Eraser, ImagePlus, PenTool, Trash2, Undo2, X } from "lucide-react";

interface ConfirmSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

type BackgroundImage = {
  img: HTMLImageElement;
  x: number;
  y: number;
  w: number;
  h: number;
};

export default function ConfirmSignatureModal({ open, onClose, onApply }: ConfirmSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);

  const [editMode, setEditMode] = useState(false);
  const [editImgSrc, setEditImgSrc] = useState("");
  const [editScale, setEditScale] = useState(0.5);
  const editImgRef = useRef<HTMLImageElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const [editOffset, setEditOffset] = useState({ x: 0, y: 0 });
  const editDragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const getRatio = () => Math.max(window.devicePixelRatio || 1, 1);

  const trimCanvas = (sourceCanvas: HTMLCanvasElement) => {
    const ctx = sourceCanvas.getContext("2d");
    if (!ctx) return sourceCanvas;

    const { width, height } = sourceCanvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let top = height;
    let left = width;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        if (data[(y * width + x) * 4 + 3] === 0) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }

    if (right < left || bottom < top) {
      return sourceCanvas;
    }

    const trimmed = document.createElement("canvas");
    trimmed.width = right - left + 1;
    trimmed.height = bottom - top + 1;
    const trimmedCtx = trimmed.getContext("2d");
    if (!trimmedCtx) return sourceCanvas;

    trimmedCtx.putImageData(
      ctx.getImageData(left, top, trimmed.width, trimmed.height),
      0,
      0,
    );

    return trimmed;
  };

  const redrawBgs = (canvas: HTMLCanvasElement, imgs: BackgroundImage[]) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = getRatio();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-over";
    imgs.forEach((item) => {
      ctx.drawImage(item.img, item.x * ratio, item.y * ratio, item.w * ratio, item.h * ratio);
    });
    ctx.restore();
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const pad = padRef.current;
    if (!canvas || !container || !pad) return;

    const ratio = getRatio();
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width === w * ratio && canvas.height === h * ratio) return;

    const data = pad.toData();
    canvas.width = w * ratio;
    canvas.height = h * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);

    pad.clear();
    redrawBgs(canvas, backgroundImages);
    if (data.length > 0) {
      pad.fromData(data);
    }
  }, [backgroundImages]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const canvas = canvasRef.current;

    if (!padRef.current) {
      padRef.current = new SignaturePad(canvas, {
        minWidth: 1.0,
        maxWidth: 3.0,
        penColor: "#000",
        throttle: 8,
      });
    }

    window.setTimeout(() => resizeCanvas(), 100);
  }, [open, resizeCanvas]);

  useEffect(() => {
    if (!padRef.current) return;
    if (tool === "eraser") {
      padRef.current.compositeOperation = "destination-out";
      padRef.current.minWidth = 10;
      padRef.current.maxWidth = 20;
    } else {
      padRef.current.compositeOperation = "source-over";
      padRef.current.minWidth = 1;
      padRef.current.maxWidth = 3;
    }
  }, [tool]);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    if (!canvas || !pad) return;

    const data = pad.toData();
    if (data.length > 0) {
      data.pop();
      pad.clear();
      redrawBgs(canvas, backgroundImages);
      pad.fromData(data);
    } else if (backgroundImages.length > 0) {
      const nextBgs = backgroundImages.slice(0, -1);
      setBackgroundImages(nextBgs);
      pad.clear();
      redrawBgs(canvas, nextBgs);
    }
  };

  const handleClear = () => {
    if (!confirm("모두 지우시겠습니까?")) return;
    padRef.current?.clear();
    setBackgroundImages([]);
    setEditMode(false);
    setEditOffset({ x: 0, y: 0 });
    resizeCanvas();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    if (!canvas) return;
    if (pad?.isEmpty() && backgroundImages.length === 0) return;

    const dataUrl = trimCanvas(canvas).toDataURL("image/png");
    onApply(dataUrl);
    pad?.clear();
    setBackgroundImages([]);
    setTool("pen");
    setEditMode(false);
    setEditOffset({ x: 0, y: 0 });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const max = 800;
        let scale = 1;
        if (img.width > max || img.height > max) {
          scale = max / Math.max(img.width, img.height);
        }
        c.width = img.width * scale;
        c.height = img.height * scale;
        const ctx = c.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, c.width, c.height);
        const idata = ctx.getImageData(0, 0, c.width, c.height);
        const data = idata.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (avg > 200) {
            data[i + 3] = 0;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }
        ctx.putImageData(idata, 0, 0);
        setEditImgSrc(c.toDataURL());
        setEditMode(true);
        setEditScale(0.5);
        setEditOffset({ x: 0, y: 0 });
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleEditApply = () => {
    const canvas = canvasRef.current;
    const pad = padRef.current;
    const editImg = editImgRef.current;
    const editContainer = editContainerRef.current;
    if (!canvas || !pad || !editImg || !editContainer) return;

    const imgRect = editImg.getBoundingClientRect();
    const contRect = editContainer.getBoundingClientRect();
    const xCss = imgRect.left - contRect.left;
    const yCss = imgRect.top - contRect.top;
    const wCss = imgRect.width;
    const hCss = imgRect.height;
    const signatureData = pad.toData();

    const newImg = new Image();
    newImg.onload = () => {
      const newBgs = [
        ...backgroundImages,
        { img: newImg, x: xCss, y: yCss, w: wCss, h: hCss },
      ];
      setBackgroundImages(newBgs);
      pad.clear();
      redrawBgs(canvas, newBgs);
      if (signatureData.length > 0) {
        pad.fromData(signatureData);
      }
      setEditMode(false);
    };
    newImg.src = editImgSrc;
  };

  const handleEditPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    editDragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: editOffset.x,
      baseY: editOffset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleEditPointerMove = (e: React.PointerEvent) => {
    if (!editDragRef.current.dragging) return;
    e.preventDefault();
    setEditOffset({
      x: editDragRef.current.baseX + (e.clientX - editDragRef.current.startX),
      y: editDragRef.current.baseY + (e.clientY - editDragRef.current.startY),
    });
  };

  const handleEditPointerUp = () => {
    editDragRef.current.dragging = false;
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2500] flex flex-col items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        className="flex h-[80vh] max-h-[800px] w-[95%] max-w-[600px] flex-col overflow-hidden rounded-xl bg-white"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f1f5f9] px-4 py-3">
          <span className="text-[16px] font-extrabold text-[#1e293b]">서명 또는 사진 입력</span>
          <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-[#64748b]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden bg-white"
          style={{
            touchAction: "none",
            backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <canvas ref={canvasRef} className="block h-full w-full" style={{ touchAction: "none" }} />

          {editMode && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
              <div
                ref={editContainerRef}
                className="relative h-full w-full overflow-hidden border-2 border-dashed border-accent"
              >
                <img
                  ref={editImgRef}
                  src={editImgSrc}
                  alt="Stamp"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 cursor-grab"
                  style={{
                    transform: `translate(-50%, -50%) translate(${editOffset.x}px, ${editOffset.y}px) scale(${editScale})`,
                    maxWidth: "none",
                    touchAction: "none",
                  }}
                  onPointerDown={handleEditPointerDown}
                  onPointerMove={handleEditPointerMove}
                  onPointerUp={handleEditPointerUp}
                />
              </div>
              <div
                className="absolute bottom-5 left-1/2 flex w-[90%] max-w-[400px] -translate-x-1/2 items-center gap-4"
                style={{
                  background: "#222",
                  borderRadius: 30,
                  padding: "10px 20px",
                }}
              >
                <span className="whitespace-nowrap text-xs text-white">크기</span>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                  value={editScale}
                  onChange={(e) => setEditScale(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <MiniBtn onClick={() => setEditMode(false)}>취소</MiniBtn>
                <MiniBtn active onClick={handleEditApply}>
                  적용
                </MiniBtn>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-[#e2e8f0] bg-white px-[10px] py-[10px]">
          <MiniBtn active={tool === "pen"} onClick={() => setTool("pen")}>
            <PenTool className="h-[14px] w-[14px]" /> 펜
          </MiniBtn>
          <MiniBtn active={tool === "eraser"} onClick={() => setTool("eraser")} className="mr-[10px]">
            <Eraser className="h-[14px] w-[14px]" /> 지우개
          </MiniBtn>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mr-1 flex h-[40px] cursor-pointer items-center gap-2 rounded-[10px] px-3 text-[13px] font-bold"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#475569",
            }}
          >
            <ImagePlus className="h-4 w-4" /> 도장/사진
          </button>
          <MiniBtn onClick={handleUndo}>
            <Undo2 className="h-[14px] w-[14px]" />
          </MiniBtn>
          <MiniBtn onClick={handleClear}>
            <Trash2 className="h-[14px] w-[14px]" />
          </MiniBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex gap-[10px] border-t border-[#e2e8f0] bg-white px-4 py-3">
          <button
            onClick={onClose}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[10px] text-[15px] font-bold"
            style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569" }}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[10px] border-none text-[15px] font-bold text-white"
            style={{ backgroundColor: "#1a254f" }}
          >
            서명 완료
          </button>
        </div>
      </div>
    </div>
  );
}

const MiniBtn = ({
  children,
  onClick,
  active = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`flex h-[40px] cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-bold ${className}`}
    style={{
      border: `1px solid ${active ? "#2563eb" : "#cbd5e1"}`,
      background: active ? "#eff6ff" : "#fff",
      color: active ? "#2563eb" : "#475569",
    }}
  >
    {children}
  </button>
);
