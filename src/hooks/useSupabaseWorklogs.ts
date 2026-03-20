/**
 * Supabase-backed worklog hooks with React Query + Realtime
 * Falls back to localStorage in test mode (no auth)
 */
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normalizeAppRole } from "@/lib/roles";
import {
  deleteWorklog as localDeleteWorklog,
  getAllWorklogs,
  migrateOldWorklogs,
  saveWorklog as localSaveWorklog,
  updateWorklogStatus as localUpdateStatus,
  type ManpowerItem,
  type MaterialItem,
  type WorklogEntry,
  type WorklogStatus,
  type WorkSet,
} from "@/lib/worklogStore";
import { ATTACHMENT_MAP_KEY } from "@/constants/storageKeys";
import { deleteRef, isAttachmentRef, type AttachmentRef, type AttachmentType } from "@/lib/attachmentStore";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AMBIGUOUS_SITE_ERROR = "현장을 다시 선택해주세요.";

const WORKLOG_SITE_DEBUG = import.meta.env.DEV;

type WorklogAttachmentMeta = {
  photos: AttachmentRef[];
  drawings: AttachmentRef[];
};

type WorklogRow = Database["public"]["Tables"]["worklogs"]["Row"];
type WorklogManpowerRow = Database["public"]["Tables"]["worklog_manpower"]["Row"];
type WorklogWorksetRow = Database["public"]["Tables"]["worklog_worksets"]["Row"];
type WorklogMaterialRow = Database["public"]["Tables"]["worklog_materials"]["Row"];
type WorklogDocumentRow = Pick<Database["public"]["Tables"]["documents"]["Row"], "worklog_id" | "doc_type">;

type WorklogQueryRow = WorklogRow & {
  worklog_manpower?: WorklogManpowerRow[] | null;
  worklog_worksets?: WorklogWorksetRow[] | null;
  worklog_materials?: WorklogMaterialRow[] | null;
};

type SiteNameResolution =
  | { siteId: string; branch: "membership-name-match" | "global-name-match"; candidate: string }
  | { siteId: ""; branch: "none"; candidate: "" };

export type WorklogMutationInput = {
  siteName: string;
  siteValue?: string;
  dept: string;
  workDate: string;
  manpower: ManpowerItem[];
  workSets: WorkSet[];
  materials: MaterialItem[];
  photos?: AttachmentRef[];
  drawings?: AttachmentRef[];
  photoCount?: number;
  drawingCount?: number;
  status: WorklogStatus;
  version?: number;
  weather?: string;
};

function normalizeWorklogStatus(rawStatus: unknown): WorklogStatus {
  const status = String(rawStatus || "").toLowerCase();
  if (status === "draft" || status === "pending" || status === "approved" || status === "rejected") return status;
  if (status === "submitted") return "pending";
  if (status === "reject") return "rejected";
  return "draft";
}

function logWorklogSiteResolution(label: string, payload: Record<string, unknown>) {
  if (!WORKLOG_SITE_DEBUG) return;
  console.info("[worklog-site-resolve]", { label, ...payload });
}

function defaultStatusByType(type: AttachmentType) {
  return type === "photo" ? "after" : "progress";
}

function normalizeAttachmentList(raw: unknown, type: AttachmentType): AttachmentRef[] {
  if (!Array.isArray(raw)) return [];
  const now = new Date().toISOString();

  return raw
    .map((row) => {
      if (isAttachmentRef(row)) {
        return { ...row, type };
      }
      if (!row || typeof row !== "object") return null;
      const item = row as Record<string, unknown>;
      if (typeof item.id !== "string") return null;
      const normalized: AttachmentRef & { url?: string } = {
        id: item.id,
        type,
        status: typeof item.status === "string" ? item.status : defaultStatusByType(type),
        timestamp: typeof item.timestamp === "string" ? item.timestamp : now,
      };
      if (typeof item.name === "string" && item.name.trim()) normalized.name = item.name;
      if (typeof item.mime === "string" && item.mime.trim()) normalized.mime = item.mime;
      if (typeof item.ext === "string" && item.ext.trim()) normalized.ext = item.ext;
      if (Number.isFinite(Number(item.size))) normalized.size = Number(item.size);
      if (item.drawingType === "drawing_file" || item.drawingType === "drawing_markup") {
        normalized.drawingType = item.drawingType;
      }
      if (typeof item.siteValue === "string" && item.siteValue.trim()) normalized.siteValue = item.siteValue;
      if (typeof item.siteName === "string" && item.siteName.trim()) normalized.siteName = item.siteName;
      if (typeof item.workDate === "string" && item.workDate.trim()) normalized.workDate = item.workDate;
      if (typeof item.source === "string" && item.source.trim()) normalized.source = item.source;
      const legacyUrl =
        typeof item.url === "string" && item.url.trim()
          ? item.url
          : typeof item.img === "string" && item.img.trim()
            ? item.img
            : "";
      if (legacyUrl) {
        normalized.url = legacyUrl;
      }
      return normalized as AttachmentRef;
    })
    .filter(Boolean) as AttachmentRef[];
}

