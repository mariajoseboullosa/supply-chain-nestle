import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, LockedNotice } from "@/components/ui-bits";
import { MOCK_ALERTS } from "@/lib/mock-data";
import { useState } from "react";
import { AlertTriangle, Plus, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/control-tower")({ component: ControlTower });

const REGLAS = [
  { regla: "Desvío consenso vs baseline > 20%", severidad: "alta", activa: true },
  { regla: "DPA por debajo de 85%", severidad: "alta", activa: true },
  { regla: "Bias fuera de rango ±5%", severidad: "media", activa: true },
  { regla: "Stockout proyectado < 5 días cobertura", severidad: "alta", activa: true },
  { regla: "Tracking signal fuera de ±4", severidad: "media", activa: true },
  { regla: "Margen por debajo de target (-10%)", severidad: "media", activa: true },
  { regla: "SKU crítico sin insight cargado", severidad: "baja", activa: true },
];

function ControlTower() {
  const { canEdit } = useAuth();
  const editable = canEdit("control-tower");
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <PageHeader title="Control Tower" subtitle="Alertas en tiempo real y reglas de monitoreo" actions={
        editable && <button onClick={()=>setShowForm(true)} className="h-9 px-3 rounded-md bg-nestle-red text-white text-sm flex items-center gap-2"><Plus className="size-4"/>Nueva regla</button>
      } />
      {!editable && <div className="mb-4"><LockedNotice feature="control tower" /></div>}

      <Card title={`Alertas activas (${MOCK_ALERTS.length})`} className="mb-6">
        <div className="space-y-2">
          {MOCK_ALERTS.map(a => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border">
              <div className={`mt-0.5 size-9 rounded-md grid place-items-center ${
                a.severidad==="alta"?"bg-destructive/10 text-destructive":a.severidad==="media"?"bg-warning/20 text-yellow-700":"bg-info/10 text-info"
              }`}><AlertTriangle className="size-5"/></div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{a.tipo}</span>
                  <Badge tone={a.severidad==="alta"?"bad":a.severidad==="media"?"warn":"info"}>{a.severidad}</Badge>
                  <span className="text-xs text-muted-foreground">{a.sku} · {a.canal}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">💡 {a.recomendacion}</div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Bell className="size-3"/>Responsable: {a.responsable}</div>
              </div>
              <button onClick={()=>toast.success("Notificación enviada")} className="text-xs text-nestle-red font-medium">Notificar</button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Reglas configuradas">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b">
            <tr><th className="py-2 px-2 font-medium">Regla</th><th className="py-2 px-2 font-medium">Severidad</th><th className="py-2 px-2 font-medium">Estado</th></tr>
          </thead>
          <tbody>
            {REGLAS.map((r,i)=>(
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 px-2">{r.regla}</td>
                <td className="py-2 px-2"><Badge tone={r.severidad==="alta"?"bad":r.severidad==="media"?"warn":"info"}>{r.severidad}</Badge></td>
                <td className="py-2 px-2"><Badge tone="good">Activa</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setShowForm(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Nueva regla de alerta</h3>
            <form onSubmit={e=>{e.preventDefault(); toast.success("Regla creada"); setShowForm(false);}} className="space-y-3 text-sm">
              <label className="block">Nombre<input className="mt-1 w-full h-9 px-2 rounded border" required/></label>
              <label className="block">Condición<input placeholder="ej: MAPE > 15%" className="mt-1 w-full h-9 px-2 rounded border" required/></label>
              <label className="block">Severidad<select className="mt-1 w-full h-9 px-2 rounded border"><option>alta</option><option>media</option><option>baja</option></select></label>
              <label className="block">Responsable<select className="mt-1 w-full h-9 px-2 rounded border"><option>Demand Planner</option><option>Marketing</option><option>Ventas</option><option>Finanzas</option></select></label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="h-9 px-3 rounded border">Cancelar</button>
                <button className="h-9 px-3 rounded bg-nestle-red text-white">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
