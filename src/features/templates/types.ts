import type { Geometry, RoomShape } from "@/features/projects/types";

export type TemplateKind = "room" | "project";

export interface RoomTemplatePayload {
  name: string;
  shape: RoomShape;
  geometry: Geometry;
  ceilingHeightFt: number;
  walls?: Array<{
    label: string;
    orderIndex: number;
    lengthFt: number;
    heightFt: number;
    thicknessIn: number;
    isCurved: boolean;
    openings: Array<{ type: "door" | "window" | "lintel"; widthFt: number; heightFt: number; count: number; label?: string }>;
  }>;
}

export interface Template {
  id: string;
  userId: string;
  kind: TemplateKind;
  name: string;
  description: string;
  thumbnail: string;
  tags: string[];
  payload: RoomTemplatePayload | unknown;
  createdAt: string;
  updatedAt: string;
}
