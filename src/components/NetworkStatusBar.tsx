import { Wifi, WifiOff, RefreshCw, CloudUpload } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function NetworkStatusBar() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus();

  // Only show when offline or has pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-amber-500 text-white"
          : "bg-red-600 text-white"
      }`}
      style={{ maxWidth: 600, margin: "0 auto" }}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4 animate-pulse" />
        )}
        <span>
          {isOnline
            ? `대기 중인 데이터 ${pendingCount}건`
            : "오프라인 모드 - 저장된 데이터는 연결 시 자동 동기화"}
        </span>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={syncNow}
          disabled={isSyncing}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CloudUpload className="w-3.5 h-3.5" />
          )}
          <span className="text-xs">{isSyncing ? "동기화 중..." : "동기화"}</span>
        </button>
      )}
    </div>
  );
}
