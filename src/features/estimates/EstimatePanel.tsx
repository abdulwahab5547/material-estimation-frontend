import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Calculator, Check, Loader2, Save, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import type { Floor, Project, Room, Wall } from "@/features/projects/types";
import { runLiveEstimate, type LiveProject } from "@/lib/calc/estimate";
import { formatBags, formatBricks, formatFt3 } from "@/lib/format";
import { useLatestEstimate, useRunEstimate } from "@/features/projects/api";
import { extractApiError } from "@/features/auth/errors";
import { useAuth } from "@/features/auth/useAuth";
import { computeCost, resolveRateCard } from "@/lib/cost/compute";
import { MaterialsTable } from "./MaterialsTable";
import { CostBreakdown } from "./CostBreakdown";
import { ExportMenu } from "@/features/reports/ExportMenu";

interface Props {
  project: Project;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
}

export function EstimatePanel({ project, floors, rooms, walls }: Props) {
  const runEstimate = useRunEstimate(project.id);
  const { data: latest } = useLatestEstimate(project.id);
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const liveProject = useMemo<LiveProject>(
    () => ({
      numberOfFloors: project.numberOfFloors,
      params: {
        brickPreset: project.brickPreset,
        mixRatio: project.mixRatio,
        wastagePct: project.wastagePct,
        mortarJointMm: project.mortarJointMm,
      },
      floors: floors.map((f) => ({
        id: f.id,
        index: f.index,
        label: f.label,
        rooms: rooms
          .filter((r) => r.floorId === f.id)
          .map((r) => ({
            id: r.id,
            name: r.name,
            walls: walls
              .filter((w) => w.roomId === r.id)
              .map((w) => ({
                id: w.id,
                label: w.label,
                lengthFt: w.lengthFt,
                heightFt: w.heightFt,
                thicknessIn: w.thicknessIn,
                openings: w.openings.map((o) => ({
                  widthFt: o.widthFt,
                  heightFt: o.heightFt,
                  count: o.count,
                })),
              })),
          })),
      })),
    }),
    [project, floors, rooms, walls],
  );

  const live = useMemo(() => runLiveEstimate(liveProject), [liveProject]);
  const isEmpty = walls.length === 0;

  const liveCost = useMemo(() => {
    const rateCard = resolveRateCard(
      user?.rateCard ?? null,
      Boolean(project.useCustomRates),
      project.rateCard ?? null,
    );
    const t = live.totalsWithWastage;
    return computeCost(
      { bricks: t.bricks, cementBags: t.cementBags, sandFt3: t.sandFt3, crushFt3: 0 },
      rateCard,
      project.currency,
    );
  }, [user, project, live]);

  async function persist() {
    try {
      await runEstimate.mutateAsync(undefined);
      toast.success("Estimate saved as a new revision");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  const totals = live.totalsWithWastage;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card/80 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live estimate
              </CardTitle>
              <CardDescription>
                Updates as you edit. Click "Save revision" to snapshot a permanent copy.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEmpty && <ExportMenu projectId={project.id} projectName={project.name} />}
              <Button onClick={persist} disabled={runEstimate.isPending || isEmpty} size="sm">
              {runEstimate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Saved" : "Save revision"}
            </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEmpty ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Add at least one room with walls to see an estimate.
            </div>
          ) : (
            <>
              <motion.div
                key={`${totals.bricks.toFixed(0)}-${totals.cementBags.toFixed(1)}`}
                initial={{ opacity: 0.4, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <HeroStat
                  label="Bricks"
                  value={formatBricks(totals.bricks)}
                  hint={`${project.brickPreset} · ${project.mortarJointMm}mm joints`}
                />
                <HeroStat label="Cement" value={`${formatBags(totals.cementBags)} bags`} hint="50 kg each" />
                <HeroStat label="Sand" value={formatFt3(totals.sandFt3)} hint={`${project.mixRatio} mix`} />
                <HeroStat label="Net wall volume" value={formatFt3(totals.netVolumeFt3)} hint="After openings" />
              </motion.div>

              <div className="flex items-center gap-4 text-xs">
                <Badge variant="outline">Incl. {project.wastagePct}% wastage</Badge>
                <Badge variant="secondary">Load-bearing: {live.loadBearingThicknessIn}″ for {project.numberOfFloors}-floor</Badge>
                {latest && (
                  <span className="text-muted-foreground">
                    Last saved {new Date(latest.createdAt).toLocaleString()}
                  </span>
                )}
              </div>

              <Separator />

              <MaterialsTable live={live} project={project} floors={floors} rooms={rooms} walls={walls} />

              <Separator />

              <CostBreakdown
                cost={liveCost}
                projectId={project.id}
                useCustomRates={Boolean(project.useCustomRates)}
              />
            </>
          )}
        </CardContent>
      </Card>

      {!isEmpty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              How the numbers are produced
            </CardTitle>
            <CardDescription>A transparent breakdown of the calculation steps.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong className="text-foreground">1. Per-wall net volume</strong> — length × height ×
              thickness, minus the sum of opening areas × thickness.
            </p>
            <p>
              <strong className="text-foreground">2. Brick count</strong> — net volume ÷ nominal brick
              volume (brick + mortar-joint-padding on three faces).
            </p>
            <p>
              <strong className="text-foreground">3. Mortar volume</strong> — net volume − (bricks × dry
              brick volume).
            </p>
            <p>
              <strong className="text-foreground">4. Cement & sand</strong> — mortar volume × 1.33 (dry
              factor), split by the mix ratio ({project.mixRatio}). One cement bag = 1.25 ft³.
            </p>
            <p>
              <strong className="text-foreground">5. Wastage</strong> — all material totals are multiplied
              by 1 + {project.wastagePct}%.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeroStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-primary">{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
