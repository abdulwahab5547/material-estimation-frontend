import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ArrowRight, Blocks, Box, TrendingUp, Wallet } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatBricks, formatMoney, formatNumber } from "@/lib/format";
import {
  CATEGORY_COLORS,
  CHART_PRIMARY,
  CHART_SECONDARY,
  CHART_TOOLTIP_STYLE,
  GRID_LINE,
  AXIS_TICK,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
} from "./palette";
import { useAnalyticsOverview } from "./api";
import type { AnalyticsOverview } from "./types";

export function DashboardAnalytics() {
  const { data, isLoading, isError } = useAnalyticsOverview();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (isError || !data) return null;

  const hasData = data.summary.projectCount > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Analytics will appear here once you've created a project and saved an estimate revision.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <KeyMetrics data={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <TrendCard data={data} />
        <TagDonutCard data={data} />
      </div>

      {data.recentActivity.length > 0 && <ActivityFeed data={data} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function KeyMetrics({ data }: { data: AnalyticsOverview }) {
  const currency = data.summary.currency ?? "PKR";
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        label="Est. value"
        value={
          data.summary.totalEstimatedValue > 0
            ? formatMoney(data.summary.totalEstimatedValue, currency)
            : "—"
        }
        hint="Across latest revisions"
        icon={Wallet}
      />
      <Metric
        label="Bricks"
        value={formatBricks(data.summary.totalBricks)}
        hint="Total committed"
        icon={Blocks}
      />
      <Metric
        label="Projects"
        value={formatNumber(data.summary.projectCount)}
        hint={`${data.summary.floorCount} floors · ${data.summary.roomCount} rooms`}
        icon={Box}
      />
      <Metric
        label="Cement bags"
        value={formatNumber(data.summary.totalCementBags, 1)}
        hint={`Sand ${formatNumber(data.summary.totalSandFt3, 0)} ft³`}
        icon={TrendingUp}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Blocks;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-bold tabular-nums">{value}</div>
          </div>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function TrendCard({ data }: { data: AnalyticsOverview }) {
  const hasValues = data.trend.some((d) => d.value > 0 || d.revisions > 0);
  const currency = data.summary.currency ?? "PKR";

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> 6-month activity
            </CardTitle>
            <CardDescription>Revisions saved and estimated value per month.</CardDescription>
          </div>
          <Badge variant="outline">{hasValues ? "Live data" : "No activity yet"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.trend} margin={{ top: 6, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.55} />
                <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_SECONDARY} stopOpacity={0.45} />
                <stop offset="100%" stopColor={CHART_SECONDARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_LINE} vertical={false} />
            <XAxis
              dataKey="label"
              stroke={AXIS_TICK}
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={AXIS_TICK}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              yAxisId="value"
              tickFormatter={(v: number) =>
                v > 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v > 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : v.toString()
              }
            />
            <YAxis
              orientation="right"
              stroke={AXIS_TICK}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              yAxisId="rev"
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(value: number, name: string) =>
                name === "Estimated value"
                  ? [formatMoney(value, currency), name]
                  : [value, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }} />
            <Area
              yAxisId="value"
              name="Estimated value"
              type="monotone"
              dataKey="value"
              stroke={CHART_PRIMARY}
              strokeWidth={2}
              fill="url(#valueFill)"
            />
            <Area
              yAxisId="rev"
              name="Revisions"
              type="monotone"
              dataKey="revisions"
              stroke={CHART_SECONDARY}
              strokeWidth={2}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function TagDonutCard({ data }: { data: AnalyticsOverview }) {
  const chartData = Object.entries(data.tagCounts).map(([name, value]) => ({ name, value }));
  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Projects by type
        </CardTitle>
        <CardDescription>Distribution of your active projects.</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {total === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No projects yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
              />
              <Pie
                data={chartData}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function ActivityFeed({ data }: { data: AnalyticsOverview }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Recent revisions
        </CardTitle>
        <CardDescription>Latest saved estimates across all projects.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {data.recentActivity.map((a) => (
            <li key={a.id}>
              <Link
                to={`/projects/${a.projectId}`}
                className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-secondary/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.projectName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {a.label || "Unlabeled revision"} · {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.grandTotal != null && a.currency ? (
                    <span className="text-sm font-semibold text-primary tabular-nums">
                      {formatMoney(a.grandTotal, a.currency)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">No rates</span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
