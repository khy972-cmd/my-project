import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Eye,
  Layers3,
  RefreshCw,
  ScanLine,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import DrawingMarkingOverlay from "@/components/overlays/DrawingMarkingOverlay";
import { getObjectUrl, isAttachmentRef } from "@/lib/attachmentStore";
import { formatDate } from "@/lib/dateFormat";
import {
  getAdminDrawingsForSite,
  getConstructionDrawingsForSite,
  removeAdminDrawingForSite,
  saveAdminDrawingsForSite,
  saveConstructionDrawingsForSite,
  type SiteDrawingBucketEntry,
  type WorklogEntry,
} from "@/lib/worklogStore";
import { cn } from "@/lib/utils";

interface SiteOption {
  key: string;
  siteValue: string;
  siteName: string;
}

interface AdminDrawingManagerProps {
  siteOptions: SiteOption[];
  selectedSiteKey: string;
  onSelectSiteKey: (value: string) => void;
  selectedSiteWorklogs: WorklogEntry[];
}

interface DrawingAssetCard {
  id: string;
  name: string;
  img: string;
  workDate: string;
  timestamp: string;
  section: "source" | "draft" | "final";
  badge: string;
  badgeClassName: string;
  sourceMeta: string;
  isMarkable: boolean;
  storageId?: string;
  sourceDrawingId?: string;
}


