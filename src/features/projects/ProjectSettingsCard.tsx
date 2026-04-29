import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BRICK_SPECS, MIX_RATIO_DESCRIPTIONS } from "@/lib/calc/constants";
import type { Project } from "./types";
import { useUpdateProject } from "./api";
import { extractApiError } from "@/features/auth/errors";

interface Props {
  project: Project;
}

export function ProjectSettingsCard({ project }: Props) {
  const update = useUpdateProject(project.id);

  const [form, setForm] = useState({
    name: project.name,
    clientName: project.client.name,
    clientPhone: project.client.phone,
    location: project.location,
    notes: project.notes,
    currency: project.currency,
    brickPreset: project.brickPreset,
    mixRatio: project.mixRatio,
    wastagePct: project.wastagePct,
    mortarJointMm: project.mortarJointMm,
  });

  useEffect(() => {
    setForm({
      name: project.name,
      clientName: project.client.name,
      clientPhone: project.client.phone,
      location: project.location,
      notes: project.notes,
      currency: project.currency,
      brickPreset: project.brickPreset,
      mixRatio: project.mixRatio,
      wastagePct: project.wastagePct,
      mortarJointMm: project.mortarJointMm,
    });
  }, [project]);

  async function save() {
    try {
      await update.mutateAsync({
        name: form.name,
        client: { name: form.clientName, phone: form.clientPhone } as Project["client"],
        location: form.location,
        notes: form.notes,
        currency: form.currency,
        brickPreset: form.brickPreset,
        mixRatio: form.mixRatio,
        wastagePct: form.wastagePct,
        mortarJointMm: form.mortarJointMm,
      });
      toast.success("Project settings saved");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project overview & settings</CardTitle>
        <CardDescription>
          These parameters drive every calculation in this project. Change them here; they apply to
          all future estimates (saved revisions keep their historical values).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Client name">
            <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          </Field>
          <Field label="Client phone">
            <Input value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Brick preset">
            <Select
              value={form.brickPreset}
              onValueChange={(v) => setForm({ ...form, brickPreset: v as Project["brickPreset"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(BRICK_SPECS).map((b) => (
                  <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground pt-1">
              {BRICK_SPECS[form.brickPreset].description}
            </p>
          </Field>

          <Field label="Mortar mix">
            <Select
              value={form.mixRatio}
              onValueChange={(v) => setForm({ ...form, mixRatio: v as Project["mixRatio"] })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(MIX_RATIO_DESCRIPTIONS) as Project["mixRatio"][]).map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground pt-1">
              {MIX_RATIO_DESCRIPTIONS[form.mixRatio]}
            </p>
          </Field>

          <Field label="Wastage %">
            <Input
              type="number"
              step="0.5"
              min={0}
              max={50}
              value={form.wastagePct}
              onChange={(e) => setForm({ ...form, wastagePct: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground pt-1">Typical: 5–10%</p>
          </Field>

          <Field label="Mortar joint (mm)">
            <Input
              type="number"
              step="1"
              min={6}
              max={20}
              value={form.mortarJointMm}
              onChange={(e) => setForm({ ...form, mortarJointMm: Number(e.target.value) })}
            />
            <p className="text-[11px] text-muted-foreground pt-1">Industry default: 10 mm</p>
          </Field>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={update.isPending}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
