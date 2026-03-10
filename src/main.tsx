import { LAST_BUILD_SHA_STORAGE_KEY } from "@/constants/storageKeys";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const env = ((import.meta as any).env ?? {}) as Record<string, unknown>;
const BUILD_SHA = String(env.VERCEL_GIT_COMMIT_SHA ?? Date.now());
const BUILD_TIME = new Date().toISOString();
const IS_PROD = env.PROD === true || env.MODE === "production";

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

const cleanupProdCachesAndWorkers = async () => {
  if (typeof window === "undefined" || !IS_PROD) return;

  const previousBuildSha = window.localStorage.getItem(LAST_BUILD_SHA_STORAGE_KEY);
  const hasBuildChanged = previousBuildSha !== BUILD_SHA;

  if (hasBuildChanged) {
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
  }

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (error) {
      console.warn("[sw-register] failed", error);
    }
  }

  window.localStorage.setItem(LAST_BUILD_SHA_STORAGE_KEY, BUILD_SHA);
};

console.info("[build-meta]", { BUILD_SHA, BUILD_TIME });
void cleanupProdCachesAndWorkers();

createRoot(document.getElementById("root")!).render(<App />);
mountBuildMarker();
