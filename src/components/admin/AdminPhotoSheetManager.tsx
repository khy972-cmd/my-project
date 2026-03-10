import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, FileImage, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { usePhotoSheets } from "@/hooks/usePhotoSheets";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorklogs } from "@/hooks/useSupabaseWorklogs";
import { isAttachmentRef } from "@/lib/attachmentStore";
import { formatDate, formatDateTime, getTodayYYYYMMDD } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import AdminDrawingManager from "@/components/admin/AdminDrawingManager";

interface SiteOption {
  key: string;
  siteValue: string;
  siteName: string;
}

function normalizeSiteToken(value: string) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").trim();
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSameSite(aValue: string, aName: string, bValue: string, bName: string) {
  const aValueToken = normalizeSiteToken(aValue);
  const aNameToken = normalizeSiteToken(aName);
  const bValueToken = normalizeSiteToken(bValue);
  const bNameToken = normalizeSiteToken(bName);

  if (aValueToken && bValueToken && aValueToken === bValueToken) return true;
  if (aNameToken && bNameToken && aNameToken === bNameToken) return true;
  if (aNameToken && bValueToken && aNameToken === bValueToken) return true;
  if (aValueToken && bNameToken && aValueToken === bNameToken) return true;
  return false;
}

function isReceiptStatus(status: string) {
  const raw = String(status || "").trim().toLowerCase();
  return raw === "receipt" || raw === "confirm" || raw === "confirmation" || raw === "확인서";
}

function readLegacyUrl(input: unknown) {
  if (!input || typeof input !== "object") return "";
  const row = input as { url?: string; img?: string };
  if (typeof row.url === "string" && row.url.trim()) return row.url;
  if (typeof row.img === "string" && row.img.trim()) return row.img;
  return "";
}


