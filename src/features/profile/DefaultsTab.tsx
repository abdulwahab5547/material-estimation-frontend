import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";
import { extractApiError } from "@/features/auth/errors";
import { profileFormSchema, type ProfileFormValues } from "@/features/auth/authSchemas";
import type { User } from "@/features/auth/types";

const MIX_RATIOS = ["1:3", "1:4", "1:5", "1:6"] as const;
const BRICK_PRESETS = ["Standard", "Modular", "Engineering"] as const;

export function DefaultsTab() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      companyName: user?.companyName ?? "",
      currency: user?.currency ?? "PKR",
      defaultWastagePct: user?.defaultWastagePct ?? 7.5,
      defaultMixRatio: user?.defaultMixRatio ?? "1:6",
      defaultBrickPreset: user?.defaultBrickPreset ?? "Standard",
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: User }>("/api/me/profile", {
        currency: values.currency,
        defaultWastagePct: values.defaultWastagePct,
        defaultMixRatio: values.defaultMixRatio,
        defaultBrickPreset: values.defaultBrickPreset,
      });
      setUser(data.user);
      toast.success("Defaults saved");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimation defaults</CardTitle>
        <CardDescription>
          These values pre-fill new projects. You can always override them on any individual project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" placeholder="PKR" maxLength={8} {...register("currency")} />
            <p className="text-xs text-muted-foreground">3-letter ISO code (e.g. PKR, USD, EUR).</p>
            {errors.currency && <p className="text-xs text-destructive">{errors.currency.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultWastagePct">Default wastage %</Label>
            <Input
              id="defaultWastagePct"
              type="number"
              step="0.1"
              min={0}
              max={50}
              {...register("defaultWastagePct", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">Typical: 5–10% for breakage and mortar waste.</p>
            {errors.defaultWastagePct && <p className="text-xs text-destructive">{errors.defaultWastagePct.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultMixRatio">Default mortar mix ratio</Label>
            <select
              id="defaultMixRatio"
              className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("defaultMixRatio")}
            >
              {MIX_RATIOS.map((r) => (
                <option key={r} value={r}>
                  {r} (cement : sand)
                </option>
              ))}
            </select>
            {errors.defaultMixRatio && <p className="text-xs text-destructive">{errors.defaultMixRatio.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultBrickPreset">Default brick preset</Label>
            <select
              id="defaultBrickPreset"
              className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register("defaultBrickPreset")}
            >
              {BRICK_PRESETS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            {errors.defaultBrickPreset && <p className="text-xs text-destructive">{errors.defaultBrickPreset.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save defaults"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
