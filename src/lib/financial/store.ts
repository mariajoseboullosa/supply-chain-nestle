import type { FinancialSimulationParams } from "./types";

const FINANCIAL_SIM_KEY = "nestle_financial_sim";

export const FINANCIAL_SIM_CHANGED_EVENT = "nestle-financial-sim-changed";

export const DEFAULT_FINANCIAL_PARAMS: FinancialSimulationParams = {
  scenario: "base",
  dollarVariationPct: 0,
  inflationPct: 6,
  priceChangePct: 8,
  rawMaterialCostPct: 12,
  demandElasticityPct: -5,
};

function emitChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FINANCIAL_SIM_CHANGED_EVENT));
  }
}

export function getFinancialSimulationParams(): FinancialSimulationParams {
  if (typeof window === "undefined") return { ...DEFAULT_FINANCIAL_PARAMS };
  try {
    const raw = localStorage.getItem(FINANCIAL_SIM_KEY);
    if (!raw) return { ...DEFAULT_FINANCIAL_PARAMS };
    return { ...DEFAULT_FINANCIAL_PARAMS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_FINANCIAL_PARAMS };
  }
}

export function saveFinancialSimulationParams(
  params: FinancialSimulationParams,
): void {
  localStorage.setItem(FINANCIAL_SIM_KEY, JSON.stringify(params));
  emitChange();
}
