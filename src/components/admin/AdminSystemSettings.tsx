import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Settings, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { isMissingSchemaEntityError } from "@/lib/operationalData";

type Stats = {
  users: number;
  sites: number;
  documents: number;
  worklogs: number;
};

type SystemConfigRow = {
  id: string;
  key: string;
  value: any;
  description?: string | null;
  updated_at?: string;
};

export default function AdminSystemSettings() {
  const { isAdmin } = useUserRole();
  const queryClient = useQueryClient();
  const [newOpen, setNewOpen] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValueText, setNewValueText] = useState("{}");
  const [newDescription, setNewDescription] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editValueText, setEditValueText] = useState("{}");

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-system-stats"],
    enabled: isAdmin,
    queryFn: async (): Promise<Stats> => {
      const [ur, st, doc, wl] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("sites").select("*", { count: "exact", head: true }),
        supabase.from("documents").select("*", { count: "exact", head: true }),
        supabase.from("worklogs").select("*", { count: "exact", head: true }),
      ]);
      return {
        users: ur.count ?? 0,
        sites: st.count ?? 0,
        documents: doc.count ?? 0,
        worklogs: wl.count ?? 0,
      };
    },
  });

  const {
    data: configs,
    isLoading: cfgLoading,
    error: cfgError,
  } = useQuery({
    queryKey: ["admin-system-configs"],
    enabled: isAdmin,
    staleTime: 15_000,
    queryFn: async (): Promise<SystemConfigRow[] | null> => {
      const { data, error } = await supabase
        .from("admin_system_configs")
        .select("id, key, value, description, updated_at")
        .order("key", { ascending: true })
        .limit(500);

      if (error) {
        if (isMissingSchemaEntityError(error, "admin_system_configs")) return null;
        throw error;
      }
      return (data || []) as any;
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async () => {
      const key = newKey.trim();
      if (!key) throw new Error("key를 입력하세요.");
      let value: any;
      try {
        value = JSON.parse(newValueText || "{}");
      } catch {
        throw new Error("value는 JSON 형식이어야 합니다.");
      }

      const { error } = await supabase.from("admin_system_configs").insert({
        key,
        value,
        description: newDescription.trim() || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-system-configs"] });
      setNewOpen(false);
      setNewKey("");
      setNewValueText("{}");
      setNewDescription("");
      toast.success("설정이 추가되었습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "추가에 실패했습니다."),
  });

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      if (!editId) return;
      let value: any;
      try {
        value = JSON.parse(editValueText || "{}");
      } catch {
        throw new Error("value는 JSON 형식이어야 합니다.");
      }
      const { error } = await supabase.from("admin_system_configs").update({ value } as any).eq("id", editId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-system-configs"] });
      setEditId(null);
      toast.success("설정이 저장되었습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "저장에 실패했습니다."),
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_system_configs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-system-configs"] });
      toast.success("설정이 삭제되었습니다.");
    },
    onError: (e: { message?: string }) => toast.error(e.message || "삭제에 실패했습니다."),
  });

  if (!isAdmin) {
    return (
      <div className="py-20 text-center text-muted-foreground">시스템 설정은 본사관리자만 이용할 수 있습니다.</div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">시스템 설정</h1>
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">통계를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">시스템 설정</h1>
        <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";
  const configTableReady = configs !== null;

  return (
    <div className="animate-fade-in">
      <h1 className="mb-0.5 text-lg-app font-[800] text-header-navy">시스템 설정</h1>
      <p className="mb-5 text-[15px] font-medium text-text-sub">시스템 현황을 확인하고 설정 값을 관리합니다.</p>

      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { label: "가입 사용자", value: stats?.users ?? 0 },
          { label: "등록 현장", value: stats?.sites ?? 0 },
          { label: "문서 수", value: stats?.documents ?? 0 },
          { label: "작업일지 수", value: stats?.worklogs ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="text-[20px] font-[800] text-header-navy">{value}</div>
            <div className="text-[12px] font-bold text-text-sub">{label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-[15px] font-bold text-header-navy">
          <Settings className="h-5 w-5" /> 앱 버전
        </div>
        <p className="mt-1 text-[14px] text-text-sub">{version}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[15px] font-[800] text-header-navy">시스템 설정값</div>
          <button
            type="button"
            onClick={() => setNewOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold"
          >
            <Plus className="h-4 w-4" /> 추가
          </button>
        </div>

        {!configTableReady ? (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-[13px] text-muted-foreground">
            `admin_system_configs` 테이블이 아직 적용되지 않았습니다. 마이그레이션 적용 후 설정값 편집이 활성화됩니다.
          </div>
        ) : cfgError ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
            설정값을 불러오는 중 오류가 발생했습니다.
          </div>
        ) : cfgLoading ? (
          <div className="mt-3 py-10 text-center text-muted-foreground">로딩 중...</div>
        ) : (
          <>
            {newOpen && (
              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-text-sub">key</label>
                    <input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="예: maintenance"
                      className="h-11 w-full rounded-lg border border-border bg-card px-3 text-[14px] outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[13px] font-bold text-text-sub">description</label>
                    <input
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="설명(선택)"
                      className="h-11 w-full rounded-lg border border-border bg-card px-3 text-[14px] outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-[13px] font-bold text-text-sub">value (JSON)</label>
                  <textarea
                    value={newValueText}
                    onChange={(e) => setNewValueText(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px] outline-none focus:border-primary"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => createConfigMutation.mutate()}
                    disabled={createConfigMutation.isPending}
                    className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    <Save className="mr-1 inline h-4 w-4" />
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewOpen(false)}
                    className="rounded-lg border border-border px-4 py-2 text-[13px] font-bold"
                  >
                    <X className="mr-1 inline h-4 w-4" />
                    닫기
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {(configs || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-[13px] text-muted-foreground">
                  등록된 설정값이 없습니다.
                </div>
              ) : (
                (configs || []).map((row) => {
                  const isEditing = editId === row.id;
                  return (
                    <div key={row.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-[800] text-foreground">{row.key}</div>
                          {row.description ? <div className="text-[12px] text-text-sub">{row.description}</div> : null}
                          {row.updated_at ? (
                            <div className="text-[11px] text-muted-foreground">updated: {String(row.updated_at).slice(0, 19).replace("T", " ")}</div>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateConfigMutation.mutate()}
                                disabled={updateConfigMutation.isPending}
                                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditId(null)}
                                className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold"
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(row.id);
                                setEditValueText(
                                  (() => {
                                    try {
                                      return JSON.stringify(row.value ?? {}, null, 2);
                                    } catch {
                                      return "{}";
                                    }
                                  })(),
                                );
                              }}
                              className="rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-[13px] font-bold"
                            >
                              수정
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteConfigMutation.mutate(row.id)}
                            disabled={deleteConfigMutation.isPending}
                            className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-bold text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="inline h-4 w-4" /> 삭제
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        {isEditing ? (
                          <textarea
                            value={editValueText}
                            onChange={(e) => setEditValueText(e.target.value)}
                            rows={6}
                            className="w-full rounded-lg border border-border bg-muted/10 px-3 py-2 font-mono text-[12px] outline-none focus:border-primary"
                          />
                        ) : (
                          <pre className="overflow-auto rounded-lg border border-border bg-muted/10 px-3 py-2 text-[12px]">
                            {(() => {
                              try {
                                return JSON.stringify(row.value ?? {}, null, 2);
                              } catch {
                                return "{}";
                              }
                            })()}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
