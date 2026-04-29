/**
 * Mirror of backend/src/services/calc/constants.ts — kept in lock-step so
 * the frontend can do live preview calculations without a round-trip.
 * The server snapshot is the source of truth when an estimate is saved.
 */

export const MM_PER_FT = 304.8;
export const IN_PER_FT = 12;
export const CEMENT_BAG_FT3 = 1.25;
export const DRY_VOLUME_FACTOR = 1.33;

export type BrickPreset = "Standard" | "Modular" | "Engineering";

export interface BrickSpec {
  name: BrickPreset;
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  /** Human-readable description for the UI preset picker. */
  description: string;
}

export const BRICK_SPECS: Record<BrickPreset, BrickSpec> = {
  Standard: {
    name: "Standard",
    lengthIn: 9,
    widthIn: 4.5,
    heightIn: 3,
    description: "Pakistani / South Asian nominal — 9\" × 4.5\" × 3\"",
  },
  Modular: {
    name: "Modular",
    lengthIn: 7.625,
    widthIn: 3.625,
    heightIn: 2.25,
    description: "US / ASTM modular — 7⅝\" × 3⅝\" × 2¼\"",
  },
  Engineering: {
    name: "Engineering",
    lengthIn: 8.66,
    widthIn: 4.13,
    heightIn: 2.56,
    description: "UK BS 3921 engineering — 220 × 105 × 65 mm",
  },
};

export type MixRatio = "1:3" | "1:4" | "1:5" | "1:6";

export const MIX_RATIO_PARTS: Record<MixRatio, { cement: number; sand: number; total: number }> = {
  "1:3": { cement: 1, sand: 3, total: 4 },
  "1:4": { cement: 1, sand: 4, total: 5 },
  "1:5": { cement: 1, sand: 5, total: 6 },
  "1:6": { cement: 1, sand: 6, total: 7 },
};

export const MIX_RATIO_DESCRIPTIONS: Record<MixRatio, string> = {
  "1:3": "Very rich — structural, load-critical mortar",
  "1:4": "Rich — plaster, high-load walls",
  "1:5": "Medium — standard external walls",
  "1:6": "Lean — most interior masonry (default)",
};

export function requiredLoadBearingThicknessIn(numberOfFloors: number): number {
  if (numberOfFloors <= 1) return 9;
  if (numberOfFloors === 2) return 9;
  if (numberOfFloors === 3) return 13.5;
  return 18;
}
