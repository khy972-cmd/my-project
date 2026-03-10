import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmHeaderProps {
  title: string;
  onBack?: () => void;
  hideBack?: boolean;
  rightActions?: ReactNode;
  className?: string;
}

export default function ConfirmHeader({
  title,
  onBack,
  hideBack = false,
  rightActions,
  className,
}: ConfirmHeaderProps) {
  const handleBack = () => {
    if (onBack) onBack();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[2100]",
        "h-[60px] flex items-center justify-between",
        "bg-header text-header-foreground border-b border-header-border",
        "px-2 shrink-0",
        "pt-[env(safe-area-inset-top)]",
        className,
      )}
    >
      <div className="w-12 flex items-center justify-start">
        {!hideBack && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full transition-colors hover:bg-header-foreground/15 active:bg-header-foreground/25"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        )}
      </div>

      <h1 className="text-lg font-bold truncate text-center flex-1 mx-2">{title}</h1>

      <div className="flex items-center gap-1 justify-end min-w-[48px]">{rightActions}</div>
    </header>
  );
}

