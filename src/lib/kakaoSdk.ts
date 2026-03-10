const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.9/kakao.min.js";
const KAKAO_SDK_SCRIPT_ID = "inopnc-kakao-sdk";

export interface KakaoFollowResponse {
  status?: "success" | "fail" | string;
  [key: string]: unknown;
}

export interface KakaoSDK {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Channel: {
    followChannel: (options: { channelPublicId: string }) => Promise<KakaoFollowResponse>;
    chat: (options: { channelPublicId: string }) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

let kakaoScriptPromise: Promise<boolean> | null = null;

function loadScriptOnce(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Kakao) {
    return Promise.resolve(true);
  }

  if (kakaoScriptPromise) {
    return kakaoScriptPromise;
  }

  kakaoScriptPromise = new Promise((resolve) => {
    let settled = false;
    const finalize = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(ok);
    };

    const timeoutId = window.setTimeout(() => finalize(Boolean(window.Kakao)), 5000);

    const attachListeners = (target: HTMLScriptElement) => {
      target.addEventListener("load", () => finalize(Boolean(window.Kakao)), { once: true });
      target.addEventListener("error", () => finalize(false), { once: true });
    };

    const existing = document.getElementById(KAKAO_SDK_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.Kakao) {
        finalize(true);
        return;
      }
      attachListeners(existing);
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SDK_SCRIPT_ID;
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    attachListeners(script);
    document.head.appendChild(script);
  });

  return kakaoScriptPromise;
}

export function getKakaoConfig(): { jsKey?: string; channelPublicId?: string; channelUrl?: string } {
  const env = (import.meta as any).env as Record<string, string | undefined>;

  const jsKey = env["VITE_KAKAO_JS_KEY"]?.trim() || undefined;
  const channelPublicId = env["VITE_KAKAO_CHANNEL_PUBLIC_ID"]?.trim() || "_xfgxdqX";
  const channelUrl = env["VITE_KAKAO_CHANNEL_URL"]?.trim() || "https://pf.kakao.com/_xfgxdqX";

  return { jsKey, channelPublicId, channelUrl };
}

export async function ensureKakao(): Promise<KakaoSDK | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const { jsKey } = getKakaoConfig();
  if (!jsKey) {
    return null;
  }

  const loaded = await loadScriptOnce();
  if (!loaded || !window.Kakao) {
    return null;
  }

  try {
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(jsKey);
    }
    return window.Kakao.isInitialized() ? window.Kakao : null;
  } catch {
    return null;
  }
}
