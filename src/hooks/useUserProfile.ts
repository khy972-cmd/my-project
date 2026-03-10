import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAppRole, type AppRole } from "@/lib/roles";

export interface UserProfile {
  user_id: string;
  name: string;
  phone: string | null;
  affiliation: string | null;
  job_title: string | null;
  avatar_url: string | null;
  notification_push_enabled: boolean;
  notification_email_enabled: boolean;
  app_version_seen: string | null;
  deletion_requested_at: string | null;
  deletion_request_status: "requested" | "reviewing" | "approved" | "rejected" | null;
  deletion_request_reason: string | null;
}

const TEST_AFFILIATIONS: Record<AppRole, string> = {
  admin: "이노피앤씨 본사",
  manager: "이노피앤씨 관리자",
  worker: "이노피앤씨 작업자",
  partner: "테스트 파트너사",
};

function readMetadataBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function buildProfileFromUser(user: User): UserProfile {
  return {
    user_id: user.id,
    name: user.user_metadata?.name ?? user.email ?? "",
    phone: user.user_metadata?.phone ?? null,
    affiliation: user.user_metadata?.affiliation ?? null,
    job_title: user.user_metadata?.job_title ?? null,
    avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    notification_push_enabled: readMetadataBoolean(user.user_metadata?.notification_push_enabled, true),
    notification_email_enabled: readMetadataBoolean(user.user_metadata?.notification_email_enabled, false),
    app_version_seen: typeof user.user_metadata?.app_version_seen === "string" ? user.user_metadata.app_version_seen : null,
    deletion_requested_at:
      typeof user.user_metadata?.deletion_requested_at === "string" ? user.user_metadata.deletion_requested_at : null,
    deletion_request_status: null,
    deletion_request_reason: null,
  };
}

function buildTestProfile(userId: string, role: AppRole): UserProfile {
  return {
    user_id: userId,
    name: `${role} 테스트 계정`,
    phone: "010-0000-0000",
    affiliation: TEST_AFFILIATIONS[role],
    job_title: null,
    avatar_url: null,
    notification_push_enabled: true,
    notification_email_enabled: false,
    app_version_seen: null,
    deletion_requested_at: null,
    deletion_request_status: null,
    deletion_request_reason: null,
  };
}

export function useUserProfile() {
  const { user, isTestMode, testRole } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (isTestMode) {
      const testUserId = user?.id ?? `test-${normalizeAppRole(testRole)}`;
      setProfile(buildTestProfile(testUserId, normalizeAppRole(testRole)));
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    let latestUser = user;
    const latestUserResult = await supabase.auth.getUser();
    if (latestUserResult.data.user?.id === user.id) {
      latestUser = latestUserResult.data.user;
    }

    const fallbackProfile = buildProfileFromUser(latestUser);

    const [{ data: profileRow }, { data: settingsRow }, { data: latestDeletionRequest }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, name, phone, affiliation, job_title")
        .eq("user_id", user.id)
        .maybeSingle(),
      (supabase as any)
        .from("user_settings")
        .select("user_id, push_enabled, email_opt_in, app_version_seen")
        .eq("user_id", user.id)
        .maybeSingle(),
      (supabase as any)
        .from("account_deletion_requests")
        .select("id, status, reason, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const mergedProfile: UserProfile = {
      ...fallbackProfile,
      user_id: profileRow?.user_id || fallbackProfile.user_id,
      name: profileRow?.name || fallbackProfile.name,
      phone: profileRow?.phone ?? fallbackProfile.phone,
      affiliation: profileRow?.affiliation ?? fallbackProfile.affiliation,
      job_title: profileRow?.job_title ?? fallbackProfile.job_title,
      notification_push_enabled:
        typeof settingsRow?.push_enabled === "boolean" ? settingsRow.push_enabled : fallbackProfile.notification_push_enabled,
      notification_email_enabled:
        typeof settingsRow?.email_opt_in === "boolean" ? settingsRow.email_opt_in : fallbackProfile.notification_email_enabled,
      app_version_seen:
        typeof settingsRow?.app_version_seen === "string" ? settingsRow.app_version_seen : fallbackProfile.app_version_seen,
      deletion_requested_at:
        typeof latestDeletionRequest?.created_at === "string"
          ? latestDeletionRequest.created_at
          : fallbackProfile.deletion_requested_at,
      deletion_request_status:
        latestDeletionRequest?.status === "requested" ||
        latestDeletionRequest?.status === "reviewing" ||
        latestDeletionRequest?.status === "approved" ||
        latestDeletionRequest?.status === "rejected"
          ? latestDeletionRequest.status
          : fallbackProfile.deletion_request_status,
      deletion_request_reason:
        typeof latestDeletionRequest?.reason === "string"
          ? latestDeletionRequest.reason
          : fallbackProfile.deletion_request_reason,
    };

    setProfile(mergedProfile);
    setLoading(false);
  }, [isTestMode, testRole, user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  return {
    profile,
    loading,
    refreshProfile,
  };
}
