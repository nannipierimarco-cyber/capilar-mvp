import {
  ShieldCheck,
  Globe,
  Tag,
  Package,
  Truck,
  Activity,
  FileText,
  Camera,
} from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Médicos habilitados" },
  { icon: Globe,       label: "100% online" },
  { icon: Tag,         label: "Precio claro" },
  { icon: Package,     label: "Producto Farmacia Autorizada" },
  { icon: Truck,       label: "Despacho a domicilio" },
  { icon: Activity,    label: "Seguimiento capilar" },
  { icon: FileText,    label: "Historial capilar" },
  { icon: Camera,      label: "Fotos de evolución" },
];

export function ValuePropMarquee() {
  return (
    <div
      className="relative overflow-hidden border-y border-border bg-white"
      style={{ height: "56px" }}
      aria-hidden="true"
    >
      <div className="animate-marquee flex h-full items-center">
        {[...items, ...items].map((item, i) => {
          const Icon = item.icon;
          return (
            <span
              key={i}
              className="flex shrink-0 items-center gap-2 px-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/50 whitespace-nowrap"
            >
              <Icon className="size-3.5 shrink-0 text-primary/70" aria-hidden />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
