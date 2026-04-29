import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  FileBadge,
  FileSpreadsheet,
  FileText,
  Layers,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useProjectsList } from "@/features/projects/api";
import { extractApiError } from "@/features/auth/errors";
import { formatNumber } from "@/lib/format";
import { ExportMenu } from "./ExportMenu";
import type { ProjectListItem } from "@/features/projects/types";

const tagStyles: Record<string, "default" | "secondary" | "warning" | "outline"> = {
  residential: "default",
  commercial: "warning",
  renovation: "secondary",
  other: "outline",
};

/**
 * Reports page — user-wide hub for exporting PDF/CSV quotes.
 *
 * Rather than duplicate the estimate logic, this page surfaces every project
 * as a row with an ExportMenu. Clicking a download hits the backend's live
 * report endpoint, which always reflects the project's CURRENT state.
 */
export function ReportsPage() {
  const { data: projects, isLoading, isError, error } = useProjectsList();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = search.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.client?.name ?? "").toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10 space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          One-click PDF &amp; CSV exports for every project you own. Reports always reflect the current
          state — save a revision first if you want a specific moment frozen.
        </p>
      </div>

      <FormatLegend />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects by name, client, or location…"
          className="pl-9 pr-8 max-w-md"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute left-[calc(28rem-1.75rem)] top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground hidden md:block"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load projects: {extractApiError(error)}
          </CardContent>
        </Card>
      ) : !projects || projects.length === 0 ? (
        <EmptyState reason="no-projects" />
      ) : filtered.length === 0 ? (
        <EmptyState reason="no-matches" onClear={() => setSearch("")} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filtered.map((p) => (
                <ProjectRow key={p.id} project={p} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function ProjectRow({ project }: { project: ProjectListItem }) {
  const disabled = project.roomCount === 0;
  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-4 px-5 py-4 transition-colors",
        disabled ? "opacity-70" : "hover:bg-secondary/40",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/projects/${project.id}`} className="font-semibold truncate hover:underline">
            {project.name}
          </Link>
          <Badge variant={tagStyles[project.tag] ?? "outline"}>{project.tag}</Badge>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {project.client?.name && <span>{project.client.name}</span>}
          {project.location && <span>· {project.location}</span>}
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {project.numberOfFloors} floor{project.numberOfFloors === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3 w-3" /> {formatNumber(project.roomCount)} rooms
          </span>
          <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {disabled ? (
          <span className="text-[11px] text-muted-foreground italic">Add a room to export</span>
        ) : (
          <ExportMenu projectId={project.id} projectName={project.name} />
        )}
        <Button asChild variant="ghost" size="sm">
          <Link to={`/projects/${project.id}`}>
            Open <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </li>
  );
}

function FormatLegend() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FormatCard
        icon={FileBadge}
        title="PDF · Full quote"
        description="Cover, material schedule, per-floor breakdown, cost table, signatures."
      />
      <FormatCard
        icon={FileText}
        title="PDF · Summary"
        description="One-page version with cover and totals — fast for quick client previews."
      />
      <FormatCard
        icon={FileSpreadsheet}
        title="CSV · Excel"
        description="Per-line material rows + summary section, opens directly in Excel."
      />
    </div>
  );
}

function FormatCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileBadge;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  reason,
  onClear,
}: {
  reason: "no-projects" | "no-matches";
  onClear?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <FileText className="h-6 w-6" />
        </div>
        {reason === "no-projects" ? (
          <>
            <h3 className="font-semibold">Nothing to report on yet</h3>
            <p className="text-sm text-muted-foreground">
              Create a project and add at least one room, then come back to export a quote.
            </p>
            <Button asChild size="sm">
              <Link to="/projects">Go to projects</Link>
            </Button>
          </>
        ) : (
          <>
            <h3 className="font-semibold">No projects match your search</h3>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear search
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
