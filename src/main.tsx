import { LAST_BUILD_SHA_STORAGE_KEY } from "@/constants/storageKeys";
import { BUILD_SHA, BUILD_TIME, IS_PROD } from "@/lib/buildMeta";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const mountBuildMarker = () => {
  if (typeof document === "undefined") return;

  const text = `BUILD_SHA=${BUILD_SHA} BUILD_TIME=${BUILD_TIME}`;
  const existing = document.getElementById("__inopnc_build_meta");
  if (existing) {
    existing.textContent = text;
    return;
  }

  const marker = document.createElement("div");
  marker.id = "__inopnc_build_meta";
  marker.setAttribute("aria-hidden", "true");
  marker.textContent = text;
  Object.assign(marker.style, {
    position: "fixed",
    left: "0",
    bottom: "0",
    padding: "2px 4px",
    fontSize: "10px",
    lineHeight: "1",
    whiteSpace: "nowrap",
    color: "#000",
    opacity: "0",
    pointerEvents: "none",
    userSelect: "text",
    zIndex: "2147483647",
  });
  document.body.appendChild(marker);
};

const cleanupLegacyWorkers = async () => {
  if (typeof window === "undefined" || !IS_PROD) return;

  const previousBuildSha = window.localStorage.getItem(LAST_BUILD_SHA_STORAGE_KEY);
  const hasBuildChanged = previousBuildSha !== BUILD_SHA;

  if (!hasBuildChanged) return;

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.warn("[cache-cleanup] failed to clear caches", error);
  }

  if ("serviceWorker" in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch (error) {
      console.warn("[sw-cleanup] failed to unregister old workers", error);
    }
  }

  window.localStorage.setItem(LAST_BUILD_SHA_STORAGE_KEY, BUILD_SHA);
};

console.info("[build-meta]", { BUILD_SHA, BUILD_TIME });
void cleanupLegacyWorkers();

createRoot(document.getElementById("root")!).render(<App />);
mountBuildMarker();
