import type { Geometry, LGeometry, RectGeometry, RoomShape } from "@/features/projects/types";

export function roomFloorArea(shape: RoomShape, geometry: Geometry): number {
  if (shape === "rect") {
    const g = geometry as RectGeometry;
    return g.lengthFt * g.widthFt;
  }
  if (shape === "L") {
    const g = geometry as LGeometry;
    return g.lengthFt * g.widthFt - g.notch.cutLengthFt * g.notch.cutWidthFt;
  }
  if (shape === "circle") {
    const g = geometry as { radiusFt: number };
    return Math.PI * g.radiusFt * g.radiusFt;
  }
  return 0;
}
