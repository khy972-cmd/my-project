import { BUILD_SHA } from "@/lib/buildMeta";
import { HOME_IFRAME_PUBLIC_ENTRY } from "@/constants/publicRuntime";

/**
 * ??湲곕낯 寃쎈줈 諛??섍꼍 ?곸닔
 * BASE_URL, ?뺤쟻 ?먯궛 寃쎈줈 ??怨듯넻 ?ъ슜
 */

const _APP_BASE = import.meta.env.BASE_URL || "/";
export const APP_BASE = _APP_BASE;
export const BASE_PREFIX = _APP_BASE.endsWith("/") ? _APP_BASE : `${_APP_BASE}/`;

export const HOME_VER = BUILD_SHA;

/** ??iframe URL */
export const getHomeMainUrl = () => `${BASE_PREFIX}${HOME_IFRAME_PUBLIC_ENTRY}?v=${HOME_VER}`;
export const getHomeFallbackUrl = () => `${BASE_PREFIX}${HOME_IFRAME_PUBLIC_ENTRY}`;

/** (援? ?몄쬆???뺤씤 iframe URL?????댁긽 ?ъ슜?섏? ?딆뒿?덈떎. */
