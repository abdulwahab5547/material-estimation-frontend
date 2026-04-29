import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Template, TemplateKind } from "./types";
import type { Project, Room, Wall } from "@/features/projects/types";

export function useTemplatesList(kind?: TemplateKind) {
  return useQuery({
    queryKey: ["templates", kind ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<{ templates: Template[] }>("/api/templates", {
        params: kind ? { kind } : undefined,
      });
      return data.templates;
    },
  });
}

export interface SaveRoomTemplateInput {
  name: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
}

export function useSaveRoomTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ roomId, input }: { roomId: string; input: SaveRoomTemplateInput }) => {
      const { data } = await api.post<{ template: Template }>(
        `/api/templates/from-room/${roomId}`,
        input,
      );
      return data.template;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useApplyTemplate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      templateId,
      floorId,
      name,
    }: {
      templateId: string;
      floorId: string;
      name?: string;
    }) => {
      const { data } = await api.post<{ room: Room; walls: Wall[] }>(
        `/api/templates/${templateId}/apply-to-floor/${floorId}`,
        { name },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/api/templates/${templateId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useCloneProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceProjectId, name }: { sourceProjectId: string; name?: string }) => {
      const { data } = await api.post<{ project: Project }>(
        `/api/projects/${sourceProjectId}/clone`,
        { name },
      );
      return data.project;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
