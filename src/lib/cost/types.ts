export interface RateCard {
  brickPerUnit: number;
  cementPerBag: number;
  sandPerFt3: number;
  crushPerFt3: number;
  laborPerDay: number;
  laborBricksPerDay: number;
  taxPct: number;
}

export const EMPTY_RATE_CARD: RateCard = {
  brickPerUnit: 0,
  cementPerBag: 0,
  sandPerFt3: 0,
  crushPerFt3: 0,
  laborPerDay: 0,
  laborBricksPerDay: 250,
  taxPct: 0,
};

export interface CostLineItem {
  label: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface CostBreakdown {
  lines: CostLineItem[];
  materialsSubtotal: number;
  laborDays: number;
  laborTotal: number;
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  rateCard: RateCard;
  hasAnyRates: boolean;
}
