import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight, GitCompare, History, Loader2, RotateCcw } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatBags, formatBricks, formatFt3 } from "@/lib/format";
import { extractApiError } from "@/features/auth/errors";
import type { Project } from "@/features/projects/types";
import { useCompareRevisions, useRestoreRevision, useRevisions, type Revision } from "./api";
import { CompareView } from "./CompareView";

interface Props {
  project: Project;
}

export function RevisionsPanel({ project }: Props) {
  const { data: revisions, isLoading } = useRevisions(project.id);
  const restore = useRestoreRevision(project.id);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const compareA = selectedIds[0] ?? null;
  const compareB = selectedIds[1] ?? null;
  const compareQuery = useCompareRevisions(compareA, compareB);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  async function handleRestore(rev: Revision) {
    if (
      !confirm(
        `Restore this revision from ${new Date(rev.createdAt).toLocaleString()}?\n\n` +
        "This will replace the project's current floors, rooms, and walls with the snapshot's input shape. " +
        "The current state will be lost.",
      )
    ) {
      return;
    }
    try {
      await restore.mutateAsync(rev.id);
      toast.success("Revision restored");
      setSelectedIds([]);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  if (!revisions || revisions.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">No saved revisions yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Click <span className="font-medium text-foreground">"Save revision"</span> on the Estimate tab to snapshot a version.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Revision history
              </CardTitle>
              <CardDescription>
                Every saved estimate is frozen here. Select any two to compare, or restore one to rebuild the project from that snapshot.
              </CardDescription>
            </div>
            {selectedIds.length === 2 && (
              <Badge variant="default" className="gap-1 h-7 self-center">
                <GitCompare className="h-3 w-3" /> Comparing 2 revisions
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {revisions.map((rev, idx) => (
            <RevisionRow
              key={rev.id}
              revision={rev}
              index={revisions.length - idx}
              selected={selectedIds.includes(rev.id)}
              canSelect={selectedIds.length < 2 || selectedIds.includes(rev.id)}
              onToggle={() => toggleSelect(rev.id)}
              onRestore={() => handleRestore(rev)}
              restoring={restore.isPending}
            />
          ))}
        </CardContent>
      </Card>

      {selectedIds.length === 2 && compareQuery.data && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CompareView data={compareQuery.data} currency={project.currency} />
        </motion.div>
      )}
    </div>
  );
}

function RevisionRow({
  revision,
  index,
  selected,
  canSelect,
  onToggle,
  onRestore,
  restoring,
}: {
  revision: Revision;
  index: number;
  selected: boolean;
  canSelect: boolean;
  onToggle: () => void;
  onRestore: () => void;
  restoring: boolean;
}) {
  const t = revision.results?.totalsWithWastage ?? revision.results?.totals;
  const brandLabel = revision.results?.params
    ? `${revision.results.params.brickPreset} · ${revision.results.params.mixRatio} · ${revision.results.params.wastagePct}% waste`
    : "—";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-md border p-3 transition-colors",
        selected
          ? "border-primary/60 bg-primary/10"
          : canSelect
            ? "border-border bg-card/60 hover:border-primary/40"
            : "border-border/40 bg-card/40 opacity-60",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={!canSelect}
        className={cn(
          "h-4 w-4 rounded border transition-colors flex items-center justify-center shrink-0",
          selected
            ? "bg-primary border-primary"
            : "border-muted-foreground hover:border-primary",
        )}
        aria-label="Select for compare"
      >
        {selected && <span className="h-2 w-2 rounded-sm bg-primary-foreground" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">#{String(index).padStart(3, "0")}</span>
          <span className="font-medium text-sm">
            {revision.label?.trim() ? revision.label : "Unlabeled revision"}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
            {new Date(revision.createdAt).toLocaleDateString()}
          </Badge>
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {brandLabel} · {new Date(revision.createdAt).toLocaleTimeString()}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span><span className="text-foreground">{t ? formatBricks(t.bricks) : "—"}</span> bricks</span>
        <span><span className="text-foreground">{t ? formatBags(t.cementBags) : "—"}</span> bags</span>
        <span><span className="text-foreground">{t ? formatFt3(t.sandFt3, 0) : "—"}</span> sand</span>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onRestore}
        disabled={restoring}
        title="Rebuild the project's tree from this snapshot"
      >
        {restoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Restore
      </Button>
    </div>
  );
}

// Helper component exports for convenience
export { ArrowRight };
