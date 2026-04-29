import { ArrowDown, ArrowUp, GitCompare, Minus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatBags, formatBricks, formatFt3, formatNumber } from "@/lib/format";
import type { ComparedKey, CompareResult } from "./api";

interface Props {
  data: CompareResult;
  currency?: string;
}

interface Row {
  key: ComparedKey;
  label: string;
  format: (n: number) => string;
  unit?: string;
}

const ROWS: Row[] = [
  { key: "bricks", label: "Bricks", format: formatBricks },
  { key: "cementBags", label: "Cement bags", format: (n) => formatBags(n) },
  { key: "sandFt3", label: "Sand", format: (n) => formatFt3(n, 0) },
  { key: "crushFt3", label: "Crush / aggregate", format: (n) => formatFt3(n, 0) },
  { key: "netVolumeFt3", label: "Net wall volume", format: (n) => formatFt3(n, 0) },
  { key: "mortarFt3", label: "Mortar", format: (n) => formatFt3(n, 0) },
];

export function CompareView({ data }: Props) {
  const { a, b, delta } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" /> Compare revisions
        </CardTitle>
        <CardDescription>
          Side-by-side deltas between two saved snapshots (all values include wastage).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <RevisionHeading label="A" revision={a} />
          <RevisionHeading label="B" revision={b} />
        </div>

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 px-3 text-left font-medium">Material</th>
                <th className="py-2 px-3 text-right font-medium">Rev A</th>
                <th className="py-2 px-3 text-right font-medium">Rev B</th>
                <th className="py-2 px-3 text-right font-medium">Δ</th>
                <th className="py-2 px-3 text-right font-medium">Δ %</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const d = delta[row.key];
                if (!d) return null;
                const trend = d.diff === 0 ? "flat" : d.diff > 0 ? "up" : "down";
                return (
                  <tr key={row.key} className="border-b border-border/40 last:border-0">
                    <td className="py-2 px-3 font-medium">{row.label}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{row.format(d.a)}</td>
                    <td className="py-2 px-3 text-right tabular-nums">{row.format(d.b)}</td>
                    <td
                      className={cn(
                        "py-2 px-3 text-right tabular-nums font-medium flex items-center justify-end gap-1",
                        trend === "up" && "text-amber-400",
                        trend === "down" && "text-emerald-400",
                        trend === "flat" && "text-muted-foreground",
                      )}
                    >
                      {trend === "up" && <ArrowUp className="h-3 w-3" />}
                      {trend === "down" && <ArrowDown className="h-3 w-3" />}
                      {trend === "flat" && <Minus className="h-3 w-3" />}
                      {d.diff >= 0 ? "+" : ""}
                      {row.format(Math.abs(d.diff))}
                    </td>
                    <td
                      className={cn(
                        "py-2 px-3 text-right tabular-nums",
                        trend === "up" && "text-amber-400",
                        trend === "down" && "text-emerald-400",
                        trend === "flat" && "text-muted-foreground",
                      )}
                    >
                      {d.pct >= 0 ? "+" : ""}
                      {formatNumber(d.pct, 1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Reading this:</strong> positive Δ (amber) means rev B used MORE material than A.
          Negative (green) means savings. Use it to see the impact of geometry changes, added openings, or wastage tweaks.
        </div>
      </CardContent>
    </Card>
  );
}

function RevisionHeading({
  label,
  revision,
}: {
  label: string;
  revision: CompareResult["a"];
}) {
  const params = revision.results?.params;
  return (
    <div className="rounded-md border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <Badge variant="default" className="text-[10px]">Revision {label}</Badge>
        <span className="text-[11px] text-muted-foreground">
          {new Date(revision.createdAt).toLocaleString()}
        </span>
      </div>
      <div className="text-sm font-medium">
        {revision.label?.trim() ? revision.label : "Unlabeled"}
      </div>
      {params && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {params.brickPreset} · {params.mixRatio} · {params.wastagePct}% waste
        </div>
      )}
    </div>
  );
}
