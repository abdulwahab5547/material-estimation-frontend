import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractApiError } from "@/features/auth/errors";
import { useCreateRoom } from "@/features/projects/api";
import type { Geometry, RoomShape } from "@/features/projects/types";
import { RoomShapeFields, type RoomShapeFormValues } from "./RoomShapeFields";
import { RoomPreview2D } from "./RoomPreview2D";

const schema = z.object({
  name: z.string().min(1, "Room name is required").max(80),
  shape: z.enum(["rect", "L", "circle"]),
  ceilingHeightFt: z.coerce.number().min(6).max(30),
  rect: z.object({
    lengthFt: z.coerce.number().min(1),
    widthFt: z.coerce.number().min(1),
  }),
  l: z.object({
    lengthFt: z.coerce.number().min(1),
    widthFt: z.coerce.number().min(1),
    notch: z.object({
      corner: z.enum(["tl", "tr", "bl", "br"]),
      cutLengthFt: z.coerce.number().min(0.5),
      cutWidthFt: z.coerce.number().min(0.5),
    }),
  }),
  circle: z.object({
    radiusFt: z.coerce.number().min(1),
  }),
});

interface Props {
  projectId: string;
  floorId: string;
  trigger?: React.ReactNode;
}

export function CreateRoomDialog({ projectId, floorId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const createRoom = useCreateRoom(projectId);

  const form = useForm<RoomShapeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      shape: "rect",
      ceilingHeightFt: 10,
      rect: { lengthFt: 12, widthFt: 10 },
      l: {
        lengthFt: 16,
        widthFt: 12,
        notch: { corner: "tr", cutLengthFt: 4, cutWidthFt: 4 },
      },
      circle: { radiusFt: 6 },
    },
  });

  const shape = form.watch("shape");
  const rect = form.watch("rect");
  const l = form.watch("l");
  const circle = form.watch("circle");

  const geometry: Geometry =
    shape === "rect" ? rect : shape === "L" ? l : circle;

  async function onSubmit(values: RoomShapeFormValues) {
    try {
      const geometry =
        values.shape === "rect" ? values.rect : values.shape === "L" ? values.l : values.circle;
      await createRoom.mutateAsync({
        floorId,
        input: {
          name: values.name,
          shape: values.shape,
          geometry,
          ceilingHeightFt: values.ceilingHeightFt,
        },
      });
      toast.success(`Room "${values.name}" created`);
      setOpen(false);
      form.reset();
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm">Add room</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a room</DialogTitle>
          <DialogDescription>
            Pick a shape — walls are generated automatically from the dimensions you enter.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Room name</Label>
              <Input placeholder="e.g. Master bedroom" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Shape</Label>
                <Select
                  value={shape}
                  onValueChange={(v) => form.setValue("shape", v as RoomShape)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rect">Rectangular</SelectItem>
                    <SelectItem value="L">L-shaped</SelectItem>
                    <SelectItem value="circle">Circular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ceiling height (ft)</Label>
                <Input type="number" step="0.1" min={6} max={30} {...form.register("ceilingHeightFt", { valueAsNumber: true })} />
              </div>
            </div>

            <RoomShapeFields
              shape={shape}
              register={form.register}
              control={form.control}
              errors={form.formState.errors}
            />
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <RoomPreview2D shape={shape} geometry={geometry} height={260} />
            <p className="text-[11px] text-muted-foreground">
              Grid = 1 ft. Walls appear in the editor once the room is created.
            </p>
          </div>

          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {createRoom.isPending ? "Creating…" : "Create room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
