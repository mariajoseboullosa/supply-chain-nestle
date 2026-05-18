import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card, Badge, LockedNotice } from "@/components/ui-bits";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { useState } from "react";
import { UploadCloud, Download, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app/datos")({ component: Datos });

const STEPS = ["Cargar archivo","Mapear columnas","Validar datos","Generar demanda base"];

function Datos() {
  const { canEdit } = useAuth();
  const editable = canEdit("datos");
  const [step, setStep] = useState(0);
  const [filtro, setFiltro] = useState({ estado: "todos", canal: "todos", producto: "todos" });
  const [drag, setDrag] = useState(false);

  const filtered = MOCK_ORDERS.filter(o =>
    (filtro.estado === "todos" || o.estado === filtro.estado) &&
    (filtro.canal === "todos" || o.tipo_canal === filtro.canal) &&
    (filtro.producto === "todos" || o.producto_codigo === filtro.producto)
  );

  return (
    <div>
      <PageHeader title="Datos" subtitle="Carga, validación y generación de demanda base" actions={
        <>
          <button onClick={() => toast.success("Plantilla descargada (demo)")} className="h-9 px-3 rounded-md border text-sm flex items-center gap-2"><Download className="size-4" />Plantilla Excel</button>
          <button disabled={!editable} onClick={() => { setStep(3); toast.success("Datos demo cargados"); }} className="h-9 px-3 rounded-md bg-nestle-blue text-white text-sm flex items-center gap-2 disabled:opacity-50"><Database className="size-4" />Cargar datos demo</button>
        </>
      } />

      {!editable && <div className="mb-4"><LockedNotice feature="la carga de datos" /></div>}

      <Card className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s,i)=>(
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`size-7 rounded-full grid place-items-center text-xs font-semibold ${i<=step?"bg-nestle-red text-white":"bg-muted text-muted-foreground"}`}>
                {i<step ? <CheckCircle2 className="size-4" /> : i+1}
              </div>
              <span className={`text-sm ${i<=step?"font-medium":"text-muted-foreground"}`}>{s}</span>
              {i<STEPS.length-1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Subir archivo (Excel/CSV)" className="mb-6">
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); if(editable){ setStep(1); toast.success("Archivo recibido (demo)"); } }}
          className={`rounded-lg border-2 border-dashed p-10 text-center transition-colors ${drag?"border-nestle-red bg-nestle-red/5":"border-border"}`}
        >
          <UploadCloud className="size-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">Arrastrá tu archivo aquí</div>
          <div className="text-sm text-muted-foreground">o</div>
          <button disabled={!editable} className="mt-2 h-9 px-4 rounded-md bg-nestle-red text-white text-sm disabled:opacity-50">Seleccionar archivo</button>
          <div className="text-xs text-muted-foreground mt-3">Columnas requeridas: fecha_emision, tipo_canal, nombre_canal, locacion, producto_nombre, producto_codigo, cantidad, fecha_entrega, estado</div>
        </div>
      </Card>

      <Card title="Pedidos" actions={
        <div className="flex gap-2 flex-wrap">
          <select value={filtro.estado} onChange={e=>setFiltro(f=>({...f,estado:e.target.value}))} className="h-8 px-2 rounded border text-sm">
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
            <option value="postergado">Postergado</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button onClick={()=>toast.success(`${filtered.length} filas exportadas`)} className="h-8 px-3 rounded border text-sm flex items-center gap-1.5"><Download className="size-3.5" />Exportar</button>
          <button disabled={!editable} onClick={()=>{setStep(3); toast.success("Demanda base generada");}} className="h-8 px-3 rounded bg-nestle-green text-white text-sm disabled:opacity-50">Generar demanda base</button>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground border-b">
              <tr>{["OC","Fecha emisión","Canal","Cliente","Locación","Producto","Cantidad","Entrega","Estado"].map(h=><th key={h} className="py-2 px-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0,15).map(o=>(
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 px-2 font-mono text-xs">{o.id}</td>
                  <td className="py-2 px-2">{o.fecha_emision}</td>
                  <td className="py-2 px-2">{o.tipo_canal}</td>
                  <td className="py-2 px-2">{o.nombre_canal}</td>
                  <td className="py-2 px-2">{o.locacion}</td>
                  <td className="py-2 px-2">{o.producto_nombre}</td>
                  <td className="py-2 px-2">{o.cantidad}</td>
                  <td className="py-2 px-2">{o.fecha_entrega}</td>
                  <td className="py-2 px-2">
                    <Badge tone={o.estado==="entregado"?"good":o.estado==="cancelado"?"bad":o.estado==="postergado"?"warn":"info"}>{o.estado}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-2">Mostrando 15 de {filtered.length} pedidos</div>
        </div>
      </Card>
    </div>
  );
}
