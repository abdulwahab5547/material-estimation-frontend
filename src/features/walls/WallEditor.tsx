import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Opening, Project, Wall } from "@/features/projects/types";
import { OpeningsManager } from "./OpeningsManager";
import { useUpdateWall } from "@/features/projects/api";
import { extractApiError } from "@/features/auth/errors";
import { computeBrickCount, computeWallVolume } from "@/lib/calc/engine";
import { formatBricks, formatFt3 } from "@/lib/format";

interface Props {
  project: Project;
  wall: Wall;
}

export function WallEditor({ project, wall }: Props) {
  const update = useUpdateWall(project.id);

  const [label, setLabel] = useState(wall.label);
  const [lengthFt, setLength] = useState(wall.lengthFt);
  const [heightFt, setHeight] = useState(wall.heightFt);
  const [thicknessIn, setThickness] = useState(wall.thicknessIn);
  const [openings, setOpenings] = useState<Opening[]>(wall.openings);

  useEffect(() => {
    setLabel(wall.label);
    setLength(wall.lengthFt);
    setHeight(wall.heightFt);
    setThickness(wall.thicknessIn);
    setOpenings(wall.openings);
  }, [wall.id, wall.label, wall.lengthFt, wall.heightFt, wall.thicknessIn, wall.openings]);

  const faceArea = lengthFt * heightFt;
  const preview = computeWallVolume({
    id: wall.id,
    label,
    lengthFt,
    heightFt,
    thicknessIn,
    openings,
  });
  const brickPreview = computeBrickCount(preview.netFt3, project.brickPreset, project.mortarJointMm);

  const changed =
    label !== wall.label ||
    lengthFt !== wall.lengthFt ||
    heightFt !== wall.heightFt ||
    thicknessIn !== wall.thicknessIn ||
    JSON.stringify(openings) !== JSON.stringify(wall.openings);

  async function save() {
    try {
      await update.mutateAsync({
        wallId: wall.id,
        patch: {
          label,
          lengthFt,
          heightFt,
          thicknessIn,
          openings,
        },
      });
      toast.success("Wall saved");
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {label || "Wall"}
              {wall.isCurved && <Badge variant="secondary">Curved</Badge>}
            </CardTitle>
            <CardDescription>
              Edit dimensions, thickness, and openings. Live preview shows the resulting volume and brick count.
            </CardDescription>
          </div>
          <Button onClick={save} disabled={update.isPending || !changed}>
            {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. North" />
          </div>
          <div className="space-y-1.5">
            <Label>Length (ft)</Label>
            <Input type="number" step="0.1" min={0.5} value={lengthFt} onChange={(e) => setLength(Number(e.target.value))} disabled={wall.isCurved} />
            {wall.isCurved && (
              <p className="text-[10px] text-muted-foreground">Locked for curved walls — edit the room radius instead.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Height (ft)</Label>
            <Input type="number" step="0.1" min={1} value={heightFt} onChange={(e) => setHeight(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Thickness (inches)</Label>
            <Input type="number" step="0.5" min={3} max={24} value={thicknessIn} onChange={(e) => setThickness(Number(e.target.value))} />
          </div>
        </div>

        <OpeningsManager openings={openings} onChange={setOpenings} wallFaceAreaFt2={faceArea} />

        <div className="rounded-lg border border-border bg-gradient-to-br from-card/80 to-primary/5 p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Live preview (this wall)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Gross volume" value={formatFt3(preview.grossFt3)} />
            <MiniStat label="Openings" value={formatFt3(preview.openingsFt3)} />
            <MiniStat label="Net volume" value={formatFt3(preview.netFt3)} highlight />
            <MiniStat label="Bricks" value={formatBricks(brickPreview.bricks)} highlight />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-base font-semibold ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
