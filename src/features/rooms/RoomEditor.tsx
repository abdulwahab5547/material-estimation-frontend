import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, AlertTriangle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomPreview2D } from "./RoomPreview2D";
import type { Room, RoomShape, Geometry, Wall } from "@/features/projects/types";
import { useUpdateRoom } from "@/features/projects/api";
import { extractApiError } from "@/features/auth/errors";
import { roomFloorArea } from "./roomMath";
import { formatFt3, formatNumber } from "@/lib/format";
import { SaveAsTemplateButton } from "@/features/templates/SaveAsTemplateButton";

interface Props {
  projectId: string;
  room: Room;
  walls: Wall[];
}

export function RoomEditor({ projectId, room, walls }: Props) {
  const update = useUpdateRoom(projectId);

  const [shape, setShape] = useState<RoomShape>(room.shape);
  const [ceiling, setCeiling] = useState(room.ceilingHeightFt);
  const [name, setName] = useState(room.name);
  const [rect, setRect] = useState({
    lengthFt: (room.geometry as any).lengthFt ?? 12,
    widthFt: (room.geometry as any).widthFt ?? 10,
  });
  const [l, setL] = useState({
    lengthFt: (room.geometry as any).lengthFt ?? 16,
    widthFt: (room.geometry as any).widthFt ?? 12,
    notch: {
      corner: ((room.geometry as any).notch?.corner as "tl" | "tr" | "bl" | "br") ?? "tr",
      cutLengthFt: (room.geometry as any).notch?.cutLengthFt ?? 4,
      cutWidthFt: (room.geometry as any).notch?.cutWidthFt ?? 4,
    },
  });
  const [circle, setCircle] = useState({ radiusFt: (room.geometry as any).radiusFt ?? 6 });

  // Re-sync when a different room is selected
  useEffect(() => {
    setShape(room.shape);
    setCeiling(room.ceilingHeightFt);
    setName(room.name);
    const g = room.geometry as any;
    if (room.shape === "rect") setRect({ lengthFt: g.lengthFt, widthFt: g.widthFt });
    else if (room.shape === "L") setL({ lengthFt: g.lengthFt, widthFt: g.widthFt, notch: g.notch });
    else if (room.shape === "circle") setCircle({ radiusFt: g.radiusFt });
  }, [room.id, room.shape, room.geometry, room.ceilingHeightFt, room.name]);

  const currentGeometry: Geometry = shape === "rect" ? rect : shape === "L" ? l : circle;
  const area = roomFloorArea(shape, currentGeometry);

  const shapeOrGeomChanged =
    shape !== room.shape || JSON.stringify(currentGeometry) !== JSON.stringify(room.geometry);
  const anyChanged =
    shapeOrGeomChanged || ceiling !== room.ceilingHeightFt || name !== room.name;

  async function saveAll(opts: { regenerateWalls: boolean }) {
    try {
      await update.mutateAsync({
        roomId: room.id,
        patch: {
          name,
          shape,
          geometry: currentGeometry as any,
          ceilingHeightFt: ceiling,
        },
        preserveWalls: !opts.regenerateWalls,
      });
      toast.success(
        opts.regenerateWalls && shapeOrGeomChanged
          ? "Room saved — walls regenerated"
          : "Room saved",
      );
    } catch (err) {
      toast.error(extractApiError(err));
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle>Room details</CardTitle>
              <CardDescription>
                Edit dimensions and shape. Changing the shape or geometry regenerates the walls unless you choose otherwise.
              </CardDescription>
            </div>
            <SaveAsTemplateButton roomId={room.id} defaultName={room.name} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Ceiling height (ft)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min={6}
                    max={30}
                    value={ceiling}
                    onChange={(e) => setCeiling(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Shape</Label>
                <Select value={shape} onValueChange={(v) => setShape(v as RoomShape)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rect">Rectangular</SelectItem>
                    <SelectItem value="L">L-shaped</SelectItem>
                    <SelectItem value="circle">Circular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {shape === "rect" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label="Length (ft)" value={rect.lengthFt} onChange={(v) => setRect({ ...rect, lengthFt: v })} />
                  <NumberField label="Width (ft)" value={rect.widthFt} onChange={(v) => setRect({ ...rect, widthFt: v })} />
                </div>
              )}

              {shape === "L" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <NumberField label="Overall length (ft)" value={l.lengthFt} onChange={(v) => setL({ ...l, lengthFt: v })} />
                    <NumberField label="Overall width (ft)" value={l.widthFt} onChange={(v) => setL({ ...l, widthFt: v })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label>Notch corner</Label>
                      <Select
                        value={l.notch.corner}
                        onValueChange={(v) => setL({ ...l, notch: { ...l.notch, corner: v as "tl" | "tr" | "bl" | "br" } })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tl">Top-left</SelectItem>
                          <SelectItem value="tr">Top-right</SelectItem>
                          <SelectItem value="bl">Bottom-left</SelectItem>
                          <SelectItem value="br">Bottom-right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <NumberField
                      label="Cut length (ft)"
                      value={l.notch.cutLengthFt}
                      onChange={(v) => setL({ ...l, notch: { ...l.notch, cutLengthFt: v } })}
                    />
                    <NumberField
                      label="Cut width (ft)"
                      value={l.notch.cutWidthFt}
                      onChange={(v) => setL({ ...l, notch: { ...l.notch, cutWidthFt: v } })}
                    />
                  </div>
                </div>
              )}

              {shape === "circle" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField label="Radius (ft)" value={circle.radiusFt} onChange={(v) => setCircle({ radiusFt: v })} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {shapeOrGeomChanged && (
                  <div className="inline-flex items-center gap-1 text-xs text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Shape or dimensions changed — walls will be regenerated.
                  </div>
                )}
                <div className="ml-auto flex gap-2">
                  {shapeOrGeomChanged && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => saveAll({ regenerateWalls: false })}
                      disabled={update.isPending}
                    >
                      Save without regenerating
                    </Button>
                  )}
                  <Button size="sm" onClick={() => saveAll({ regenerateWalls: true })} disabled={update.isPending || !anyChanged}>
                    {update.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : shapeOrGeomChanged ? (
                      <RefreshCw className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {shapeOrGeomChanged ? "Save & regenerate" : "Save"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Plan view</Label>
              <RoomPreview2D shape={shape} geometry={currentGeometry} height={260} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Stat label="Floor area" value={`${formatNumber(area, 1)} ft²`} />
                <Stat label="Walls" value={`${walls.length}`} />
                <Stat label="Ceiling height" value={`${ceiling.toFixed(1)} ft`} />
                <Stat label="Volume (rough)" value={formatFt3(area * ceiling, 0)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.1"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-card/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
