import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, KPI, Badge } from "@/components/ui-bits";
import { PRODUCTS } from "@/lib/mock-data";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { useState } from "react";

export const Route = createFileRoute("/app/finanzas")({ component: Finanzas });

const margenes = PRODUCTS.map((p,i)=>({ sku: p.name.split(" ")[0], margen: 22 + (i*3) - (i%2?5:0), target: 25 }));
const dolar = Array.from({length:12},(_,i)=>({ mes:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i], valor: 950 + i*42 + (Math.sin(i)*30) }));
const materia = Array.from({length:12},(_,i)=>({ mes:["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][i], cafe: 100+i*4, cacao: 100+i*5.5, leche: 100+i*3 }));

function Finanzas() {
  const [esc, setEsc] = useState<"optimista"|"base"|"pesimista">("base");
  const mult = esc==="optimista"?1.12:esc==="pesimista"?0.88:1;

  return (
    <div>
      <PageHeader title="Finanzas" subtitle="Dashboard financiero, escenarios y simulación" />

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <KPI label="Impacto forecast" value={`$${(1842*mult).toFixed(0)}M`} tone={esc==="pesimista"?"bad":"good"} />
        <KPI label="Margen promedio" value="24.6%" hint="Target 25%" tone="warn" />
        <KPI label="Rentabilidad" value="18.2%" tone="good" />
        <KPI label="Costo MP YTD" value="+12.4%" hint="vs 2024" tone="bad" />
      </div>

      <Card title="Escenarios" className="mb-6">
        <div className="flex gap-2">
          {(["optimista","base","pesimista"] as const).map(e=>(
            <button key={e} onClick={()=>setEsc(e)} className={`px-4 py-2 rounded-md text-sm capitalize ${esc===e?"bg-nestle-red text-white":"border"}`}>{e}</button>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div><div className="text-xs text-muted-foreground">Inflación mensual</div><input type="range" min="1" max="15" defaultValue="6" className="w-full"/><div className="text-sm font-medium">6%</div></div>
          <div><div className="text-xs text-muted-foreground">Ajuste precio</div><input type="range" min="-5" max="20" defaultValue="8" className="w-full"/><div className="text-sm font-medium">+8%</div></div>
          <div><div className="text-xs text-muted-foreground">Elasticidad consumo</div><input type="range" min="-30" max="10" defaultValue="-5" className="w-full"/><div className="text-sm font-medium">-5%</div></div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Margen por SKU">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={margenes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sku" tick={{fontSize:11}}/>
              <YAxis unit="%" />
              <Tooltip />
              <Bar dataKey="margen" fill="#dc2626" radius={[4,4,0,0]} />
              <Bar dataKey="target" fill="#16a34a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Evolución del dólar oficial">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dolar}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line dataKey="valor" stroke="#1f6fbf" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Costo materias primas (índice base 100)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={materia}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line dataKey="cafe" name="Café" stroke="#8b4513" strokeWidth={2}/>
            <Line dataKey="cacao" name="Cacao" stroke="#dc2626" strokeWidth={2}/>
            <Line dataKey="leche" name="Leche" stroke="#1f6fbf" strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 text-sm flex items-center gap-2">
          <Badge tone="bad">Alerta margen bajo</Badge>
          <span className="text-muted-foreground">Kit Kat 40g por debajo del target del 25%.</span>
        </div>
      </Card>
    </div>
  );
}
