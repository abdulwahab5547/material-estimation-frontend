/**
 * Frontend orchestrator (mirror of backend). Runs synchronously on the
 * current in-memory project tree so the EstimatePanel updates in real-time
 * as the user edits wall lengths, openings, etc.
 */

import {
  applyWastage,
  computeBrickCount,
  computeMortarMaterials,
  computeWallVolume,
} from "./engine";
import { requiredLoadBearingThicknessIn, type BrickPreset, type MixRatio } from "./constants";

export interface EstimateParams {
  brickPreset: BrickPreset;
  mixRatio: MixRatio;
  wastagePct: number;
  mortarJointMm: number;
}

export interface LiveWall {
  id: string;
  label?: string;
  lengthFt: number;
  heightFt: number;
  thicknessIn: number;
  openings: { widthFt: number; heightFt: number; count: number }[];
}

export interface LiveRoom {
  id: string;
  name: string;
  walls: LiveWall[];
}

export interface LiveFloor {
  id: string;
  index: number;
  label: string;
  rooms: LiveRoom[];
}

export interface LiveProject {
  numberOfFloors: number;
  params: EstimateParams;
  floors: LiveFloor[];
}

export interface LiveWallResult {
  wallId: string;
  label: string;
  grossFt3: number;
  openingsFt3: number;
  netFt3: number;
  bricks: number;
  mortarFt3: number;
}

export interface LiveEstimateResult {
  totals: {
    netVolumeFt3: number;
    mortarFt3: number;
    bricks: number;
    cementBags: number;
    sandFt3: number;
  };
  totalsWithWastage: {
    netVolumeFt3: number;
    mortarFt3: number;
    bricks: number;
    cementBags: number;
    sandFt3: number;
  };
  loadBearingThicknessIn: number;
  perWall: LiveWallResult[];
}

export function runLiveEstimate(project: LiveProject): LiveEstimateResult {
  const perWall: LiveWallResult[] = [];

  for (const floor of project.floors) {
    for (const room of floor.rooms) {
      for (const wall of room.walls) {
        const v = computeWallVolume(wall);
        const b = computeBrickCount(v.netFt3, project.params.brickPreset, project.params.mortarJointMm);
        perWall.push({
          wallId: wall.id,
          label: wall.label ?? "",
          grossFt3: v.grossFt3,
          openingsFt3: v.openingsFt3,
          netFt3: v.netFt3,
          bricks: b.bricks,
          mortarFt3: b.mortarFt3,
        });
      }
    }
  }

  const mortarFt3 = perWall.reduce((s, w) => s + w.mortarFt3, 0);
  const { cementBags, sandFt3 } = computeMortarMaterials(mortarFt3, project.params.mixRatio);

  const totals = {
    netVolumeFt3: perWall.reduce((s, w) => s + w.netFt3, 0),
    mortarFt3,
    bricks: perWall.reduce((s, w) => s + w.bricks, 0),
    cementBags,
    sandFt3,
  };

  const totalsWithWastage = applyWastage(totals, project.params.wastagePct);

  return {
    totals,
    totalsWithWastage,
    loadBearingThicknessIn: requiredLoadBearingThicknessIn(project.numberOfFloors),
    perWall,
  };
}
