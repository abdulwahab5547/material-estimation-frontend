import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Building2, FolderKanban, Layers, Search, X } from "lucide-react";

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
import { CreateProjectDialog } from "./CreateProjectDialog";
import { DemoProjectButton } from "./DemoProjectButton";
import { useProjectsList } from "./api";
import { extractApiError } from "@/features/auth/errors";
import { formatNumber } from "@/lib/format";
import type { ProjectListItem, ProjectTag } from "./types";

const tagStyles: Record<string, "default" | "secondary" | "warning" | "outline"> = {
  residential: "default",
  commercial: "warning",
  renovation: "secondary",
  other: "outline",
};

const TAG_FILTERS: Array<{ value: "all" | ProjectTag; label: string }> = [
  { value: "all", label: "All" },
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "renovation", label: "Renovation" },
  { value: "other", label: "Other" },
];

type SortKey = "recent" | "name" | "rooms" | "floors";

export function ProjectsListPage() {
  const { data: projects, isLoading, isError, error } = useProjectsList();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<"all" | ProjectTag>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    const list = projects ?? [];
    const q = search.trim().toLowerCase();
    return list
      .filter((p) => {
        if (tag !== "all" && p.tag !== tag) return false;
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.client?.name ?? "").toLowerCase().includes(q) ||
          (p.location ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        switch (sort) {
          case "name":
            return a.name.localeCompare(b.name);
          case "rooms":
            return b.roomCount - a.roomCount;
          case "floors":
            return b.numberOfFloors - a.numberOfFloors;
          case "recent":
          default:
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
      });
  }, [projects, search, tag, sort]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="mt-1 text-muted-foreground">
            Every estimation starts here. Create a project, define its floors &amp; rooms, then run the calc engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DemoProjectButton variant="outline" />
          <CreateProjectDialog />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, client, or location…"
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

        <div className="flex items-center gap-1 rounded-md border border-border bg-card/50 p-1">
          {TAG_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTag(f.value)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                tag === f.value
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Sort: Recent</SelectItem>
            <SelectItem value="name">Sort: Name A–Z</SelectItem>
            <SelectItem value="rooms">Sort: Most rooms</SelectItem>
            <SelectItem value="floors">Sort: Most floors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load projects: {extractApiError(error)}
          </CardContent>
        </Card>
      ) : !projects || projects.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <Search className="h-5 w-5" />
            </div>
            <p>No projects match your filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setTag("all");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">
            Showing {filtered.length} of {projects.length} project{projects.length === 1 ? "" : "s"}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link to={`/projects/${project.id}`} className="group">
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">{project.name}</h3>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {project.client?.name || project.location || "No client / location set"}
              </p>
            </div>
            <Badge variant={tagStyles[project.tag] ?? "outline"}>{project.tag}</Badge>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> {project.numberOfFloors} floor{project.numberOfFloors === 1 ? "" : "s"}
            </div>
            <div className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> {formatNumber(project.roomCount)} rooms
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:translate-x-0.5 transition-transform">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <FolderKanban className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Create your first project from scratch, or skip the setup and explore a fully-populated
            demo project (2 floors, 6 rooms, openings, and a saved estimate).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <DemoProjectButton size="lg" variant="default" />
          <CreateProjectDialog
            trigger={
              <Button size="lg" variant="outline">
                <FolderKanban className="h-4 w-4" /> Start from scratch
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