function readAttachmentMap(): Record<string, WorklogAttachmentMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(ATTACHMENT_MAP_KEY) || "{}");
    if (!raw || typeof raw !== "object") return {};
    const map: Record<string, WorklogAttachmentMeta> = {};

    Object.entries(raw).forEach(([worklogId, payload]) => {
      if (!payload || typeof payload !== "object") return;
      const row = payload as Record<string, unknown>;
      map[worklogId] = {
        photos: normalizeAttachmentList(row.photos, "photo"),
        drawings: normalizeAttachmentList(row.drawings, "drawing"),
      };
    });

    return map;
  } catch {
    return {};
  }
}

function writeAttachmentMap(map: Record<string, WorklogAttachmentMeta>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ATTACHMENT_MAP_KEY, JSON.stringify(map));
}

function getAttachmentMeta(worklogId: string): WorklogAttachmentMeta {
  const map = readAttachmentMap();
  return map[worklogId] || { photos: [], drawings: [] };
}

function setAttachmentMeta(worklogId: string, photos: AttachmentRef[], drawings: AttachmentRef[]) {
  if (!worklogId) return;
  const map = readAttachmentMap();
  map[worklogId] = {
    photos: normalizeAttachmentList(photos, "photo"),
    drawings: normalizeAttachmentList(drawings, "drawing"),
  };
  writeAttachmentMap(map);
}

async function removeAttachmentMeta(worklogId: string) {
  if (!worklogId) return;
  const map = readAttachmentMap();
  const row = map[worklogId];

  if (row) {
    const refs = [...row.photos, ...row.drawings];
    for (const ref of refs) {
      try {
        await deleteRef(ref.id);
      } catch {
        // keep deleting best-effort
      }
    }
  }

  delete map[worklogId];
  writeAttachmentMap(map);
}

function resolveMediaCounts(entry: WorklogMutationInput, meta: WorklogAttachmentMeta) {
  const photoCount = Math.max(Number(entry.photoCount || 0), meta.photos.length);
  const drawingCount = Math.max(Number(entry.drawingCount || 0), meta.drawings.length);
  return { photoCount, drawingCount };
}

function mapToWorklogEntry(
  row: WorklogQueryRow,
  mediaCounts?: {
    photoCount: number;
    drawingCount: number;
  },
  attachmentMeta?: WorklogAttachmentMeta,
): WorklogEntry {
  const meta = attachmentMeta || getAttachmentMeta(row.id);
  const photoCount = Math.max(Number(mediaCounts?.photoCount || 0), meta.photos.length);
  const drawingCount = Math.max(Number(mediaCounts?.drawingCount || 0), meta.drawings.length);

  return {
    id: row.id,
    siteValue: row.site_id || "",
    siteName: row.site_name || "",
    createdBy: row.created_by || undefined,
    dept: row.dept || "",
    workDate: row.work_date || "",
    manpower: (row.worklog_manpower || []).map((m) => ({
      id: Number(m.id) || Date.now(),
      worker: m.worker_name || "",
      workHours: Number(m.work_hours || 0),
      isCustom: Boolean(m.is_custom),
      locked: Boolean(m.locked),
    })),
    workSets: (row.worklog_worksets || []).map((ws) => ({
      id: Number(ws.id) || Date.now(),
      member: ws.member || "",
      process: ws.process || "",
      type: ws.work_type || "",
      location: { block: ws.block || "", dong: ws.dong || "", floor: ws.floor || "" },
      customMemberValue: "",
      customProcessValue: "",
      customTypeValue: "",
    })),
    materials: (row.worklog_materials || []).map((mt) => ({
      id: Number(mt.id) || Date.now(),
      name: mt.name || "",
      qty: Number(mt.qty || 0),
    })),
    photos: meta.photos,
    drawings: meta.drawings,
    photoCount,
    drawingCount,
    status: normalizeWorklogStatus(row.status),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || undefined,
    version: Math.max(1, Number(row.version || 1)),
    weather: row.weather || "",
  };
}

