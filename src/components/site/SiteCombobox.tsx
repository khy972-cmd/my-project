import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  matchesSiteSearch,
  readRecentSiteValues,
  RECENT_SITE_STORAGE_KEY,
  rememberRecentSiteValue,
} from "@/lib/siteList";

export type SiteComboboxOption = {
  value: string;
  label: string;
  siteId?: string;
  description?: string;
  keywords?: string[];
  trackRecent?: boolean;
};

type SiteComboboxProps = {
  options: SiteComboboxOption[];
  value: string;
  onChange: (option: SiteComboboxOption | null) => void;
  placeholder?: string;
  emptyText?: string;
  latestTitle?: string;
  recentTitle?: string;
  storageKey?: string;
  recentLimit?: number;
  resultLimit?: number;
  disabled?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  dropdownClassName?: string;
};

const BLUR_CLOSE_DELAY_MS = 120;

export default function SiteCombobox({
  options,
  value,
  onChange,
  placeholder = "현장 선택 또는 검색",
  emptyText = "검색 결과가 없습니다.",
  latestTitle = "최신 현장",
  recentTitle = "최근 현장",
  storageKey = RECENT_SITE_STORAGE_KEY,
  recentLimit = 2,
  resultLimit = 12,
  disabled = false,
  containerClassName,
  inputClassName,
  dropdownClassName,
}: SiteComboboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentValues, setRecentValues] = useState<string[]>(() => readRecentSiteValues(storageKey));

  const optionList = useMemo(() => {
    const map = new Map<string, SiteComboboxOption>();
    options.forEach((option) => {
      const nextValue = String(option.value || "").trim();
      const nextLabel = String(option.label || "").trim();
      if (!nextValue || !nextLabel || map.has(nextValue)) return;
      map.set(nextValue, {
        ...option,
        value: nextValue,
        label: nextLabel,
      });
    });
    return Array.from(map.values());
  }, [options]);

  const optionMap = useMemo(() => new Map(optionList.map((option) => [option.value, option])), [optionList]);
  const selectedOption = value ? optionMap.get(value) ?? optionList.find((option) => option.label === value) : undefined;

  useEffect(() => {
    if (!isOpen) {
      setQuery(selectedOption?.label || "");
    }
  }, [isOpen, selectedOption?.label]);

  useEffect(() => {
    setRecentValues(readRecentSiteValues(storageKey));
  }, [storageKey]);

  const hasQuery = query.trim().length > 0;
  const matchingOptions = useMemo(() => {
    if (!hasQuery) return optionList.slice(0, resultLimit);
    return optionList
      .filter((option) => matchesSiteSearch(option.label, query, [option.description || "", ...(option.keywords || [])]))
      .slice(0, resultLimit);
  }, [hasQuery, optionList, query, resultLimit]);

  const recentOptions = useMemo(
    () =>
      recentValues
        .map((recentValue) => optionMap.get(recentValue))
        .filter((option): option is SiteComboboxOption => !!option)
        .slice(0, recentLimit),
    [optionMap, recentLimit, recentValues],
  );

  const latestOptions = useMemo(() => {
    const recentSet = new Set(recentOptions.map((option) => option.value));
    return optionList.filter((option) => !recentSet.has(option.value)).slice(0, resultLimit);
  }, [optionList, recentOptions, resultLimit]);

  const visibleOptions = hasQuery ? matchingOptions : latestOptions;

  const selectOption = (option: SiteComboboxOption) => {
    onChange(option);
    setQuery(option.label);
    setIsOpen(false);
    if (option.trackRecent !== false) {
      setRecentValues(rememberRecentSiteValue(option.value, storageKey));
    }
  };

  const clearSelection = () => {
    onChange(null);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", containerClassName)}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (selectedOption && nextValue !== selectedOption.label) {
            onChange(null);
          }
          setQuery(nextValue);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), BLUR_CLOSE_DELAY_MS)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
            return;
          }
          if (event.key === "Enter" && matchingOptions.length === 1) {
            event.preventDefault();
            selectOption(matchingOptions[0]);
          }
        }}
        placeholder={placeholder}
        className={cn(
          "w-full h-[50px] rounded-xl border border-border bg-card px-4 pr-16 text-[17px] font-medium text-foreground placeholder:text-muted-foreground outline-none transition-all hover:border-primary/50 focus:border-primary focus:shadow-[0_0_0_3px_rgba(49,163,250,0.15)]",
          inputClassName,
        )}
      />
      {query ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={clearSelection}
          className="absolute right-10 top-1/2 -translate-y-1/2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground z-10"
          aria-label="현장명 지우기"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) {
            window.setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-label="현장 목록 열기"
      >
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isOpen ? (
        <div
          className={cn(
            "absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg",
            dropdownClassName,
          )}
        >
          <div className="max-h-72 overflow-y-auto p-1.5">
            {!hasQuery && recentOptions.length > 0 ? (
              <>
                <div className="px-2.5 pb-1 pt-1 text-[12px] font-bold text-muted-foreground">{recentTitle}</div>
                {recentOptions.map((option) => (
                  <DropdownItem
                    key={`recent-${option.value}`}
                    option={option}
                    selected={selectedOption?.value === option.value}
                    onSelect={selectOption}
                  />
                ))}
                <div className="mx-1 my-1 h-px bg-border" />
              </>
            ) : null}

            {!hasQuery && visibleOptions.length > 0 ? (
              <>
                <div className="px-2.5 pb-1 pt-1 text-[12px] font-bold text-muted-foreground">{latestTitle}</div>
                {visibleOptions.map((option) => (
                  <DropdownItem
                    key={option.value}
                    option={option}
                    selected={selectedOption?.value === option.value}
                    onSelect={selectOption}
                  />
                ))}
              </>
            ) : null}

            {hasQuery ? (
              visibleOptions.length > 0 ? (
                visibleOptions.map((option) => (
                  <DropdownItem
                    key={option.value}
                    option={option}
                    selected={selectedOption?.value === option.value}
                    onSelect={selectOption}
                  />
                ))
              ) : (
                <div className="px-3 py-3 text-sm-app text-muted-foreground">{emptyText}</div>
              )
            ) : null}

            {!hasQuery && recentOptions.length === 0 && visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm-app text-muted-foreground">{emptyText}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DropdownItem({
  option,
  selected,
  onSelect,
}: {
  option: SiteComboboxOption;
  selected: boolean;
  onSelect: (option: SiteComboboxOption) => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(option)}
      className={cn(
        "mb-1 w-full rounded-lg px-3 py-3 text-left transition-colors last:mb-0",
        selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
      )}
    >
      <div className="text-[15px] font-semibold leading-tight">{option.label}</div>
      {option.description ? <div className="mt-0.5 text-[12px] text-text-sub">{option.description}</div> : null}
    </button>
  );
}
