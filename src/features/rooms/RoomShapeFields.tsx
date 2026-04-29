import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RoomShape } from "@/features/projects/types";

export interface RoomShapeFormValues {
  name: string;
  shape: RoomShape;
  ceilingHeightFt: number;
  rect: { lengthFt: number; widthFt: number };
  l: {
    lengthFt: number;
    widthFt: number;
    notch: { corner: "tl" | "tr" | "bl" | "br"; cutLengthFt: number; cutWidthFt: number };
  };
  circle: { radiusFt: number };
}

interface Props {
  shape: RoomShape;
  register: UseFormRegister<RoomShapeFormValues>;
  control: Control<RoomShapeFormValues>;
  errors: FieldErrors<RoomShapeFormValues>;
}

export function RoomShapeFields({ shape, register, control, errors }: Props) {
  if (shape === "rect") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Numeric label="Length (ft)" error={errors.rect?.lengthFt?.message} {...register("rect.lengthFt", { valueAsNumber: true })} />
        <Numeric label="Width (ft)" error={errors.rect?.widthFt?.message} {...register("rect.widthFt", { valueAsNumber: true })} />
      </div>
    );
  }

  if (shape === "L") {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Numeric label="Overall length (ft)" {...register("l.lengthFt", { valueAsNumber: true })} />
          <Numeric label="Overall width (ft)" {...register("l.widthFt", { valueAsNumber: true })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Notch corner</Label>
            <Controller
              control={control}
              name="l.notch.corner"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tl">Top-left</SelectItem>
                    <SelectItem value="tr">Top-right</SelectItem>
                    <SelectItem value="bl">Bottom-left</SelectItem>
                    <SelectItem value="br">Bottom-right</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <Numeric label="Cut length (ft)" {...register("l.notch.cutLengthFt", { valueAsNumber: true })} />
          <Numeric label="Cut width (ft)" {...register("l.notch.cutWidthFt", { valueAsNumber: true })} />
        </div>
        <p className="text-xs text-muted-foreground">
          An L-shape is the bounding box rectangle with a smaller rectangle carved out of one corner.
        </p>
      </div>
    );
  }

  // circle
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Numeric label="Radius (ft)" {...register("circle.radiusFt", { valueAsNumber: true })} />
      <p className="text-xs text-muted-foreground sm:col-span-1 self-end pb-2">
        Circular rooms use a single wall whose length equals the circumference (2πr).
      </p>
    </div>
  );
}

// ---- tiny helper ---------------------------------------------------------

interface NumericProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Numeric = Object.assign(
  function NumericInner({ label, error, ...rest }: NumericProps) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Input type="number" step="0.1" min={0} {...rest} />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
  { displayName: "NumericField" },
);
