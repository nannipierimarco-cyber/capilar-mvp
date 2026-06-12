"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DENTALINK_AGENDA_URL =
  "https://9e93d9de54e8b651346cd4aae17ad9f6b1221485.agenda.softwaredentalink.com/agendas/agendaExpress/1";

const CLINIC = {
  address: "Pérez Valenzuela 1661, Providencia",
  metro: "Cercano a Metro Pedro de Valdivia",
  hours: [
    { days: "Lunes a Viernes", time: "09:00 – 18:30 hrs" },
    { days: "Sábado", time: "10:00 – 13:00 hrs" },
  ],
  mapsEmbed:
    "https://maps.google.com/maps?q=P%C3%A9rez+Valenzuela+1661%2C+Providencia%2C+Chile&output=embed&z=16",
  mapsLink:
    "https://www.google.com/maps/search/Pérez+Valenzuela+1661+Providencia+Chile",
};

const DOCTORS = [
  { name: "Dr. Ivo Fodich", specialty: "Implantólogo", initials: "IF", photo: "/dr-ivo-fodich.png" },
  { name: "Dr. Patricio Lobos", specialty: "Rehabilitador Oral", initials: "PL", photo: "/dr-patricio-lobos.png" },
];

function AgendaButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={DENTALINK_AGENDA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center w-full py-4 rounded-xl bg-[#0EA5E9] text-white font-semibold text-base shadow-md hover:bg-[#0284C7] active:scale-[0.98] transition-all ${className}`}
    >
      Agendar evaluación presencial gratis
    </a>
  );
}

function DoctorCard({ doctor }: { doctor: (typeof DOCTORS)[0] }) {
  const [imgOk, setImgOk] = useState(true);

  if (!imgOk) {
    return (
      <div className="min-w-0 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] flex flex-col items-center justify-center aspect-[3/4] gap-2 p-4">
        <span className="text-4xl font-bold text-[#0284C7] select-none">{doctor.initials}</span>
        <p className="text-xs font-semibold text-gray-700 text-center">{doctor.name}</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={doctor.photo}
        alt={doctor.name}
        className="w-full h-auto rounded-2xl block"
        onError={() => setImgOk(false)}
      />
    </div>
  );
}

export default function DentalAgendarPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">

      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
        <button
          onClick={() => router.back()}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-4">

        {/* Hero vendedor */}
        <div className="text-center px-1 pt-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0EA5E9] mb-2">
            Perfecto Dental · Providencia
          </p>
          <h1 className="text-2xl sm:text-[1.65rem] font-bold text-gray-900 leading-tight">
            La mejor solución dental con calidad y precio transparente
          </h1>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            Evaluación presencial gratis con especialistas de alto nivel.
          </p>
        </div>

        {/* Ubicación compacta */}
        <div className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] rounded-2xl px-4 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
            Dónde atendemos
          </p>
          <p className="text-base sm:text-lg font-bold text-white leading-tight">{CLINIC.address}</p>
          <p className="text-sm text-white/80 mt-0.5">{CLINIC.metro}</p>
        </div>

        {/* CTA principal — visible sin scroll */}
        <AgendaButton />

        {/* Especialistas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Especialistas que revisarán tu caso
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {DOCTORS.map((doc) => (
              <DoctorCard key={doc.name} doctor={doc} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-3 leading-relaxed">
            El profesional asignado dependerá de disponibilidad y especialidad requerida.
          </p>
        </div>

        {/* Mapa */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-sm font-semibold text-gray-900">Ubicación</p>
          </div>
          <div className="w-full" style={{ height: 200 }}>
            <iframe
              src={CLINIC.mapsEmbed}
              width="100%"
              height="200"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación clínica dental"
            />
          </div>
          <div className="px-5 py-3">
            <a
              href={CLINIC.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              📍 Abrir en Google Maps
            </a>
          </div>
        </div>

        {/* Horario */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Horario de atención
          </p>
          {CLINIC.hours.map((h) => (
            <div
              key={h.days}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-700">{h.days}</span>
              <span className="text-sm font-semibold text-gray-900">{h.time}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center px-2 pb-2 leading-relaxed">
          La evaluación presencial es gratuita y sirve para revisar tu caso y confirmar el presupuesto
          final. Los rangos del reporte pueden variar según diagnóstico clínico, radiografías y materiales.
        </p>

      </div>

      {/* CTA fijo en móvil */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-20 sm:hidden">
        <AgendaButton />
      </div>

    </div>
  );
}
