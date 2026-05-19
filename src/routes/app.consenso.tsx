import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, KPI, LockedNotice } from "@/components/ui-bits";
import { useProduct } from "@/lib/product-context";
import { getSkuBundle } from "@/lib/mockData";
import {
  useInsights,
  computeConsensusBreakdown,
  computeInsightDelta,
  formatImpactDisplay,
  canApproveReject,
  canPublishForecast,
} from "@/lib/insights";
import { Check, X, Send, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useMemo } from "react";

export const Route = createFileRoute("/app/consenso")({ component: Consenso });

function formatAuditTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Consenso() {
  const { product } = useProduct();
  const { user, canEdit } = useAuth();
  const editable = canEdit("consenso");
  const canApprove = canApproveReject(user?.role ?? "marketing");
  const canPublish = canPublishForecast(user?.role ?? "marketing");

  const {
    insights,
    auditLog,
    approveInsight,
    rejectInsight,
    publishForecast,
    getPublishState,
  } = useInsights();

  const bundle = useMemo(() => getSkuBundle(product.code), [product.code]);

  const baseline = useMemo(() => {
    if (!bundle) return 0;
    return bundle.weeklyForecast.reduce((acc, w) => acc + w.baseline, 0);
  }, [bundle]);

  const breakdown = useMemo(
    () =>
      computeConsensusBreakdown(
        baseline,
        insights,
        product.code,
        product.name,
      ),
    [baseline, insights, product.code, product.name],
  );

  const publishState = getPublishState(product.code);

  const skuAudit = useMemo(
    () =>
      auditLog.filter(
        (a) => !a.skuCode || a.skuCode === product.code,
      ),
    [auditLog, product.code],
  );

  const handleApprove = (id: string) => {
    if (!user || !canApprove) return;
    approveInsight(id, user.name);
    toast.success("Aprobado");
  };

  const handleReject = (id: string) => {
    if (!user || !canApprove) return;
    rejectInsight(id, user.name);
    toast.error("Rechazado");
  };

  const handlePublish = () => {
    if (!user || !canPublish) return;
    const state = publishForecast(product.code, user.name, product.name);
    toast.success(`Forecast publicado ${state.version} a ERP/SAP`);
  };

  const fmtDelta = (n: number) => (n >= 0 ? `+${n.toLocaleString("es-AR")}` : n.toLocaleString("es-AR"));

  return (
    <div>
      <PageHeader
        title="Consenso S&OP"
        subtitle={`Versión activa: ${publishState?.version ?? "v3.2"} · ${product.name}`}
        actions={
          <>
            {publishState?.published && (
              <Badge tone="good">
                Publicado {publishState.publishedAt ? formatAuditTime(publishState.publishedAt) : ""}
              </Badge>
            )}
            <button
              disabled={!editable || !canPublish}
              onClick={handlePublish}
              className="h-9 px-3 rounded-md bg-nestle-green text-white text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="size-4" />
              Publish Forecast
            </button>
          </>
        }
      />
      {!editable && (
        <div className="mb-4">
          <LockedNotice feature="consenso" />
        </div>
      )}

      <Card title="Fórmula del consenso" className="mb-6">
        <div className="rounded-md bg-muted p-4 font-mono text-sm text-center">
          Forecast final = baseline + Δ marketing + Δ ventas + Δ finanzas
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <KPI label="Baseline" value={breakdown.baseline.toLocaleString("es-AR")} />
          <KPI
            label="Δ Marketing"
            value={fmtDelta(breakdown.marketing)}
            tone={breakdown.marketing >= 0 ? "good" : "warn"}
          />
          <KPI
            label="Δ Ventas"
            value={fmtDelta(breakdown.ventas)}
            tone={breakdown.ventas >= 0 ? "good" : "warn"}
          />
          <KPI
            label="Δ Finanzas"
            value={fmtDelta(breakdown.finanzas)}
            tone={breakdown.finanzas >= 0 ? "good" : "warn"}
          />
          <KPI
            label="Consenso final"
            value={breakdown.final.toLocaleString("es-AR")}
            tone="good"
            hint={`${breakdown.diffPct >= 0 ? "+" : ""}${breakdown.diffPct.toFixed(1)}% vs baseline`}
          />
        </div>
      </Card>

      <Card title="Trazabilidad — ajustes aprobados" className="mb-6">
        {breakdown.approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay insights aprobados para este SKU.
          </p>
        ) : (
          <div className="space-y-2">
            {breakdown.approved.map((ins) => {
              const delta = Math.round(computeInsightDelta(ins, baseline));
              return (
                <div
                  key={ins.id}
                  className="flex items-center justify-between p-3 rounded-md border text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      tone={
                        ins.area === "Marketing"
                          ? "info"
                          : ins.area === "Ventas"
                            ? "good"
                            : "warn"
                      }
                    >
                      {ins.area}
                    </Badge>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {ins.evento} · {ins.sku}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ins.channel} · {ins.cliente} · {formatImpactDisplay(ins)} →{" "}
                        {fmtDelta(delta)} u
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {ins.responsable}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Ajustes pendientes de aprobación" className="mb-6">
        {breakdown.pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay ajustes pendientes.</p>
        ) : (
          <div className="space-y-2">
            {breakdown.pending.map((ins) => (
              <div
                key={ins.id}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    tone={
                      ins.area === "Marketing"
                        ? "info"
                        : ins.area === "Ventas"
                          ? "good"
                          : "warn"
                    }
                  >
                    {ins.area}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">
                      {ins.evento} · {ins.sku}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Impacto: {formatImpactDisplay(ins)} · {ins.justificacion}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={!editable || !canApprove}
                    onClick={() => handleApprove(ins.id)}
                    className="h-8 px-3 rounded bg-success text-white text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Check className="size-3.5" />
                    Aprobar
                  </button>
                  <button
                    disabled={!editable || !canApprove}
                    onClick={() => handleReject(ins.id)}
                    className="h-8 px-3 rounded bg-destructive text-white text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <X className="size-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Versiones del forecast">
          <div className="space-y-2">
            <div className="flex items-start justify-between p-2 rounded border">
              <div>
                <div className="font-medium text-sm flex items-center gap-2">
                  {publishState?.version ?? "v3.2"}
                  <Badge tone="good">Activa</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Consenso con insights aprobados
                </div>
                <div className="text-xs text-muted-foreground">
                  {publishState?.publishedBy ?? "Demand Planner"} ·{" "}
                  {publishState?.publishedAt
                    ? formatAuditTime(publishState.publishedAt)
                    : "Pendiente de publicación"}
                </div>
              </div>
            </div>
            {skuAudit
              .filter((a) => a.action === "publicacion")
              .slice(0, 3)
              .map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between p-2 rounded border opacity-80"
                >
                  <div>
                    <div className="font-medium text-sm">{a.description}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.user} · {formatAuditTime(a.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
        <Card
          title="Audit log"
          actions={<History className="size-4 text-muted-foreground" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {skuAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
            ) : (
              skuAudit.map((a) => (
                <div key={a.id} className="text-sm border-l-2 border-nestle-red pl-3">
                  <div className="text-xs text-muted-foreground">
                    {formatAuditTime(a.timestamp)} · {a.user}
                  </div>
                  <div>{a.description}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
