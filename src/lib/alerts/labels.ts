import type { AlertStatus, AlertType } from "./types";

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  consensus_deviation: "Desvío consenso vs baseline > 20%",
  dpa_lag3_low: "DPA Lag-3 bajo umbral",
  bias_out_of_range: "Bias fuera de rango",
  tracking_signal: "Tracking signal fuera de rango",
  stockout_risk: "Stockout proyectado",
  margin_below_target: "Margen bajo target",
  critical_sku_no_insights: "SKU crítico sin insight cargado",
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  open: "Activa",
  acknowledged: "Reconocida",
  resolved: "Resuelta",
};
