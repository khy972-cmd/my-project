import { NOTIFICATIONS_NOTIFICATIONS_HIDE_KEY } from "@/constants/storageKeys";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle,
  ClipboardList,
  FileText,
  Megaphone,
  ShieldAlert,
} from "lucide-react";

interface NotificationItem {
  id: number;
  type: "announcement" | "safety" | "schedule" | "document" | "success" | "warning" | "general";
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onBadgeUpdate?: (count: number) => void;
}

const SHEET_ANIMATION_MS = 280;
const todayKey = () => new Date().toDateString();

const isNotificationHiddenToday = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NOTIFICATIONS_HIDE_KEY) === todayKey();
  } catch {
    return false;
  }
};

const setNotificationHiddenToday = (hidden: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (hidden) {
      window.localStorage.setItem(NOTIFICATIONS_HIDE_KEY, todayKey());
    } else {
      window.localStorage.removeItem(NOTIFICATIONS_HIDE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "announcement",
    title: "안전 점검 안내",
    desc: "A구역 비계 상태 점검이 예정되어 있습니다.",
    time: "방금 전",
    unread: true,
  },
  {
    id: 2,
    type: "document",
    title: "문서 확인 요청",
    desc: "금일 작업 관련 문서 확인이 필요합니다.",
    time: "10분 전",
    unread: true,
  },
  {
    id: 3,
    type: "success",
    title: "작업 완료",
    desc: "어제 등록한 작업일지가 정상 반영되었습니다.",
    time: "1시간 전",
    unread: false,
  },
];

const typeLabelMap: Record<NotificationItem["type"], string> = {
  announcement: "공지",
  safety: "안전",
  schedule: "일정",
  document: "문서",
  success: "완료",
  warning: "주의",
  general: "알림",
};

const typeIconMap = {
  announcement: Megaphone,
  safety: ShieldAlert,
  schedule: CalendarClock,
  document: FileText,
  success: CheckCircle,
  warning: AlertCircle,
  general: ClipboardList,
} as const;

const iconClassMap: Record<NotificationItem["type"], string> = {
  announcement: "bg-blue-50 text-blue-700 border-blue-200",
  safety: "bg-red-50 text-red-700 border-red-200",
  schedule: "bg-indigo-50 text-indigo-700 border-indigo-200",
  document: "bg-sky-50 text-sky-700 border-sky-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  general: "bg-slate-50 text-slate-700 border-slate-200",
};

const labelClassMap: Record<NotificationItem["type"], string> = {
  announcement: "bg-blue-100 text-blue-700",
  safety: "bg-red-100 text-red-700",
  schedule: "bg-indigo-100 text-indigo-700",
  document: "bg-sky-100 text-sky-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  general: "bg-slate-100 text-slate-700",
};

export default function NotificationPanel({ isOpen, onClose, onBadgeUpdate }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter(notification => notification.unread).length,
    [notifications]
  );

  useEffect(() => {
    onBadgeUpdate?.(unreadCount);
  }, [onBadgeUpdate, unreadCount]);

  useEffect(() => {
    if (!isOpen) return;
    setDontShowToday(isNotificationHiddenToday());
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const raf = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(raf);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), SHEET_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  const selected = selectedId ? notifications.find(notification => notification.id === selectedId) : null;

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, unread: false })));
  };

  const handleClose = () => {
    setNotificationHiddenToday(dontShowToday);
    setSelectedId(null);
    onClose();
  };

  const handleItemClick = (id: number) => {
    setSelectedId(id);
    markAsRead(id);
  };

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 z-[1500] bg-black/35 transition-opacity duration-200 ${
          visible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
      />

      <section
        className={`fixed bottom-0 left-1/2 z-[2500] flex h-[70dvh] w-full max-w-app -translate-x-1/2 flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-2xl transition-transform duration-300 will-change-transform ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
      >
        <header className="flex h-[60px] items-center justify-between border-b border-border px-5">
          <span className="absolute left-1/2 top-2 h-1 w-12 -translate-x-1/2 rounded-full bg-border" />
          <h3 className="text-lg font-bold text-foreground">알림</h3>
          <button
            onClick={handleClose}
            className="rounded-full border border-border px-3 py-1 text-xs font-bold text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            닫기
          </button>
        </header>

        <div className="overflow-y-auto overscroll-contain px-4 py-3 pb-[env(safe-area-inset-bottom,0px)]">
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map(notification => {
                const Icon = typeIconMap[notification.type] ?? Bell;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleItemClick(notification.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      notification.unread ? "border-primary/30 bg-primary-bg/50" : "border-border bg-muted/20"
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconClassMap[notification.type]}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${labelClassMap[notification.type]}`}
                        >
                          {typeLabelMap[notification.type]}
                        </span>
                        <span className="truncate text-sm font-bold text-foreground">
                          {notification.title}
                        </span>
                      </span>
                      <span className="line-clamp-2 block text-sm text-muted-foreground">
                        {notification.desc}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">{notification.time}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">새로운 알림이 없습니다.</div>
          )}

          {selected && (
            <article className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-1 text-xs font-bold text-primary">선택한 알림</div>
              <div className="text-base font-bold text-foreground">{selected.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.desc}</p>
            </article>
          )}

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="mt-4 w-full rounded-xl bg-header-navy py-2.5 text-sm font-bold text-header-navy-foreground transition hover:opacity-90"
            >
              모두 읽음으로 표시
            </button>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={event => setDontShowToday(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            오늘 하루 보지 않기
          </label>
        </div>
      </section>
    </>
  );
}
