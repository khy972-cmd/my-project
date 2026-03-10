/**
 * Supabase-backed punch hooks with React Query + Realtime
 * Falls back to localStorage in test mode (no auth)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import {
  getAllPunchGroups, savePunchGroups, initPunchData,
  addPunchItemToGroup as localAddItem,
  updatePunchItemInGroup as localUpdateItem,
  deletePunchItemFromGroup as localDeleteItem,
  type PunchGroup, type PunchItem,
} from "@/lib/punchStore";

// ─── Map Supabase → PunchGroup ───
function mapToPunchGroup(row: any): PunchGroup {
  return {
    id: row.id,
    title: row.site_name,
    contractor: row.contractor || "",
    affiliation: row.affiliation || "",
    author: row.author || "",
    date: row.punch_date,
    time: row.punch_time || "",
    status: row.status,
    punchItems: (row.punch_items || []).map((i: any) => ({
      id: i.id,
      location: i.location || "",
      issue: i.issue || "",
      priority: i.priority as PunchItem["priority"],
      status: i.status as PunchItem["status"],
      assignee: i.assignee || "",
      dueDate: i.due_date || "",
      date: i.created_at?.split("T")[0] || "",
      beforePhoto: i.before_photo || "",
      afterPhoto: i.after_photo || "",
    })),
    files: [],
  };
}

// ─── Hooks ───

export function usePunchGroups() {
  const { user, isTestMode } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  const query = useQuery({
    queryKey: ["punchGroups"],
    queryFn: async (): Promise<PunchGroup[]> => {
      if (!isAuthenticated) {
        initPunchData();
        return getAllPunchGroups();
      }

      const { data, error } = await supabase
        .from("punch_groups")
        .select(`*, punch_items(*)`)
        .order("punch_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToPunchGroup);
    },
    enabled: isAuthenticated || isTestMode,
    refetchInterval: isAuthenticated ? false : 2000,
  });

  // Realtime
  useEffect(() => {
    if (!isAuthenticated) return;
    const channel = supabase
      .channel("punch-changes")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "punch_groups" },
        () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] })
      )
      .on("postgres_changes",
        { event: "*", schema: "public", table: "punch_items" },
        () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, queryClient]);

  return query;
}

export function usePunchStats() {
  const { data: groups = [] } = usePunchGroups();
  const items = groups.flatMap(g => g.punchItems || []);
  return {
    total: items.length,
    open: items.filter(i => i.status !== "done").length,
    done: items.filter(i => i.status === "done").length,
  };
}

export function useAddPunchItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, item }: { groupId: string; item: PunchItem }) => {
      if (!user) {
        localAddItem(groupId, item);
        return;
      }
      const { error } = await supabase.from("punch_items").insert({
        group_id: groupId,
        location: item.location,
        issue: item.issue,
        priority: item.priority,
        status: item.status,
        assignee: item.assignee,
        due_date: item.dueDate || null,
        before_photo: item.beforePhoto,
        after_photo: item.afterPhoto,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] }),
  });
}

export function useUpdatePunchItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      groupId,
      itemId,
      field,
      value,
    }: {
      groupId: string;
      itemId: string;
      field: string;
      value: string;
    }) => {
      if (!user) {
        localUpdateItem(groupId, itemId, { [field]: value });
        return;
      }

      // Map field names from local format to Supabase column names
      const fieldMap: Record<string, string> = {
        location: "location",
        issue: "issue",
        priority: "priority",
        status: "status",
        assignee: "assignee",
        dueDate: "due_date",
        beforePhoto: "before_photo",
        afterPhoto: "after_photo",
      };

      const dbField = fieldMap[field] || field;
      const { error } = await supabase
        .from("punch_items")
        .update({ [dbField]: value })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] }),
  });
}

export function useDeletePunchItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, itemId }: { groupId: string; itemId: string }) => {
      if (!user) {
        localDeleteItem(groupId, itemId);
        return;
      }
      const { error } = await supabase
        .from("punch_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] }),
  });
}

export function useSavePunchGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groups: PunchGroup[]) => {
      if (!user) {
        savePunchGroups(groups);
        return;
      }
      // For Supabase, individual operations are handled by other hooks
      // This is a fallback for bulk operations in test mode
      savePunchGroups(groups);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["punchGroups"] }),
  });
}
