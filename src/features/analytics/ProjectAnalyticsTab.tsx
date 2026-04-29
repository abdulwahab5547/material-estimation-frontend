import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowUp, BarChart3, Minus, PieChartIcon, TrendingUp } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBricks, formatFt3, formatMoney, formatNumber } from "@/lib/format";
import {
  AXIS_TICK,
  CATEGORY_COLORS,
  CHART_PRIMARY,
  CHART_SECONDARY,
  CHART_TOOLTIP_STYLE,
  GRID_LINE,
  TOOLTIP_ITEM_STYLE,
  TOOLTIP_LABEL_STYLE,
} from "./palette";
import { useProjectAnalytics } from "./api";
import type { ProjectAnalytics } from "./types";
import type { Project } from "@/features/projects/types";

interface Props {
  project: Project;
}

export function ProjectAnalyticsTab({ project }: Props) {
  const { data, isLoading } = useProjectAnalytics(project.id);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="font-semibold mt-2">No analytics yet</h3>
          <p className="text-sm text-muted-foreground">
            Save an estimate revision first and come back here to see the timeline and breakdown.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = data.latest?.currency ?? project.currency;
  const hasCost = (data.latest?.grandTotal ?? 0) > 0;

  return (
    <div className="space-y-6">
      <DeltaSummary data={data} currency={currency} />

      <div className="grid gap-4 lg:grid-cols-3">
        <TimelineCard data={data} currency={currency} hasCost={hasCost} />
        {hasCost && data.materialSplit.length > 0 && (
          <MaterialSplitCard split={data.materialSplit} currency={currency} />
        )}
      </div>

      <MaterialsBarCard data={data} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function DeltaSummary({ data, currency }: { data: ProjectAnalytics; currency: string }) {
  const latest = data.latest;
  const first = data.first;
  if (!latest) return null;

  const entries = first && first.id !== latest.id
    ? [
        {
          label: "Bricks",
          current: latest.bricks,
          first: first.bricks,
          format: (n: number) => formatBricks(n),
        },
        {
          label: "Cement bags",
          current: latest.cementBags,
          first: first.cementBags,
          format: (n: number) => formatNumber(n, 1),
        },
        {
          label: "Net volume",
          current: latest.netVolumeFt3,
          first: first.netVolumeFt3,
          format: (n: number) => formatFt3(n, 0),
        },
        {
          label: "Grand total",
          current: latest.grandTotal,
          first: first.grandTotal,
          format: (n: number) => formatMoney(n, currency),
          hideIfZero: true,
        },
      ]
    : [];

  return (
    <Card className="bg-gradient-to-br from-card/80 to-primary/5 border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-sm font-semibold">
              Latest revision {latest.label ? `— "${latest.label}"` : ""}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Saved {new Date(latest.createdAt).toLocaleString()} · revision #{data.timeline.length}
            </div>
          </div>
          {data.timeline.length > 1 && (
            <Badge variant="outline">
              Comparing to revision #1 ({new Date(data.first!.createdAt).toLocaleDateString()})
            </Badge>
          )}
        </div>

        {data.timeline.length === 1 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MiniMetric label="Bricks" value={formatBricks(latest.bricks)} />
            <MiniMetric label="Cement bags" value={formatNumber(latest.cementBags, 1)} />
            <MiniMetric label="Net volume" value={formatFt3(latest.netVolumeFt3, 0)} />
            {latest.grandTotal > 0 && (
              <MiniMetric label="Grand total" value={formatMoney(latest.grandTotal, currency)} highlight />
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {entries.map((e) =>
              e.hideIfZero && e.current === 0 ? null : (
                <DeltaTile key={e.label} entry={e} />
              ),
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeltaTile({
  entry,
}: {
  entry: {
    label: string;
    current: number;
    first: number;
    format: (n: number) => string;
  };
}) {
  const diff = entry.current - entry.first;
  const pct = entry.first === 0 ? 0 : (diff / entry.first) * 100;
  const trend = Math.abs(diff) < 0.001 ? "flat" : diff > 0 ? "up" : "down";

  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{entry.label}</div>
      <div className="mt-1 text-lg font-bold tabular-nums">{entry.format(entry.current)}</div>
      <div
        className={cn(
          "mt-1 flex items-center gap-1 text-[11px] font-medium",
          trend === "up" && "text-amber-400",
          trend === "down" && "text-emerald-400",
          trend === "flat" && "text-muted-foreground",
        )}
      >
        {trend === "up" && <ArrowUp className="h-3 w-3" />}
        {trend === "down" && <ArrowDown className="h-3 w-3" />}
        {trend === "flat" && <Minus className="h-3 w-3" />}
        {diff >= 0 ? "+" : ""}
        {entry.format(Math.abs(diff))} ({pct >= 0 ? "+" : ""}
        {pct.toFixed(1)}%)
      </div>
    </div>
  );
}

function MiniMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-lg font-bold tabular-nums", highlight && "text-primary")}>
        {value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function TimelineCard({
  data,
  currency,
  hasCost,
}: {
  data: ProjectAnalytics;
  currency: string;
  hasCost: boolean;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Cost over revisions
        </CardTitle>
        <CardDescription>
          How the total evolves as you refine the project. Each point is a saved revision.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {hasCost ? (
            <AreaChart
              data={data.timeline}
              margin={{ top: 6, right: 10, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_PRIMARY} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={CHART_PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID_LINE} vertical={false} />
              <XAxis
                dataKey="index"
                stroke={AXIS_TICK}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `#${v}`}
              />
              <YAxis
                stroke={AXIS_TICK}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v > 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v > 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
                }
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value: number, name: string) =>
                  name === "Grand total" ? [formatMoney(value, currency), name] : [value, name]
                }
                labelFormatter={(label) => `Revision #${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }} />
              <Area
                type="monotone"
                name="Grand total"
                dataKey="grandTotal"
                stroke={CHART_PRIMARY}
                strokeWidth={2}
                fill="url(#costFill)"
              />
              <Line
                type="monotone"
                name="Materials"
                dataKey="materialsSubtotal"
                stroke={CHART_SECONDARY}
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          ) : (
            <LineChart data={data.timeline} margin={{ top: 6, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid stroke={GRID_LINE} vertical={false} />
              <XAxis
                dataKey="index"
                stroke={AXIS_TICK}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `#${v}`}
              />
              <YAxis stroke={AXIS_TICK} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }} />
              <Line type="monotone" dataKey="bricks" name="Bricks" stroke={CHART_PRIMARY} strokeWidth={2} dot />
              <Line
                type="monotone"
                dataKey="cementBags"
                name="Cement bags"
                stroke={CHART_SECONDARY}
                strokeWidth={2}
                dot
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function MaterialSplitCard({
  split,
  currency,
}: {
  split: ProjectAnalytics["materialSplit"];
  currency: string;
}) {
  const total = split.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-4 w-4 text-primary" /> Cost split
        </CardTitle>
        <CardDescription>
          Share of total materials cost by line item (latest revision).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              formatter={(value: number, name: string) => [
                `${formatMoney(value, currency)}  (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Pie
              data={split}
              innerRadius={52}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              stroke="none"
            >
              {split.map((entry, i) => (
                <Cell key={entry.label} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

function MaterialsBarCard({ data }: { data: ProjectAnalytics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Materials per revision
        </CardTitle>
        <CardDescription>Side-by-side quantities across each saved snapshot.</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.timeline} margin={{ top: 6, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid stroke={GRID_LINE} vertical={false} />
            <XAxis
              dataKey="index"
              stroke={AXIS_TICK}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `#${v}`}
            />
            <YAxis stroke={AXIS_TICK} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelFormatter={(label) => `Revision #${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "rgb(148 163 184)" }} />
            <Bar dataKey="bricks" name="Bricks" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
            <Bar dataKey="cementBags" name="Cement (×10 for scale)" fill={CHART_SECONDARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
