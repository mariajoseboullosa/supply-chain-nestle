import { DEMO_INSIGHTS } from "@/lib/mockData/catalog";
import type {
  AuditEntry,
  CollaborativeInsight,
  ConsensusPublishState,
  InsightFormInput,
} from "./types";

const INSIGHTS_KEY = "nestle_dp_insights";
const AUDIT_KEY = "nestle_dp_audit_log";
const CONSENSUS_KEY = "nestle_dp_consensus";
const SEED_KEY = "nestle_dp_insights_seeded";

export const INSIGHTS_CHANGED_EVENT = "nestle-insights-changed";

function emitChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INSIGHTS_CHANGED_EVENT));
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseLegacyImpact(impact: string): {
  impacto_tipo: CollaborativeInsight["impacto_tipo"];
  impacto_valor: number;
} {
  const pct = impact.match(/([+-]?\d+(?:\.\d+)?)\s*%/);
  if (pct) {
    return { impacto_tipo: "porcentaje", impacto_valor: parseFloat(pct[1]!) };
  }
  const units = impact.match(/([+-]?\d+)\s*u/i);
  if (units) {
    return { impacto_tipo: "unidades", impacto_valor: parseFloat(units[1]!) };
  }
  return { impacto_tipo: "porcentaje", impacto_valor: 0 };
}

function mapLegacyStatus(
  estado: string,
): CollaborativeInsight["estado_aprobacion"] {
  if (estado === "Aprobado") return "aprobado";
  if (estado === "Rechazado") return "rechazado";
  if (estado === "En revisión") return "pendiente";
  return "pendiente";
}

function seedInsights(): CollaborativeInsight[] {
  const now = new Date().toISOString();
  return DEMO_INSIGHTS.map((legacy) => {
    const { impacto_tipo, impacto_valor } = parseLegacyImpact(legacy.impact);
    return {
      id: `ins-${legacy.id}`,
      area: legacy.area,
      responsable: legacy.owner,
      sku: legacy.sku,
      skuCode: legacy.skuCode,
      channel: legacy.channel,
      cliente: legacy.channel === "Todos" ? "Todos los clientes" : legacy.channel,
      fecha_inicio: legacy.startDate,
      fecha_fin: legacy.endDate,
      impacto_tipo,
      impacto_valor,
      justificacion: legacy.justification,
      evento: legacy.type,
      tipo_evento:
        legacy.type.toLowerCase().includes("inflación") ||
        legacy.type.toLowerCase().includes("traba")
          ? "estructural"
          : "coyuntural",
      estado_aprobacion: mapLegacyStatus(legacy.status),
      createdAt: now,
      updatedAt: now,
    } satisfies CollaborativeInsight;
  });
}

function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  const seeded = seedInsights();
  saveJson(INSIGHTS_KEY, seeded);
  localStorage.setItem(SEED_KEY, "1");
}

export function getInsights(): CollaborativeInsight[] {
  ensureSeeded();
  return loadJson<CollaborativeInsight[]>(INSIGHTS_KEY, []);
}

export function saveInsights(insights: CollaborativeInsight[]): void {
  saveJson(INSIGHTS_KEY, insights);
  emitChange();
}

export function getAuditLog(): AuditEntry[] {
  return loadJson<AuditEntry[]>(AUDIT_KEY, []);
}

export function appendAudit(entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
  const full: AuditEntry = {
    ...entry,
    id: uid("aud"),
    timestamp: new Date().toISOString(),
  };
  const log = [full, ...getAuditLog()].slice(0, 200);
  saveJson(AUDIT_KEY, log);
  emitChange();
  return full;
}

export function getConsensusStates(): ConsensusPublishState[] {
  return loadJson<ConsensusPublishState[]>(CONSENSUS_KEY, []);
}

export function getConsensusState(skuCode: string): ConsensusPublishState | null {
  return getConsensusStates().find((s) => s.skuCode === skuCode) ?? null;
}

export function setConsensusPublished(
  skuCode: string,
  userName: string,
): ConsensusPublishState {
  const states = getConsensusStates().filter((s) => s.skuCode !== skuCode);
  const prev = getConsensusState(skuCode);
  const versionNum = prev?.version
    ? parseFloat(prev.version.replace("v", "")) + 0.1
    : 3.0;
  const state: ConsensusPublishState = {
    skuCode,
    published: true,
    publishedAt: new Date().toISOString(),
    publishedBy: userName,
    version: `v${versionNum.toFixed(1)}`,
  };
  saveJson(CONSENSUS_KEY, [...states, state]);
  emitChange();
  return state;
}

export function createInsight(
  input: InsightFormInput,
  userName: string,
): CollaborativeInsight {
  const now = new Date().toISOString();
  const insight: CollaborativeInsight = {
    ...input,
    id: uid("ins"),
    estado_aprobacion: "pendiente",
    createdAt: now,
    updatedAt: now,
  };
  saveInsights([insight, ...getInsights()]);
  appendAudit({
    user: userName,
    action: "creacion",
    description: `Insight creado: ${input.evento} · ${input.sku}`,
    skuCode: input.skuCode,
    insightId: insight.id,
  });
  return insight;
}

export function updateInsight(
  id: string,
  patch: Partial<InsightFormInput>,
  userName: string,
): CollaborativeInsight | null {
  const insights = getInsights();
  const idx = insights.findIndex((i) => i.id === id);
  if (idx < 0) return null;

  const updated: CollaborativeInsight = {
    ...insights[idx]!,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const next = [...insights];
  next[idx] = updated;
  saveInsights(next);
  appendAudit({
    user: userName,
    action: "edicion",
    description: `Insight editado: ${updated.evento} · ${updated.sku}`,
    skuCode: updated.skuCode,
    insightId: updated.id,
  });
  return updated;
}

export function deleteInsight(id: string, userName: string): boolean {
  const insights = getInsights();
  const target = insights.find((i) => i.id === id);
  if (!target) return false;
  saveInsights(insights.filter((i) => i.id !== id));
  appendAudit({
    user: userName,
    action: "eliminacion",
    description: `Insight eliminado: ${target.evento} · ${target.sku}`,
    skuCode: target.skuCode,
    insightId: target.id,
  });
  return true;
}

export function approveInsight(id: string, userName: string): CollaborativeInsight | null {
  return setApproval(id, "aprobado", userName, "aprobacion", "aprobado");
}

export function rejectInsight(id: string, userName: string): CollaborativeInsight | null {
  return setApproval(id, "rechazado", userName, "rechazo", "rechazado");
}

function setApproval(
  id: string,
  status: CollaborativeInsight["estado_aprobacion"],
  userName: string,
  action: AuditEntry["action"],
  label: string,
): CollaborativeInsight | null {
  const insights = getInsights();
  const idx = insights.findIndex((i) => i.id === id);
  if (idx < 0) return null;

  const updated: CollaborativeInsight = {
    ...insights[idx]!,
    estado_aprobacion: status,
    updatedAt: new Date().toISOString(),
  };
  const next = [...insights];
  next[idx] = updated;
  saveInsights(next);
  appendAudit({
    user: userName,
    action,
    description: `Insight ${label}: ${updated.evento} · ${updated.sku}`,
    skuCode: updated.skuCode,
    insightId: updated.id,
  });
  return updated;
}

export function publishForecast(
  skuCode: string,
  userName: string,
  productName: string,
): ConsensusPublishState {
  const state = setConsensusPublished(skuCode, userName);
  appendAudit({
    user: userName,
    action: "publicacion",
    description: `Forecast publicado ${state.version} · ${productName}`,
    skuCode,
  });
  return state;
}
