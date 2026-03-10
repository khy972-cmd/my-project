import React, { useState } from "react";
import type { InfoTemplate } from "../types";
import { Plus, Trash2, FileText, ChevronDown, Edit3, Check, Download, Loader2 } from "lucide-react";

interface SheetToolbarProps {
  siteName: string;
  onSiteNameChange: (name: string) => void;
  onAddPage: () => void;
  onDeletePage: () => void;
  pageCount: number;
  currentPage: number;
  onSelectPage: (index: number) => void;
  templates: InfoTemplate[];
  onApplyTemplate: (template: InfoTemplate) => void;
  onExportPdf: () => void;
  isExporting: boolean;
}

const SheetToolbar: React.FC<SheetToolbarProps> = ({
  siteName,
  onSiteNameChange,
  onAddPage,
  onDeletePage,
  pageCount,
  currentPage,
  onSelectPage,
  templates,
  onApplyTemplate,
  onExportPdf,
  isExporting,
}) => {
  const [isEditingSiteName, setIsEditingSiteName] = useState(false);
  const [tempName, setTempName] = useState(siteName);
  const [showTemplates, setShowTemplates] = useState(false);

  const confirmName = () => {
    onSiteNameChange(tempName);
    setIsEditingSiteName(false);
  };

  return (
    <div className="sticky top-0 z-20 border-b border-border shadow-sm backdrop-blur-sm bg-background/95">
      <div className="mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">현장명:</span>
          {isEditingSiteName ? (
            <div className="flex items-center gap-1">
              <input
                className="border border-input rounded px-2 py-0.5 text-sm bg-background text-foreground outline-none focus:ring-1 focus:ring-ring w-32 sm:w-auto"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmName()}
                autoFocus
              />
              <button type="button" onClick={confirmName} className="p-0.5 text-primary hover:text-primary/80">
                <Check size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempName(siteName);
                setIsEditingSiteName(true);
              }}
              className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors max-w-[140px] sm:max-w-none truncate"
            >
              {siteName}
              <Edit3 size={12} className="text-muted-foreground flex-shrink-0" />
            </button>
          )}
        </div>
        <div className="h-4 w-px bg-border mx-0.5" />
        <div className="flex items-center gap-1 overflow-x-auto">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPage(i)}
              className={`w-6 h-6 rounded text-[11px] font-medium transition-colors flex-shrink-0 ${
                i === currentPage ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button type="button" onClick={onAddPage} className="w-6 h-6 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center flex-shrink-0" title="페이지 추가">
            <Plus size={13} />
          </button>
          {pageCount > 1 && (
            <button type="button" onClick={onDeletePage} className="w-6 h-6 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center justify-center flex-shrink-0" title="현재 페이지 삭제">
              <Trash2 size={12} />
            </button>
          )}
        </div>
        <div className="h-4 w-px bg-border mx-0.5" />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground bg-secondary rounded px-2 py-1 transition-colors"
          >
            <FileText size={12} />
            <span className="hidden sm:inline">템플릿</span>
            <ChevronDown size={10} />
          </button>
          {showTemplates && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowTemplates(false)} aria-hidden />
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg py-1 z-30 min-w-[120px]">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      onApplyTemplate(tpl);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    {tpl.name}
                    <span className="text-muted-foreground ml-1">({tpl.rows.length}행)</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1 text-[11px] font-medium bg-primary text-primary-foreground rounded px-2.5 py-1 hover:bg-primary/90 transition-colors disabled:opacity-50 ml-auto"
        >
          {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          <span className="hidden sm:inline">{isExporting ? "생성중..." : "PDF"}</span>
        </button>
      </div>
    </div>
  );
};

export default SheetToolbar;