function isPdfAsset(url: string, name?: string) {
  const target = `${url} ${name || ""}`.toLowerCase();
  return target.includes("application/pdf") || target.endsWith(".pdf");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function dedupeCards(rows: DrawingAssetCard[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.section}:${row.storageId || row.id}:${row.img}:${row.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AdminDrawingManager({
  siteOptions,
  selectedSiteKey,
  onSelectSiteKey,
  selectedSiteWorklogs,
}: AdminDrawingManagerProps) {
  const selectedSite = useMemo(
    () => siteOptions.find((site) => site.key === selectedSiteKey) || null,
    [selectedSiteKey, siteOptions],
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [resolvedDrawingUrls, setResolvedDrawingUrls] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<{ open: boolean; title: string; src: string; isPdf: boolean }>({
    open: false,
    title: "",
    src: "",
    isPdf: false,
  });
  const [marking, setMarking] = useState<{ open: boolean; asset: DrawingAssetCard | null }>({
    open: false,
    asset: null,
  });
  const drawingInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const unresolvedIds = Array.from(
      new Set(
        selectedSiteWorklogs.flatMap((log) =>
          (log.drawings || [])
            .map((item) => {
              if (!isAttachmentRef(item) || !item.id) return "";
              const legacyUrl = (item.url || item.img || "").trim();
              if (legacyUrl || resolvedDrawingUrls[item.id]) return "";
              return item.id;
            })
            .filter(Boolean),
        ),
      ),
    );

    if (unresolvedIds.length === 0) return;

    const resolve = async () => {
      const entries: Array<[string, string]> = [];
      for (const refId of unresolvedIds) {
        const url = await getObjectUrl(refId);
        if (url) entries.push([refId, url]);
      }

      if (cancelled || entries.length === 0) return;
      setResolvedDrawingUrls((prev) => {
        const next = { ...prev };
        entries.forEach(([id, url]) => {
          if (!next[id]) next[id] = url;
        });
        return next;
      });
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [resolvedDrawingUrls, selectedSiteWorklogs]);

  const siteKeyValue = selectedSite?.siteValue || selectedSite?.siteName || "";
  const constructionDrawings = useMemo(
    () =>
      selectedSite ? getConstructionDrawingsForSite(siteKeyValue, selectedSite.siteName) : ([] as SiteDrawingBucketEntry[]),
    [reloadToken, selectedSite, siteKeyValue],
  );
  const adminDrafts = useMemo(
    () => (selectedSite ? getAdminDrawingsForSite(siteKeyValue, selectedSite.siteName, "draft") : []),
    [reloadToken, selectedSite, siteKeyValue],
  );
  const adminFinals = useMemo(
    () => (selectedSite ? getAdminDrawingsForSite(siteKeyValue, selectedSite.siteName, "final") : []),
    [reloadToken, selectedSite, siteKeyValue],
  );

  const sourceCards = useMemo(() => {
    const linkedConstruction = constructionDrawings.map((item, index) => ({
      id: `source_construction_${item.id || index}`,
      name: item.name || `공사도면 ${index + 1}`,
      img: item.img,
      workDate: item.workDate || item.timestamp.slice(0, 10),
      timestamp: item.timestamp,
      section: "source" as const,
      badge: "연결도면",
      badgeClassName: "border-slate-300 bg-slate-100 text-slate-700",
      sourceMeta: "현장 원본 도면",
      isMarkable: !isPdfAsset(item.img, item.name),
      sourceDrawingId: item.id,
    }));

    const linkedWorklogs = selectedSiteWorklogs.flatMap((log) =>
      (log.drawings || [])
        .map((item, index) => {
          const legacyUrl = isAttachmentRef(item) ? (item.url || item.img || "").trim() : "";
          const url = legacyUrl || (isAttachmentRef(item) && item.id ? resolvedDrawingUrls[item.id] || "" : "");
          if (!url) return null;

          const statusLabel =
            log.status === "approved"
              ? "일지 완료"
              : log.status === "pending"
                ? "일지 진행"
                : log.status === "rejected"
                  ? "일지 반려"
                  : "일지 임시";
          const badgeClassName =
            log.status === "approved"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : log.status === "pending"
                ? "border-sky-200 bg-sky-50 text-sky-700"
                : log.status === "rejected"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-amber-200 bg-amber-50 text-amber-800";

          return {
            id: `source_worklog_${log.id}_${isAttachmentRef(item) ? item.id || index : index}`,
            name: (isAttachmentRef(item) && item.name?.trim()) || `${log.workDate || "현장"} 도면 ${index + 1}`,
            img: url,
            workDate: log.workDate || (isAttachmentRef(item) ? item.workDate || "" : ""),
            timestamp: (isAttachmentRef(item) && item.timestamp) || log.createdAt || new Date().toISOString(),
            section: "source" as const,
            badge: statusLabel,
            badgeClassName,
            sourceMeta: `${log.siteName || selectedSite?.siteName || "현장"} · ${statusLabel}`,
            isMarkable: !isPdfAsset(url, isAttachmentRef(item) ? item.name : undefined),
            sourceDrawingId: isAttachmentRef(item) ? item.id : undefined,
          };
        })
        .filter(Boolean) as DrawingAssetCard[],
    );

    return dedupeCards([...linkedConstruction, ...linkedWorklogs]).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [constructionDrawings, resolvedDrawingUrls, selectedSite?.siteName, selectedSiteWorklogs]);

  const draftCards = useMemo(
    () =>
      adminDrafts.map((item, index) => ({
        id: `draft_${item.id || index}`,
        storageId: item.id,
        name: item.name || `관리도면 ${index + 1}`,
        img: item.img,
        workDate: item.workDate || item.timestamp.slice(0, 10),
        timestamp: item.timestamp,
        section: "draft" as const,
        badge: "관리작업본",
        badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
        sourceMeta: "관리자 편집본",
        isMarkable: !isPdfAsset(item.img, item.name),
        sourceDrawingId: item.sourceDrawingId,
      })),
    [adminDrafts],
  );

  const finalCards = useMemo(
    () =>
      adminFinals.map((item, index) => ({
        id: `final_${item.id || index}`,
        storageId: item.id,
        name: item.name || `최종도면 ${index + 1}`,
        img: item.img,
        workDate: item.workDate || item.timestamp.slice(0, 10),
        timestamp: item.timestamp,
        section: "final" as const,
        badge: "최종양식",
        badgeClassName: "border-violet-200 bg-violet-50 text-violet-700",
        sourceMeta: "현장 카드 연결 완료",
        isMarkable: !isPdfAsset(item.img, item.name),
        sourceDrawingId: item.sourceDrawingId,
      })),
    [adminFinals],
  );
  const linkedWorklogDrawingCount = useMemo(
    () => sourceCards.filter((item) => item.badge.startsWith("일지")).length,
    [sourceCards],
  );

  const openPreview = (asset: DrawingAssetCard) => {
    setPreview({
      open: true,
      title: asset.name,
      src: asset.img,
      isPdf: isPdfAsset(asset.img, asset.name),
    });
  };

  const openMarking = (asset: DrawingAssetCard) => {
    if (!asset.isMarkable) {
      toast.error("이미지 도면만 마킹할 수 있습니다.");
      return;
    }
    setMarking({ open: true, asset });
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!selectedSite) return;
    const rows = Array.from(files || []).filter((file) => file.type.startsWith("image/"));
    if (rows.length === 0) {
      toast.error("이미지 도면 파일을 선택해주세요.");
      return;
    }

    try {
      const drawings = await Promise.all(
        rows.map(async (file) => ({
          img: await readFileAsDataUrl(file),
          name: file.name,
          timestamp: new Date().toISOString(),
        })),
      );

      const saved = saveConstructionDrawingsForSite({
        siteValue: siteKeyValue,
        siteName: selectedSite.siteName,
        drawings,
      });
      if (saved.length === 0) {
        toast.error("저장 가능한 도면이 없습니다.");
        return;
      }
      setReloadToken((prev) => prev + 1);
      toast.success(`${saved.length}건의 도면을 연결 원본으로 추가했습니다.`);
    } catch {
      toast.error("도면 업로드 중 오류가 발생했습니다.");
    }
  };

  const handleSaveMarkedDrawing = (markedImage: string) => {
    if (!selectedSite || !marking.asset || !markedImage) {
      setMarking({ open: false, asset: null });
      return;
    }

    const asset = marking.asset;
    const saved = saveAdminDrawingsForSite({
      siteValue: siteKeyValue,
      siteName: selectedSite.siteName,
      stage: "draft",
      drawings: [
        {
          id: asset.section === "draft" ? asset.storageId : undefined,
          img: markedImage,
          name:
            asset.section === "draft"
              ? asset.name
              : asset.name.includes("도면")
                ? `${asset.name.replace(/\s+최종$/, "")}`
                : `${selectedSite.siteName} 관리도면`,
          timestamp: new Date().toISOString(),
          workDate: asset.workDate,
          sourceDrawingId: asset.sourceDrawingId || asset.storageId || asset.id,
        },
      ],
    });

    if (saved.length > 0) {
      setReloadToken((prev) => prev + 1);
      toast.success("관리자 도면 작업본을 저장했습니다.");
    }
    setMarking({ open: false, asset: null });
  };

  const handleFinalizeDraft = (asset: DrawingAssetCard) => {
    if (!selectedSite || !asset.storageId) return;

    const saved = saveAdminDrawingsForSite({
      siteValue: siteKeyValue,
      siteName: selectedSite.siteName,
      stage: "final",
      drawings: [
        {
          img: asset.img,
          name: asset.name.includes("최종") ? asset.name : `${asset.name} 최종`,
          timestamp: new Date().toISOString(),
          workDate: asset.workDate,
          sourceDrawingId: asset.sourceDrawingId || asset.storageId,
        },
      ],
    });
    removeAdminDrawingForSite({
      siteValue: siteKeyValue,
      siteName: selectedSite.siteName,
      stage: "draft",
      drawingId: asset.storageId,
    });
    if (saved.length > 0) {
      setReloadToken((prev) => prev + 1);
      toast.success("최종 도면으로 확정했고 현장 카드 완료도면에 연결했습니다.");
    }
  };

  const handleDeleteDrawing = (stage: "draft" | "final", asset: DrawingAssetCard) => {
    if (!selectedSite || !asset.storageId) return;
    removeAdminDrawingForSite({
      siteValue: siteKeyValue,
      siteName: selectedSite.siteName,
      stage,
      drawingId: asset.storageId,
    });
    setReloadToken((prev) => prev + 1);
    toast.success(stage === "final" ? "최종 도면을 제거했습니다." : "관리 작업본을 제거했습니다.");
  };

  const handleCopyFinalToDraft = (asset: DrawingAssetCard) => {
    if (!selectedSite) return;
    const saved = saveAdminDrawingsForSite({
      siteValue: siteKeyValue,
      siteName: selectedSite.siteName,
      stage: "draft",
      drawings: [
        {
          img: asset.img,
          name: asset.name.replace("최종", "관리"),
          timestamp: new Date().toISOString(),
          workDate: asset.workDate,
          sourceDrawingId: asset.sourceDrawingId || asset.storageId,
        },
      ],
    });
    if (saved.length > 0) {
      setReloadToken((prev) => prev + 1);
      toast.success("최종 도면을 관리 작업본으로 복제했습니다.");
    }
  };

  if (siteOptions.length === 0) {
    return (
      <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-soft">
        연동할 현장 도면 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end md:-mt-[56px] md:mb-0">
        <button
          type="button"
          onClick={() => drawingInputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Upload className="h-3.5 w-3.5" />
          직접 도면 업로드
        </button>
        <button
          type="button"
          onClick={() =>
            toast.success(
              `${selectedSite?.siteName || "현장"} 기준으로 홈/작업일지 도면 ${sourceCards.length}건을 관리자 도면 목록에 반영했습니다.`,
            )
          }
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-[13px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <Layers3 className="h-3.5 w-3.5" />
          연동 현황 확인
        </button>
      </div>

      <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-[13px] font-bold text-text-sub">현장 선택</label>
          <button
            type="button"
            onClick={() => setReloadToken((prev) => prev + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-bold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </button>
        </div>

        <div className="relative">
          <select
            value={selectedSiteKey}
            onChange={(event) => onSelectSiteKey(event.target.value)}
            className="h-[44px] w-full appearance-none rounded-xl border border-slate-200 bg-card px-3 pr-10 text-[14px] font-medium outline-none focus:border-slate-300"
          >
            {siteOptions.map((site) => (
              <option key={site.key} value={site.key}>
                {site.siteName}
              </option>
            ))}
          </select>
          <ChevronDown
            strokeWidth={1.7}
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: "연동 도면", value: sourceCards.length, cls: "border-slate-200 bg-white text-slate-700" },
            { label: "관리 작업본", value: draftCards.length, cls: "border-sky-200 bg-sky-50 text-sky-700" },
            { label: "최종 양식", value: finalCards.length, cls: "border-violet-200 bg-violet-50 text-violet-700" },
            { label: "일지 도면", value: linkedWorklogDrawingCount, cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          ].map((item) => (
            <div key={item.label} className={cn("rounded-xl border px-3 py-3 text-center", item.cls)}>
              <div className="text-[20px] font-[800]">{item.value}</div>
              <div className="text-[12px] font-bold">{item.label}</div>
            </div>
          ))}
        </div>

        <input
          ref={drawingInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleUploadFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-[800] text-header-navy">연동 도면</h2>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
              {sourceCards.length}건
            </span>
          </div>
          <p className="mb-3 text-[12px] text-text-sub">홈/작업일지와 연결된 현장 도면을 바로 마킹할 수 있습니다.</p>
          <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
            {sourceCards.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-10 text-center text-[13px] text-muted-foreground">
                연동된 도면이 없습니다.
              </div>
            ) : (
              sourceCards.map((asset) => (
                <article key={asset.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-[700] text-header-navy">{asset.name}</div>
                      <div className="mt-1 text-[12px] text-text-sub">
                        {formatDate(asset.workDate)} · {asset.sourceMeta}
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold", asset.badgeClassName)}>
                      {asset.badge}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(asset)}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-card text-[12px] font-bold text-text-sub transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      보기
                    </button>
                    <button
                      type="button"
                      onClick={() => openMarking(asset)}
                      disabled={!asset.isMarkable}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 text-[12px] font-bold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      도면마킹
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-[800] text-header-navy">관리 작업본</h2>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              {draftCards.length}건
            </span>
          </div>
          <p className="mb-3 text-[12px] text-text-sub">관리자 수정본을 검토한 뒤 최종 도면으로 확정합니다.</p>
          <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
            {draftCards.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-10 text-center text-[13px] text-muted-foreground">
                저장된 관리 작업본이 없습니다.
              </div>
            ) : (
              draftCards.map((asset) => (
                <article key={asset.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-[700] text-header-navy">{asset.name}</div>
                      <div className="mt-1 text-[12px] text-text-sub">
                        {formatDate(asset.workDate)} · {asset.sourceMeta}
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold", asset.badgeClassName)}>
                      {asset.badge}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-card text-[12px] font-bold text-text-sub transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      보기
                    </button>
                    <button
                      type="button"
                      onClick={() => openMarking(asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 text-[12px] font-bold text-sky-700 transition-colors hover:bg-sky-100"
                    >
                      <ScanLine className="h-3.5 w-3.5" />
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFinalizeDraft(asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 text-[12px] font-bold text-violet-700 transition-colors hover:bg-violet-100"
                    >
                      <Check className="h-3.5 w-3.5" />
                      확정
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDrawing("draft", asset)}
                    className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 text-[12px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    작업본 제거
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-[800] text-header-navy">최종 양식</h2>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
              {finalCards.length}건
            </span>
          </div>
          <p className="mb-3 text-[12px] text-text-sub">확정된 도면은 현장 카드의 완료도면으로 자동 연결됩니다.</p>
          <div className="max-h-[56vh] space-y-2 overflow-y-auto pr-1">
            {finalCards.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/40 px-4 py-10 text-center text-[13px] text-muted-foreground">
                확정된 최종 도면이 없습니다.
              </div>
            ) : (
              finalCards.map((asset) => (
                <article key={asset.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-[700] text-header-navy">{asset.name}</div>
                      <div className="mt-1 text-[12px] text-text-sub">
                        {formatDate(asset.workDate)} · {asset.sourceMeta}
                      </div>
                    </div>
                    <span className={cn("rounded-full border px-2 py-1 text-[10px] font-bold", asset.badgeClassName)}>
                      {asset.badge}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-border bg-card text-[12px] font-bold text-text-sub transition-colors hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      보기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyFinalToDraft(asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 text-[12px] font-bold text-sky-700 transition-colors hover:bg-sky-100"
                    >
                      <Layers3 className="h-3.5 w-3.5" />
                      작업본복제
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDrawing("final", asset)}
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 text-[12px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      제거
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {preview.open && (
        <div className="fixed inset-0 z-[70] bg-black/60 p-4" onClick={() => setPreview({ open: false, title: "", src: "", isPdf: false })}>
          <div className="mx-auto flex h-full max-w-5xl items-center justify-center">
            <div
              className="w-full rounded-2xl bg-card p-3 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0 truncate text-[15px] font-[800] text-header-navy">{preview.title}</div>
                <button
                  type="button"
                  onClick={() => setPreview({ open: false, title: "", src: "", isPdf: false })}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-text-sub transition-colors hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-hidden rounded-xl bg-slate-950/95 p-2">
                {preview.isPdf ? (
                  <iframe title={preview.title} src={preview.src} className="h-[72vh] w-full rounded-lg bg-white" />
                ) : (
                  <img src={preview.src} alt={preview.title} className="mx-auto max-h-[72vh] w-auto rounded-lg object-contain" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <DrawingMarkingOverlay
        isOpen={marking.open}
        imageSrc={marking.asset?.img || ""}
        onPrev={() => setMarking({ open: false, asset: null })}
        onSave={handleSaveMarkedDrawing}
        contextKey="admin-drawing-manager"
      />
    </div>
  );
}
