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
  documentRef: RefObject<HTMLDivElement>;
  formRef: RefObject<{ reset: () => void }>;
  signatureDataUrl: string | null;
  onSignatureClick: () => void;
  onZoomChange?: (nextZoom: number) => void;
}

export default function ConfirmDocumentViewer({
  zoom,
  isPanning,
  documentRef,
  formRef,
  signatureDataUrl,
  onSignatureClick,
  onZoomChange,
}: ConfirmDocumentViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const clampZoom = (value: number) => Math.min(3, Math.max(0.3, value));

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
    // 트랙패드/마우스 휠로 부드럽게 확대/축소
    e.preventDefault();
    const delta = e.deltaY;
    const step = delta < 0 ? 0.08 : -0.08;
    onZoomChange(clampZoom(zoom + step));
  };

  return (
    <div
      ref={viewportRef}
      className="flex-1 relative overflow-hidden flex items-center justify-center"
      style={{
        marginTop: 60,
        cursor: isPanning ? "grab" : "default",
        // 이동 모드가 아닐 때는 브라우저 기본 핀치-줌을 허용
        touchAction: isPanning ? "none" : "pan-x pan-y",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        ref={wrapperRef}
        className="origin-center transition-transform duration-75"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
        }}
      >
        <DocumentForm
          ref={formRef}
          documentRef={documentRef}
          signatureDataUrl={signatureDataUrl}
          onSignatureClick={onSignatureClick}
        />
      </div>
    </div>
  );
}

interface DocumentFormProps {
  documentRef: RefObject<HTMLDivElement>;
  signatureDataUrl: string | null;
  onSignatureClick: () => void;
}

const DocumentForm = forwardRef<{ reset: () => void }, DocumentFormProps>(
  ({ documentRef, signatureDataUrl, onSignatureClick }, ref) => {
    const [site, setSite] = useState("자이 아파트 101동");
    const [company, setCompany] = useState("");
    const [workName, setWorkName] = useState("");
    const [period, setPeriod] = useState("");
    const [content, setContent] = useState("* 지하주차장 PC부재 균열보수 완료\n* ");
    const [notes, setNotes] = useState("");
    const [org, setOrg] = useState("(주)이노피앤씨");
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
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: `"Pretendard Variable", Pretendard, sans-serif`,
        }}
      >
        <div className="text-center mb-[30px] border-b-[3px] border-double border-black pb-[15px]">
          <h1 className="text-[36px] font-black tracking-[5px] text-[#111] m-0">작 업 완 료 확 인 서</h1>
        </div>

        <table
          className="w-full border-collapse mb-5"
          style={{ border: "2px solid #1e293b", tableLayout: "fixed" }}
        >
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "48%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <tbody>
            <tr>
              <Th>현 장 명</Th>
              <Td>
                <AutoTextarea value={site} onChange={setSite} placeholder="내용 입력" />
              </Td>
              <Th>업 체</Th>
              <Td>
                <AutoTextarea value={company} onChange={setCompany} placeholder="업체명 입력" />
              </Td>
            </tr>
            <tr>
              <Th>공 사 명</Th>
              <Td>
                <AutoTextarea value={workName} onChange={setWorkName} placeholder="공사명 입력" />
              </Td>
              <Th>공사기간</Th>
              <Td>
                <AutoTextarea value={period} onChange={setPeriod} placeholder="기간 입력" />
              </Td>
            </tr>
          </tbody>
        </table>

        <SectionBlock title="작업내용">
          <textarea
            className="flex-1 w-full border-none bg-transparent text-[16px] font-semibold text-black outline-none resize-none leading-relaxed"
            style={{ fontFamily: "inherit" }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="상세 내용"
          />
        </SectionBlock>

        <SectionBlock title="특기사항" className="h-[150px]">
          <textarea
            className="flex-1 w-full border-none bg-transparent text-[16px] font-semibold text-black outline-none resize-none"
            style={{ fontFamily: "inherit" }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항"
          />
        </SectionBlock>

        <div className="mt-[10px] text-center">
          <div className="text-[20px] font-extrabold mb-[25px]">
            상기 사항과 같이 작업을 완료하였음을 확인합니다.
          </div>

          <input
            type="text"
            className="text-[20px] font-extrabold text-center w-full border-none bg-transparent outline-none mb-[30px]"
            style={{ fontFamily: "inherit" }}
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
          />

          <div
            className="grid mb-5"
            style={{
              gridTemplateColumns: "33% 27% 40%",
              border: "2px solid #1e293b",
            }}
          >
            <div className="bg-[#f8fafc] flex flex-col justify-center items-center p-[10px] gap-2 border-r border-[#1e293b]">
              <span className="font-extrabold text-[18px] text-[#334155]">소 속 :</span>
              <input
                type="text"
                className="text-center text-[18px] font-bold w-full border-b border-dashed border-[#cbd5e1] bg-transparent outline-none"
                style={{ fontFamily: "inherit" }}
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="소속 입력"
              />
            </div>

            <div className="bg-[#f8fafc] flex flex-col justify-center items-center p-[10px] gap-2 border-r border-[#1e293b]">
              <span className="font-extrabold text-[18px] text-[#334155]">성 명 :</span>
              <input
                type="text"
                className="text-center text-[18px] font-bold w-full border-b border-dashed border-[#cbd5e1] bg-transparent outline-none"
                style={{ fontFamily: "inherit" }}
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="이름 입력"
              />
            </div>

            <div
              className="relative bg-white h-[180px] flex flex-col overflow-hidden cursor-pointer hover:bg-[#f0f9ff]"
              onClick={onSignatureClick}
            >
              <div className="px-3 py-2 font-bold text-[14px] text-[#64748b] border-b border-dashed border-[#e2e8f0] pointer-events-none text-left">
                확인자 (서명)
              </div>
              <div className="flex-1 w-full relative flex items-center justify-center">
                {signatureDataUrl ? (
                  <img
                    src={signatureDataUrl}
                    alt="서명"
                    className="max-w-[90%] max-h-[90%] object-contain"
                  />
                ) : (
                  <span className="text-[#94a3b8] font-bold text-sm bg-white/80 px-2 py-1 rounded">
                    서명하려면 터치
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center items-end gap-2 h-[80px]">
            <input
              type="text"
              className="text-center text-[24px] font-extrabold w-[300px] border-b-2 border-black bg-transparent outline-none"
              style={{
                fontFamily: "inherit",
                height: 60,
                paddingTop: 20,
                paddingBottom: 0,
                lineHeight: 1.4,
                marginBottom: 3,
              }}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="회사명"
            />
            <input
              type="text"
              className="w-[60px] text-left text-[20px] font-bold border-none bg-transparent outline-none"
              style={{ fontFamily: "inherit", marginBottom: 10 }}
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  },
);

DocumentForm.displayName = "ConfirmDocumentForm";

const Th = ({ children }: { children: React.ReactNode }) => (
  <th
    className="bg-[#f8fafc] font-extrabold text-center text-[16px] text-[#334155]"
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
  <td style={{ border: "1px solid #1e293b", padding: 8, verticalAlign: "middle" }}>{children}</td>
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
  <div
    className={`p-[15px] flex flex-col mb-5 ${className}`}
    style={{ border: "2px solid #1e293b" }}
  >
    <div className="text-[18px] font-extrabold text-[#1e293b] mb-3 pl-3 border-l-[5px] border-[#475569]">
      {title}
    </div>
    {children}
  </div>
);

const AutoTextarea = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      className="w-full border-none bg-transparent text-[16px] font-semibold text-black outline-none resize-none overflow-hidden"
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

