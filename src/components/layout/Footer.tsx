export default function Footer() {
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
