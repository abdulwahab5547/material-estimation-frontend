import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

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
import { useAuth } from "@/features/auth/useAuth";
import { extractApiError } from "@/features/auth/errors";
import { useCreateProject } from "./api";

const schema = z.object({
  name: z.string().min(1, "Project name is required").max(140),
  clientName: z.string().max(140).optional(),
  location: z.string().max(200).optional(),
  numberOfFloors: z.coerce.number().int().min(1).max(50),
  tag: z.enum(["residential", "commercial", "renovation", "other"]),
});
type Values = z.infer<typeof schema>;

interface Props {
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ trigger }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const create = useCreateProject();
  const [open, setOpen] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      clientName: "",
      location: "",
      numberOfFloors: 1,
      tag: "residential",
    },
  });

  async function onSubmit(values: Values) {
    try {
      const project = await create.mutateAsync({
        name: values.name,
        client: values.clientName ? { name: values.clientName } : undefined,
        location: values.location,
        numberOfFloors: values.numberOfFloors,
        tag: values.tag,
      });
      toast.success(`Project "${project.name}" created`);
      setOpen(false);
      form.reset();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Defaults come from your profile ({user ? `${user.defaultBrickPreset} brick · ${user.defaultMixRatio} mix · ${user.defaultWastagePct}% wastage` : "—"}). You can override anything per-project later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input id="name" placeholder="e.g. Khan residence, Plot 27" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client name (optional)</Label>
              <Input id="clientName" placeholder="Mr. / Mrs. …" {...form.register("clientName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location / address</Label>
              <Input id="location" placeholder="DHA Phase 5, Lahore" {...form.register("location")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="numberOfFloors">Number of floors</Label>
              <Input
                id="numberOfFloors"
                type="number"
                min={1}
                max={50}
                {...form.register("numberOfFloors")}
              />
              <p className="text-xs text-muted-foreground">
                Floors are created automatically; add/remove later as needed.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.watch("tag")}
                onValueChange={(v) => form.setValue("tag", v as Values["tag"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {create.isPending ? "Creating…" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
