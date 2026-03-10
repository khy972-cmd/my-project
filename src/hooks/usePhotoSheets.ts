import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildPhotoSheetDraftFromSources,
  buildPhotoSheetFinalFromDraft,
} from "@/lib/photoSheet/mapper";
import {
  normalizePhotoSheetDraft,
  normalizePhotoSheetItemStatus,
  toPhotoSheetDraftKey,
} from "@/lib/photoSheet/normalize";
import {
  finalizeRemotePhotoSheetDraft,
  getLocalPhotoSheetDraft,
  listLocalPhotoSheetDrafts,
  listLocalPhotoSheetFinals,
  listRemotePhotoSheetDrafts,
  listRemotePhotoSheetFinals,
  removeLocalPhotoSheetFinalByDraftId,
  reopenRemotePhotoSheetDraft,
  saveRemotePhotoSheetDraft,
  upsertLocalPhotoSheetDraft,
  upsertLocalPhotoSheetFinal,
} from "@/lib/photoSheet/store";
import type {
  BuildPhotoSheetDraftParams,
  PhotoSheetDraft,
  PhotoSheetQueryData,
} from "@/lib/photoSheet/types";

function mergeDraftsByIdentity(local: PhotoSheetDraft[], remote: PhotoSheetDraft[]) {
  const map = new Map<string, PhotoSheetDraft>();

  [...local, ...remote].forEach((draft) => {
    const key = toPhotoSheetDraftKey(draft.siteValue, draft.siteName, draft.workDate);
    const prev = map.get(key);
    if (!prev || (draft.updatedAt || "") > (prev.updatedAt || "")) {
      map.set(key, draft);
    }
  });

  return [...map.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function usePhotoSheets() {
  const { user, isTestMode } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  const query = useQuery({
    queryKey: ["photo-sheets", user?.id || "local"],
    queryFn: async (): Promise<PhotoSheetQueryData> => {
      const localDrafts = listLocalPhotoSheetDrafts();
      const localFinals = listLocalPhotoSheetFinals();

      if (!isAuthenticated) {
        return { drafts: localDrafts, finals: localFinals };
      }

      try {
        const [remoteDrafts, remoteFinals] = await Promise.all([
          listRemotePhotoSheetDrafts(),
          listRemotePhotoSheetFinals(),
        ]);

        const mergedDrafts = mergeDraftsByIdentity(localDrafts, remoteDrafts).map((draft) =>
          upsertLocalPhotoSheetDraft({ ...draft, localOnly: false, lastSyncedAt: draft.updatedAt }),
        );

        remoteFinals.forEach((item) => {
          upsertLocalPhotoSheetFinal(item);
        });

        return {
          drafts: mergedDrafts,
          finals: remoteFinals.length > 0 ? remoteFinals : localFinals,
        };
      } catch {
        return { drafts: localDrafts, finals: localFinals };
      }
    },
    enabled: isAuthenticated || isTestMode,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["photo-sheets", user?.id || "local"] });
  }, [queryClient, user?.id]);

  const saveDraftMutation = useMutation({
    mutationFn: async (inputDraft: PhotoSheetDraft) => {
      const normalized = normalizePhotoSheetDraft(inputDraft);
      if (!normalized) throw new Error("invalid_photo_sheet_draft");

      const localSaved = upsertLocalPhotoSheetDraft({
        ...normalized,
        localOnly: !isAuthenticated,
      });
      if (!isAuthenticated || !user?.id) return localSaved;

      const remoteSaved = await saveRemotePhotoSheetDraft(localSaved, user.id);
      return upsertLocalPhotoSheetDraft({
        ...remoteSaved,
        localOnly: false,
        lastSyncedAt: remoteSaved.updatedAt,
      });
    },
    onSuccess: invalidate,
  });

  const approveDraftMutation = useMutation({
    mutationFn: async (inputDraft: PhotoSheetDraft) => {
      const normalized = normalizePhotoSheetDraft(inputDraft);
      if (!normalized) throw new Error("invalid_photo_sheet_draft");

      const localDraft = upsertLocalPhotoSheetDraft({
        ...normalized,
        status: "finalized",
        updatedAt: new Date().toISOString(),
      });

      if (!isAuthenticated || !user?.id) {
        const localFinal = buildPhotoSheetFinalFromDraft({ draft: localDraft });
        upsertLocalPhotoSheetFinal(localFinal);
        return { draft: localDraft, final: localFinal };
      }

      return finalizeRemotePhotoSheetDraft(localDraft, user.id);
    },
    onSuccess: invalidate,
  });

  const reopenDraftMutation = useMutation({
    mutationFn: async (inputDraft: PhotoSheetDraft) => {
      const normalized = normalizePhotoSheetDraft(inputDraft);
      if (!normalized) throw new Error("invalid_photo_sheet_draft");

      if (!isAuthenticated || !user?.id) {
        const reopened = upsertLocalPhotoSheetDraft({
          ...normalized,
          status: "draft",
          updatedAt: new Date().toISOString(),
          localOnly: true,
        });
        removeLocalPhotoSheetFinalByDraftId(reopened.id);
        return reopened;
      }

      return reopenRemotePhotoSheetDraft(normalized, user.id);
    },
    onSuccess: invalidate,
  });

  const buildDraftFromSources = useCallback((params: BuildPhotoSheetDraftParams) => {
    const existing =
      params.existing ||
      getLocalPhotoSheetDraft(params.siteValue, params.siteName, params.workDate);
    return buildPhotoSheetDraftFromSources({
      ...params,
      existing,
      createdBy: params.createdBy || user?.id,
    });
  }, [user?.id]);

  return {
    drafts: query.data?.drafts || [],
    finals: query.data?.finals || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    buildDraftFromSources,
    normalizeItemStatus: normalizePhotoSheetItemStatus,
    saveDraft: saveDraftMutation.mutateAsync,
    approveDraft: approveDraftMutation.mutateAsync,
    reopenDraft: reopenDraftMutation.mutateAsync,
    isSavingDraft: saveDraftMutation.isPending,
    isApprovingDraft: approveDraftMutation.isPending,
    isReopeningDraft: reopenDraftMutation.isPending,
  };
}
