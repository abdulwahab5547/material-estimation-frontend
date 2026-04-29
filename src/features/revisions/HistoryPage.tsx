import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight,
  Clock,
  Filter,
  History as HistoryIcon,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { extractApiError } from "@/features/auth/errors";
import { formatBags, formatBricks, formatFt3, formatMoney } from "@/lib/format";
import { useAllRevisions, useRestoreRevisionGlobal, type GlobalRevision } from "./api";

/**
 * Global revision history across every project the user owns.
 *
 * Unlike the per-project "Revisions" tab, this page is primarily a timeline —
 * scan all your work over time, jump to a project, or restore a snapshot
 * right from here.
 */
export function HistoryPage() {
  const [filterProjectId, setFilterProjectId] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error } = useAllRevisions(
    filterProjectId === "all" ? undefined : filterProjectId,
  );
  const restore = useRestoreRevisionGlobal();

  const filtered = useMemo(() => {
    const revs = data?.revisions ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return revs;
    return revs.filter(
      (r) =>
        r.projectName.toLowerCase().includes(q) ||
        (r.label ?? "").toLowerCase().includes(q),
    );
  }, [data?.revisions, search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  async function handleRestore(rev: GlobalRevision) {
    if (
      !confirm(
        `Restore this revision from ${new Date(rev.createdAt).toLocaleString()} into "${rev.projectName}"?\n\n` +
        "This replaces the project's current floors, rooms, and walls with the snapshot's input shape. " +
        "The current state will be lost.",
      )
    ) {
      return;
    }
    try {
      await restore.mutateAsync({ revisionId: rev.id, projectId: rev.projectId });
      toast.success(`Restored into "${rev.projectName}"`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-7 w-7 text-primary" /> History
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every saved estimate, newest first. Click a project name to jump in, or restore a snapshot
          to rebuild that project from this point in time.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name or revision label…"
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filterProjectId} onValueChange={setFilterProjectId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {data?.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load history: {extractApiError(error)}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState hasData={(data?.revisions.length ?? 0) > 0} onClear={() => setSearch("")} />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.dayKey}>
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {g.label}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  · {g.items.length} revision{g.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="relative space-y-2 border-l border-border pl-5">
                {g.items.map((rev) => (
                  <RevisionRow
                    key={rev.id}
                    rev={rev}
                    onRestore={() => handleRestore(rev)}
                    restoring={restore.isPending}
                  />
                ))}
              </ul>
            </div>
          ))}

          {data && filtered.length >= 100 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Showing the most recent 100 revisions. Filter by project to see older ones.
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------

function RevisionRow({
  rev,
  onRestore,
  restoring,
}: {
  rev: GlobalRevision;
  onRestore: () => void;
  restoring: boolean;
}) {
  const totals = rev.results?.totalsWithWastage ?? rev.results?.totals;
  const cost = rev.results?.cost;
  const brandLabel = rev.results?.params
    ? `${rev.results.params.brickPreset} · ${rev.results.params.mixRatio} · ${rev.results.params.wastagePct}% waste`
    : "";

  return (
    <li className="relative">
      {/* timeline dot */}
      <span className="absolute -left-[1.5rem] top-3 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />

      <div className={cn("rounded-md border border-border bg-card/60 px-4 py-3 transition-colors", !restoring && "hover:border-primary/40")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/projects/${rev.projectId}`}
                className="font-semibold truncate hover:text-primary"
              >
                {rev.projectName}
              </Link>
              <Badge variant="outline" className="text-[10px]">
                {new Date(rev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
              {rev.label && (
                <span className="text-xs font-medium text-foreground/80 truncate max-w-[18rem]">
                  "{rev.label}"
                </span>
              )}
            </div>
            {brandLabel && (
              <div className="mt-1 text-[11px] text-muted-foreground">{brandLabel}</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {cost?.grandTotal && cost.currency ? (
              <span className="text-sm font-bold text-primary tabular-nums">
                {formatMoney(cost.grandTotal, cost.currency)}
              </span>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              onClick={onRestore}
              disabled={restoring}
              title="Rebuild the project from this snapshot"
            >
              {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Restore
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to={`/projects/${rev.projectId}`}>
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {totals && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground font-mono">
            <span><span className="text-foreground">{formatBricks(totals.bricks)}</span> bricks</span>
            <span><span className="text-foreground">{formatBags(totals.cementBags)}</span> cement bags</span>
            <span><span className="text-foreground">{formatFt3(totals.sandFt3, 0)}</span> sand</span>
            <span><span className="text-foreground">{formatFt3(totals.netVolumeFt3, 0)}</span> net volume</span>
          </div>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Date grouping — "Today", "Yesterday", then absolute dates
// ---------------------------------------------------------------------------

interface Group {
  dayKey: string;
  label: string;
  items: GlobalRevision[];
}

function groupByDay(revs: GlobalRevision[]): Group[] {
  const groups = new Map<string, Group>();
  const today = dayKey(new Date());
  const yest = dayKey(new Date(Date.now() - 86_400_000));

  for (const r of revs) {
    const d = new Date(r.createdAt);
    const key = dayKey(d);
    const label =
      key === today ? "Today" :
      key === yest ? "Yesterday" :
      d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });

    if (!groups.has(key)) groups.set(key, { dayKey: key, label, items: [] });
    groups.get(key)!.items.push(r);
  }
  return Array.from(groups.values());
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------

function EmptyState({ hasData, onClear }: { hasData: boolean; onClear: () => void }) {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <HistoryIcon className="h-6 w-6" />
        </div>
        {hasData ? (
          <>
            <h3 className="font-semibold">No revisions match your filters</h3>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear search
            </Button>
          </>
        ) : (
          <>
            <h3 className="font-semibold">No saved revisions yet</h3>
            <p className="text-sm text-muted-foreground">
              Open any project, go to <strong className="text-foreground">Estimate</strong>, and click
              "Save revision" to snapshot a version here.
            </p>
            <Button asChild size="sm">
              <Link to="/projects">Go to projects</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
