import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EstimateResult } from "@/features/projects/types";

export interface Revision {
  id: string;
  projectId: string;
  userId: string;
  label: string;
  inputs: unknown;
  results: EstimateResult;
  createdAt: string;
  updatedAt: string;
}

export function useRevisions(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "revisions"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await api.get<{ revisions: Revision[] }>(
        `/api/projects/${projectId}/revisions`,
      );
      return data.revisions;
    },
  });
}

export type ComparedKey = "bricks" | "cementBags" | "sandFt3" | "crushFt3" | "netVolumeFt3" | "mortarFt3";

export interface CompareResult {
  a: Revision;
  b: Revision;
  delta: Record<ComparedKey, { a: number; b: number; diff: number; pct: number }>;
}

export function useCompareRevisions(aId: string | null, bId: string | null) {
  return useQuery({
    queryKey: ["revisions", "compare", aId, bId],
    enabled: !!aId && !!bId && aId !== bId,
    queryFn: async () => {
      const { data } = await api.get<CompareResult>("/api/revisions/compare", {
        params: { a: aId, b: bId },
      });
      return data;
    },
  });
}

export function useRestoreRevision(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (revisionId: string) => {
      await api.post(`/api/revisions/${revisionId}/restore`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "revisions"] });
      qc.invalidateQueries({ queryKey: ["revisions", "all"] });
    },
  });
}

// -------------------------------------------------------------------------
// Global (user-wide) history — used by /history
// -------------------------------------------------------------------------

export interface GlobalRevision extends Revision {
  projectName: string;
}

export interface GlobalHistoryPayload {
  revisions: GlobalRevision[];
  projects: Array<{ id: string; name: string }>;
}

export function useAllRevisions(projectId?: string) {
  return useQuery({
    queryKey: ["revisions", "all", projectId ?? "*"],
    queryFn: async () => {
      const { data } = await api.get<GlobalHistoryPayload>("/api/revisions", {
        params: projectId ? { projectId } : undefined,
      });
      return data;
    },
    staleTime: 15_000,
  });
}

/**
 * Restore when the caller doesn't know the project up front (used from the
 * global History page). On success, invalidates every project tree so the
 * target project gets fresh data.
 */
export function useRestoreRevisionGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ revisionId }: { revisionId: string; projectId: string }) => {
      await api.post(`/api/revisions/${revisionId}/restore`);
    },
    onSuccess: (_data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects", projectId, "revisions"] });
      qc.invalidateQueries({ queryKey: ["revisions", "all"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
