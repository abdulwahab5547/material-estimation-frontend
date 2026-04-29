import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Receipt } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";
import { extractApiError } from "@/features/auth/errors";
import type { User } from "@/features/auth/types";
import type { RateCard } from "@/lib/cost/types";

const DEFAULT_RATES: RateCard = {
  brickPerUnit: 0,
  cementPerBag: 0,
  sandPerFt3: 0,
  crushPerFt3: 0,
  laborPerDay: 0,
  laborBricksPerDay: 250,
  taxPct: 0,
};

export function RatesTab() {
  const { user, setUser } = useAuth();
  const [rates, setRates] = useState<RateCard>(DEFAULT_RATES);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.rateCard) setRates({ ...DEFAULT_RATES, ...user.rateCard });
  }, [user?.rateCard]);

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: User }>("/api/me/profile", { rateCard: rates });
      setUser(data.user);
      toast.success("Rate card saved");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const currency = user?.currency ?? "PKR";
  const hasAnyRates =
    rates.brickPerUnit > 0 ||
    rates.cementPerBag > 0 ||
    rates.sandPerFt3 > 0 ||
    rates.crushPerFt3 > 0 ||
    rates.laborPerDay > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Default rate card
            </CardTitle>
            <CardDescription>
              Unit prices (in {currency}) used to cost every new project. Individual projects can override these.
            </CardDescription>
          </div>
          <Badge variant={hasAnyRates ? "success" : "outline"}>
            {hasAnyRates ? "Active" : "Not set"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-5 sm:grid-cols-2">
          <RateField
            label={`Brick — per unit (${currency})`}
            hint="Market rate for one laid brick including mortar"
            value={rates.brickPerUnit}
            onChange={(v) => setRates({ ...rates, brickPerUnit: v })}
          />
          <RateField
            label={`Cement — per 50 kg bag (${currency})`}
            hint="Current bag retail price"
            value={rates.cementPerBag}
            onChange={(v) => setRates({ ...rates, cementPerBag: v })}
          />
          <RateField
            label={`Sand — per ft³ (${currency})`}
            hint="Delivered-to-site price"
            value={rates.sandPerFt3}
            onChange={(v) => setRates({ ...rates, sandPerFt3: v })}
          />
          <RateField
            label={`Crush / aggregate — per ft³ (${currency})`}
            hint="Foundation aggregate (optional)"
            value={rates.crushPerFt3}
            onChange={(v) => setRates({ ...rates, crushPerFt3: v })}
          />
        </div>

        <div className="my-6 h-px bg-border" />

        <div className="grid gap-5 sm:grid-cols-3">
          <RateField
            label={`Labor — per mason-day (${currency})`}
            hint="Daily cost including helper"
            value={rates.laborPerDay}
            onChange={(v) => setRates({ ...rates, laborPerDay: v })}
          />
          <RateField
            label="Productivity (bricks/day)"
            hint="Standard is 250 per mason/day"
            value={rates.laborBricksPerDay}
            onChange={(v) => setRates({ ...rates, laborBricksPerDay: Math.max(50, v) })}
            step={10}
            min={50}
            max={2000}
          />
          <RateField
            label="Tax / GST %"
            hint="Applied on materials + labor"
            value={rates.taxPct}
            onChange={(v) => setRates({ ...rates, taxPct: Math.min(50, Math.max(0, v)) })}
            step={0.5}
            max={50}
          />
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save rate card
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RateField({
  label,
  hint,
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 10_000_000,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