async function canCreateSite(userId: string, allowCreate: boolean) {
  if (allowCreate) return true;
  const { data: roleRows, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!error) {
    return (roleRows ?? []).some((row) => {
      const role = normalizeAppRole(row.role);
      return role === "admin" || role === "manager";
    });
  }
  const { data, error: adminError } = await supabase.rpc("has_role", { _role: "admin", _user_id: userId });
  if (!adminError && data) return true;
  return false;
}

async function getSiteCreatorMembershipRole(userId: string): Promise<"manager" | "worker"> {
  const { data: roleRows, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return "worker";
  return (roleRows ?? []).some((row) => normalizeAppRole(row.role) === "manager") ? "manager" : "worker";
}

async function findOrCreateSite(siteName: string, userId: string, allowCreate: boolean): Promise<string> {
  const trimmedName = siteName.trim();
  const { data: existing } = await supabase.from("sites").select("id").eq("name", trimmedName).limit(1).maybeSingle();
  if (existing?.id) return existing.id;

  const isAdmin = await canCreateSite(userId, allowCreate);
  if (!isAdmin) throw new Error("현장 생성 권한이 없습니다. 기존 현장을 선택해 주세요.");

  const { error } = await supabase.from("sites").insert({ name: trimmedName, created_by: userId, status: "진행중" });

  if (error) {
    const { data: retry } = await supabase.from("sites").select("id").eq("name", trimmedName).limit(1).maybeSingle();
    if (retry?.id) return retry.id;
    throw error;
  }

  const { data: created, error: lookupError } = await supabase
    .from("sites")
    .select("id")
    .eq("name", trimmedName)
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lookupError || !created?.id) throw lookupError ?? new Error("site_lookup_failed");

  const bootstrapRole = await getSiteCreatorMembershipRole(userId);
  await supabase.from("site_members").insert({ site_id: created.id, user_id: userId, role: bootstrapRole });
  return created.id;
}

async function findExistingSiteIdByName(siteNames: Array<string | undefined>, userId: string): Promise<SiteNameResolution> {
  const candidates = [...new Set(siteNames.map((name) => String(name || "").trim()).filter(Boolean))];

  if (candidates.length === 0) return { siteId: "", branch: "none", candidate: "" };

  const { data: membershipRows, error: membershipError } = await supabase
    .from("site_members")
    .select("site_id, sites:site_id(id, name)")
    .eq("user_id", userId);

  if (!membershipError) {
    for (const candidate of candidates) {
      const matches = (membershipRows || []).filter((row: any) => {
        const site = Array.isArray(row?.sites) ? row.sites[0] : row?.sites;
        return String(site?.name || "").trim() === candidate;
      });

      if (matches.length === 1) {
        return {
          siteId: String(matches[0]?.site_id || ""),
          branch: "membership-name-match",
          candidate,
        };
      }
      if (matches.length > 1) throw new Error(AMBIGUOUS_SITE_ERROR);
    }
  }

  for (const candidate of candidates) {
    const { data, error } = await supabase.from("sites").select("id").eq("name", candidate);
    if (error) continue;
    if ((data || []).length === 1) {
      return {
        siteId: String(data?.[0]?.id || ""),
        branch: "global-name-match",
        candidate,
      };
    }
    if ((data || []).length > 1) throw new Error(AMBIGUOUS_SITE_ERROR);
  }
  return { siteId: "", branch: "none", candidate: "" };
}

