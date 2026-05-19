import { rowsToMonthlyHistory, rowsToWeeklyForecast } from "./build";
import type { CleaningPersistedState, CleaningRow, SkuCleaningStore } from "./types";

const CLEANING_KEY = "nestle_cleaning_state";

export const CLEANING_CHANGED_EVENT = "nestle-cleaning-changed";

function emitChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CLEANING_CHANGED_EVENT));
  }
}

function loadState(): CleaningPersistedState {
  if (typeof window === "undefined") return { version: 1, bySku: {} };
  try {
    const raw = localStorage.getItem(CLEANING_KEY);
    if (!raw) return { version: 1, bySku: {} };
    return JSON.parse(raw) as CleaningPersistedState;
  } catch {
    return { version: 1, bySku: {} };
  }
}

function saveState(state: CleaningPersistedState): void {
  localStorage.setItem(CLEANING_KEY, JSON.stringify(state));
  emitChange();
}

export function getCleaningState(): CleaningPersistedState {
  return loadState();
}

export function getSkuCleaning(skuCode: string): SkuCleaningStore | null {
  return loadState().bySku[skuCode] ?? null;
}

export function hasCleanedDemand(skuCode?: string): boolean {
  const state = loadState();
  if (skuCode) return Boolean(state.bySku[skuCode]);
  return Object.keys(state.bySku).length > 0;
}

export function saveSkuCleaning(
  skuCode: string,
  threshold: number,
  rows: CleaningRow[],
): SkuCleaningStore {
  const store: SkuCleaningStore = {
    skuCode,
    cleanedAt: new Date().toISOString(),
    threshold,
    rows,
    weeklyForecast: rowsToWeeklyForecast(rows),
    monthlyHistory: rowsToMonthlyHistory(skuCode, rows),
  };

  const state = loadState();
  state.bySku[skuCode] = store;
  saveState(state);
  return store;
}

export function clearSkuCleaning(skuCode: string): void {
  const state = loadState();
  delete state.bySku[skuCode];
  saveState(state);
}
