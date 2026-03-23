import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";

interface ConfirmDocumentViewerProps {
  zoom: number;
  isPanning: boolean;
  isCapturing: boolean;
  documentRef: RefObject<HTMLDivElement>;
  formRef: RefObject<{ reset: () => void }>;
  signatureDataUrl: string | null;
  onSignatureClick: () => void;
  onZoomChange?: (nextZoom: number) => void;
  resetKey?: number;
}

export default function ConfirmDocumentViewer({
  zoom,
  isPanning,
  isCapturing,
  documentRef,
  formRef,
  signatureDataUrl,
  onSignatureClick,
  onZoomChange,
  resetKey,
}: ConfirmDocumentViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const touchRef = useRef<{
    mode: "pan" | "pinch";
    x: number;
    y: number;
    pinchDistance?: number;
    pinchZoom?: number;
  } | null>(null);

  const clampZoom = (value: number) => Math.min(3, Math.max(0.3, value));

  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    dragRef.current.dragging = false;
    touchRef.current = null;
  }, [resetKey]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "TEXTAREA", "BUTTON"].includes(tag)) return;

    e.preventDefault();
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return;
    e.preventDefault();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  };

  const handlePointerUp = () => {
    dragRef.current.dragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!onZoomChange) return;
    e.preventDefault();
    const step = e.deltaY < 0 ? 0.1 : -0.1;
    onZoomChange(clampZoom(zoom + step));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      const [a, b] = e.touches;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      touchRef.current = {
        mode: "pinch",
        x: 0,
        y: 0,
        pinchDistance: Math.hypot(dx, dy),
        pinchZoom: zoom,
      };
      return;
    }

    if (!isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchRef.current = {
      mode: "pan",
      x: touch.clientX,
      y: touch.clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;

    if (touchRef.current.mode === "pinch" && e.touches.length >= 2) {
      const [a, b] = e.touches;
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      const distance = Math.hypot(dx, dy);
      const baseDistance = touchRef.current.pinchDistance || distance;
      const baseZoom = touchRef.current.pinchZoom || zoom;
      e.preventDefault();
      onZoomChange?.(clampZoom((baseZoom * distance) / baseDistance));
      return;
    }

    if (touchRef.current.mode !== "pan" || !isPanning || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchRef.current.x;
    const dy = touch.clientY - touchRef.current.y;
    touchRef.current = { ...touchRef.current, x: touch.clientX, y: touch.clientY };
    e.preventDefault();
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
  };

  return (
    <div
      ref={viewportRef}
      className="mx-auto flex min-h-full w-full items-start justify-center px-3 py-5 sm:px-5"
      style={{
        cursor: isPanning ? "grab" : "default",
        touchAction: isPanning ? "none" : "pan-x pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        ref={wrapperRef}
        className="origin-top transition-transform duration-75"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
          willChange: "transform",
        }}
      >
        <DocumentForm
          ref={formRef}
          documentRef={documentRef}
          signatureDataUrl={signatureDataUrl}
          onSignatureClick={onSignatureClick}
          isCapturing={isCapturing}
        />
      </div>
    </div>
  );
}

interface DocumentFormProps {
  documentRef: RefObject<HTMLDivElement>;
  signatureDataUrl: string | null;
  onSignatureClick: () => void;
  isCapturing: boolean;
}

const DocumentForm = forwardRef<{ reset: () => void }, DocumentFormProps>(
  ({ documentRef, signatureDataUrl, onSignatureClick, isCapturing }, ref) => {
    const [site, setSite] = useState("자이 아파트 101동");
    const [company, setCompany] = useState("");
    const [workName, setWorkName] = useState("");
    const [period, setPeriod] = useState("");
    const [content, setContent] = useState("* 지하주차장 PC부재 균열보수 완료\n* ");
    const [notes, setNotes] = useState("");
    const [org, setOrg] = useState("");
    const [signerName, setSignerName] = useState("");
    const [recipient, setRecipient] = useState("");
    const [suffix, setSuffix] = useState("귀중");

    const d = new Date();
    const [dateStr, setDateStr] = useState(
      `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`,
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        setSite("");
        setCompany("");
        setWorkName("");
        setPeriod("");
        setContent("");
        setNotes("");
        setOrg("");
        setSignerName("");
        setRecipient("");
        setSuffix("귀중");
        const nd = new Date();
        setDateStr(`${nd.getFullYear()}년 ${nd.getMonth() + 1}월 ${nd.getDate()}일`);
      },
    }));

    return (
      <div
        ref={documentRef}
        className="bg-white text-black"
        style={{
          width: window.innerWidth < 768 ? "100%" : "210mm",
          minHeight: "297mm",
          maxHeight: "297mm",
          paddingTop: window.innerWidth < 768 ? "2.5mm" : "7.5mm",
          paddingBottom: window.innerWidth < 768 ? "2.5mm" : "7.5mm",
          paddingLeft: window.innerWidth < 768 ? "5mm" : "15mm",
          paddingRight: window.innerWidth < 768 ? "5mm" : "15mm",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: `"Pretendard Variable", Pretendard, sans-serif`,
        }}
      >
        <div className="mb-[15px] border-b-[3px] border-double border-black pb-[10px] text-center">
          <h1 className="m-0 text-[36px] font-black tracking-[5px] text-[#111]">작 업 완 료 확 인 서</h1>
        </div>

        <table
          className="mb-3 w-full border-collapse"
          style={{ border: "2px solid #1e293b", tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: window.innerWidth < 768 ? "18%" : "12%" }} />
            <col style={{ width: window.innerWidth < 768 ? "32%" : "48%" }} />
            <col style={{ width: window.innerWidth < 768 ? "18%" : "10%" }} />
            <col style={{ width: window.innerWidth < 768 ? "32%" : "30%" }} />
          </colgroup>
          <tbody>
            <tr>
              <Th>현 장 명</Th>
              <Td>
                <AutoTextarea
                  value={site}
                  onChange={setSite}
                  placeholder="내용 입력"
                  isCapturing={isCapturing}
                />
              </Td>
              <Th>업 체</Th>
              <Td>
                <AutoTextarea
                  value={company}
                  onChange={setCompany}
                  placeholder="업체명 입력"
                  isCapturing={isCapturing}
                />
              </Td>
            </tr>
            <tr>
              <Th>공 사 명</Th>
              <Td>
                <AutoTextarea
                  value={workName}
                  onChange={setWorkName}
                  placeholder="공사명 입력"
                  isCapturing={isCapturing}
                />
              </Td>
              <Th>공사기간</Th>
              <Td>
                <AutoTextarea
                  value={period}
                  onChange={setPeriod}
                  placeholder="기간 입력"
                  isCapturing={isCapturing}
                />
              </Td>
            </tr>
          </tbody>
        </table>

        <SectionBlock title="작업내용">
          {isCapturing ? (
            <CaptureField
              className="flex-1 w-full border-none bg-transparent text-[16px] font-semibold leading-relaxed text-black whitespace-pre-wrap break-words"
              style={{ fontFamily: "inherit" }}
              value={content}
              multiline
            />
          ) : (
            <textarea
              className="flex-1 w-full resize-none border-none bg-transparent text-[16px] font-semibold leading-relaxed text-black outline-none"
              style={{ fontFamily: "inherit" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="상세 내용"
            />
          )}
        </SectionBlock>

        <SectionBlock title="특기사항" className="h-[130px]">
          {isCapturing ? (
            <CaptureField
              className="flex-1 w-full border-none bg-transparent text-[16px] font-semibold text-black whitespace-pre-wrap break-words"
              style={{ fontFamily: "inherit" }}
              value={notes}
              multiline
            />
          ) : (
            <textarea
              className="flex-1 w-full resize-none border-none bg-transparent text-[16px] font-semibold text-black outline-none"
              style={{ fontFamily: "inherit" }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항"
            />
          )}
        </SectionBlock>

        <div className="mt-0 text-center">
          <div className="mb-[12px] text-[20px] font-extrabold">
            상기 사항과 같이 작업을 완료하였음을 확인합니다.
          </div>

          {isCapturing ? (
            <CaptureField
              className="mb-[15px] w-full border-none bg-transparent text-center text-[20px] font-extrabold"
              style={{ fontFamily: "inherit" }}
              value={dateStr}
            />
          ) : (
            <input
              type="text"
              className="mb-[15px] w-full border-none bg-transparent text-center text-[20px] font-extrabold outline-none"
              style={{ fontFamily: "inherit" }}
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          )}

          <div
            className="mb-3 grid"
            style={{
              gridTemplateColumns: "33% 27% 40%",
              border: "2px solid #1e293b",
            }}
          >
            <div className="flex flex-col items-center justify-center gap-2 border-r border-[#1e293b] bg-[#f8fafc] p-[10px]">
              <span className="text-[18px] font-extrabold text-[#334155]">소 속 :</span>
              {isCapturing ? (
                <CaptureField
                  className="w-full bg-transparent px-0 py-0.5 text-center text-[18px] font-bold leading-tight"
                  style={{ fontFamily: "inherit" }}
                  value={org}
                />
              ) : (
                <input
                  type="text"
                  className="w-full bg-transparent px-0 py-0.5 text-center text-[18px] font-bold leading-tight outline-none"
                  style={{ fontFamily: "inherit" }}
                  value={org}
                  onChange={(e) => {
                    const next = e.target.value;
                    setOrg(next);
                    setRecipient(next);
                  }}
                  placeholder="소속 입력"
                />
              )}
            </div>

            <div className="flex flex-col items-center justify-center gap-2 border-r border-[#1e293b] bg-[#f8fafc] p-[10px]">
              <span className="text-[18px] font-extrabold text-[#334155]">성 명 :</span>
              {isCapturing ? (
                <CaptureField
                  className="w-full bg-transparent px-0 py-0.5 text-center text-[18px] font-bold leading-tight"
                  style={{ fontFamily: "inherit" }}
                  value={signerName}
                />
              ) : (
                <input
                  type="text"
                  className="w-full bg-transparent px-0 py-0.5 text-center text-[18px] font-bold leading-tight outline-none"
                  style={{ fontFamily: "inherit" }}
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="이름 입력"
                />
              )}
            </div>

            <div
              className="relative h-[180px] cursor-pointer overflow-hidden bg-white hover:bg-[#f0f9ff]"
              onClick={onSignatureClick}
            >
              <div className="pointer-events-none border-b border-dashed border-[#e2e8f0] px-3 py-2 text-left text-[14px] font-bold text-[#64748b]">
                확인자 (서명)
              </div>
              <div className="flex h-[132px] w-full items-center justify-center overflow-hidden">
                {signatureDataUrl ? (
                  <div className="h-[90%] w-[90%]">
                    <img src={signatureDataUrl} alt="서명" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <span
                    data-html2canvas-ignore="true"
                    className="rounded bg-white/80 px-2 py-1 text-sm font-bold text-[#94a3b8]"
                  >
                    서명하려면 터치
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 pt-2">
            {isCapturing ? (
              <CaptureField
                className="w-[300px] border-b-2 border-black bg-transparent px-0 text-center text-[24px] font-extrabold"
                style={{ fontFamily: "inherit", lineHeight: 1.8, paddingBottom: "4px" }}
                value={recipient}
              />
            ) : (
              <input
                type="text"
                className="w-[300px] border-b-2 border-black bg-transparent px-0 text-center text-[24px] font-extrabold outline-none"
                style={{ fontFamily: "inherit", lineHeight: 1.8, paddingBottom: "4px" }}
                value={recipient}
                onChange={(e) => {
                  const next = e.target.value;
                  setRecipient(next);
                  setOrg(next);
                }}
                placeholder="회사명"
              />
            )}
            {isCapturing ? (
              <CaptureField
                className="recipient-suffix w-[60px] border-none bg-transparent px-0 text-left text-[20px] font-bold"
                style={{ fontFamily: "inherit", lineHeight: 1.8, paddingBottom: "4px" }}
                value={suffix}
              />
            ) : (
              <input
                type="text"
                className="recipient-suffix w-[60px] border-none bg-transparent px-0 text-left text-[20px] font-bold outline-none"
                style={{ fontFamily: "inherit", lineHeight: 1.8, paddingBottom: "4px" }}
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

DocumentForm.displayName = "ConfirmDocumentForm";

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    className="bg-[#f8fafc] text-center text-[16px] font-extrabold text-[#334155]"
    style={{
      border: "1px solid #1e293b",
      padding: 8,
      verticalAlign: "middle",
      wordBreak: "keep-all",
    }}
  >
    {children}
  </th>
);

const Td = ({ children }: { children: React.ReactNode }) => (
  <td
    style={{
      border: "1px solid #1e293b",
      padding: 8,
      verticalAlign: "middle",
      wordBreak: "break-word",
      overflowWrap: "anywhere",
    }}
  >
    {children}
  </td>
);

const SectionBlock = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`mb-3 flex flex-col p-[12px] ${className}`} style={{ border: "2px solid #1e293b" }}>
    <div className="mb-2 border-l-[5px] border-[#475569] pl-3 text-[18px] font-extrabold text-[#1e293b]">
      {title}
    </div>
    {children}
  </div>
);

const CaptureField = ({
  value,
  className,
  style,
  multiline = false,
}: {
  value: string;
  className: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) => (
  <div
    className={className}
    style={style}
    data-confirm-capture-field="1"
    data-capture-field-kind={multiline ? "textarea" : "input"}
  >
    {value || "\u00A0"}
  </div>
);

const AutoTextarea = ({
  value,
  onChange,
  placeholder,
  isCapturing,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isCapturing: boolean;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  if (isCapturing) {
    return (
      <CaptureField
        className="w-full border-none bg-transparent text-[16px] font-semibold text-black whitespace-pre-wrap break-words"
        style={{
          fontFamily: "inherit",
          minHeight: 24,
          lineHeight: 1.4,
          padding: 2,
        }}
        value={value}
        multiline
      />
    );
  }

  return (
    <textarea
      ref={ref}
      rows={1}
      className="w-full resize-none overflow-hidden border-none bg-transparent text-[16px] font-semibold text-black outline-none"
      style={{
        fontFamily: "inherit",
        minHeight: 24,
        lineHeight: 1.4,
        padding: 2,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
};