async function resolveSiteId(siteName: string, siteValue: string | undefined, userId: string, allowCreate: boolean) {
  const candidateNames = [siteName, siteValue && !UUID_RE.test(siteValue) ? siteValue : ""].filter(Boolean);
  let branch = "create-path";

  try {
    if (siteValue && UUID_RE.test(siteValue)) {
      const { data, error } = await supabase.from("sites").select("id").eq("id", siteValue).maybeSingle();
      if (!error && data?.id) {
        branch = "uuid-direct";
        logWorklogSiteResolution("resolved", {
          branch,
          inputSiteValue: siteValue,
          candidateNames,
          resolvedSiteId: data.id,
        });
        return data.id;
      }
    }

    const existingMatch = await findExistingSiteIdByName([
      siteName,
      siteValue && !UUID_RE.test(siteValue) ? siteValue : "",
    ], userId);
    if (existingMatch.siteId) {
      branch = existingMatch.branch;
      logWorklogSiteResolution("resolved", {
        branch,
        inputSiteValue: siteValue || "",
        candidateName: existingMatch.candidate,
        resolvedSiteId: existingMatch.siteId,
      });
      return existingMatch.siteId;
    }

    branch = "create-path";
    const createdSiteId = await findOrCreateSite(siteName, userId, allowCreate);
    logWorklogSiteResolution("resolved", {
      branch,
      inputSiteValue: siteValue || "",
      candidateNames,
      resolvedSiteId: createdSiteId,
    });
    return createdSiteId;
  } catch (error) {
    logWorklogSiteResolution("error", {
      branch: error instanceof Error && error.message === AMBIGUOUS_SITE_ERROR ? "ambiguous" : branch,
      inputSiteValue: siteValue || "",
      candidateNames,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function insertWorklogDetails(worklogId: string, entry: WorklogMutationInput) {
  if (entry.manpower.length > 0) {
    const { error } = await supabase.from("worklog_manpower").insert(
      entry.manpower.map((item) => ({
        worklog_id: worklogId,
        worker_name: item.worker,
        work_hours: item.workHours,
        is_custom: item.isCustom,
        locked: item.locked,
      })),
    );
    if (error) throw error;
  }

  if (entry.workSets.length > 0) {
    const { error } = await supabase.from("worklog_worksets").insert(
      entry.workSets.map((item) => ({
        worklog_id: worklogId,
        member: item.member === "기타" ? item.customMemberValue : item.member,
        process: item.process === "기타" ? item.customProcessValue : item.process,
        work_type: item.type === "기타" ? item.customTypeValue : item.type,
        block: item.location?.block || "",
        dong: item.location?.dong || "",
        floor: item.location?.floor || "",
      })),
    );
    if (error) throw error;
  }

  if (entry.materials.length > 0) {
    const { error } = await supabase.from("worklog_materials").insert(
      entry.materials.map((item) => ({
        worklog_id: worklogId,
        name: item.name,
        qty: item.qty,
      })),
    );
    if (error) throw error;
  }
}

async function replaceWorklogDetails(worklogId: string, entry: WorklogMutationInput) {
  await supabase.from("worklog_manpower").delete().eq("worklog_id", worklogId);
  await supabase.from("worklog_worksets").delete().eq("worklog_id", worklogId);
  await supabase.from("worklog_materials").delete().eq("worklog_id", worklogId);
  await insertWorklogDetails(worklogId, entry);
}

async function hasPrivilegedWorklogAccess(userId: string) {
  const { data: roleRows, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!error) {
    return (roleRows ?? []).some((row) => {
      const role = normalizeAppRole(row.role);
      return role === "admin" || role === "manager";
    });
  }

  const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
    supabase.rpc("has_role", { _role: "admin", _user_id: userId }),
    supabase.rpc("has_role", { _role: "manager", _user_id: userId }),
  ]);
  return !!isAdmin || !!isManager;
}

async function getWorklogAccessTarget(worklogId: string, userId: string) {
  const { data, error } = await supabase
    .from("worklogs")
    .select("id, created_by, status")
    .eq("id", worklogId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("작업일지를 찾을 수 없습니다.");

  const privileged = await hasPrivilegedWorklogAccess(userId);
  const isOwner = data.created_by === userId;
  const currentStatus = normalizeWorklogStatus(data.status);

  if (!privileged && !isOwner) {
    throw new Error("본인 작업일지만 수정할 수 있습니다.");
  }

  return { currentStatus, isOwner, privileged };
}

export function useWorklogs() {
  const { user, isTestMode } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  const query = useQuery({
    queryKey: ["worklogs", user?.id ?? "anon"],
    queryFn: async (): Promise<WorklogEntry[]> => {
      if (!isAuthenticated) {
        migrateOldWorklogs();
        return getAllWorklogs().map((entry) => ({ ...entry, status: normalizeWorklogStatus(entry.status) }));
      }

      const canViewAll = await hasPrivilegedWorklogAccess(user.id);
      let query = supabase
        .from("worklogs")
        .select(
          `
          *,
          worklog_manpower(*),
          worklog_worksets(*),
          worklog_materials(*)
        `,
        )
        .order("work_date", { ascending: false });

      if (!canViewAll) {
        query = query.eq("created_by", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data || []) as WorklogQueryRow[];
      const worklogIds = rows.map((row) => row.id).filter(Boolean);
      const mediaCountByWorklog: Record<string, { photoCount: number; drawingCount: number }> = {};
      const attachmentMap = readAttachmentMap();

      if (worklogIds.length > 0) {
        const { data: docs } = await supabase
          .from("documents")
          .select("worklog_id, doc_type")
          .in("worklog_id", worklogIds);

        const docRows = (docs || []) as WorklogDocumentRow[];
        docRows.forEach((doc) => {
          const worklogId = doc.worklog_id;
          if (!worklogId) return;
          if (!mediaCountByWorklog[worklogId]) mediaCountByWorklog[worklogId] = { photoCount: 0, drawingCount: 0 };
          if (doc.doc_type === "photo") mediaCountByWorklog[worklogId].photoCount += 1;
          if (doc.doc_type === "drawing") mediaCountByWorklog[worklogId].drawingCount += 1;
        });
      }

      return rows.map((row) => mapToWorklogEntry(row, mediaCountByWorklog[row.id], attachmentMap[row.id]));
    },
    enabled: isAuthenticated || isTestMode,
    refetchInterval: isAuthenticated ? false : 2000,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("worklogs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "worklogs" }, () =>
        queryClient.invalidateQueries({ queryKey: ["worklogs"] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, queryClient]);

  return query;
}

export function useSaveWorklog() {
  const { user, isTestMode, testRole } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: WorklogMutationInput) => {
      const now = new Date().toISOString();
      const fallbackMeta = {
        photos: normalizeAttachmentList(entry.photos || [], "photo"),
        drawings: normalizeAttachmentList(entry.drawings || [], "drawing"),
      };

      if (!user) {
        const counts = resolveMediaCounts(entry, fallbackMeta);
        return localSaveWorklog({
          ...entry,
          siteValue: entry.siteValue || entry.siteName,
          photos: fallbackMeta.photos,
          drawings: fallbackMeta.drawings,
          photoCount: counts.photoCount,
          drawingCount: counts.drawingCount,
          createdAt: now,
          version: Math.max(1, Number(entry.version || 1)),
        });
      }

      const allowCreate = isTestMode && testRole === "admin";
      const siteId = await resolveSiteId(entry.siteName, entry.siteValue, user.id, allowCreate);

      const { data: sameDayRows, error: sameDayError } = await supabase
        .from("worklogs")
        .select("id, version, status")
        .eq("site_id", siteId)
        .eq("work_date", entry.workDate)
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sameDayError) throw sameDayError;

      const existing = sameDayRows?.[0];
      const normalizedStatus = normalizeWorklogStatus(entry.status);

      if (existing?.id) {
        const canManageLocked = await hasPrivilegedWorklogAccess(user.id);
        if (!canManageLocked && normalizeWorklogStatus(existing.status) === "approved") {
          throw new Error("관리자 확정 후에는 수정할 수 없습니다.");
        }

        const { data: updatedWorklog, error: updateError } = await supabase
          .from("worklogs")
          .update({
            site_id: siteId,
            site_name: entry.siteName.trim(),
            dept: entry.dept || "",
            work_date: entry.workDate,
            status: normalizedStatus,
            version: Math.max(Number(existing.version || 1) + 1, Number(entry.version || 0) || Number(existing.version || 1) + 1),
            weather: entry.weather || "",
            updated_at: now,
          })
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateError) throw updateError;

        await replaceWorklogDetails(existing.id, entry);

        const prevMeta = getAttachmentMeta(existing.id);
        const nextMeta = {
          photos: fallbackMeta.photos.length > 0 ? fallbackMeta.photos : prevMeta.photos,
          drawings: fallbackMeta.drawings.length > 0 ? fallbackMeta.drawings : prevMeta.drawings,
        };
        setAttachmentMeta(existing.id, nextMeta.photos, nextMeta.drawings);

        return mapToWorklogEntry(
          { ...updatedWorklog, worklog_manpower: [], worklog_worksets: [], worklog_materials: [] },
          resolveMediaCounts(entry, nextMeta),
          nextMeta,
        );
      }

      const { data: insertedWorklog, error: insertError } = await supabase
        .from("worklogs")
        .insert({
          site_id: siteId,
          site_name: entry.siteName.trim(),
          dept: entry.dept || "",
          work_date: entry.workDate,
          status: normalizedStatus,
          version: Math.max(1, Number(entry.version || 1)),
          weather: entry.weather || "",
          created_by: user.id,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;
      await insertWorklogDetails(insertedWorklog.id, entry);
      setAttachmentMeta(insertedWorklog.id, fallbackMeta.photos, fallbackMeta.drawings);

      return mapToWorklogEntry(
        { ...insertedWorklog, worklog_manpower: [], worklog_worksets: [], worklog_materials: [] },
        resolveMediaCounts(entry, fallbackMeta),
        fallbackMeta,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    },
  });
}

export function useUpdateWorklog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: WorklogMutationInput }) => {
      const now = new Date().toISOString();
      const incomingMeta = {
        photos: normalizeAttachmentList(entry.photos || [], "photo"),
        drawings: normalizeAttachmentList(entry.drawings || [], "drawing"),
      };

      if (!user) {
        const previous = getAllWorklogs().find((log) => log.id === id);
        const nextMeta = {
          photos: incomingMeta.photos.length > 0 ? incomingMeta.photos : previous?.photos || [],
          drawings: incomingMeta.drawings.length > 0 ? incomingMeta.drawings : previous?.drawings || [],
        };
        const counts = resolveMediaCounts(entry, nextMeta);

        return localSaveWorklog({
          ...entry,
          id,
          siteValue: entry.siteValue || entry.siteName,
          photos: nextMeta.photos,
          drawings: nextMeta.drawings,
          photoCount: counts.photoCount,
          drawingCount: counts.drawingCount,
          createdAt: previous?.createdAt || now,
          version: Math.max(Number(previous?.version || 1) + 1, Number(entry.version || 0) || Number(previous?.version || 1) + 1),
        });
      }

      const access = await getWorklogAccessTarget(id, user.id);
      if (!access.privileged && access.currentStatus === "approved") {
        throw new Error("관리자 확정 후에는 수정할 수 없습니다.");
      }

      const prevMeta = getAttachmentMeta(id);
      const nextMeta = {
        photos: incomingMeta.photos.length > 0 ? incomingMeta.photos : prevMeta.photos,
        drawings: incomingMeta.drawings.length > 0 ? incomingMeta.drawings : prevMeta.drawings,
      };

      const { data: updatedWorklog, error: updateError } = await supabase
        .from("worklogs")
        .update({
          site_name: entry.siteName.trim(),
          dept: entry.dept || "",
          work_date: entry.workDate,
          status: normalizeWorklogStatus(entry.status),
          version: Math.max(1, Number(entry.version || 1)),
          weather: entry.weather || "",
          updated_at: now,
        })
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      await replaceWorklogDetails(id, entry);
      setAttachmentMeta(id, nextMeta.photos, nextMeta.drawings);

      return mapToWorklogEntry(
        { ...updatedWorklog, worklog_manpower: [], worklog_worksets: [], worklog_materials: [] },
        resolveMediaCounts(entry, nextMeta),
        nextMeta,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    },
  });
}

export function useUpdateWorklogStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WorklogStatus }) => {
      const normalizedStatus = normalizeWorklogStatus(status);
      if (!user) {
        localUpdateStatus(id, normalizedStatus);
        return;
      }

      const access = await getWorklogAccessTarget(id, user.id);
      if (!access.privileged && access.currentStatus === "approved") {
        throw new Error("관리자 확정 후에는 수정할 수 없습니다.");
      }
      if (!access.privileged && (normalizedStatus === "approved" || normalizedStatus === "rejected")) {
        throw new Error("승인 또는 반려 처리는 관리자만 가능합니다.");
      }

      const { error } = await supabase
        .from("worklogs")
        .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    },
  });
}

export function useDeleteWorklog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) {
        localDeleteWorklog(id);
        await removeAttachmentMeta(id);
        return;
      }

      const access = await getWorklogAccessTarget(id, user.id);
      if (!access.privileged && access.currentStatus === "approved") {
        throw new Error("관리자 확정 후에는 삭제할 수 없습니다.");
      }

      await supabase.from("worklog_manpower").delete().eq("worklog_id", id);
      await supabase.from("worklog_worksets").delete().eq("worklog_id", id);
      await supabase.from("worklog_materials").delete().eq("worklog_id", id);

      const { error } = await supabase.from("worklogs").delete().eq("id", id);
      if (error) throw error;
      await removeAttachmentMeta(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    },
  });
}
