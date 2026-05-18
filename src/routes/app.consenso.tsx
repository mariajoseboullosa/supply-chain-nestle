import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, KPI, LockedNotice } from "@/components/ui-bits";
import { useProduct } from "@/lib/product-context";
import { getWeeklyForecast } from "@/lib/mock-data";
import { Check, X, Send, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/consenso")({ component: Consenso });

const VERSIONES = [
  { v: "v3.2", fecha: "2025-05-28 14:20", autor: "Juan García", nota: "Ajuste post insight Hot Sale" },
  { v: "v3.1", fecha: "2025-05-27 10:05", autor: "Juan García", nota: "Baseline regenerado" },
  { v: "v3.0", fecha: "2025-05-26 17:30", autor: "Sistema", nota: "Publicación mensual" },
];

const AUDIT = [
  { hora: "14:32", user: "Laura Pérez", acc: "Insight Hot Sale Kit Kat aprobado" },
  { hora: "14:18", user: "Diego Ruiz", acc: "Insight stock cliente Nescafé Gold (pendiente)" },
  { hora: "13:50", user: "Juan García", acc: "Baseline regenerado con modelo SARIMA" },
  { hora: "11:02", user: "Carla Mora", acc: "Insight ajuste precio Milo +8%" },
];

function Consenso() {
  const { product } = useProduct();
  const { canEdit } = useAuth();
  const editable = canEdit("consenso");
  const w = getWeeklyForecast(product.code);
  const baseline = w.reduce((a,b)=>a+b.baseDem, 0);
  const ajusteMkt = Math.round(baseline * 0.04);
  const ajusteVtas = Math.round(baseline * 0.02);
  const ajusteFin = Math.round(baseline * -0.015);
  const consenso = baseline + ajusteMkt + ajusteVtas + ajusteFin;

  return (
    <div>
      <PageHeader title="Consenso S&OP" subtitle={`Versión activa: v3.2 · ${product.name}`} actions={
        <button disabled={!editable} onClick={()=>toast.success("Forecast publicado a ERP/SAP")} className="h-9 px-3 rounded-md bg-nestle-green text-white text-sm flex items-center gap-2 disabled:opacity-50"><Send className="size-4"/>Publish Forecast</button>
      } />
      {!editable && <div className="mb-4"><LockedNotice feature="consenso" /></div>}

      <Card title="Fórmula del consenso" className="mb-6">
        <div className="rounded-md bg-muted p-4 font-mono text-sm text-center">
          Forecast final = baseline + Δ marketing + Δ ventas + Δ finanzas
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <KPI label="Baseline" value={baseline.toLocaleString()} />
          <KPI label="Δ Marketing" value={`+${ajusteMkt}`} tone="good" />
          <KPI label="Δ Ventas" value={`+${ajusteVtas}`} tone="good" />
          <KPI label="Δ Finanzas" value={`${ajusteFin}`} tone="warn" />
          <KPI label="Consenso final" value={consenso.toLocaleString()} tone="good" />
        </div>
      </Card>

      <Card title="Ajustes pendientes de aprobación" className="mb-6">
        <div className="space-y-2">
          {[
            { area: "Marketing", desc: "Hot Sale Kit Kat e-commerce", delta: "+22%" },
            { area: "Ventas", desc: "Traba comercial Nescafé Gold Coto", delta: "-1.200u" },
            { area: "Finanzas", desc: "Ajuste precio Milo +8% (inflación)", delta: "-3%" },
          ].map((a,i)=>(
            <div key={i} className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3">
                <Badge tone={a.area==="Marketing"?"info":a.area==="Ventas"?"good":"warn"}>{a.area}</Badge>
                <div>
                  <div className="text-sm font-medium">{a.desc}</div>
                  <div className="text-xs text-muted-foreground">Impacto: {a.delta}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={!editable} onClick={()=>toast.success("Aprobado")} className="h-8 px-3 rounded bg-success text-white text-xs flex items-center gap-1 disabled:opacity-50"><Check className="size-3.5"/>Aprobar</button>
                <button disabled={!editable} onClick={()=>toast.error("Rechazado")} className="h-8 px-3 rounded bg-destructive text-white text-xs flex items-center gap-1 disabled:opacity-50"><X className="size-3.5"/>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Versiones del forecast">
          <div className="space-y-2">
            {VERSIONES.map(v=>(
              <div key={v.v} className="flex items-start justify-between p-2 rounded border">
                <div>
                  <div className="font-medium text-sm flex items-center gap-2">{v.v} {v.v==="v3.2" && <Badge tone="good">Activa</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{v.nota}</div>
                  <div className="text-xs text-muted-foreground">{v.autor} · {v.fecha}</div>
                </div>
                <button className="text-xs text-nestle-red font-medium">Ver</button>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Audit log" actions={<History className="size-4 text-muted-foreground"/>}>
          <div className="space-y-2">
            {AUDIT.map((a,i)=>(
              <div key={i} className="text-sm border-l-2 border-nestle-red pl-3">
                <div className="text-xs text-muted-foreground">{a.hora} · {a.user}</div>
                <div>{a.acc}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
