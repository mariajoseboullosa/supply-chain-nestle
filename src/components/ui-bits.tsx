import { type ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function KPI({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default"|"good"|"warn"|"bad" }) {
  const toneCls = {
    default: "text-foreground",
    good: "text-success",
    warn: "text-warning",
    bad: "text-destructive",
  }[tone];
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

export function Card({ title, children, actions, className = "" }: { title?: string; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b">
          {title && <h3 className="font-medium text-sm">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default"|"good"|"warn"|"bad"|"info" }) {
  const t = {
    default: "bg-muted text-muted-foreground",
    good: "bg-success/15 text-success",
    warn: "bg-warning/20 text-yellow-800",
    bad: "bg-destructive/15 text-destructive",
    info: "bg-info/15 text-info",
  }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t}`}>{children}</span>;
}

export function Semaforo({ estado }: { estado: string }) {
  const map: Record<string, "good"|"warn"|"bad"> = { OK: "good", Revisar: "warn", "Atención": "bad", Aprobado: "good", Pendiente: "warn", "En revisión": "info" as any };
  const t = (map[estado] ?? "default") as any;
  return <Badge tone={t}>{estado}</Badge>;
}

export function LockedNotice({ feature }: { feature: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground flex items-center gap-2">
      <span className="size-5 rounded grid place-items-center bg-background border">🔒</span>
      Tu rol no tiene permisos para editar {feature}. Vista de solo lectura.
    </div>
  );
}
