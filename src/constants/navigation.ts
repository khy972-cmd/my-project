import type { AppRole } from "@/lib/roles";

export const APP_HEADER_TABS = [
  { key: "home", label: "홈", path: "/" },
  { key: "output", label: "출력", path: "/output" },
  { key: "worklog", label: "일지", path: "/worklog" },
  { key: "site", label: "현장", path: "/site" },
  { key: "doc", label: "문서", path: "/doc" },
  { key: "request", label: "본사요청", path: "/request", roles: ["admin", "worker"] as AppRole[] },
] as const;

export const MENU_PANEL_ITEMS = [
  { label: "홈", path: "/" },
  { label: "출력현황", path: "/output" },
  { label: "작업일지", path: "/worklog" },
  { label: "현장정보", path: "/site" },
  { label: "문서함", path: "/doc" },
  { label: "관리자 콘솔", path: "/admin", roles: ["admin", "manager"] as AppRole[] },
] as const;
