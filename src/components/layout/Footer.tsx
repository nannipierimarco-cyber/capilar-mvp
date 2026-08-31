"use client";

import { usePathname } from "next/navigation";
import { isDentalPath } from "@/lib/dentalRoutes";

export default function Footer() {
  const pathname = usePathname();

  if (isDentalPath(pathname)) {
    return (
      <footer className="mt-auto border-t border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <p className="font-semibold text-[#0C4A6E] text-lg">Perfecto Labs — Dental</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Comparación de cotizaciones dentales. Gratis y sin compromiso.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Privacidad</p>
              <p className="max-w-sm">
                Usamos tus datos únicamente para gestionar tu solicitud y buscar una alternativa dental.
              </p>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Perfecto Labs. Chile. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-border bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-semibold text-primary text-lg">Capilar</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Evaluación capilar online. Tratamiento coordinado con médico y farmacia autorizada.
            </p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Aviso importante</p>
            <p className="max-w-sm">
              Los medicamentos son prescritos solo si corresponde y dispensados por farmacia autorizada.
              Esta plataforma no reemplaza la consulta médica presencial.
            </p>
          </div>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Capilar. Chile. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
