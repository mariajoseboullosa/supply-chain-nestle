import { createFileRoute, Link } from "@tanstack/react-router";
import { useProduct } from "@/lib/product-context";
import {
  getDemandSeries,
  getWeeklyForecast,
  getChannelForecast,
} from "@/lib/mock-data";
import {
  buildDashboardData,
  formatPct,
  formatUnits,
} from "@/lib/dashboard";
import { ALERT_TYPE_LABELS } from "@/lib/alerts";
import { PageHeader, KPI, Card, Badge, Semaforo } from "@/components/ui-bits";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { CLEANING_CHANGED_EVENT } from "@/lib/cleaning";
import { DATA_CHANGED_EVENT } from "@/lib/data";
import { INSIGHTS_CHANGED_EVENT } from "@/lib/insights";
import {
  CheckCircle2,
  Database,
  Brush,
  LineChart as LC,
  Lightbulb,
  Handshake,
  Send,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/app/")({ component: Dashboard });

const STEPS = [
  { icon: Database, label: "Cargar datos", done: true },
  { icon: Brush, label: "Limpiar", done: true },
  { icon: LC, label: "Baseline", done: true },
  { icon: Lightbulb, label: "Insights", done: true },
  { icon: Handshake, label: "Consenso", done: false },
  { icon: Send, label: "Publicar", done: false },
];

function Dashboard() {
  const { product } = useProduct();
  const [view, setView] = useState<"chart" | "table">("chart");
  const [insightsTick, setInsightsTick] = useState(0);

  useEffect(() => {
    const refresh = () => setInsightsTick((t) => t + 1);
    window.addEventListener(INSIGHTS_CHANGED_EVENT, refresh);
    window.addEventListener(DATA_CHANGED_EVENT, refresh);
    window.addEventListener(CLEANING_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(INSIGHTS_CHANGED_EVENT, refresh);
      window.removeEventListener(DATA_CHANGED_EVENT, refresh);
      window.removeEventListener(CLEANING_CHANGED_EVENT, refresh);
    };
  }, []);

  const dashboard = useMemo(
    () => buildDashboardData(product.code),
    [product.code, insightsTick],
  );

  const chartSeries = useMemo(() => {
    if (dashboard) return dashboard.chartSeries;
    return getDemandSeries(product.code).map((m) => ({
      mes: m.mes,
      real: m.real,
      baseline: m.baseline,
      consenso: m.consenso,
    }));
  }, [dashboard, product.code]);

  const weekly = useMemo(() => {
    if (dashboard) return dashboard.weekly;
    return getWeeklyForecast(product.code).map((r) => ({
      semana: r.semana,
      real: r.real,
      baseDem: r.baseDem,
      ajuste: r.ajuste,
      consenso: r.consenso,
      vsBase: r.vsBase,
      estado: r.estado,
    }));
  }, [dashboard, product.code]);

  const channels = useMemo(() => {
    if (dashboard) return dashboard.channels;
    return getChannelForecast(product.code).map((c) => ({
      canal: c.canal,
      forecast: c.forecast,
      consenso: c.consenso,
    }));
  }, [dashboard, product.code]);

  const kpis = dashboard?.kpis;
  const productAlerts = dashboard?.productAlerts ?? [];
  const alertCount = dashboard?.activeAlertCount ?? 0;
  const topAlerts = productAlerts.slice(0, 3);

  const biasTone =
    kpis && Math.abs(kpis.bias) > 5
      ? "warn"
      : kpis && kpis.bias < 0
        ? "default"
        : "good";
  const mapeTone = kpis && kpis.mape <= 10 ? "good" : kpis && kpis.mape <= 15 ? "warn" : "bad";
  const dpaTone = kpis && kpis.dpaLag3 >= 85 ? "good" : kpis && kpis.dpaLag3 >= 70 ? "warn" : "bad";
  const stockTone = kpis && kpis.stockoutRiskCount > 0 ? "warn" : "good";
  const fvaTone = kpis && kpis.fva >= 0 ? "good" : "bad";

  return (
    <div>
      <PageHeader
        title="Dashboard ejecutivo"
        subtitle={`Producto: ${product.name} · ${product.category}`}
        actions={
          alertCount > 0 ? (
            <Badge tone="bad">{alertCount} alertas activas</Badge>
          ) : (
            <Badge tone="good">Sin alertas</Badge>
          )
        }
      />

      {topAlerts.length > 0 && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-warning/30 bg-warning/15">
            <AlertTriangle className="size-4 text-warning shrink-0" />
            <span className="text-sm font-medium">Alertas activas</span>
            <Badge tone="warn">{alertCount}</Badge>
            <Link
              to="/app/control-tower"
              className="ml-auto text-xs text-nestle-red font-medium flex items-center gap-0.5 hover:underline"
            >
              Ver todas
              <ChevronRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-warning/20">
            {topAlerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 px-4 py-2.5 text-sm"
              >
                <Badge tone={a.severity === "alta" ? "bad" : a.severity === "media" ? "warn" : "info"}>
                  {a.severity}
                </Badge>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{ALERT_TYPE_LABELS[a.type]}</span>
                  <span className="text-muted-foreground"> · {a.channel}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {a.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.owner}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI
          label="Demanda Base M+1"
          value={kpis ? formatUnits(kpis.demandBaseM1) : "—"}
          hint={kpis ? `Modelo ${kpis.modelName}` : "Datos demo"}
        />
        <KPI
          label="Demanda Consenso M+1"
          value={kpis ? formatUnits(kpis.demandConsensusM1) : "—"}
          hint={kpis ? formatPct(kpis.consensusVsBasePct) + " vs base" : undefined}
          tone={kpis && kpis.consensusVsBasePct >= 0 ? "good" : "warn"}
        />
        <KPI
          label="MAPE modelo actual"
          value={kpis ? `${kpis.mape.toFixed(1)}%` : "—"}
          hint={
            kpis
              ? `MAD ${Math.round(kpis.mad)} · RMSE ${Math.round(kpis.rmse)} · Accuracy ${kpis.forecastAccuracy.toFixed(1)}%`
              : undefined
          }
          tone={kpis ? mapeTone : "default"}
        />
        <KPI
          label="Bias acumulado"
          value={kpis ? formatPct(kpis.bias) : "—"}
          hint={
            kpis
              ? `Tracking Signal ${kpis.trackingSignal.toFixed(2)}`
              : undefined
          }
          tone={kpis ? biasTone : "default"}
        />
        <KPI
          label="DPA Lag-3"
          value={kpis ? `${kpis.dpaLag3.toFixed(1)}%` : "—"}
          tone={kpis ? dpaTone : "default"}
        />
        <KPI
          label="In Stock"
          value={kpis ? `${kpis.inStockPct.toFixed(1)}%` : "—"}
          tone={kpis && kpis.inStockPct >= 90 ? "good" : "warn"}
        />
        <KPI
          label="Stockout Risk"
          value={kpis ? `${kpis.stockoutRiskCount} alerta${kpis.stockoutRiskCount !== 1 ? "s" : ""}` : "—"}
          tone={kpis ? stockTone : "default"}
        />
        <KPI
          label="Forecast Value Added"
          value={kpis ? formatPct(kpis.fva) : "—"}
          hint="vs naive"
          tone={kpis ? fvaTone : "default"}
        />
      </div>

      <Card title="Workflow del proceso S&OP" className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                    s.done
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Histórico vs Forecast vs Consenso" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="real"
                name="Real"
                stroke="#1f6fbf"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="#dc2626"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="consenso"
                name="Consenso"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Estacionalidad mensual">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="baseline" name="Baseline" fill="#dc2626" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consenso" name="Consenso" fill="#16a34a" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card
        title="Pronóstico 13 semanas"
        actions={
          <div className="flex gap-1">
            <button
              onClick={() => setView("chart")}
              className={`px-3 py-1 text-xs rounded ${view === "chart" ? "bg-nestle-red text-white" : "bg-muted"}`}
            >
              Gráfico
            </button>
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1 text-xs rounded ${view === "table" ? "bg-nestle-red text-white" : "bg-muted"}`}
            >
              Tabla
            </button>
          </div>
        }
        className="mb-6"
      >
        {view === "chart" ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                dataKey="baseDem"
                name="Base"
                stroke="#dc2626"
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                dataKey="consenso"
                name="Consenso"
                stroke="#16a34a"
                strokeWidth={2}
              />
              <Line dataKey="real" name="Real" stroke="#1f6fbf" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>
                  {[
                    "Semana",
                    "Real",
                    "Demanda Base",
                    "Ajuste insights",
                    "Consenso",
                    "vs Base",
                    "Estado",
                  ].map((h) => (
                    <th key={h} className="py-2 px-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekly.map((r) => (
                  <tr key={r.semana} className="border-b last:border-0">
                    <td className="py-2 px-2 font-medium">{r.semana}</td>
                    <td className="py-2 px-2">{r.real ?? "—"}</td>
                    <td className="py-2 px-2">{r.baseDem}</td>
                    <td className="py-2 px-2">
                      {r.ajuste > 0 ? `+${r.ajuste}` : r.ajuste}
                    </td>
                    <td className="py-2 px-2 font-medium">{r.consenso}</td>
                    <td
                      className={`py-2 px-2 ${r.vsBase >= 0 ? "text-success" : "text-destructive"}`}
                    >
                      {r.vsBase.toFixed(1)}%
                    </td>
                    <td className="py-2 px-2">
                      <Semaforo estado={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Forecast por canal">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={channels}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="forecast"
              name="Forecast base"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="consenso"
              name="Consenso"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
