import Link from "next/link";

const CARDS = [
  { vertical: "hair", emoji: "💆", label: "Hair Care", desc: "Evaluación y tratamiento capilar" },
  { vertical: "skin", emoji: "✨", label: "Skin Care", desc: "Evaluación dermatológica" },
  { vertical: "dental", emoji: "🦷", label: "Dental Care", desc: "Evaluación dental" },
];

export function VerticalSelector() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">¿Qué tipo de consulta necesitas?</p>
      <div className="grid gap-3">
        {CARDS.map(({ vertical, emoji, label, desc }) => (
          <Link
            key={vertical}
            href={`/agendar-consulta?vertical=${vertical}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-white px-5 py-4 hover:border-foreground/30 hover:shadow-sm transition-all"
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <span className="ml-auto text-muted-foreground text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
