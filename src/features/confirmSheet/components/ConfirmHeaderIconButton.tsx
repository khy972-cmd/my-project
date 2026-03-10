import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConfirmHeaderIconButtonProps {
  onClick: () => void;
  children: ReactNode;
  label: string;
  className?: string;
}

const ConfirmHeaderIconButton = forwardRef<HTMLButtonElement, ConfirmHeaderIconButtonProps>(
  ({ onClick, children, label, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onClick}
        className={cn(
          "p-2 rounded-full transition-colors",
          "hover:bg-header-foreground/15 active:bg-header-foreground/25",
          "text-header-foreground",
          className,
        )}
        aria-label={label}
      >
        {children}
      </button>
    );
  },
);

ConfirmHeaderIconButton.displayName = "ConfirmHeaderIconButton";

export default ConfirmHeaderIconButton;

