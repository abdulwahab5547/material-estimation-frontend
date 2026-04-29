import { DoorOpen, LayoutPanelTop, Plus, Trash2, Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Opening, OpeningType } from "@/features/projects/types";
import { cn } from "@/lib/utils";

interface Props {
  openings: Opening[];
  onChange: (next: Opening[]) => void;
  wallFaceAreaFt2: number;
  disabled?: boolean;
}

const PRESETS: Record<OpeningType, { label: string; widthFt: number; heightFt: number; icon: typeof DoorOpen }> = {
  door: { label: "Door", widthFt: 3, heightFt: 7, icon: DoorOpen },
  window: { label: "Window", widthFt: 4, heightFt: 4, icon: LayoutPanelTop },
  lintel: { label: "Lintel", widthFt: 4, heightFt: 1, icon: Rows3 },
};

export function OpeningsManager({ openings, onChange, wallFaceAreaFt2, disabled }: Props) {
  const totalOpeningArea = openings.reduce((s, o) => s + o.widthFt * o.heightFt * o.count, 0);
  const overLimit = totalOpeningArea > wallFaceAreaFt2;

  function addOpening(type: OpeningType) {
    const p = PRESETS[type];
    onChange([...openings, { type, widthFt: p.widthFt, heightFt: p.heightFt, count: 1, label: "" }]);
  }

  function update(index: number, patch: Partial<Opening>) {
    onChange(openings.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function remove(index: number) {
    onChange(openings.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label className="text-sm">Openings</Label>
          <p className="text-xs text-muted-foreground">
            Doors, windows, and lintels cut through the wall thickness and are deducted from the volume.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRESETS) as OpeningType[]).map((t) => {
            const P = PRESETS[t];
            const Icon = P.icon;
            return (
              <Button key={t} type="button" size="sm" variant="outline" onClick={() => addOpening(t)} disabled={disabled}>
                <Plus className="h-3.5 w-3.5" /> <Icon className="h-3.5 w-3.5" /> {P.label}
              </Button>
            );
          })}
        </div>
      </div>

      {openings.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          No openings on this wall yet.
        </div>
      ) : (
        <div className="space-y-2">
          {openings.map((o, i) => {
            const Icon = PRESETS[o.type].icon;
            return (
              <div
                key={i}
                className="grid grid-cols-2 md:grid-cols-[auto_1fr_90px_90px_70px_auto] items-end gap-2 rounded-md border border-border bg-card/60 p-2"
              >
                <div className="flex items-center gap-2 text-xs font-medium col-span-2 md:col-span-1">
                  <Icon className="h-4 w-4 text-primary" />
                  <Select value={o.type} onValueChange={(v) => update(i, { type: v as OpeningType })}>
                    <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="door">Door</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                      <SelectItem value="lintel">Lintel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="Label (optional)"
                  value={o.label ?? ""}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="h-8"
                  disabled={disabled}
                />
                <NumCell label="Width ft" value={o.widthFt} onChange={(v) => update(i, { widthFt: v })} />
                <NumCell label="Height ft" value={o.heightFt} onChange={(v) => update(i, { heightFt: v })} />
                <NumCell label="Count" value={o.count} onChange={(v) => update(i, { count: Math.max(1, Math.round(v)) })} step={1} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => remove(i)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className={cn("text-xs", overLimit ? "text-destructive" : "text-muted-foreground")}>
        Total opening area: {totalOpeningArea.toFixed(1)} ft² of {wallFaceAreaFt2.toFixed(1)} ft² wall face
        {overLimit && " — exceeds wall, will be rejected on save"}
      </div>
    </div>
  );
}

function NumCell({
  label,
  value,
  onChange,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <Input
        type="number"
        step={step}
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8"
      />
    </div>
  );
}
