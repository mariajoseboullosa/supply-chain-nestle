import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Card } from "@/components/ui-bits";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

export const Route = createFileRoute("/app/ai")({ component: AI });

interface Msg { role: "user"|"assistant"; content: string }

const SUGERENCIAS = [
  "¿Qué SKU tiene más riesgo?",
  "¿Por qué subió el forecast?",
  "¿Qué alertas requieren acción?",
  "¿Qué modelo conviene usar?",
];

function respond(q: string): string {
  const lower = q.toLowerCase();
  if (lower.includes("riesgo") || lower.includes("sku")) {
    return "**Nescafé Gold 200g** en Supermercados presenta el mayor riesgo: Bias negativo de -4.2% y cobertura proyectada de 4 días. Recomendación: acelerar reposición desde CD Pilar, revisar stock cliente Coto e incorporar el insight comercial pendiente de Ventas.";
  }
  if (lower.includes("forecast") && (lower.includes("subió") || lower.includes("subio") || lower.includes("aumentó"))) {
    return "El consenso M+1 subió 5.5% vs baseline por:\n• Insight Hot Sale Kit Kat (+22% e-commerce)\n• Vuelta a clases Nesquik 800g (+15% supermercados)\n• Parcialmente compensado por traba comercial Nescafé Gold (-1.200u).";
  }
  if (lower.includes("alerta")) {
    return "Hay **2 alertas de severidad alta** que requieren acción inmediata:\n1. Stockout proyectado Nescafé Gold 200g (4 días cobertura)\n2. DPA bajo umbral en Nesquik 800g (78%)\n\nRecomiendo priorizarlas antes del consenso del miércoles.";
  }
  if (lower.includes("modelo")) {
    return "Para este producto, **SARIMA** es el mejor modelo: MAPE 7.8% y Bias 0.1%. Captura bien la estacionalidad mensual y la tendencia. Holt-Winters es la segunda mejor opción (MAPE 8.6%) si necesitás más interpretabilidad.";
  }
  return "Puedo ayudarte con análisis de forecast, riesgos, alertas y recomendaciones de modelos. Probá una de las sugerencias o preguntá libremente.";
}

function AI() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hola, soy el asistente IA de Demand Planning. Tengo contexto de tus forecasts, alertas y consenso activo. ¿En qué te ayudo?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { role:"user", content:text }]);
    setInput("");
    setTimeout(()=> setMsgs(m => [...m, { role:"assistant", content: respond(text) }]), 400);
  };

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Análisis y recomendaciones automáticas" />

      <div className="grid lg:grid-cols-4 gap-4">
        <Card title="Sugerencias" className="lg:col-span-1">
          <div className="space-y-2">
            {SUGERENCIAS.map(s=>(
              <button key={s} onClick={()=>send(s)} className="w-full text-left text-sm p-2 rounded border hover:bg-accent">{s}</button>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-md bg-nestle-red/5 border border-nestle-red/20 text-xs">
            💡 <strong>Recomendación proactiva:</strong> Nescafé Gold 200g en supermercados presenta Bias negativo y riesgo de stockout. Revisar stock cliente, forecast base e inputs comerciales.
          </div>
        </Card>

        <Card className="lg:col-span-3 p-0" >
          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgs.map((m,i)=>(
                <div key={i} className={`flex gap-2 ${m.role==="user"?"flex-row-reverse":""}`}>
                  <div className={`size-8 rounded-md grid place-items-center shrink-0 ${m.role==="user"?"bg-nestle-blue text-white":"bg-nestle-red text-white"}`}>
                    {m.role==="user" ? <User className="size-4"/> : <Bot className="size-4"/>}
                  </div>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line ${m.role==="user"?"bg-nestle-blue text-white":"bg-muted"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={endRef}/>
            </div>
            <form onSubmit={e=>{e.preventDefault(); send(input);}} className="border-t p-3 flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Preguntá al asistente…" className="flex-1 h-10 px-3 rounded-md border"/>
              <button className="h-10 px-4 rounded-md bg-nestle-red text-white flex items-center gap-2"><Send className="size-4"/>Enviar</button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
