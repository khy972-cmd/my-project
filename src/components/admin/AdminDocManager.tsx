import { useState, useMemo } from "react";
import { Search, X, FileText, Download, Eye, Filter } from "lucide-react";
import { formatDate } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DocRow {
  id: string;
  title: string;
  doc_type: string;
  file_ext: string | null;
  site_name: string | null;
  work_date: string | null;
  created_at: string;
  file_url: string | null;
}

type DocTypeFilter = "all" | "photo" | "drawing" | "cert" | "company" | "other";

export default function AdminDocManager() {
  const { isTestMode } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>("all");

  const MOCK_DOCS: DocRow[] = [
    { id: "d1", title: "강남 오피스텔 3층 슬라브 배근 사진", doc_type: "photo", file_ext: "jpg", site_name: "강남 오피스텔 신축", work_date: "2026-02-23", created_at: "2026-02-23T10:00:00Z", file_url: null },
    { id: "d2", title: "판교 데이터센터 구조 도면 v3", doc_type: "drawing", file_ext: "pdf", site_name: "판교 데이터센터", work_date: "2026-02-22", created_at: "2026-02-22T14:00:00Z", file_url: null },
    { id: "d3", title: "송도 물류센터 콘크리트 타설 확인서", doc_type: "cert", file_ext: "pdf", site_name: "송도 물류센터", work_date: "2026-02-21", created_at: "2026-02-21T16:30:00Z", file_url: null },
    { id: "d4", title: "2026년 안전관리 지침서", doc_type: "company", file_ext: "pdf", site_name: null, work_date: null, created_at: "2026-02-20T09:00:00Z", file_url: null },
    { id: "d5", title: "여의도 리모델링 벽체 배근 사진", doc_type: "photo", file_ext: "jpg", site_name: "여의도 리모델링", work_date: "2026-02-20", created_at: "2026-02-20T11:00:00Z", file_url: null },
    { id: "d6", title: "인천공항 T2 거푸집 설치 사진", doc_type: "photo", file_ext: "png", site_name: "인천공항 T2 확장", work_date: "2026-02-19", created_at: "2026-02-19T15:00:00Z", file_url: null },
    { id: "d7", title: "판교 데이터센터 전기 도면", doc_type: "drawing", file_ext: "dwg", site_name: "판교 데이터센터", work_date: "2026-02-18", created_at: "2026-02-18T10:00:00Z", file_url: null },
    { id: "d8", title: "강남 오피스텔 완료확인서", doc_type: "cert", file_ext: "pdf", site_name: "강남 오피스텔 신축", work_date: "2026-02-17", created_at: "2026-02-17T17:00:00Z", file_url: null },
  ];

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin-docs", isTestMode],
    queryFn: async () => {
      if (isTestMode) return MOCK_DOCS;

      const { data, error } = await supabase
        .from("documents")
        .select("id, title, doc_type, file_ext, site_name, work_date, created_at, file_url")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as DocRow[];
    },
  });

  const filtered = useMemo(() => {
    return docs.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.title.toLowerCase().includes(q) || (d.site_name || "").toLowerCase().includes(q);
      const matchType = typeFilter === "all" || d.doc_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [docs, search, typeFilter]);

  const stats = useMemo(() => ({
    total: docs.length,
    photo: docs.filter(d => d.doc_type === "photo").length,
    drawing: docs.filter(d => d.doc_type === "drawing").length,
    cert: docs.filter(d => d.doc_type === "cert" || d.doc_type === "completion").length,
    company: docs.filter(d => d.doc_type === "company").length,
  }), [docs]);

  const DOC_TYPE_LABEL: Record<string, string> = {
    photo: "사진", drawing: "도면", cert: "확인서", completion: "완료확인서", company: "회사서류", other: "기타",
  };

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-lg-app font-[800] text-header-navy mb-0.5">문서 관리</h1>
      <p className="text-[15px] text-text-sub font-medium mb-5">전체 문서 현황 조회</p>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {[
          { key: "all" as const, label: "전체", val: stats.total, cls: "bg-slate-50 text-slate-700 border-slate-200" },
          { key: "photo" as const, label: "사진", val: stats.photo, cls: "bg-sky-50 text-sky-700 border-sky-200" },
          { key: "drawing" as const, label: "도면", val: stats.drawing, cls: "bg-violet-50 text-violet-700 border-violet-200" },
          { key: "cert" as const, label: "확인서", val: stats.cert, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { key: "company" as const, label: "회사", val: stats.company, cls: "bg-amber-50 text-amber-800 border-amber-200" },
        ].map(c => (
          <button
            key={c.key}
            onClick={() => setTypeFilter(c.key)}
            className={cn(
              "p-2 rounded-xl text-center border cursor-pointer transition-all active:scale-[0.98]",
              c.cls,
              typeFilter === c.key && "translate-y-[-1px] ring-1 ring-current/20 shadow-soft"
            )}
          >
            <div className="text-[16px] font-[800]">{c.val}</div>
            <div className="text-[10px] font-bold">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="문서명 또는 현장명 검색"
          className="w-full h-[48px] bg-card border border-border rounded-xl pl-4 pr-10 text-[15px] font-medium outline-none focus:border-primary focus:shadow-input-focus" />
        {search ? <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-muted-foreground" /></button>
          : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Doc List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">문서가 없습니다</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="bg-card rounded-xl shadow-soft p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-foreground truncate">{doc.title}</div>
                <div className="text-[12px] text-text-sub font-medium flex items-center gap-2">
                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-bold">{DOC_TYPE_LABEL[doc.doc_type] || doc.doc_type}</span>
                  {doc.site_name && <span className="truncate">{doc.site_name}</span>}
                  <span>{formatDate(doc.created_at)}</span>
                </div>
              </div>
              {doc.file_ext && (
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded uppercase flex-shrink-0">
                  {doc.file_ext}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
