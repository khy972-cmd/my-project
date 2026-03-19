const env = (import.meta.env ?? {}) as Record<string, unknown>;

function readEnvString(...keys: string[]): string | null {
  for (const key of keys) {
    const value = env[key];
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  return null;
}

export const BUILD_SHA =
  readEnvString("VITE_VERCEL_GIT_COMMIT_SHA", "VITE_APP_BUILD_SHA", "VITE_COMMIT_SHA") ??
  (env.MODE === "production" ? "production" : "development");

export const BUILD_TIME = new Date().toISOString();
export const IS_PROD = env.PROD === true || env.MODE === "production";
