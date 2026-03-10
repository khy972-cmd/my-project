import { toast } from "sonner";

const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 };

async function getCoords() {
  if (typeof navigator === "undefined" || !navigator.geolocation) return DEFAULT_COORDS;
  return await new Promise<{ lat: number; lng: number }>((resolve) => {
    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolve(DEFAULT_COORDS);
    }, 900);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve(DEFAULT_COORDS);
      },
      { enableHighAccuracy: false, timeout: 900, maximumAge: 60000 }
    );
  });
}

export async function copyText(text: string, label = "주소") {
  const value = (text || "").trim();
  if (!value) {
    toast.error(`${label}가 없습니다`);
    return;
  }
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      toast.success(`${label}가 복사되었습니다.`);
      return;
    }
  } catch {
    // fall through
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    ok ? toast.success(`${label}가 복사되었습니다.`) : toast.error("복사에 실패했습니다.");
  } catch {
    toast.error("복사에 실패했습니다.");
  }
}

export async function openAddressInMaps(address: string, opts?: { label?: string }) {
  const label = opts?.label ?? "주소";
  const value = (address || "").trim();
  if (!value) {
    toast.error(`${label}가 없습니다`);
    return;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    toast.error("오프라인 상태에서는 지도 앱을 열 수 없습니다.");
    return;
  }
  if (typeof window === "undefined") return;

  const q = encodeURIComponent(value);
  const { lat, lng } = await getCoords();

  const tmapUrl = `tmap://search?name=${q}`;
  const kakaoUrl = `kakaomap://search?q=${q}&p=${lat},${lng}`;
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;

  const attempt = (url: string, next: () => void) => {
    window.location.href = url;
    window.setTimeout(() => {
      if (document.hidden) return;
      next();
    }, 900);
  };

  attempt(tmapUrl, () => attempt(kakaoUrl, () => {
    window.location.href = googleUrl;
  }));
}
