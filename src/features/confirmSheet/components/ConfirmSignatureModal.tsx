import { useCallback, useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Eraser, ImagePlus, PenTool, Trash2, Undo2, X } from "lucide-react";

interface ConfirmSignatureModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
}

export default function ConfirmSignatureModal({ open, onClose, onApply }: ConfirmSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [backgroundImages, setBackgroundImages] = useState<
    { img: HTMLImageElement; x: number; y: number; w: number; h: number }[]
  >([]);

  const [editMode, setEditMode] = useState(false);
  const [editImgSrc, setEditImgSrc] = useState("");
  const [editScale, setEditScale] = useState(0.5);
  const editImgRef = useRef<HTMLImageElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const [editOffset, setEditOffset] = useState({ x: 0, y: 0 });
  const editDragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const redrawBgs = (
    canvas: HTMLCanvasElement,
    imgs: { img: HTMLImageElement; x: number; y: number; w: number; h: number }[],
  ) => {
    const ctx = canvas.getContext("2d")!;
    const prev = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "destination-over";
    imgs.forEach((item) => {
      ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
    });
    ctx.globalCompositeOperation = prev;
  };

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const pad = padRef.current;
    if (!canvas || !container || !pad) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (canvas.width === w * ratio && canvas.height === h * ratio) return;

    const data = pad.toData();
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    canvas.getContext("2d")!.scale(ratio, ratio);
    pad.clear();
    redrawBgs(canvas, backgroundImages);
    pad.fromData(data);
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

    setTimeout(() => resizeCanvas(), 100);
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
    if (!padRef.current) return;
    const data = padRef.current.toData();
    if (data.length > 0) {
      data.pop();
      padRef.current.fromData(data);
    } else if (backgroundImages.length > 0) {
      setBackgroundImages((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!confirm("모두 지우시겠습니까?")) return;
    padRef.current?.clear();
    setBackgroundImages([]);
    resizeCanvas();
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = padRef.current;
    if (pad?.isEmpty() && backgroundImages.length === 0) {
      return;
    }
    const dataUrl = canvas.toDataURL("image/png");
    onApply(dataUrl);
    pad?.clear();
    setBackgroundImages([]);
    setTool("pen");
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
        if (img.width > max || img.height > max) scale = max / Math.max(img.width, img.height);
        c.width = img.width * scale;
        c.height = img.height * scale;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const idata = ctx.getImageData(0, 0, c.width, c.height);
        const data = idata.data;
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (avg > 200) data[i + 3] = 0;
          else data[i] = data[i + 1] = data[i + 2] = 0;
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
    const editImg = editImgRef.current;
    const editContainer = editContainerRef.current;
    if (!canvas || !editImg || !editContainer) return;

    const imgRect = editImg.getBoundingClientRect();
    const contRect = editContainer.getBoundingClientRect();

    // 컨테이너 기준(화면 좌표)에서 위치/크기를 계산해 놓고,
    // 캔버스는 devicePixelRatio 로 스케일되더라도 같은 비율로 맞도록 한다.
    const imgCX = imgRect.left + imgRect.width / 2;
    const imgCY = imgRect.top + imgRect.height / 2;
    const contCX = contRect.left + contRect.width / 2;
    const contCY = contRect.top + contRect.height / 2;

    const relX = (imgCX - contCX) / contRect.width;
    const relY = (imgCY - contCY) / contRect.height;

    const wCss = imgRect.width;
    const hCss = imgRect.height;

    const xCss = contCX + relX * contRect.width - wCss / 2;
    const yCss = contCY + relY * contRect.height - hCss / 2;

    // canvas 컨텍스트는 resize 시 ratio 만큼 스케일되므로,
    // x/y/w/h 는 CSS 좌표계 기준 그대로 저장해 두었다가 redraw 시 동일하게 적용된다.
    const newImg = new Image();
    newImg.onload = () => {
      const newBgs = [
        ...backgroundImages,
        { img: newImg, x: xCss, y: yCss, w: wCss, h: hCss },
      ];
      setBackgroundImages(newBgs);
      redrawBgs(canvas, newBgs);
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
        className="w-[95%] max-w-[600px] bg-white rounded-xl flex flex-col overflow-hidden"
        style={{ height: "80vh", maxHeight: 800, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}
      >
        <div className="px-4 py-3 bg-[#f1f5f9] border-b border-[#e2e8f0] flex justify-between items-center">
          <span className="font-extrabold text-[16px] text-[#1e293b]">서명 또는 도장 입력</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-[#64748b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 relative bg-white overflow-hidden"
          style={{
            touchAction: "none",
            backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" style={{ touchAction: "none" }} />

          {editMode && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
              <div
                ref={editContainerRef}
                className="relative w-full h-full overflow-hidden border-2 border-dashed border-accent"
              >
                <img
                  ref={editImgRef}
                  src={editImgSrc}
                  alt="Stamp"
                  draggable={false}
                  className="absolute top-1/2 left-1/2 cursor-grab"
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
                className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-4 items-center w-[90%] max-w-[400px]"
                style={{
                  background: "#222",
                  borderRadius: 30,
                  padding: "10px 20px",
                }}
              >
                <span className="text-white text-xs whitespace-nowrap">크기</span>
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

        <div className="px-[10px] py-[10px] bg-white border-t border-[#e2e8f0] flex gap-2 overflow-x-auto shrink-0 items-center">
          <MiniBtn active={tool === "pen"} onClick={() => setTool("pen")}>
            <PenTool className="w-[14px] h-[14px]" /> 펜
          </MiniBtn>
          <MiniBtn active={tool === "eraser"} onClick={() => setTool("eraser")} className="mr-[10px]">
            <Eraser className="w-[14px] h-[14px]" /> 지우개
          </MiniBtn>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 h-[40px] px-3 text-[13px] font-bold rounded-[10px] cursor-pointer mr-1"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
              color: "#475569",
            }}
          >
            <ImagePlus className="w-4 h-4" /> 도장/사진
          </button>
          <MiniBtn onClick={handleUndo}>
            <Undo2 className="w-[14px] h-[14px]" />
          </MiniBtn>
          <MiniBtn onClick={handleClear}>
            <Trash2 className="w-[14px] h-[14px]" />
          </MiniBtn>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="px-4 py-3 bg-white border-t border-[#e2e8f0] flex gap-[10px]">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-[10px] text-[15px] font-bold flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#475569" }}
          >
            취소
          </button>
          <button
            onClick={handleApply}
            className="flex-1 h-12 rounded-[10px] text-[15px] font-bold flex items-center justify-center cursor-pointer border-none text-white"
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
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`text-xs px-3 py-1.5 rounded-md font-bold flex items-center gap-1 whitespace-nowrap h-[40px] justify-center cursor-pointer ${className}`}
    style={{
      border: `1px solid ${active ? "#2563eb" : "#cbd5e1"}`,
      background: active ? "#eff6ff" : "#fff",
      color: active ? "#2563eb" : "#475569",
    }}
  >
    {children}
  </button>
);

