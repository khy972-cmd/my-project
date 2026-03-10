import { Hand, Minus, Plus, Share2 } from "lucide-react";

interface ConfirmViewerControlsProps {
  isPanning: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanToggle: () => void;
  onShare: () => void;
}

export default function ConfirmViewerControls({
  isPanning,
  onZoomIn,
  onZoomOut,
  onPanToggle,
  onShare,
}: ConfirmViewerControlsProps) {
  return (
    <div
      className="fixed bottom-[30px] left-1/2 -translate-x-1/2 z-[2200] flex gap-6 items-center"
      style={{
        background: "#222",
        padding: "10px 25px",
        borderRadius: 50,
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        border: "1px solid #333",
        backdropFilter: "blur(8px)",
      }}
    >
      <CtrlBtn onClick={onZoomOut} label="축소">
        <Minus className="w-5 h-5" />
      </CtrlBtn>
      <CtrlBtn onClick={onPanToggle} label="이동" active={isPanning}>
        <Hand className="w-5 h-5" />
      </CtrlBtn>
      <CtrlBtn onClick={onZoomIn} label="확대">
        <Plus className="w-5 h-5" />
      </CtrlBtn>
      <CtrlBtn onClick={onShare} label="공유">
        <Share2 className="w-5 h-5" />
      </CtrlBtn>
    </div>
  );
}

const CtrlBtn = ({
  onClick,
  label,
  active = false,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="bg-transparent border-none flex flex-col items-center gap-1 cursor-pointer min-w-[35px] transition-all"
    style={{
      color: active ? "#31a3fa" : "#fff",
      opacity: active ? 1 : 0.7,
      fontSize: 10,
      fontWeight: active ? 700 : 400,
    }}
  >
    {children}
    {label}
  </button>
);

