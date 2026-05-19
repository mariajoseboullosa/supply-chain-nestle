import { CHANNELS } from "@/lib/mock-data";
import type {
  ChannelForecastPoint,
  MonthlyDemandPoint,
  WeeklyDemandPoint,
} from "@/lib/mockData";
import {
  getIsoWeekKey,
  monthLabel,
  parseFlexibleDate,
} from "./normalize";
import type {
  GeneratedDemandStore,
  OrderRecord,
  SkuDemandBundle,
  WeeklyDemandAggregate,
} from "./types";

export function buildWeeklyAggregates(
  orders: OrderRecord[],
): WeeklyDemandAggregate[] {
  const map = new Map<string, WeeklyDemandAggregate>();

  for (const o of orders) {
    const d = parseFlexibleDate(o.fecha_entrega) ?? parseFlexibleDate(o.fecha_emision);
    if (!d) continue;
    const week = getIsoWeekKey(d);
    const key = `${week}|${o.producto_codigo}|${o.tipo_canal}|${o.nombre_canal}`;
    const prev = map.get(key) ?? {
      week,
      skuCode: o.producto_codigo,
      skuName: o.producto_nombre,
      channel: o.tipo_canal,
      client: o.nombre_canal,
      deliveredQty: 0,
      pendingQty: 0,
      postponedQty: 0,
    };

    if (o.estado === "entregado") prev.deliveredQty += o.cantidad;
    else if (o.estado === "pendiente") prev.pendingQty += o.cantidad;
    else if (o.estado === "postergado") prev.postponedQty += o.cantidad;

    map.set(key, prev);
  }

  return [...map.values()].sort((a, b) => a.week.localeCompare(b.week));
}

function buildMonthlyHistory(
  orders: OrderRecord[],
  skuCode: string,
): MonthlyDemandPoint[] {
  const byMonth = new Map<number, { label: string; actual: number }>();

  for (const o of orders) {
    if (o.producto_codigo !== skuCode || o.estado !== "entregado") continue;
    const d =
      parseFlexibleDate(o.fecha_entrega) ?? parseFlexibleDate(o.fecha_emision);
    if (!d) continue;
    const sort = d.getFullYear() * 12 + d.getMonth();
    const label = monthLabel(d);
    const prev = byMonth.get(sort) ?? { label, actual: 0 };
    prev.actual += o.cantidad;
    byMonth.set(sort, prev);
  }

  return [...byMonth.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => ({
      month: v.label,
      actual: v.actual,
      baseline: v.actual,
      consensus: v.actual,
    }));
}

function buildWeeklyForecast(
  aggregates: WeeklyDemandAggregate[],
  skuCode: string,
): WeeklyDemandPoint[] {
  const weeks = aggregates
    .filter((a) => a.skuCode === skuCode)
    .sort((a, b) => a.week.localeCompare(b.week));

  return weeks.map((w) => {
    const baseDem = w.deliveredQty;
    const signalAdj = Math.round((w.pendingQty - w.postponedQty) * 0.15);
    const consenso = baseDem + signalAdj;
    const weekLabel = w.week.includes("-W")
      ? `S${w.week.split("-W")[1]}`
      : w.week;
    return {
      week: weekLabel,
      actual: w.deliveredQty,
      baseline: baseDem,
      consensus: consenso,
    };
  });
}

function buildChannelForecasts(
  orders: OrderRecord[],
  skuCode: string,
): ChannelForecastPoint[] {
  const totals = new Map<string, number>();

  for (const o of orders) {
    if (o.producto_codigo !== skuCode || o.estado !== "entregado") continue;
    totals.set(o.tipo_canal, (totals.get(o.tipo_canal) ?? 0) + o.cantidad);
  }

  return CHANNELS.map((ch) => {
    const baseline = totals.get(ch.name) ?? 0;
    return {
      channel: ch.name,
      channelKey: ch.key,
      baseline,
      consensus: baseline,
    };
  });
}

export function generateDemandBase(
  orders: OrderRecord[],
  source: "upload" | "demo",
): GeneratedDemandStore {
  const aggregates = buildWeeklyAggregates(orders);
  const skuCodes = [...new Set(orders.map((o) => o.producto_codigo))];
  const bySku: Record<string, SkuDemandBundle> = {};

  for (const skuCode of skuCodes) {
    const skuOrders = orders.filter((o) => o.producto_codigo === skuCode);
    const skuAggregates = aggregates.filter((a) => a.skuCode === skuCode);
    const signals = skuAggregates.reduce(
      (acc, a) => ({
        deliveredQty: acc.deliveredQty + a.deliveredQty,
        pendingQty: acc.pendingQty + a.pendingQty,
        postponedQty: acc.postponedQty + a.postponedQty,
      }),
      { deliveredQty: 0, pendingQty: 0, postponedQty: 0 },
    );

    bySku[skuCode] = {
      monthlyHistory: buildMonthlyHistory(orders, skuCode),
      weeklyForecast: buildWeeklyForecast(aggregates, skuCode),
      channelForecasts: buildChannelForecasts(orders, skuCode),
      signals,
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    aggregates,
    bySku,
  };
}
