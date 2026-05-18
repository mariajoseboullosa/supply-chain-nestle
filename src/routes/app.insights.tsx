import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, LockedNotice } from "@/components/ui-bits";
import { MOCK_INSIGHTS, PRODUCTS, CHANNELS } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/insights")({ component: Insights });

const TIPOS_POR_AREA: Record<string,string[]> = {
  Marketing: ["Campaña","Share","Sell-out","Comportamiento consumidor","Hot Sale","Cyber Week","Día de la madre","Vuelta a clases"],
  Ventas: ["Stock cliente","Sell-in","Traba comercial","Deuda","Pedido postergado","Competencia"],
  Finanzas: ["Margen","Costo materia prima","Dólar","Inflación","Rentabilidad","Precio"],
};

function Insights() {
  const { user, canEdit } = useAuth();
  const editable = canEdit("insights");
  const [tab, setTab] = useState<"todos"|"Marketing"|"Ventas"|"Finanzas">("todos");
  const [items, setItems] = useState(MOCK_INSIGHTS);
  const [showForm, setShowForm] = useState(false);

  const areaUsuario = user?.role === "marketing" ? "Marketing" : user?.role === "ventas" ? "Ventas" : user?.role === "finanzas" ? "Finanzas" : "Marketing";
  const filtered = tab === "todos" ? items : items.filter(i => i.area === tab);

  const addInsight = (data: any) => {
    setItems(p => [{ id: p.length+1, area: areaUsuario, responsable: user?.name ?? "", estado: "Pendiente", ...data }, ...p]);
    setShowForm(false);
    toast.success("Insight cargado");
  };

  return (
    <div>
      <PageHeader title="Insights colaborativos" subtitle="Inputs de Marketing, Ventas y Finanzas que ajustan el forecast" actions={
        editable && <button onClick={()=>setShowForm(true)} className="h-9 px-3 rounded-md bg-nestle-red text-white text-sm flex items-center gap-2"><Plus className="size-4"/>Cargar insight</button>
      } />
      {!editable && <div className="mb-4"><LockedNotice feature="insights" /></div>}

      <div className="flex gap-1 mb-4 border-b">
        {(["todos","Marketing","Ventas","Finanzas"] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab===t?"border-nestle-red text-nestle-red":"border-transparent text-muted-foreground hover:text-foreground"}`}>{t==="todos"?"Todos":t}</button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {filtered.map(it => {
          const positivo = it.impacto.startsWith("+");
          return (
            <div key={it.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone={it.area==="Marketing"?"info":it.area==="Ventas"?"good":"warn"}>{it.area}</Badge>
                  <div className="font-medium text-sm mt-2">{it.sku}</div>
                  <div className="text-xs text-muted-foreground">{it.canal} · {it.inicio} → {it.fin}</div>
                </div>
                <div className={`flex items-center gap-1 font-semibold ${positivo?"text-success":"text-destructive"}`}>
                  {positivo ? <TrendingUp className="size-4"/> : <TrendingDown className="size-4"/>}
                  {it.impacto}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{it.justificacion}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs">{it.tipo}</span>
                <Badge tone={it.estado==="Aprobado"?"good":it.estado==="Pendiente"?"warn":"info"}>{it.estado}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">por {it.responsable}</div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4 z-50" onClick={()=>setShowForm(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-card rounded-lg p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-4">Nuevo insight — {areaUsuario}</h3>
            <form onSubmit={(e)=>{
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              addInsight(Object.fromEntries(f) as any);
            }} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <label>SKU<select name="sku" className="mt-1 w-full h-9 px-2 rounded border">{PRODUCTS.map(p=><option key={p.code}>{p.name}</option>)}</select></label>
                <label>Canal<select name="canal" className="mt-1 w-full h-9 px-2 rounded border"><option>Todos</option>{CHANNELS.map(c=><option key={c.key}>{c.name}</option>)}</select></label>
                <label>Fecha inicio<input name="inicio" type="date" className="mt-1 w-full h-9 px-2 rounded border" required/></label>
                <label>Fecha fin<input name="fin" type="date" className="mt-1 w-full h-9 px-2 rounded border" required/></label>
                <label>Impacto<input name="impacto" placeholder="+15% o +1200u" className="mt-1 w-full h-9 px-2 rounded border" required/></label>
                <label>Tipo<select name="tipo" className="mt-1 w-full h-9 px-2 rounded border">{TIPOS_POR_AREA[areaUsuario].map(t=><option key={t}>{t}</option>)}</select></label>
              </div>
              <label className="block">Justificación<textarea name="justificacion" className="mt-1 w-full px-2 py-1 rounded border" rows={3} required/></label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="h-9 px-3 rounded border">Cancelar</button>
                <button className="h-9 px-3 rounded bg-nestle-red text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