export default function AdminPhotoSheetManager() {
  const navigate = useNavigate();
  const { isAdmin, isManager } = useUserRole();
  const canApprove = isAdmin || isManager;
  const { data: worklogs = [] } = useWorklogs();
  const {
    drafts,
    finals,
    isLoading,
    buildDraftFromSources,
    normalizeItemStatus,
    saveDraft,
    approveDraft,
    reopenDraft,
    isSavingDraft,
    isApprovingDraft,
    isReopeningDraft,
  } = usePhotoSheets();

  const siteOptions = useMemo<SiteOption[]>(() => {
    const map = new Map<string, SiteOption>();
    const upsert = (siteValueRaw: string, siteNameRaw: string) => {
      const siteValue = String(siteValueRaw || "").trim();
      const siteName = String(siteNameRaw || "").trim() || siteValue;
      if (!siteValue && !siteName) return;
      const key = `${normalizeSiteToken(siteValue || siteName)}::${normalizeSiteToken(siteName || siteValue)}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          siteValue: siteValue || siteName,
          siteName: siteName || siteValue,
        });
      }
    };

    drafts.forEach((item) => upsert(item.siteValue, item.siteName));
    finals.forEach((item) => upsert(item.siteValue, item.siteName));
    worklogs.forEach((item) => upsert(item.siteValue || "", item.siteName || ""));

    return [...map.values()].sort((a, b) => a.siteName.localeCompare(b.siteName, "ko"));
  }, [drafts, finals, worklogs]);

  const [selectedSiteKey, setSelectedSiteKey] = useState("");
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [activeView, setActiveView] = useState<"photosheet" | "drawing">("photosheet");

  useEffect(() => {
    if (siteOptions.length === 0) {
      setSelectedSiteKey("");
      return;
    }
    if (!siteOptions.some((site) => site.key === selectedSiteKey)) {
      setSelectedSiteKey(siteOptions[0].key);
    }
  }, [selectedSiteKey, siteOptions]);

  const selectedSite = useMemo(
    () => siteOptions.find((site) => site.key === selectedSiteKey) || null,
    [selectedSiteKey, siteOptions],
  );

  const selectedSiteWorklogs = useMemo(() => {
    if (!selectedSite) return [];
    return worklogs.filter((item) =>
      isSameSite(item.siteValue || "", item.siteName || "", selectedSite.siteValue, selectedSite.siteName),
    );
  }, [selectedSite, worklogs]);

  const selectedSitePhotoSources = useMemo(() => {
    const sortedLogs = [...selectedSiteWorklogs].sort((a, b) => (a.workDate || "").localeCompare(b.workDate || ""));
    const sources: Array<{
      attachmentRefId: string;
      title: string;
      status: "before" | "after";
      note: string;
      order: number;
      timestamp?: string;
      url?: string;
    }> = [];

    sortedLogs.forEach((log) => {
      (log.photos || []).forEach((item) => {
        if (!isAttachmentRef(item) || item.type !== "photo") return;
        if (isReceiptStatus(item.status)) return;
        const normalized = normalizeItemStatus(item.status, "after");
        sources.push({
          attachmentRefId: item.id,
          title: item.name?.trim() || `사진 ${sources.length + 1}`,
          status: normalized === "before" ? "before" : "after",
          note: "",
          order: sources.length + 1,
          timestamp: item.timestamp,
          url: readLegacyUrl(item) || undefined,
        });
      });
    });

    return sources;
  }, [normalizeItemStatus, selectedSiteWorklogs]);

  const latestWorkDate = useMemo(() => {
    if (selectedSiteWorklogs.length === 0) return "";
    return [...selectedSiteWorklogs]
      .map((item) => item.workDate || "")
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] || "";
  }, [selectedSiteWorklogs]);

  const filteredDrafts = useMemo(() => {
    if (!selectedSite) return [];
    return drafts
      .filter((draft) => isSameSite(draft.siteValue, draft.siteName, selectedSite.siteValue, selectedSite.siteName))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }, [drafts, selectedSite]);

  const filteredFinals = useMemo(() => {
    if (!selectedSite) return [];
    return finals
      .filter((item) => isSameSite(item.siteValue, item.siteName, selectedSite.siteValue, selectedSite.siteName))
      .sort((a, b) => (b.finalizedAt || "").localeCompare(a.finalizedAt || ""));
  }, [finals, selectedSite]);

  useEffect(() => {
    if (filteredDrafts.length === 0) {
      setSelectedDraftId("");
      return;
    }
    if (!filteredDrafts.some((draft) => draft.id === selectedDraftId)) {
      setSelectedDraftId(filteredDrafts[0].id);
    }
  }, [filteredDrafts, selectedDraftId]);

  const selectedDraft = useMemo(
    () => filteredDrafts.find((draft) => draft.id === selectedDraftId) || null,
    [filteredDrafts, selectedDraftId],
  );
  const latestFinal = filteredFinals[0] || null;

  const handleCreateDraft = async () => {
    if (!selectedSite) return;
    if (selectedSitePhotoSources.length === 0) {
      toast.error("선택한 현장의 사진이 없어 사진대지를 생성할 수 없습니다.");
      return;
    }

    setIsCreatingDraft(true);
    try {
      const draft = buildDraftFromSources({
        siteId: isUuid(selectedSite.siteValue) ? selectedSite.siteValue : undefined,
        siteValue: selectedSite.siteValue || selectedSite.siteName,
        siteName: selectedSite.siteName || selectedSite.siteValue,
        workDate: latestWorkDate || getTodayYYYYMMDD(),
        existing: filteredDrafts[0] || undefined,
        sources: selectedSitePhotoSources,
      });
      const saved = await saveDraft({
        ...draft,
        status: "draft",
        updatedAt: new Date().toISOString(),
      });
      setSelectedDraftId(saved.id);
      toast.success("선택한 현장 기준으로 사진대지 임시저장을 생성했습니다.");
    } catch {
      toast.error("사진대지 임시저장 생성에 실패했습니다.");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDraft || !canApprove || selectedDraft.status === "finalized") return;
    try {
      await approveDraft(selectedDraft);
      toast.success("사진대지를 승인했습니다.");
    } catch {
      toast.error("사진대지 승인에 실패했습니다.");
    }
  };

  const handleReopen = async () => {
    if (!selectedDraft || !canApprove || selectedDraft.status !== "finalized") return;
    try {
      await reopenDraft(selectedDraft);
      toast.success("사진대지 승인 상태를 해제했습니다.");
    } catch {
      toast.error("사진대지 승인 해제에 실패했습니다.");
    }
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">사진대지 · 도면 관리</h1>
        <p className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium text-text-sub md:text-[15px]">
          사진·도면 검토 후 확정합니다.
        </p>
      </div>

      <div className="mb-4 inline-flex rounded-2xl border border-border bg-card p-1 shadow-soft">
        <button
          type="button"
          onClick={() => setActiveView("photosheet")}
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-bold transition-colors",
            activeView === "photosheet"
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
              : "text-text-sub hover:bg-muted/70 hover:text-header-navy",
          )}
        >
          사진대지
        </button>
        <button
          type="button"
          onClick={() => setActiveView("drawing")}
          className={cn(
            "inline-flex h-10 items-center rounded-xl px-4 text-[13px] font-bold transition-colors",
            activeView === "drawing"
              ? "bg-slate-100 text-slate-800 ring-1 ring-slate-200"
              : "text-text-sub hover:bg-muted/70 hover:text-header-navy",
          )}
        >
          도면마킹
        </button>
      </div>

      {activeView === "drawing" ? (
        <AdminDrawingManager
          siteOptions={siteOptions}
          selectedSiteKey={selectedSiteKey}
          onSelectSiteKey={setSelectedSiteKey}
          selectedSiteWorklogs={selectedSiteWorklogs}
        />
      ) : siteOptions.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-soft p-6 text-sm text-muted-foreground">
          등록된 사진대지/작업일지 현장이 없습니다.
        </div>
      ) : (
        <>
          <div className="mb-4 space-y-2.5 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 shadow-soft">
            <label className="block text-[13px] font-bold text-text-sub">현장 선택</label>
            <div className="relative">
              <select
                value={selectedSiteKey}
                onChange={(event) => setSelectedSiteKey(event.target.value)}
                className="h-[44px] w-full appearance-none rounded-xl border border-amber-200 bg-card px-3 pr-10 text-[14px] font-medium outline-none focus:border-amber-300"
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
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                임시저장 {filteredDrafts.length}건
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                승인본 {filteredFinals.length}건
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                현장 사진 {selectedSitePhotoSources.length}건
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateDraft()}
              disabled={isCreatingDraft || isSavingDraft || selectedSitePhotoSources.length === 0}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 text-[13px] font-bold text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              현장 사진으로 임시저장 생성
            </button>
            <button
              type="button"
              onClick={() => {
                const site = siteOptions.find((s) => s.key === selectedSiteKey);
                const name = site?.siteName ? encodeURIComponent(site.siteName) : "";
                navigate(`/photo-sheet${name ? `?siteName=${name}` : ""}`);
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 text-[13px] font-bold text-primary transition-colors hover:bg-primary/20"
            >
              <FileImage className="h-3.5 w-3.5" />
              사진대지 생성(스마트)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="bg-card rounded-2xl shadow-soft p-4">
              <h2 className="text-[16px] font-[800] text-header-navy mb-3">임시저장 목록</h2>
              {filteredDrafts.length === 0 ? (
                <div className="text-[13px] text-muted-foreground">선택한 현장의 임시저장이 없습니다.</div>
              ) : (
                <div className="space-y-2">
                  {filteredDrafts.map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => setSelectedDraftId(draft.id)}
                      className={cn(
                        "w-full text-left border rounded-xl p-3 cursor-pointer transition-all",
                        selectedDraftId === draft.id
                          ? "border-amber-200 bg-amber-50/80 shadow-soft"
                          : "border-border bg-background hover:bg-muted/40",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14px] font-[700] text-foreground">{draft.workDate}</span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-1 text-[11px] font-bold",
                            draft.status === "finalized"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {draft.status === "finalized" ? "승인완료" : "임시저장"}
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-text-sub">
                        기준일 {formatDate(draft.workDate)} · 항목 {draft.items.length}건 · 수정{" "}
                        {formatDateTime(draft.updatedAt)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="bg-card rounded-2xl shadow-soft p-4">
                <h2 className="text-[16px] font-[800] text-header-navy mb-3">임시저장 상세</h2>
                {!selectedDraft ? (
                  <div className="text-[13px] text-muted-foreground">확인할 임시저장을 선택하세요.</div>
                ) : (
                  <div className="space-y-2">
                    <InfoRow label="현장" value={selectedDraft.siteName} />
                    <InfoRow label="상태" value={selectedDraft.status === "finalized" ? "승인완료" : "임시저장"} />
                    <InfoRow label="기준일" value={formatDate(selectedDraft.workDate)} />
                    <InfoRow label="건수" value={`${selectedDraft.items.length}건`} />
                    {canApprove && (
                      <div className="pt-2 flex gap-2">
                        {selectedDraft.status !== "finalized" && (
                          <button
                            type="button"
                            onClick={() => void handleApprove()}
                            disabled={isApprovingDraft || isReopeningDraft}
                            className="flex-1 h-10 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            승인
                          </button>
                        )}
                        {selectedDraft.status === "finalized" && (
                          <button
                            type="button"
                            onClick={() => void handleReopen()}
                            disabled={isApprovingDraft || isReopeningDraft}
                            className="flex-1 h-10 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold text-[13px] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            승인해제
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl shadow-soft p-4">
                <h2 className="text-[16px] font-[800] text-header-navy mb-3">최신 승인본</h2>
                {!latestFinal ? (
                  <div className="text-[13px] text-muted-foreground">선택한 현장의 승인본이 없습니다.</div>
                ) : (
                  <div className="space-y-2">
                    <InfoRow label="기준일" value={formatDate(latestFinal.workDate)} />
                    <InfoRow label="확정일" value={formatDateTime(latestFinal.finalizedAt)} />
                    <InfoRow label="건수" value={`${latestFinal.items.length}건`} />
                    <div className="pt-2">
                      <div className="text-[12px] font-bold text-text-sub mb-1">승인본 목록</div>
                      <div className="space-y-1.5">
                        {filteredFinals.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-2 text-[12px] text-emerald-800"
                          >
                            <span>{formatDate(item.workDate)}</span>
                            <span>{item.items.length}건</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
      <div className="text-[12px] font-bold text-text-sub mb-1">{label}</div>
      <div className="text-[14px] font-bold text-foreground">{value}</div>
    </div>
  );
}
