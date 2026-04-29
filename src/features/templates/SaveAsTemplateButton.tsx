import { useState } from "react";
import { toast } from "sonner";
import { BookmarkPlus, Loader2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { useSaveRoomTemplate } from "./api";
import { extractApiError } from "@/features/auth/errors";

interface Props {
  roomId: string;
  defaultName?: string;
}

export function SaveAsTemplateButton({ roomId, defaultName = "" }: Props) {
  const save = useSaveRoomTemplate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Give the template a name");
      return;
    }
    try {
      await save.mutateAsync({
        roomId,
        input: {
          name: name.trim(),
          description: description.trim(),
          tags: tagsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 8),
        },
      });
      toast.success(`Saved "${name}" to your templates`);
      setOpen(false);
      setName(defaultName);
      setDescription("");
      setTagsText("");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookmarkPlus className="h-3.5 w-3.5" /> Save as template
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save room as template</DialogTitle>
          <DialogDescription>
            Captures the room's shape, dimensions, walls, and openings so you can drop it into future projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard 12×12 bedroom" />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="1 door + 1 window, 10ft ceiling"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="bedroom, residential, 12x12"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {save.isPending ? "Saving…" : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
