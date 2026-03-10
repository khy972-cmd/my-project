import { NOTIFICATIONS_HIDE_KEY } from "@/constants/storageKeys";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import SearchOverlay from "../overlays/SearchOverlay";
import NotificationPanel from "../overlays/NotificationPanel";
import MenuPanel from "../overlays/MenuPanel";
import AccountOverlay from "../overlays/AccountOverlay";
import CertModal from "../overlays/CertModal";
import NetworkStatusBar from "../NetworkStatusBar";

const isNotificationHiddenToday = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NOTIFICATIONS_HIDE_KEY) === new Date().toDateString();
  } catch {
    return false;
  }
};

export default function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(2);
  const [hasAutoOpenedToday, setHasAutoOpenedToday] = useState(false);
  const [drawingOverlaySources, setDrawingOverlaySources] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (notifyOpen || hasAutoOpenedToday) return;
    if (notificationCount <= 0) return;
    if (isNotificationHiddenToday()) return;

    setNotifyOpen(true);
    setHasAutoOpenedToday(true);
  }, [hasAutoOpenedToday, notificationCount, notifyOpen]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; open?: boolean; source?: string };
      if (!data || data.type !== "inopnc-drawing") return;
      const source = data.source || "default";
      setDrawingOverlaySources((prev) => {
        if (!data.open) {
          if (!(source in prev)) return prev;
          const next = { ...prev };
          delete next[source];
          return next;
        }
        if (prev[source]) return prev;
        return { ...prev, [source]: true };
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const isDrawingOverlayOpen = Object.keys(drawingOverlaySources).length > 0;

  const openNotificationPanel = () => {
    // Manual open must work even if user hid auto-popup for today.
    setHasAutoOpenedToday(true);
    setNotifyOpen(true);
  };

  return (
    <div
      className="inopnc-app"
      style={{
        "--app-header-height": isDrawingOverlayOpen ? "0px" : "114px",
        "--home-section-mt": isDrawingOverlayOpen ? "0px" : "-0.5rem",
        "--home-section-mb": isDrawingOverlayOpen ? "0px" : "-1.5rem",
      } as any}
    >
      {!isDrawingOverlayOpen && (
        <AppHeader
          onSearch={() => setSearchOpen(true)}
          onCert={() => setCertOpen(true)}
          onNotify={openNotificationPanel}
          onMenu={() => setMenuOpen(true)}
          notificationCount={notificationCount}
        />
      )}
      <main
        className="px-4"
        style={{
          paddingTop: "var(--app-header-height, 114px)",
          paddingBottom: isDrawingOverlayOpen ? "0px" : "1.5rem",
        }}
      >
        <Outlet />
      </main>

      {/* Overlays */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenCert={() => setCertOpen(true)}
      />
      <NotificationPanel
        isOpen={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        onBadgeUpdate={setNotificationCount}
      />
      <MenuPanel isOpen={menuOpen} onClose={() => setMenuOpen(false)} onOpenAccount={() => setAccountOpen(true)} />
      <AccountOverlay isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
      <CertModal isOpen={certOpen} onClose={() => setCertOpen(false)} />
      <NetworkStatusBar />
    </div>
  );
}
