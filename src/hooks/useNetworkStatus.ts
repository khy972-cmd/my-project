import { useState, useEffect, useCallback } from "react";
import { getQueueCount, processSyncQueue } from "@/lib/offlineStore";
import { toast } from "sonner";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    try {
      const count = await getQueueCount();
      setPendingCount(count);
    } catch { /* IndexedDB unavailable */ }
  }, []);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await processSyncQueue();
      if (result.synced > 0) {
        toast.success(`${result.synced}건 동기화 완료`);
      }
      if (result.failed > 0) {
        toast.error(`${result.failed}건 동기화 실패 - 재시도 예정`);
      }
      await refreshPending();
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("네트워크 연결됨 - 대기 데이터 동기화 중...");
      syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("오프라인 모드 - 데이터가 로컬에 저장됩니다", {
        duration: 4000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshPending();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow, refreshPending]);

  return { isOnline, pendingCount, isSyncing, syncNow, refreshPending };
}
