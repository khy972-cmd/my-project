import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  /** 전체 화면 여부 (min-h-screen) */
  fullScreen?: boolean;
  /** 추가 className */
  className?: string;
}

/**
 * 공통 로딩 스피너 화면
 * App, ProtectedRoute, AdminPage 등에서 재사용
 */
export function LoadingScreen({ fullScreen = true, className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background",
        fullScreen && "min-h-screen",
        className
      )}
    >
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-label="로딩 중"
      />
    </div>
  );
}
