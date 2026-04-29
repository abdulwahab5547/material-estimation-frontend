import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  EstimateResult,
  Floor,
  Geometry,
  Project,
  ProjectListItem,
  ProjectTree,
  Room,
  RoomShape,
  Wall,
} from "./types";

// ---------------- queries --------------------------------------------------

export function useProjectsList() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data } = await api.get<{ projects: ProjectListItem[] }>("/api/projects");
      return data.projects;
    },
  });
}

export function useProjectTree(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await api.get<ProjectTree>(`/api/projects/${projectId}`);
      return data;
    },
  });
}

export function useLatestEstimate(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId, "estimate", "latest"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await api.get<{
        snapshot: { results: EstimateResult; createdAt: string; label: string } | null;
      }>(`/api/projects/${projectId}/estimate/latest`);
      return data.snapshot;
    },
  });
}

// ---------------- mutations ------------------------------------------------

export interface CreateProjectInput {
  name: string;
  client?: Partial<{ name: string; phone: string; email: string; address: string }>;
  location?: string;
  tag?: Project["tag"];
  numberOfFloors?: number;
  brickPreset?: Project["brickPreset"];
  mixRatio?: Project["mixRatio"];
  wastagePct?: number;
  currency?: string;
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data } = await api.post<{ project: Project }>("/api/projects", input);
      return data.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export interface DemoPresetSummary {
  id: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  icon: string;
  tag: "residential" | "commercial" | "renovation" | "other";
  brickPreset: "Standard" | "Modular" | "Engineering";
  mixRatio: "1:3" | "1:4" | "1:5" | "1:6";
  wastagePct: number;
  floorCount: number;
  roomCount: number;
}

export function useDemoOptions() {
  return useQuery({
    queryKey: ["demo", "options"],
    queryFn: async () => {
      const { data } = await api.get<{ presets: DemoPresetSummary[] }>(
        "/api/projects/demo/options",
      );
      return data.presets;
    },
    staleTime: 5 * 60_000, // preset list is effectively static
  });
}

/**
 * Creates a fully-populated demo project from a named preset. Each call
 * makes a new project so the user can experiment freely.
 */
export function useCreateDemoProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (presetId?: string) => {
      const { data } = await api.post<{ project: Project }>("/api/projects/demo", { presetId });
      return data.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      qc.invalidateQueries({ queryKey: ["revisions", "all"] });
    },
  });
}

export function useUpdateProject(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Project>) => {
      const { data } = await api.patch<{ project: Project }>(`/api/projects/${projectId}`, patch);
      return data.project;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      await api.delete(`/api/projects/${projectId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// ---------------- floors ---------------------------------------------------

export function useCreateFloor(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { label?: string; heightFt?: number }) => {
      const { data } = await api.post<{ floor: Floor }>(`/api/projects/${projectId}/floors`, input);
      return data.floor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUpdateFloor(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ floorId, patch }: { floorId: string; patch: Partial<Floor> }) => {
      const { data } = await api.patch<{ floor: Floor }>(`/api/floors/${floorId}`, patch);
      return data.floor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useDeleteFloor(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (floorId: string) => api.delete(`/api/floors/${floorId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

// ---------------- rooms ----------------------------------------------------

export interface CreateRoomInput {
  name: string;
  shape: RoomShape;
  geometry: Geometry;
  ceilingHeightFt: number;
}

export function useCreateRoom(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ floorId, input }: { floorId: string; input: CreateRoomInput }) => {
      const { data } = await api.post<{ room: Room; walls: Wall[] }>(
        `/api/floors/${floorId}/rooms`,
        input,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useUpdateRoom(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      patch,
      preserveWalls,
    }: {
      roomId: string;
      patch: Partial<Room>;
      preserveWalls?: boolean;
    }) => {
      const { data } = await api.patch<{ room: Room; walls: Wall[]; regenerated: boolean }>(
        `/api/rooms/${roomId}${preserveWalls ? "?preserveWalls=true" : ""}`,
        patch,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useDeleteRoom(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: string) => api.delete(`/api/rooms/${roomId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

// ---------------- walls ----------------------------------------------------

export function useUpdateWall(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ wallId, patch }: { wallId: string; patch: Partial<Wall> }) => {
      const { data } = await api.patch<{ wall: Wall }>(`/api/walls/${wallId}`, patch);
      return data.wall;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

export function useDeleteWall(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wallId: string) => api.delete(`/api/walls/${wallId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects", projectId] }),
  });
}

// ---------------- estimates ------------------------------------------------

export function useRunEstimate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (label?: string) => {
      const { data } = await api.post<{ result: EstimateResult; persisted: boolean }>(
        `/api/projects/${projectId}/estimate`,
        { label: label ?? "" },
      );
      return data.result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects", projectId, "estimate", "latest"] });
    },
  });
}
