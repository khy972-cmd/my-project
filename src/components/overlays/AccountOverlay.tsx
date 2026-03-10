import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatDateTime } from "@/lib/dateFormat";
import { ROLE_LABELS } from "@/lib/roles";

interface AccountOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_BUCKET = "photos";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const DEFAULT_AFFILIATION = "이노피앤씨";
const APP_VERSION =
  import.meta.env.VITE_APP_VERSION?.trim() ||
  (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || import.meta.env.VERCEL_GIT_COMMIT_SHA || "").trim().slice(0, 7) ||
  "0.0.0";

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function readMetadataBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function extractStoragePath(publicUrl: string | null): string | null {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex < 0) return null;
  const path = publicUrl.slice(markerIndex + marker.length);
  return path ? decodeURIComponent(path) : null;
}

function formatDeletionStatus(value: string | null): string {
  if (value === "reviewing") return "검토중";
  if (value === "approved") return "승인";
  if (value === "rejected") return "반려";
  return "요청됨";
}

export default function AccountOverlay({ isOpen, onClose }: AccountOverlayProps) {
  const { user, isTestMode } = useAuth();
  const { role } = useUserRole();
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);

  const resolvedRole = role ?? "worker";
  const canEditAffiliation = resolvedRole === "partner";
  const deletionRequestedAt =
    profile?.deletion_requested_at ??
    (typeof user?.user_metadata?.deletion_requested_at === "string" ? user.user_metadata.deletion_requested_at : null);
  const deletionRequestStatus = profile?.deletion_request_status ?? (deletionRequestedAt ? "requested" : null);
  const hasPendingDeletionRequest = deletionRequestStatus === "requested" || deletionRequestStatus === "reviewing";

  useEffect(() => {
    if (!isOpen || (!profile && !user)) return;
    setName(profile?.name || user?.user_metadata?.name || "");
    setPhone(profile?.phone || user?.user_metadata?.phone || "");
    setAffiliation(profile?.affiliation || user?.user_metadata?.affiliation || "");
    setPushEnabled(
      profile?.notification_push_enabled ?? readMetadataBoolean(user?.user_metadata?.notification_push_enabled, true),
    );
    setEmailEnabled(
      profile?.notification_email_enabled ?? readMetadataBoolean(user?.user_metadata?.notification_email_enabled, false),
    );
    setNewPassword("");
    setConfirmPassword("");
    setSelectedAvatarFile(null);
  }, [isOpen, profile, user]);

  useEffect(() => {
    if (selectedAvatarFile) return;
    setAvatarPreviewUrl(
      profile?.avatar_url ||
        (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null),
    );
  }, [profile, selectedAvatarFile, user]);

  useEffect(() => {
    if (isOpen) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedAvatarFile(null);
    setAvatarPreviewUrl(null);
    setNewPassword("");
    setConfirmPassword("");
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const initials = useMemo(() => {
    const base = name.trim() || user?.email || "U";
    return base.slice(0, 1).toUpperCase();
  }, [name, user?.email]);

  const handleAvatarClick = () => {
    if (saving || profileLoading || requestingDeletion) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("프로필 사진은 5MB 이하만 업로드할 수 있습니다.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    setSelectedAvatarFile(file);
    setAvatarPreviewUrl(objectUrl);
  };

  const uploadAvatarIfNeeded = async (): Promise<string | null> => {
    if (!selectedAvatarFile || !user) {
      return profile?.avatar_url || (typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);
    }

    const extension = getFileExtension(selectedAvatarFile);
    const path = `avatars/${user.id}/avatar-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, selectedAvatarFile, { upsert: true, contentType: selectedAvatarFile.type });

    if (uploadError) {
      throw new Error(`프로필 사진 업로드에 실패했습니다: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    const nextAvatarUrl = data.publicUrl;
    const oldPath = extractStoragePath(
      profile?.avatar_url || (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null),
    );

    if (oldPath && oldPath !== path) {
      void supabase.storage.from(AVATAR_BUCKET).remove([oldPath]).catch(() => undefined);
    }

    return nextAvatarUrl;
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    const nextAffiliation = canEditAffiliation
      ? affiliation.trim()
      : profile?.affiliation || affiliation.trim() || DEFAULT_AFFILIATION;

    if (!trimmedName) {
      toast.error("이름을 입력하세요.");
      return;
    }

    if (canEditAffiliation && !nextAffiliation) {
      toast.error("소속 정보를 입력하세요.");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        toast.error("새 비밀번호는 8자 이상이어야 합니다.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("비밀번호 확인 값이 일치하지 않습니다.");
        return;
      }
    }

    if (isTestMode) {
      toast.success("테스트 모드에서는 저장만 시뮬레이션합니다.");
      onClose();
      return;
    }

    if (!user) {
      toast.error("로그인 세션을 찾지 못했습니다. 다시 로그인해주세요.");
      return;
    }

    setSaving(true);

    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded();

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          name: trimmedName,
          phone: normalizedPhone || null,
          affiliation: nextAffiliation || null,
        },
        { onConflict: "user_id" },
      );

      if (profileError) {
        throw new Error(`기본 프로필 저장에 실패했습니다: ${profileError.message}`);
      }

      const { error: settingsError } = await (supabase as any).from("user_settings").upsert(
        {
          user_id: user.id,
          push_enabled: pushEnabled,
          email_opt_in: emailEnabled,
          app_version_seen: APP_VERSION,
        },
        { onConflict: "user_id" },
      );

      if (settingsError) {
        throw new Error(`알림 설정 저장에 실패했습니다: ${settingsError.message}`);
      }

      const nextMetadata = {
        ...user.user_metadata,
        name: trimmedName,
        phone: normalizedPhone || null,
        affiliation: nextAffiliation || null,
        avatar_url: nextAvatarUrl,
        notification_push_enabled: pushEnabled,
        notification_email_enabled: emailEnabled,
        app_version_seen: APP_VERSION,
        deletion_requested_at: deletionRequestedAt,
      };

      const { error: metadataError } = await supabase.auth.updateUser({ data: nextMetadata });
      if (metadataError) {
        throw new Error(`유저 메타데이터 저장에 실패했습니다: ${metadataError.message}`);
      }

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) {
          throw new Error(`비밀번호 변경에 실패했습니다: ${passwordError.message}`);
        }
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setSelectedAvatarFile(null);
      setNewPassword("");
      setConfirmPassword("");
      await refreshProfile();
      toast.success("계정 정보가 저장되었습니다.");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "계정 정보 저장에 실패했습니다.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (isTestMode) {
      toast.info("테스트 모드에서는 회원 탈퇴 요청을 저장하지 않습니다.");
      return;
    }

    if (!user) {
      toast.error("로그인 세션을 찾지 못했습니다.");
      return;
    }

    if (hasPendingDeletionRequest) {
      toast.info("이미 회원 탈퇴 요청이 접수되었습니다.");
      return;
    }

    const confirmed = window.confirm(
      "회원 탈퇴는 즉시 계정 삭제가 아니라 요청 접수 방식으로 처리됩니다. 계속하시겠습니까?",
    );
    if (!confirmed) return;

    const reasonInput = window.prompt("탈퇴 요청 사유를 입력하세요. (선택 사항)", "");
    const reason = reasonInput?.trim() || null;

    setRequestingDeletion(true);

    const { error } = await (supabase as any).from("account_deletion_requests").insert({
      user_id: user.id,
      reason,
      status: "requested",
    });

    if (error) {
      setRequestingDeletion(false);
      toast.error(`회원 탈퇴 요청 접수에 실패했습니다: ${error.message}`);
      return;
    }

    await refreshProfile();
    setRequestingDeletion(false);
    toast.success("회원 탈퇴 요청이 접수되었습니다. 최종 삭제 전까지 계정은 유지됩니다.");
  };

  const currentAvatarUrl = avatarPreviewUrl;
  const saveDisabled = saving || profileLoading || requestingDeletion;

  return (
    <div
      className={`fixed inset-0 left-0 right-0 mx-auto max-w-app bg-background z-[2000] flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-y-0 visible" : "translate-y-full invisible"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.33,1,0.68,1)" }}
    >
      <div className="h-[60px] px-4 flex items-center justify-between bg-card border-b border-border shrink-0">
        <button onClick={onClose} className="bg-transparent border-none p-1" disabled={saveDisabled}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <span className="text-lg-app font-bold text-foreground">계정 관리</span>
        <button
          onClick={handleSave}
          className="text-base-app font-bold text-primary bg-transparent border-none cursor-pointer disabled:opacity-50"
          disabled={saveDisabled}
        >
          {saving ? "저장중" : "저장"}
        </button>
      </div>

      <div className="flex-1 px-5 py-6 overflow-y-auto">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[100px] h-[100px] rounded-full bg-border relative flex items-center justify-center text-[36px] font-bold text-muted-foreground border-4 border-card shadow-lg">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {currentAvatarUrl ? (
                <img src={currentAvatarUrl} alt="프로필 사진" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border-[3px] border-card bg-header-navy text-white flex items-center justify-center cursor-pointer z-[20] shadow-md disabled:opacity-50"
              disabled={saveDisabled}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
          </div>
          <div className="mt-3 text-[13px] text-text-sub">
            권한: <span className="font-bold text-foreground">{ROLE_LABELS[resolvedRole]}</span>
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground">프로필 사진은 5MB 이하 이미지 파일만 업로드할 수 있습니다.</div>
        </div>

        {profileLoading && (
          <div className="mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[13px] text-text-sub flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            계정 정보를 불러오는 중입니다.
          </div>
        )}

        {deletionRequestedAt && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-700">
            탈퇴 요청 상태: {formatDeletionStatus(deletionRequestStatus)} / 접수 시각: {formatDateTime(deletionRequestedAt)}
            {profile?.deletion_request_reason ? ` / 사유: ${profile.deletion_request_reason}` : ""}
          </div>
        )}

        <section className="mb-8">
          <span className="text-sm-app font-bold text-text-sub block mb-3">기본 정보</span>
          <div className="mb-4">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">이름</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus"
            />
          </div>
          <div className="mb-4">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">이메일</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium opacity-70"
            />
            <p className="mt-1 text-[12px] text-muted-foreground">이메일 변경은 현재 지원하지 않습니다.</p>
          </div>
          <div className="mb-4">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">전화번호</label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus"
            />
          </div>
          <div className="mb-4">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">소속</label>
            <input
              type="text"
              value={affiliation}
              onChange={(event) => setAffiliation(event.target.value)}
              disabled={!canEditAffiliation}
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus disabled:opacity-70"
            />
            {!canEditAffiliation && <p className="mt-1 text-[12px] text-muted-foreground">소속 변경은 관리자에게 요청하세요.</p>}
          </div>
        </section>

        <section className="mb-8">
          <span className="text-sm-app font-bold text-text-sub block mb-3">보안 설정</span>
          <div className="mb-4">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">새 비밀번호</label>
            <input
              type="password"
              placeholder="8자 이상 입력"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus placeholder:text-muted-foreground"
            />
          </div>
          <div className="mb-1">
            <label className="block text-base-app text-text-sub mb-1.5 font-bold">새 비밀번호 확인</label>
            <input
              type="password"
              placeholder="비밀번호를 다시 입력"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full h-12 px-3.5 border border-border rounded-xl text-base-app text-foreground bg-[hsl(var(--bg-input))] font-medium outline-none transition-all focus:border-primary focus:shadow-input-focus placeholder:text-muted-foreground"
            />
          </div>
        </section>

        <section className="mb-8">
          <span className="text-sm-app font-bold text-text-sub block mb-3">알림 설정</span>
          <div className="flex justify-between items-center py-4 border-b border-border">
            <span className="text-base-app text-foreground">푸시 알림</span>
            <label className="relative inline-block w-12 h-[26px]">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(event) => setPushEnabled(event.target.checked)}
                className="opacity-0 w-0 h-0 peer"
              />
              <span className="absolute cursor-pointer inset-0 bg-border rounded-full transition-colors peer-checked:bg-primary before:content-[''] before:absolute before:h-5 before:w-5 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-transform peer-checked:before:translate-x-[22px]" />
            </label>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-base-app text-foreground">이메일 수신</span>
            <label className="relative inline-block w-12 h-[26px]">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(event) => setEmailEnabled(event.target.checked)}
                className="opacity-0 w-0 h-0 peer"
              />
              <span className="absolute cursor-pointer inset-0 bg-border rounded-full transition-colors peer-checked:bg-primary before:content-[''] before:absolute before:h-5 before:w-5 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-transform peer-checked:before:translate-x-[22px]" />
            </label>
          </div>
        </section>

        <section className="mb-8">
          <span className="text-sm-app font-bold text-text-sub block mb-3">기타</span>
          <div className="flex justify-between mb-5">
            <span className="text-sm-app text-text-sub">앱 버전</span>
            <span className="text-sm-app text-foreground font-semibold">{APP_VERSION}</span>
          </div>
          <button
            type="button"
            onClick={handleRequestDeletion}
            disabled={requestingDeletion || hasPendingDeletionRequest}
            className="text-destructive text-sm-app font-bold bg-transparent border-none p-0 cursor-pointer underline disabled:no-underline disabled:opacity-50"
          >
            {requestingDeletion ? "요청 처리중" : hasPendingDeletionRequest ? "탈퇴 요청 접수됨" : "회원 탈퇴 요청"}
          </button>
          <p className="mt-2 text-[12px] text-muted-foreground">
            현재 앱에서는 즉시 계정 삭제를 수행하지 않습니다. 탈퇴 요청을 접수하면 관리자 확인 후 처리됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
