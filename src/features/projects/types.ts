import type { BrickPreset, MixRatio } from "@/lib/calc/constants";
import type { CostBreakdown, RateCard } from "@/lib/cost/types";

export type ProjectTag = "residential" | "commercial" | "renovation" | "other";
export type RoomShape = "rect" | "L" | "circle";
export type LCorner = "tl" | "tr" | "bl" | "br";
export type OpeningType = "door" | "window" | "lintel";

export interface Client {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Project {
  id: string;
  name: string;
  client: Client;
  location: string;
  notes: string;
  tag: ProjectTag;
  numberOfFloors: number;
  currency: string;
  brickPreset: BrickPreset;
  mixRatio: MixRatio;
  wastagePct: number;
  mortarJointMm: number;
  useCustomRates?: boolean;
  rateCard?: RateCard;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem extends Project {
  floorCount: number;
  roomCount: number;
}

export interface Floor {
  id: string;
  projectId: string;
  index: number;
  label: string;
  heightFt: number;
  createdAt: string;
  updatedAt: string;
}

export interface RectGeometry {
  lengthFt: number;
  widthFt: number;
}

export interface LGeometry {
  lengthFt: number;
  widthFt: number;
  notch: {
    corner: LCorner;
    cutLengthFt: number;
    cutWidthFt: number;
  };
}

export interface CircleGeometry {
  radiusFt: number;
}

export type Geometry = RectGeometry | LGeometry | CircleGeometry;

export interface Room {
  id: string;
  floorId: string;
  name: string;
  shape: RoomShape;
  geometry: Geometry;
  ceilingHeightFt: number;
  createdAt: string;
  updatedAt: string;
}

export interface Opening {
  id?: string;
  type: OpeningType;
  label?: string;
  widthFt: number;
  heightFt: number;
  count: number;
}

export interface Wall {
  id: string;
  roomId: string;
  label: string;
  orderIndex: number;
  lengthFt: number;
  heightFt: number;
  thicknessIn: number;
  openings: Opening[];
  isCurved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTree {
  project: Project;
  floors: Floor[];
  rooms: Room[];
  walls: Wall[];
}

export interface EstimateResult {
  params: {
    brickPreset: BrickPreset;
    mixRatio: MixRatio;
    wastagePct: number;
    mortarJointMm: number;
  };
  loadBearingThicknessIn: number;
  totals: {
    netVolumeFt3: number;
    mortarFt3: number;
    bricks: number;
    cementBags: number;
    sandFt3: number;
    crushFt3: number;
  };
  totalsWithWastage: EstimateResult["totals"];
  floors: Array<{
    floorId: string;
    index: number;
    label: string;
    totalNetFt3: number;
    totalBricks: number;
    totalMortarFt3: number;
    rooms: Array<{
      roomId: string;
      name: string;
      totalNetFt3: number;
      totalBricks: number;
      totalMortarFt3: number;
      walls: Array<{
        wallId: string;
        label: string;
        lengthFt: number;
        heightFt: number;
        thicknessIn: number;
        grossFt3: number;
        openingsFt3: number;
        netFt3: number;
        bricks: number;
        mortarFt3: number;
      }>;
    }>;
  }>;
  cost?: CostBreakdown;
  computedAt: string;
}
