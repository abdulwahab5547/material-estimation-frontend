import type { RateCard } from "@/lib/cost/types";

export interface User {
  id: string;
  email: string;
  displayName: string;
  companyName: string;
  logoUrl: string;
  currency: string;
  defaultWastagePct: number;
  defaultMixRatio: "1:3" | "1:4" | "1:5" | "1:6";
  defaultBrickPreset: "Standard" | "Modular" | "Engineering";
  rateCard?: RateCard;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
