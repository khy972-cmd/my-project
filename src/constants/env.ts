/**
 * 앱 기본 경로 및 환경 상수
 * BASE_URL, 정적 자산 경로 등 공통 사용
 */

const _APP_BASE = import.meta.env.BASE_URL || "/";
export const APP_BASE = _APP_BASE;
export const BASE_PREFIX = _APP_BASE.endsWith("/") ? _APP_BASE : `${_APP_BASE}/`;

export const HOME_VER =
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ??
  import.meta.env.VERCEL_GIT_COMMIT_SHA ??
  Date.now().toString();

/** 홈 iframe URL */
export const getHomeMainUrl = () => `${BASE_PREFIX}home-v2/main-v2-app/index.html?v=${HOME_VER}`;
export const getHomeFallbackUrl = () => `${BASE_PREFIX}home-v2/main-v2-app/index.html`;

/** (구) 인증서 확인 iframe URL는 더 이상 사용하지 않습니다. */
