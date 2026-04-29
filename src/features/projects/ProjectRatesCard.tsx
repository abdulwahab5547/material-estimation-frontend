import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Receipt, Link2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/useAuth";
import { useUpdateProject } from "./api";
import { extractApiError } from "@/features/auth/errors";
import { EMPTY_RATE_CARD, type RateCard } from "@/lib/cost/types";
import type { Project } from "./types";

interface Props {
  project: Project;
}

/**
 * Per-project cost-rate override. By default a project inherits the user's
 * rate card (set in Profile → Rates). Flipping the switch copies the current
 * inherited rates into the project and lets them be edited without touching
 * the global defaults.
 */
export function ProjectRatesCard({ project }: Props) {
  const { user } = useAuth();
  const update = useUpdateProject(project.id);

  const [useCustom, setUseCustom] = useState(Boolean(project.useCustomRates));
  const [rates, setRates] = useState<RateCard>(() => ({
    ...EMPTY_RATE_CARD,
    ...(project.rateCard ?? user?.rateCard ?? {}),
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUseCustom(Boolean(project.useCustomRates));
    setRates({ ...EMPTY_RATE_CARD, ...(project.rateCard ?? user?.rateCard ?? {}) });
  }, [project, user?.rateCard]);

  async function save() {
    setSaving(true);
    try {
      await update.mutateAsync({
        useCustomRates: useCustom,
        rateCard: rates,
      } as Partial<Project>);
      toast.success(useCustom ? "Project rates saved" : "Back to using default rates");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const currency = project.currency;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Cost rates for this project
            </CardTitle>
            <CardDescription>
              Override your default rate card if this job's pricing differs from your standard. The chosen
              rates are frozen into every saved estimate.
            </CardDescription>
          </div>
          <Badge variant={useCustom ? "warning" : "secondary"}>
            {useCustom ? "Project-specific" : "Inheriting defaults"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3 rounded-md border border-border bg-card/60 px-4 py-3">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <div className="text-sm font-medium">Use custom rates for this project</div>
            <div className="text-xs text-muted-foreground">
              When off, rates come from Profile → Rates tab.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={useCustom}
            onClick={() => setUseCustom((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useCustom ? "bg-primary" : "bg-secondary"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${useCustom ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        <fieldset disabled={!useCustom} className={useCustom ? "" : "opacity-60"}>
          <div className="grid gap-5 sm:grid-cols-2">
            <RateField label={`Brick / unit (${currency})`} value={rates.brickPerUnit} onChange={(v) => setRates({ ...rates, brickPerUnit: v })} />
            <RateField label={`Cement / bag (${currency})`} value={rates.cementPerBag} onChange={(v) => setRates({ ...rates, cementPerBag: v })} />
            <RateField label={`Sand / ft³ (${currency})`} value={rates.sandPerFt3} onChange={(v) => setRates({ ...rates, sandPerFt3: v })} />
            <RateField label={`Crush / ft³ (${currency})`} value={rates.crushPerFt3} onChange={(v) => setRates({ ...rates, crushPerFt3: v })} />
          </div>

          <div className="my-4 h-px bg-border" />

          <div className="grid gap-5 sm:grid-cols-3">
            <RateField
              label={`Labor / mason-day (${currency})`}
              value={rates.laborPerDay}
              onChange={(v) => setRates({ ...rates, laborPerDay: v })}
            />
            <RateField
              label="Productivity (bricks/day)"
              value={rates.laborBricksPerDay}
              onChange={(v) => setRates({ ...rates, laborBricksPerDay: Math.max(50, v) })}
              step={10}
              min={50}
              max={2000}
            />
            <RateField
              label="Tax %"
              value={rates.taxPct}
              onChange={(v) => setRates({ ...rates, taxPct: Math.min(50, Math.max(0, v)) })}
              step={0.5}
              max={50}
            />
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save rates
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RateField({
  label,
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 10_000_000,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
