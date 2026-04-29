import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Boxes, Square, Shapes, Circle as CircleIcon, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplatesList, useDeleteTemplate } from "./api";
import { extractApiError } from "@/features/auth/errors";
import type { RoomTemplatePayload, Template } from "./types";
import { RoomPreview2D } from "@/features/rooms/RoomPreview2D";

export function TemplatesPage() {
  const { data, isLoading, isError, error } = useTemplatesList("room");
  const [search, setSearch] = useState("");
  const del = useDeleteTemplate();

  const filtered = (data ?? []).filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(s) ||
      t.description.toLowerCase().includes(s) ||
      t.tags.some((tag) => tag.toLowerCase().includes(s))
    );
  });

  async function handleDelete(t: Template) {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    try {
      await del.mutateAsync(t.id);
      toast.success("Template deleted");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="mt-1 text-muted-foreground">
            Reusable room presets. Save any room from a project with "Save as template", then drop it into new projects.
          </p>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description, or tag…"
          className="w-full sm:w-72"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load templates: {extractApiError(error)}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={!!search.trim()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={() => handleDelete(t)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TemplateCard({ template, onDelete }: { template: Template; onDelete: () => void }) {
  const payload = template.payload as RoomTemplatePayload;
  const Icon = payload.shape === "rect" ? Square : payload.shape === "L" ? Shapes : CircleIcon;

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-[16/10] bg-card/60">
        <RoomPreview2D shape={payload.shape} geometry={payload.geometry} height={260} label={template.name} />
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5 text-primary" />
              {template.name}
            </div>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            title="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Ceil {payload.ceilingHeightFt} ft
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Insert via "Add room" → "From template" inside any project.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <Card>
      <CardContent className="p-10 text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {hasSearch ? <BookOpen className="h-6 w-6" /> : <Boxes className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="font-semibold">
            {hasSearch ? "No templates match your search" : "No templates yet"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {hasSearch
              ? "Try a different term, or save a new template from any room editor."
              : "Open any room in a project and click \"Save as template\" to get started."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
