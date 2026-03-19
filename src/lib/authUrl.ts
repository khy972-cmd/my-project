const SEARCH_AUTH_PARAM_KEYS = [
  "code",
  "error",
  "error_code",
  "error_description",
  "provider_token",
  "provider_refresh_token",
  "type",
] as const;

const HASH_AUTH_PARAM_KEYS = [
  "access_token",
  "error",
  "error_code",
  "error_description",
  "expires_at",
  "expires_in",
  "provider_token",
  "provider_refresh_token",
  "refresh_token",
  "token_type",
  "type",
] as const;

const AUTH_ORIGIN_ENV_KEYS = ["VITE_AUTH_REDIRECT_ORIGIN", "VITE_PUBLIC_APP_URL", "VITE_SITE_URL"] as const;
const env = import.meta.env as Record<string, unknown>;

function getRuntimeUrl(): URL | null {
  if (typeof window === "undefined") return null;

  try {
    return new URL(window.location.href);
  } catch {
    return null;
  }
}

function getHashParams(hash: string): URLSearchParams {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function readConfiguredOrigin(): string | null {
  for (const key of AUTH_ORIGIN_ENV_KEYS) {
    const value = env[key];
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (!trimmed) continue;

    try {
      return new URL(trimmed).origin;
    } catch {
      console.warn(`[auth] invalid ${key}:`, trimmed);
    }
  }

  return null;
}

export function getAuthCallbackError(): string | null {
  const url = getRuntimeUrl();
  if (!url) return null;

  const hashParams = getHashParams(url.hash);
  return (
    url.searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    url.searchParams.get("error") ??
    hashParams.get("error")
  );
}

export function hasAuthCodeInUrl(): boolean {
  const url = getRuntimeUrl();
  return Boolean(url?.searchParams.get("code"));
}

export function isRecoveryFlowUrl(): boolean {
  const url = getRuntimeUrl();
  if (!url) return false;

  const hashParams = getHashParams(url.hash);
  return (
    url.searchParams.get("type") === "recovery" ||
    hashParams.get("type") === "recovery" ||
    hashParams.has("access_token") ||
    hashParams.has("refresh_token")
  );
}

export function stripAuthCallbackParamsFromUrl(): void {
  const url = getRuntimeUrl();
  if (!url) return;

  let changed = false;
  for (const key of SEARCH_AUTH_PARAM_KEYS) {
    if (!url.searchParams.has(key)) continue;
    url.searchParams.delete(key);
    changed = true;
  }

  const hashParams = getHashParams(url.hash);
  for (const key of HASH_AUTH_PARAM_KEYS) {
    if (!hashParams.has(key)) continue;
    hashParams.delete(key);
    changed = true;
  }

  if (!changed) return;

  const nextHash = hashParams.toString();
  const nextUrl = `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ""}`;
  window.history.replaceState(window.history.state, document.title, nextUrl);
}

export function getAppOrigin(): string {
  const configuredOrigin = readConfiguredOrigin();
  if (configuredOrigin) return configuredOrigin;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildAppUrl(path = "/"): string {
  const origin = getAppOrigin();
  if (!origin) return path;
  return new URL(path, origin).toString();
}
