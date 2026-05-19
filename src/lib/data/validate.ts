import { REQUIRED_COLUMNS } from "./types";
import type {
  ColumnMapping,
  ColumnValidation,
  OrderRecord,
  ParsePreview,
  RequiredColumn,
} from "./types";
import {
  formatDateIso,
  normalizeChannel,
  normalizeStatus,
  parseFlexibleDate,
  parseQuantity,
} from "./normalize";
import { isMappingComplete } from "./parse";

export function validateColumnMapping(
  mapping: ColumnMapping,
): ColumnValidation[] {
  return REQUIRED_COLUMNS.map((column) => {
    const sourceHeader = mapping[column];
    if (!sourceHeader) {
      return { column, mapped: false, status: "missing", message: "Sin mapear" };
    }
    return { column, mapped: true, sourceHeader, status: "ok" };
  });
}

export function mapRowsToOrders(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
): { orders: OrderRecord[]; errors: string[] } {
  if (!isMappingComplete(mapping)) {
    return { orders: [], errors: ["Completá el mapeo de columnas antes de validar."] };
  }

  const orders: OrderRecord[] = [];
  const errors: string[] = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;
    const get = (col: RequiredColumn) =>
      String(row[mapping[col]!] ?? "").trim();

    const emision = parseFlexibleDate(get("fecha_emision"));
    const entrega = parseFlexibleDate(get("fecha_entrega"));
    const cantidad = parseQuantity(get("cantidad"));
    const estado = normalizeStatus(get("estado"));
    const canal = normalizeChannel(get("tipo_canal"));

    if (!emision) errors.push(`Fila ${line}: fecha_emision inválida`);
    if (!entrega) errors.push(`Fila ${line}: fecha_entrega inválida`);
    if (cantidad == null) errors.push(`Fila ${line}: cantidad no numérica`);
    if (!estado) errors.push(`Fila ${line}: estado inválido`);
    if (!canal) errors.push(`Fila ${line}: canal inválido`);

    if (!emision || !entrega || cantidad == null || !estado || !canal) return;

    orders.push({
      id: `OC-${line}-${get("producto_codigo")}`,
      fecha_emision: formatDateIso(emision),
      tipo_canal: canal,
      nombre_canal: get("nombre_canal"),
      locacion: get("locacion"),
      producto_nombre: get("producto_nombre"),
      producto_codigo: get("producto_codigo").toUpperCase(),
      cantidad,
      fecha_entrega: formatDateIso(entrega),
      estado,
    });
  });

  return { orders, errors };
}

export function validateOrders(orders: OrderRecord[]): ColumnValidation[] {
  const base = validateColumnMapping(
    Object.fromEntries(REQUIRED_COLUMNS.map((c) => [c, c])) as ColumnMapping,
  );

  if (orders.length === 0) {
    return base.map((v) => ({
      ...v,
      status: "invalid" as const,
      message: "Sin registros válidos",
    }));
  }

  return base.map((v) => ({ ...v, status: "ok" as const, message: "OK" }));
}

export function buildParsePreview(orders: OrderRecord[]): ParsePreview {
  const skus = new Set(orders.map((o) => o.producto_codigo));
  const channels = new Set(orders.map((o) => o.tipo_canal));
  const dates = orders
    .map((o) => parseFlexibleDate(o.fecha_emision))
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    totalRows: orders.length,
    skuCount: skus.size,
    channelCount: channels.size,
    dateFrom: dates[0] ? formatDateIso(dates[0]) : null,
    dateTo: dates[dates.length - 1] ? formatDateIso(dates[dates.length - 1]!) : null,
    previewRows: orders.slice(0, 20),
  };
}
