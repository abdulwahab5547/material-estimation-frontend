/**
 * Frontend mirror of backend/services/cost/rates.ts — used for live cost
 * preview as the user tweaks wastage, mix, or rates in the UI. The server
 * re-runs the same math when persisting an estimate snapshot.
 */

import type { CostBreakdown, RateCard } from "./types";

export function resolveRateCard(
  userRates: Partial<RateCard> | null | undefined,
  projectUseCustom: boolean,
  projectRates: Partial<RateCard> | null | undefined,
): RateCard {
  const src = projectUseCustom && projectRates ? projectRates : userRates ?? {};
  return {
    brickPerUnit: num(src.brickPerUnit),
    cementPerBag: num(src.cementPerBag),
    sandPerFt3: num(src.sandPerFt3),
    crushPerFt3: num(src.crushPerFt3),
    laborPerDay: num(src.laborPerDay),
    laborBricksPerDay: src.laborBricksPerDay && src.laborBricksPerDay > 0 ? src.laborBricksPerDay : 250,
    taxPct: num(src.taxPct),
  };
}

export interface MaterialQuantities {
  bricks: number;
  cementBags: number;
  sandFt3: number;
  crushFt3: number;
}

export function computeCost(
  q: MaterialQuantities,
  rateCard: RateCard,
  currency: string,
): CostBreakdown {
  const lines = [
    { label: "Bricks", quantity: q.bricks, unit: "nos", unitPrice: rateCard.brickPerUnit, total: q.bricks * rateCard.brickPerUnit },
    { label: "Cement", quantity: q.cementBags, unit: "bags", unitPrice: rateCard.cementPerBag, total: q.cementBags * rateCard.cementPerBag },
    { label: "Sand", quantity: q.sandFt3, unit: "ft³", unitPrice: rateCard.sandPerFt3, total: q.sandFt3 * rateCard.sandPerFt3 },
    { label: "Crush / aggregate", quantity: q.crushFt3, unit: "ft³", unitPrice: rateCard.crushPerFt3, total: q.crushFt3 * rateCard.crushPerFt3 },
  ];
  const materialsSubtotal = lines.reduce((s, l) => s + l.total, 0);
  const laborDays = rateCard.laborBricksPerDay > 0 ? q.bricks / rateCard.laborBricksPerDay : 0;
  const laborTotal = laborDays * rateCard.laborPerDay;
  const subtotal = materialsSubtotal + laborTotal;
  const taxAmount = subtotal * (rateCard.taxPct / 100);
  const grandTotal = subtotal + taxAmount;

  const hasAnyRates =
    rateCard.brickPerUnit > 0 ||
    rateCard.cementPerBag > 0 ||
    rateCard.sandPerFt3 > 0 ||
    rateCard.crushPerFt3 > 0 ||
    rateCard.laborPerDay > 0;

  return {
    lines,
    materialsSubtotal,
    laborDays,
    laborTotal,
    subtotal,
    taxPct: rateCard.taxPct,
    taxAmount,
    grandTotal,
    currency,
    rateCard,
    hasAnyRates,
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
