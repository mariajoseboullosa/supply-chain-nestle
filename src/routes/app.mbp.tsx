import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge } from "@/components/ui-bits";
import { MBP_TASKS } from "@/lib/mock-data";
import { Calendar, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/mbp")({ component: MBP });

const REUNIONES = [
  { fecha: "Lun 02/06 10:00", titulo: "Limpieza & baseline", asistentes: "Demand Planner, Data" },
  { fecha: "Mié 11/06 14:00", titulo: "Inputs Marketing & Ventas", asistentes: "Mkt, Ventas, DP" },
  { fecha: "Mié 18/06 11:00", titulo: "Pre-consenso", asistentes: "DP, Mkt, Ventas, Fin" },
  { fecha: "Vie 27/06 09:00", titulo: "Consenso S&OP ejecutivo", asistentes: "Dirección, DP" },
];

function MBP() {
  const [tasks, setTasks] = useState(MBP_TASKS);
  const toggle = (s: number, ti: number) => setTasks(t => t.map(x => x.semana===s ? {...x, tareas: x.tareas.map((tt,i)=>i===ti?{...tt,done:!tt.done}:tt)} : x));

  return (
    <div>
      <PageHeader title="Monthly Business Planning" subtitle="Calendario MBP · Junio 2025" />

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {tasks.map(s => (
          <Card key={s.semana} title={`Semana ${s.semana} · ${s.titulo}`}>
            <ul className="space-y-2">
              {s.tareas.map((t,i)=>(
                <li key={i} className="flex items-start gap-2">
                  <button onClick={()=>toggle(s.semana,i)}>{t.done ? <CheckCircle2 className="size-5 text-success"/> : <Circle className="size-5 text-muted-foreground"/>}</button>
                  <div className="flex-1">
                    <div className={`text-sm ${t.done?"line-through text-muted-foreground":""}`}>{t.t}</div>
                    <Badge tone="info">{t.resp}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        <Card title="Semana 4 · Publicación">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><Circle className="size-5 text-muted-foreground"/><div>Publicar forecast a ERP/SAP <div><Badge tone="info">Demand Planner</Badge></div></div></li>
            <li className="flex items-start gap-2"><Circle className="size-5 text-muted-foreground"/><div>Revisión ejecutiva y cierre <div><Badge tone="info">Dirección</Badge></div></div></li>
          </ul>
        </Card>
      </div>

      <Card title="Calendario de reuniones">
        <div className="space-y-2">
          {REUNIONES.map((r,i)=>(
            <div key={i} className="flex items-center gap-3 p-3 rounded-md border">
              <div className="size-10 rounded-md bg-nestle-blue text-white grid place-items-center"><Calendar className="size-5"/></div>
              <div className="flex-1">
                <div className="font-medium text-sm">{r.titulo}</div>
                <div className="text-xs text-muted-foreground">{r.fecha} · {r.asistentes}</div>
              </div>
              <button className="text-xs text-nestle-red font-medium">Unirse</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
