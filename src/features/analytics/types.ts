export interface AnalyticsOverview {
  summary: {
    projectCount: number;
    floorCount: number;
    roomCount: number;
    totalBricks: number;
    totalCementBags: number;
    totalSandFt3: number;
    totalNetVolumeFt3: number;
    totalEstimatedValue: number;
    currency: string | null;
  };
  trend: Array<{ label: string; revisions: number; value: number }>;
  tagCounts: Record<string, number>;
  recentActivity: Array<{
    id: string;
    projectId: string;
    projectName: string;
    label: string;
    grandTotal: number | null;
    currency: string | null;
    createdAt: string;
  }>;
}

export interface ProjectAnalytics {
  timeline: Array<{
    id: string;
    index: number;
    label: string;
    createdAt: string;
    bricks: number;
    cementBags: number;
    sandFt3: number;
    mortarFt3: number;
    netVolumeFt3: number;
    grandTotal: number;
    materialsSubtotal: number;
    laborTotal: number;
    taxAmount: number;
    currency: string | null;
  }>;
  materialSplit: Array<{ label: string; value: number }>;
  latest: ProjectAnalytics["timeline"][number] | null;
  first: ProjectAnalytics["timeline"][number] | null;
}
