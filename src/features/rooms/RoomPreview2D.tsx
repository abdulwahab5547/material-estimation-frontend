import { useMemo } from "react";
import type { Geometry, LGeometry, RectGeometry, RoomShape } from "@/features/projects/types";

interface Props {
  shape: RoomShape;
  geometry: Geometry;
  width?: number;
  height?: number;
  /** Optional label overlayed in the centre of the room. */
  label?: string;
}

/**
 * Scaled 2D plan view of a room. Uses a viewBox so it scales cleanly to any
 * container. The grid behind the room is a rendering of a 1-foot grid.
 */
export function RoomPreview2D({ shape, geometry, width = 320, height = 240, label }: Props) {
  const rendered = useMemo(() => renderShape(shape, geometry, width, height), [shape, geometry, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto rounded-md border border-border bg-card/60"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* grid background */}
      <defs>
        <pattern id="grid" width={rendered.gridPx} height={rendered.gridPx} patternUnits="userSpaceOnUse">
          <path
            d={`M ${rendered.gridPx} 0 L 0 0 0 ${rendered.gridPx}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border/50"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* room fill + stroke */}
      <path
        d={rendered.path}
        className="fill-primary/10 stroke-primary"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* dimension labels */}
      {rendered.dims.map((d, i) => (
        <text
          key={i}
          x={d.x}
          y={d.y}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {d.text}
        </text>
      ))}

      {label && (
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground/80 text-xs font-medium"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// shape rendering
// ---------------------------------------------------------------------------

interface Rendered {
  path: string;
  dims: { x: number; y: number; text: string }[];
  gridPx: number;
}

function renderShape(shape: RoomShape, geometry: Geometry, viewW: number, viewH: number): Rendered {
  // Determine real-world bounding box in feet
  const bbox = worldBBox(shape, geometry);
  const padding = 28;
  const availW = viewW - padding * 2;
  const availH = viewH - padding * 2;
  const scale = Math.max(
    0.1,
    Math.min(availW / Math.max(bbox.w, 1), availH / Math.max(bbox.h, 1)),
  );

  const originX = padding + (availW - bbox.w * scale) / 2;
  const originY = padding + (availH - bbox.h * scale) / 2;

  const toX = (ftX: number) => originX + ftX * scale;
  const toY = (ftY: number) => originY + ftY * scale;

  if (shape === "rect") {
    const g = geometry as RectGeometry;
    const x0 = toX(0), y0 = toY(0);
    const x1 = toX(g.lengthFt), y1 = toY(g.widthFt);
    const path = `M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z`;
    return {
      path,
      gridPx: scale,
      dims: [
        { x: (x0 + x1) / 2, y: y0 - 6, text: `${fmt(g.lengthFt)} ft` },
        { x: x1 + 14, y: (y0 + y1) / 2, text: `${fmt(g.widthFt)} ft` },
      ],
    };
  }

  if (shape === "L") {
    const g = geometry as LGeometry;
    const { lengthFt: L, widthFt: W } = g;
    const { corner, cutLengthFt: a, cutWidthFt: b } = g.notch;

    // Define L polygon by removing a rectangular corner. We trace clockwise
    // from the top-left of the outer bounding box.
    let pts: Array<[number, number]>;
    switch (corner) {
      case "tr":
        pts = [
          [0, 0],
          [L - a, 0],
          [L - a, b],
          [L, b],
          [L, W],
          [0, W],
        ];
        break;
      case "tl":
        pts = [
          [a, 0],
          [L, 0],
          [L, W],
          [0, W],
          [0, b],
          [a, b],
        ];
        break;
      case "br":
        pts = [
          [0, 0],
          [L, 0],
          [L, W - b],
          [L - a, W - b],
          [L - a, W],
          [0, W],
        ];
        break;
      case "bl":
      default:
        pts = [
          [0, 0],
          [L, 0],
          [L, W],
          [a, W],
          [a, W - b],
          [0, W - b],
        ];
        break;
    }
    const path =
      pts.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p[0])} ${toY(p[1])}`).join(" ") + " Z";

    return {
      path,
      gridPx: scale,
      dims: [
        { x: toX(L / 2), y: toY(0) - 6, text: `${fmt(L)} ft` },
        { x: toX(L) + 14, y: toY(W / 2), text: `${fmt(W)} ft` },
      ],
    };
  }

  if (shape === "circle") {
    const g = geometry as { radiusFt: number };
    const cx = toX(g.radiusFt), cy = toY(g.radiusFt);
    const r = g.radiusFt * scale;
    const path = `M ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} Z`;
    return {
      path,
      gridPx: scale,
      dims: [
        { x: cx, y: cy - r - 8, text: `r = ${fmt(g.radiusFt)} ft` },
      ],
    };
  }

  return { path: "", gridPx: scale, dims: [] };
}

function worldBBox(shape: RoomShape, geometry: Geometry): { w: number; h: number } {
  if (shape === "rect") {
    const g = geometry as RectGeometry;
    return { w: g.lengthFt, h: g.widthFt };
  }
  if (shape === "L") {
    const g = geometry as LGeometry;
    return { w: g.lengthFt, h: g.widthFt };
  }
  if (shape === "circle") {
    const g = geometry as { radiusFt: number };
    return { w: g.radiusFt * 2, h: g.radiusFt * 2 };
  }
  return { w: 10, h: 10 };
}

function fmt(n: number): string {
  return n.toFixed(n < 10 ? 1 : 0);
}
