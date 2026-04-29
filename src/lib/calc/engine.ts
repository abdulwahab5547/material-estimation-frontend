/**
 * Frontend mirror of the StructuraCore calc engine — identical formulas,
 * used to power live preview as the user types. The server always re-runs
 * the calc when persisting an estimate, so a mismatch would be caught.
 */

import {
  BRICK_SPECS,
  CEMENT_BAG_FT3,
  DRY_VOLUME_FACTOR,
  IN_PER_FT,
  MIX_RATIO_PARTS,
  MM_PER_FT,
  type BrickPreset,
  type MixRatio,
} from "./constants";

export interface OpeningLike {
  widthFt: number;
  heightFt: number;
  count: number;
}

export interface WallLike {
  id: string;
  label?: string;
  lengthFt: number;
  heightFt: number;
  thicknessIn: number;
  openings: OpeningLike[];
}

export interface WallVolumeBreakdown {
  grossFt3: number;
  openingsFt3: number;
  netFt3: number;
}

export function computeWallVolume(wall: WallLike): WallVolumeBreakdown {
  const thicknessFt = wall.thicknessIn / IN_PER_FT;
  const grossFt3 = wall.lengthFt * wall.heightFt * thicknessFt;
  const openingsArea = wall.openings.reduce(
    (sum, o) => sum + o.widthFt * o.heightFt * o.count,
    0,
  );
  const openingsFt3 = openingsArea * thicknessFt;
  return { grossFt3, openingsFt3, netFt3: Math.max(0, grossFt3 - openingsFt3) };
}

export function nominalBrickVolumeFt3(preset: BrickPreset, mortarJointMm: number): number {
  const spec = BRICK_SPECS[preset];
  const jointFt = mortarJointMm / MM_PER_FT;
  const L = spec.lengthIn / IN_PER_FT + jointFt;
  const W = spec.widthIn / IN_PER_FT + jointFt;
  const H = spec.heightIn / IN_PER_FT + jointFt;
  return L * W * H;
}

export function dryBrickVolumeFt3(preset: BrickPreset): number {
  const s = BRICK_SPECS[preset];
  return (s.lengthIn * s.widthIn * s.heightIn) / (IN_PER_FT ** 3);
}

export function computeBrickCount(
  netVolumeFt3: number,
  preset: BrickPreset,
  mortarJointMm: number,
) {
  if (netVolumeFt3 <= 0) return { bricks: 0, mortarFt3: 0 };
  const vNom = nominalBrickVolumeFt3(preset, mortarJointMm);
  const vDry = dryBrickVolumeFt3(preset);
  const bricks = netVolumeFt3 / vNom;
  const mortarFt3 = Math.max(0, netVolumeFt3 - bricks * vDry);
  return { bricks, mortarFt3 };
}

export function computeMortarMaterials(mortarWetFt3: number, mixRatio: MixRatio) {
  if (mortarWetFt3 <= 0) return { cementBags: 0, sandFt3: 0 };
  const parts = MIX_RATIO_PARTS[mixRatio];
  const dry = mortarWetFt3 * DRY_VOLUME_FACTOR;
  return {
    cementBags: (dry * parts.cement) / parts.total / CEMENT_BAG_FT3,
    sandFt3: (dry * parts.sand) / parts.total,
  };
}

export function applyWastage<T extends Record<string, number>>(materials: T, wastagePct: number): T {
  const factor = 1 + wastagePct / 100;
  const out = {} as T;
  for (const key of Object.keys(materials) as (keyof T)[]) {
    out[key] = ((materials[key] as number) * factor) as T[keyof T];
  }
  return out;
}
