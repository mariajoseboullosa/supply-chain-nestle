import { createFileRoute } from "@tanstack/react-router";
import { useProduct } from "@/lib/product-context";
import { getDemandSeries, getWeeklyForecast, getChannelForecast } from "@/lib/mock-data";
import { PageHeader, KPI, Card, Semaforo } from "@/components/ui-bits";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useState } from "react";
import { CheckCircle2, Database, Brush, LineChart as LC, Lightbulb, Handshake, Send } from "lucide-react";

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
  const series = getDemandSeries(product.code);
  const weekly = getWeeklyForecast(product.code);
  const channels = getChannelForecast(product.code);
  const [view, setView] = useState<"chart"|"table">("chart");

  return (
    <div>
      <PageHeader title="Dashboard ejecutivo" subtitle={`Producto: ${product.name} · ${product.category}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Demanda Base M+1" value="14.820 u" hint="Modelo SARIMA" />
        <KPI label="Demanda Consenso M+1" value="15.640 u" hint="+5.5% vs base" tone="good" />
        <KPI label="MAPE modelo actual" value="8.6%" tone="good" />
        <KPI label="Bias acumulado" value="-1.2%" hint="Levemente subestimando" />
        <KPI label="DPA Lag-3" value="92.4%" tone="good" />
        <KPI label="In Stock" value="96.1%" tone="good" />
        <KPI label="Stockout Risk" value="3 SKUs" tone="warn" />
        <KPI label="Forecast Value Added" value="+4.1%" hint="vs naive" tone="good" />
      </div>

      <Card title="Workflow del proceso S&OP" className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${s.done ? "bg-success/10 border-success/30 text-success" : "bg-muted text-muted-foreground"}`}>
                  {s.done ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
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
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="real" name="Real" stroke="#1f6fbf" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#dc2626" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="consenso" name="Consenso" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Estacionalidad mensual">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="baseline" fill="#dc2626" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Pronóstico 13 semanas" actions={
        <div className="flex gap-1">
          <button onClick={()=>setView("chart")} className={`px-3 py-1 text-xs rounded ${view==="chart"?"bg-nestle-red text-white":"bg-muted"}`}>Gráfico</button>
          <button onClick={()=>setView("table")} className={`px-3 py-1 text-xs rounded ${view==="table"?"bg-nestle-red text-white":"bg-muted"}`}>Tabla</button>
        </div>
      } className="mb-6">
        {view === "chart" ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line dataKey="baseDem" name="Base" stroke="#dc2626" strokeDasharray="4 4" dot={false} />
              <Line dataKey="consenso" name="Consenso" stroke="#16a34a" strokeWidth={2} />
              <Line dataKey="real" name="Real" stroke="#1f6fbf" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground border-b">
                <tr>{["Semana","Real","Demanda Base","Ajuste insights","Consenso","vs Base","Estado"].map(h=><th key={h} className="py-2 px-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {weekly.map(r => (
                  <tr key={r.semana} className="border-b last:border-0">
                    <td className="py-2 px-2 font-medium">{r.semana}</td>
                    <td className="py-2 px-2">{r.real ?? "—"}</td>
                    <td className="py-2 px-2">{r.baseDem}</td>
                    <td className="py-2 px-2">{r.ajuste > 0 ? `+${r.ajuste}` : r.ajuste}</td>
                    <td className="py-2 px-2 font-medium">{r.consenso}</td>
                    <td className={`py-2 px-2 ${r.vsBase >= 0 ? "text-success" : "text-destructive"}`}>{r.vsBase.toFixed(1)}%</td>
                    <td className="py-2 px-2"><Semaforo estado={r.estado} /></td>
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
            <Bar dataKey="forecast" name="Forecast base" fill="#dc2626" radius={[4,4,0,0]} />
            <Bar dataKey="consenso" name="Consenso" fill="#16a34a" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
