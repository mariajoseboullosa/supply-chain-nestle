import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, LockedNotice } from "@/components/ui-bits";
import { MOCK_OUTLIERS } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export const Route = createFileRoute("/app/limpieza")({ component: Limpieza });

const EVENTOS = ["Promoción","Hot Sale","Cyber Week","Vuelta a clases","Cierre de trimestre","Traba comercial","Falso stock","Quiebre de stock"];

function buildSeries() {
  return Array.from({ length: 18 }, (_, i) => {
    const x = i + 1;
    const base = 3500 + Math.sin(i/2)*400;
    const outlier = i === 5 ? 8200 : i === 12 ? 1100 : null;
    const original = outlier ?? Math.round(base + (Math.sin(i*1.7)*200));
    const limpio = Math.round(base + (Math.sin(i*1.7)*200));
    return { mes: `M${x}`, original, limpio };
  });
}

function Limpieza() {
  const { canEdit } = useAuth();
  const editable = canEdit("limpieza");
  const series = buildSeries();
  const [classifs, setClassifs] = useState<Record<number,{evento:string,tipo:string}>>({});

  return (
    <div>
      <PageHeader title="Limpieza de outliers" subtitle="Detección estadística (Z-score) y clasificación de eventos" />
      {!editable && <div className="mb-4"><LockedNotice feature="la limpieza de datos" /></div>}

      <Card title="Antes / después de limpieza" className="mb-6">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="original" name="Original (con outliers)" stroke="#dc2626" strokeWidth={2} />
            <Line dataKey="limpio" name="Limpio" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-muted-foreground mt-2">El Z-score mide cuántas desviaciones estándar se aleja un punto del promedio. |Z| {">"} 2.5 se considera outlier.</div>
      </Card>

      <Card title="Outliers detectados">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr>{["Fecha","Producto","Valor","Esperado","Z-score","Tipo evento","Clasificación","Acción"].map(h=><th key={h} className="py-2 px-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {MOCK_OUTLIERS.map((o, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-2">{o.fecha}</td>
                  <td className="py-2 px-2 font-medium">{o.producto}</td>
                  <td className="py-2 px-2">{o.valor}</td>
                  <td className="py-2 px-2 text-muted-foreground">{o.esperado}</td>
                  <td className="py-2 px-2"><Badge tone={Math.abs(o.zscore)>3?"bad":"warn"}>{o.zscore.toFixed(1)}</Badge></td>
                  <td className="py-2 px-2">
                    <select disabled={!editable} defaultValue={o.evento} onChange={e=>setClassifs(c=>({...c,[i]:{...c[i],evento:e.target.value}}))} className="h-7 text-xs border rounded px-1 disabled:opacity-50">
                      {EVENTOS.map(ev=><option key={ev}>{ev}</option>)}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <select disabled={!editable} defaultValue={o.tipo} onChange={e=>setClassifs(c=>({...c,[i]:{...c[i],tipo:e.target.value}}))} className="h-7 text-xs border rounded px-1 disabled:opacity-50">
                      <option value="estructural">Estructural</option>
                      <option value="coyuntural">Coyuntural</option>
                    </select>
                  </td>
                  <td className="py-2 px-2"><button disabled={!editable} className="text-xs text-nestle-red font-medium disabled:opacity-50">Limpiar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
