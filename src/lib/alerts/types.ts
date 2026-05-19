export type AlertSeverity = "alta" | "media" | "baja";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export type AlertType =
  | "consensus_deviation"
  | "dpa_lag3_low"
  | "bias_out_of_range"
  | "tracking_signal"
  | "stockout_risk"
  | "margin_below_target"
  | "critical_sku_no_insights";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  sku: string;
  skuCode: string;
  channel: string;
  message: string;
  recommendation: string;
  owner: string;
  status: AlertStatus;
  createdAt: string;
}

export interface AlertRuleThresholds {
  consensusDeviationPct: number;
  dpaLag3Min: number;
  biasMin: number;
  biasMax: number;
  trackingSignalMin: number;
  trackingSignalMax: number;
  stockoutCoverageDays: number;
  marginGapPoints: number;
}

export interface EvaluateAlertsOptions {
  thresholds?: Partial<AlertRuleThresholds>;
  /** Si true, incluye alertas ya resueltas del cache */
  includeResolved?: boolean;
}
