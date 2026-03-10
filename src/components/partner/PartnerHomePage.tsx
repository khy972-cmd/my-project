import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Phone, Camera, Map as MapIcon, FileText, ClipboardList, CheckCircle2, Cloud, Sun, CloudRain, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDateTimeCompact } from "@/lib/dateFormat";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOperationalSites } from "@/hooks/useOperationalSites";

import iconFlash from "@/assets/icons/flash.png";
import iconSiteInfo from "@/assets/icons/site-info.png";
import iconWorklog from "@/assets/icons/worklog.png";
import iconOutput from "@/assets/icons/output.png";
import iconDocs from "@/assets/icons/docs.png";
import iconRequest from "@/assets/icons/request.png";

type PartnerHomeSite = {
  id: string;
  name: string;
  status: "ing" | "wait" | "done";
  days: number;
  mp: number;
  address: string;
  worker: number;
  manager: string;
  managerPhone: string;
  safety: string;
  affil: string;
  lastUpdate: string;
  hasDraw: boolean;
  hasPhoto: boolean;
  hasPTW: boolean;
  hasLog: boolean;
  hasAction: boolean;
};

const WEATHER_MAP: Record<string, { text: string; icon: typeof Sun }> = {
  서울: { text: "맑음 3도", icon: Sun },
  경기: { text: "비 4도", icon: CloudRain },
  인천: { text: "흐림 2도", icon: Cloud },
  울산: { text: "맑음 8도", icon: Sun },
  원주: { text: "흐림 2도", icon: Cloud },
};

const QUICK_MENU = [
  { label: "현장정보", path: "/site", icon: iconSiteInfo },
  { label: "작업일지", path: "/worklog", icon: iconWorklog, badge: 0, badgeColor: "bg-green-600" },
  { label: "출력현황", path: "/output", icon: iconOutput },
  { label: "문서함", path: "/doc", icon: iconDocs },
  { label: "본사요청", path: "/request", icon: iconRequest, badge: 0, badgeColor: "bg-violet-500" },
];

const NOTICES = [
  { type: "공지", text: "운영 현장 데이터가 site.xlsx 기준으로 동기화됩니다.", badgeCls: "bg-header-navy" },
  { type: "업데이트", text: "인력 디렉터리가 workers_rows.csv 기준으로 정리됩니다.", badgeCls: "bg-primary" },
  { type: "안내", text: "권한 변경은 dry-run 확인 후 안전하게 적용됩니다.", badgeCls: "bg-header-navy" },
];

function getWeather(address: string) {
  const region = Object.keys(WEATHER_MAP).find((key) => address.includes(key));
  return region ? WEATHER_MAP[region] : { text: "맑음 3도", icon: Sun };
}

function toStatusKey(status: string): PartnerHomeSite["status"] {
  if (status === "예정") return "wait";
  if (status === "완료") return "done";
  return "ing";
}

