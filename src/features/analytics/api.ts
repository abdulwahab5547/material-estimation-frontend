import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AnalyticsOverview, ProjectAnalytics } from "./types";

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: async () => {
      const { data } = await api.get<AnalyticsOverview>("/api/analytics/overview");
      return data;
    },
    staleTime: 15_000,
  });
}

export function useProjectAnalytics(projectId: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data } = await api.get<ProjectAnalytics>(`/api/analytics/projects/${projectId}`);
      return data;
    },
    staleTime: 15_000,
  });
}
