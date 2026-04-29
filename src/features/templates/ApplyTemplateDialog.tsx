import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Loader2, Square, Shapes, Circle as CircleIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomPreview2D } from "@/features/rooms/RoomPreview2D";
import { cn } from "@/lib/utils";
import { useApplyTemplate, useTemplatesList } from "./api";
import type { RoomTemplatePayload, Template } from "./types";
import { extractApiError } from "@/features/auth/errors";

interface Props {
  projectId: string;
  floorId: string;
  trigger?: React.ReactNode;
}

export function ApplyTemplateDialog({ projectId, floorId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");

  const { data: templates, isLoading } = useTemplatesList("room");
  const apply = useApplyTemplate(projectId);

  async function handleInsert() {
    if (!selectedId) return;
    try {
      await apply.mutateAsync({ templateId: selectedId, floorId, name: customName.trim() || undefined });
      toast.success("Room inserted from template");
      setOpen(false);
      setSelectedId(null);
      setCustomName("");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const selected = templates?.find((t) => t.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <BookOpen className="h-3.5 w-3.5" /> From template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert room from template</DialogTitle>
          <DialogDescription>
            Pick one of your saved templates. Dimensions stay fully editable afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <ScrollArea className="h-80 rounded-md border border-border p-2">
            {isLoading && <p className="text-sm text-muted-foreground p-2">Loading…</p>}
            {!isLoading && (!templates || templates.length === 0) && (
              <p className="text-sm text-muted-foreground p-2">
                No templates saved yet. Save a room first from any project.
              </p>
            )}
            <div className="space-y-1">
              {templates?.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  selected={selectedId === t.id}
                  onSelect={() => {
                    setSelectedId(t.id);
                    setCustomName((t.payload as RoomTemplatePayload).name);
                  }}
                />
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-3">
            {selected ? (
              <>
                <RoomPreview2D
                  shape={(selected.payload as RoomTemplatePayload).shape}
                  geometry={(selected.payload as RoomTemplatePayload).geometry}
                  height={200}
                  label={selected.name}
                />
                <div className="space-y-1.5">
                  <Label>Room name (override)</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Room name"
                  />
                </div>
                {selected.description && (
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground border border-dashed border-border rounded-md p-8">
                Select a template on the left to preview.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleInsert} disabled={!selectedId || apply.isPending}>
            {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {apply.isPending ? "Inserting…" : "Insert room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateRow({
  template,
  selected,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  onSelect: () => void;
}) {
  const shape = (template.payload as RoomTemplatePayload).shape;
  const Icon = shape === "rect" ? Square : shape === "L" ? Shapes : CircleIcon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
        selected ? "bg-primary/15 text-primary" : "hover:bg-secondary text-foreground/80",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate font-medium">{template.name}</span>
      </div>
      {template.description && (
        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
          {template.description}
        </div>
      )}
    </button>
  );
}