function daysSince(value: string | null | undefined) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.max(1, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function PartnerHomePage() {
  const navigate = useNavigate();
  const today = new Date();
  const dateStr = `${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")} (${["일", "월", "화", "수", "목", "금", "토"][today.getDay()]})`;
  const { data: sites = [], isLoading } = useOperationalSites();
  const [noticeIdx, setNoticeIdx] = useState(0);

  const { data: docs = [] } = useQuery({
    queryKey: ["partner-home-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("site_id, doc_type")
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: worklogs = [] } = useQuery({
    queryKey: ["partner-home-worklogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("worklogs")
        .select("id, site_id, created_at, updated_at");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setNoticeIdx((prev) => (prev + 1) % NOTICES.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const homeSites = useMemo<PartnerHomeSite[]>(() => {
    return sites.map((site) => {
      const siteDocs = docs.filter((doc) => doc.site_id === site.id);
      const siteWorklogs = worklogs.filter((worklog) => worklog.site_id === site.id);
      const latestWorklog = [...siteWorklogs].sort((left, right) => String(right.updated_at || right.created_at).localeCompare(String(left.updated_at || left.created_at)))[0];
      return {
        id: site.id,
        name: site.name,
        status: toStatusKey(site.status),
        days: daysSince(site.created_at),
        mp: siteWorklogs.length,
        address: site.address || "",
        worker: siteWorklogs.length,
        manager: site.manager_name || "미지정",
        managerPhone: site.manager_phone || "",
        safety: site.builder || site.company_name || "미지정",
        affil: site.company_name || site.builder || "미지정",
        lastUpdate: formatDateTimeCompact(site.updated_at || latestWorklog?.updated_at || latestWorklog?.created_at),
        hasDraw: siteDocs.some((doc) => doc.doc_type === "drawing"),
        hasPhoto: siteDocs.some((doc) => doc.doc_type === "photo"),
        hasPTW: siteDocs.some((doc) => doc.doc_type === "cert" || doc.doc_type === "completion"),
        hasLog: siteWorklogs.length > 0,
        hasAction: false,
      };
    });
  }, [docs, sites, worklogs]);

  return (
    <div className="animate-fade-in">
      <div className="mb-5 pt-2.5">
        <div className="mb-4 flex items-center gap-1.5 px-1">
          <img src={iconFlash} alt="빠른메뉴" className="h-5 w-5 object-contain" />
          <span className="text-[20px] font-bold tracking-tight text-header-navy">빠른메뉴</span>
        </div>
        <div className="grid grid-cols-5 gap-0.5">
          {QUICK_MENU.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="border-none bg-transparent py-1 transition-transform active:scale-95"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative inline-block">
                  <img src={item.icon} alt={item.label} className="h-[46px] w-[46px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.06)]" />
                  {item.badge > 0 && (
                    <span className={cn(
                      "absolute right-0 top-0 z-10 flex h-[18px] min-w-[18px] translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background px-[5px] text-[10px] font-black leading-none text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]",
                      item.badgeColor,
                    )}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="whitespace-nowrap text-center text-[13px] font-bold tracking-tight text-foreground">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-5 flex h-14 items-center gap-3 overflow-hidden rounded-xl border border-border bg-card px-4 shadow-soft">
        {NOTICES.map((notice, index) => (
          <div
            key={notice.text}
            className={cn(
              "absolute inset-0 flex items-center gap-3 px-4 transition-all duration-500",
              index === noticeIdx ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
            )}
          >
            <span className={cn("whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] font-bold text-white", notice.badgeCls)}>{notice.type}</span>
            <span className="flex-1 truncate text-[15px] font-medium text-foreground">{notice.text}</span>
          </div>
        ))}
        <ChevronRight className="relative z-10 ml-auto h-[18px] w-[18px] text-text-sub" />
      </div>

      <div className="mb-6 rounded-2xl bg-card p-[22px] shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-header-navy" />
            <span className="text-[19px] font-[800] text-header-navy">운영 현장 요약</span>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[14px] font-bold text-primary">{dateStr}</span>
        </div>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">현장 정보를 불러오는 중입니다.</div>
        ) : homeSites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            표시할 운영 현장이 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {homeSites.slice(0, 3).map((site) => (
              <div key={site.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3.5 px-[18px]">
                <span className="flex-1 truncate pr-2 text-[16px] font-bold text-foreground">{site.name}</span>
                <span className="flex items-center gap-1 text-[16px] font-bold text-primary">
                  <Users className="h-[18px] w-[18px]" /> {site.worker}명
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {homeSites.map((site) => {
        const weather = getWeather(site.address);
        const WeatherIcon = weather.icon;
        return (
          <div key={site.id} className="relative mb-5 overflow-hidden rounded-2xl bg-card shadow-soft">
            <span className={cn(
              "absolute right-0 top-0 z-10 rounded-bl-xl px-3 py-1 text-[11px] font-bold text-white",
              site.status === "ing" ? "bg-blue-500" : site.status === "wait" ? "bg-violet-500" : "bg-muted-foreground",
            )}>
              {site.status === "ing" ? "진행중" : site.status === "wait" ? "예정" : "완료"}
            </span>
            <div className="border-b border-border p-5">
              <span className="mb-1 block text-[15px] font-medium text-text-sub">{site.lastUpdate}</span>
              <div className="mb-4 w-[85%] text-[20px] font-[800] text-header-navy">{site.name}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[13px] font-bold text-indigo-500">실데이터</span>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-[13px] font-bold text-primary">{site.affil}</span>
                  <span className="flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-[13px] font-bold text-text-sub">
                    <WeatherIcon className="h-3.5 w-3.5" />
                    {weather.text}
                  </span>
                </div>
                <div className="ml-1 flex items-center gap-1.5 border-l border-border pl-2">
                  <MapIcon className={cn("h-4 w-4", site.hasDraw ? "text-header-navy" : "text-border")} />
                  <Camera className={cn("h-4 w-4", site.hasPhoto ? "text-header-navy" : "text-border")} />
                  <FileText className={cn("h-4 w-4", site.hasPTW ? "text-header-navy" : "text-border")} />
                  <ClipboardList className={cn("h-4 w-4", site.hasLog ? "text-header-navy" : "text-border")} />
                  <CheckCircle2 className={cn("h-4 w-4", site.hasAction ? "text-header-navy" : "text-border")} />
                </div>
              </div>
            </div>
            <div className="p-[22px]">
              <div className="mb-5 grid grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-muted bg-muted/50 p-3.5 text-center">
                  <span className="mb-1.5 block text-[15px] font-bold text-text-sub">운영일수</span>
                  <span className="text-[20px] font-[800] text-foreground">{site.days}일</span>
                </div>
                <div className="rounded-xl border border-muted bg-muted/50 p-3.5 text-center">
                  <span className="mb-1.5 block text-[15px] font-bold text-text-sub">작업기록</span>
                  <span className="text-[20px] font-[800] text-primary">{site.mp}건</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border py-3 text-[15px] text-text-sub">
                <span className="w-20 text-[17px] font-bold">현장담당</span>
                <span className="flex-1 truncate pr-3 text-right text-[17px] font-semibold text-foreground">{site.manager}</span>
                <button
                  onClick={() => site.managerPhone && window.location.assign(`tel:${site.managerPhone}`)}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-blue-900"
                >
                  <Phone className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border py-3 text-[15px] text-text-sub">
                <span className="w-20 text-[17px] font-bold">시공/소속</span>
                <span className="flex-1 truncate pr-3 text-right text-[17px] font-semibold text-foreground">{site.safety}</span>
                <div className="h-9 w-9" />
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-border py-3 text-[15px] text-text-sub">
                <span className="w-20 text-[17px] font-bold">주소</span>
                <span className="flex-1 truncate pr-3 text-right text-[17px] font-semibold text-foreground">{site.address || "미입력"}</span>
                <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-blue-100 bg-blue-50 text-blue-900">
                  <MapPin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
