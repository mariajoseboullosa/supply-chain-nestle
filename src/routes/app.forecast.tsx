import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, LockedNotice } from "@/components/ui-bits";
import { MODELS, getDemandSeries } from "@/lib/mock-data";
import { useProduct } from "@/lib/product-context";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from "recharts";
import { useAuth } from "@/lib/auth";
import { Play, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/forecast")({ component: Forecast });

function Forecast() {
  const { product } = useProduct();
  const { canEdit } = useAuth();
  const editable = canEdit("forecast");
  const best = MODELS.reduce((a,b)=>a.mape<b.mape?a:b);
  const series = getDemandSeries(product.code);
  const residuales = series.filter(s=>s.real).map((s,i)=>({ mes: s.mes, residual: (s.real ?? 0) - s.baseline }));
  const comp = MODELS.map(m => ({ name: m.name.split(" ").slice(0,2).join(" "), mape: m.mape }));

  return (
    <div>
      <PageHeader title="Forecast" subtitle={`Comparación de modelos · ${product.name}`} actions={
        <>
          <button disabled={!editable} onClick={()=>toast.success("Corriendo 8 modelos…")} className="h-9 px-3 rounded-md bg-nestle-red text-white text-sm flex items-center gap-2 disabled:opacity-50"><Play className="size-4"/>Correr todos</button>
          <button onClick={()=>toast.success("Exportado a Excel")} className="h-9 px-3 rounded-md border text-sm flex items-center gap-2"><Download className="size-4"/>Excel</button>
          <button onClick={()=>toast.success("Exportado a CSV")} className="h-9 px-3 rounded-md border text-sm">CSV</button>
          <button onClick={()=>toast.success("Enviado a SAP")} className="h-9 px-3 rounded-md border text-sm">SAP</button>
          <button onClick={()=>toast.success("Enviado a ERP")} className="h-9 px-3 rounded-md border text-sm">ERP</button>
        </>
      } />

      {!editable && <div className="mb-4"><LockedNotice feature="forecast" /></div>}

      <Card title="Parámetros" className="mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="text-sm">Horizonte (semanas)
            <input type="number" defaultValue={13} className="mt-1 w-full h-9 px-2 rounded border" />
          </label>
          <label className="text-sm">Intervalo de confianza
            <select className="mt-1 w-full h-9 px-2 rounded border"><option>80%</option><option>90%</option><option>95%</option></select>
          </label>
          <label className="text-sm">Ventana entrenamiento (meses)
            <input type="number" defaultValue={24} className="mt-1 w-full h-9 px-2 rounded border" />
          </label>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {MODELS.map(m => (
          <div key={m.name} className={`rounded-lg border p-3 ${m.name===best.name?"border-nestle-red ring-1 ring-nestle-red/40 bg-nestle-red/5":""}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">{m.name}</div>
              {m.name===best.name && <Badge tone="bad">Mejor</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div><div className="text-muted-foreground">MAPE</div><div className="font-semibold">{m.mape}%</div></div>
              <div><div className="text-muted-foreground">MAD</div><div className="font-semibold">{m.mad}</div></div>
              <div><div className="text-muted-foreground">RMSE</div><div className="font-semibold">{m.rmse}</div></div>
              <div><div className="text-muted-foreground">Bias</div><div className="font-semibold">{m.bias}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Comparación de modelos (MAPE %)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="mape" fill="#dc2626" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Residuales">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={residuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <ReferenceLine y={0} stroke="#999" />
              <Line dataKey="residual" stroke="#1f6fbf" strokeWidth={2} dot={{r:3}} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
