"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const CALENDLY_URL = process.env.NEXT_PUBLIC_DENTAL_CALENDLY_URL ?? "";

const CLINIC = {
  address: "Pérez Valenzuela 1661, Providencia",
  metro: "Cercano a Metro Pedro de Valdivia",
  hours: [
    { days: "Lunes a Viernes", time: "09:00 – 18:30 hrs" },
    { days: "Sábado", time: "10:00 – 13:00 hrs" },
  ],
  phone: "+56 9 5804 3937",
  mapsEmbed:
    "https://maps.google.com/maps?q=P%C3%A9rez+Valenzuela+1661%2C+Providencia%2C+Chile&output=embed&z=16",
  mapsLink:
    "https://www.google.com/maps/search/Pérez+Valenzuela+1661+Providencia+Chile",
};

const DOCTORS: { name: string; specialty: string; initials: string; photo: string }[] = [
  { name: "Dr. Ivo Fodich", specialty: "Implantólogo", initials: "IF", photo: "/dr-ivo-fodich.jpg" },
  { name: "Dr. Patricio Lobos", specialty: "Rehabilitador Oral", initials: "PL", photo: "/dr-patricio-lobos.jpg" },
];

function DoctorCard({ doctor }: { doctor: typeof DOCTORS[0] }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="relative w-full" style={{ paddingBottom: "110%" }}>
        {imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.photo}
            alt={doctor.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD]">
            <span className="text-5xl font-bold text-[#0284C7] select-none">{doctor.initials}</span>
          </div>
        )}
      </div>
      <div className="px-4 py-3 text-center">
        <p className="text-sm font-semibold text-gray-900">{doctor.name}</p>
        <p className="text-xs text-[#0EA5E9] font-medium mt-0.5">{doctor.specialty}</p>
      </div>
    </div>
  );
}

function CalendlyEmbed({ email, reportId }: { email: string; reportId: string }) {
  const [booked, setBooked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const capturedEmail = useRef(email);
  useEffect(() => { capturedEmail.current = email; }, [email]);

  const iframeUrl =
    CALENDLY_URL
      ? `${CALENDLY_URL}?embed_type=Inline&hide_gdpr_banner=1&hide_landing_page_details=1` +
        (email ? `&email=${encodeURIComponent(email)}` : "")
      : "";

  useEffect(() => {
    if (!CALENDLY_URL) return;
    function onMessage(e: MessageEvent) {
      if (e.origin !== "https://calendly.com") return;
      let msg: Record<string, unknown>;
      try {
        msg = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      } catch { return; }
      if (msg.event !== "calendly.event_scheduled") return;
      const payload = msg.payload as Record<string, unknown> | undefined;
      const eventUri = (payload?.event as Record<string, unknown> | undefined)?.uri as string | undefined;
      const inviteeUri = (payload?.invitee as Record<string, unknown> | undefined)?.uri as string | undefined;
      if (!eventUri || !inviteeUri) return;
      setSyncing(true);
      fetch("/api/appointments/calendly-embed-scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: capturedEmail.current,
          eventUri,
          inviteeUri,
          vertical: "dental",
          reportId,
        }),
      })
        .catch(() => {})
        .finally(() => { setSyncing(false); setBooked(true); });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [reportId]);

  if (booked) {
    return (
      <div className="text-center py-10 space-y-3">
        <div className="text-5xl">✅</div>
        <p className="text-lg font-semibold text-gray-900">¡Evaluación agendada!</p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          Recibirás una confirmación por email. Te esperamos en la clínica.
        </p>
      </div>
    );
  }

  if (!CALENDLY_URL) {
    return (
      <div className="text-center py-6 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Para agendar tu evaluación presencial, contáctanos directamente por WhatsApp o teléfono.
        </p>
        <a
          href={`https://wa.me/56958043937?text=${encodeURIComponent("Hola, quiero agendar una evaluación dental presencial.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          <span>💬</span> Agendar por WhatsApp
        </a>
        <p className="text-xs text-gray-400">También puedes llamar al {CLINIC.phone}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {syncing && (
        <p className="text-xs text-center text-[#0EA5E9] animate-pulse">Registrando tu cita…</p>
      )}
      <iframe
        src={iframeUrl}
        width="100%"
        height="700"
        frameBorder="0"
        title="Agendar evaluación dental"
        className="rounded-xl border border-gray-100 block"
      />
    </div>
  );
}

export default function DentalAgendarPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("dental_lead_email") ?? "";
    setEmail(saved);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <span className="text-xs font-semibold tracking-widest text-[#0EA5E9]">PERFECTO DENTAL</span>
        <button
          onClick={() => router.back()}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Volver
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* A. Título y subtítulo */}
        <div className="text-center px-2">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            Confirma tu presupuesto en nuestra clínica dental
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            Agenda una evaluación presencial para revisar tu caso, validar el tratamiento recomendado y confirmar el presupuesto final.
          </p>
        </div>

        {/* B. Dirección, horario y teléfono */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-1">Dónde atendemos</p>
            <p className="text-xl font-bold text-white leading-tight">{CLINIC.address}</p>
            <p className="text-sm text-white/80 mt-0.5">{CLINIC.metro}</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Horario de atención</p>
              {CLINIC.hours.map((h) => (
                <div key={h.days} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700">{h.days}</span>
                  <span className="text-sm font-semibold text-gray-900">{h.time}</span>
                </div>
              ))}
            </div>
            <a
              href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 py-3 px-4 bg-[#F0F9FF] rounded-xl border border-[#BAE6FD] hover:bg-[#E0F2FE] transition-colors"
            >
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs text-gray-400 font-medium">Teléfono</p>
                <p className="text-base font-bold text-[#0284C7]">{CLINIC.phone}</p>
              </div>
            </a>
          </div>
        </div>

        {/* C. Mapa */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Ubicación</p>
            <a
              href={CLINIC.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#0EA5E9] hover:underline"
            >
              Abrir en Maps →
            </a>
          </div>
          <div className="relative w-full" style={{ height: 220 }}>
            <iframe
              src={CLINIC.mapsEmbed}
              width="100%"
              height="220"
              frameBorder="0"
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
              📍 Cómo llegar
            </a>
          </div>
        </div>

        {/* D. Profesionales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Profesionales</p>
          <div className="flex gap-4">
            {DOCTORS.map((doc) => (
              <DoctorCard key={doc.name} doctor={doc} />
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
            El profesional asignado a tu evaluación dependerá de disponibilidad y especialidad requerida.
          </p>
        </div>

        {/* E. Calendly */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-1">Elige tu horario</p>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            Selecciona el día y hora que mejor te acomode para tu evaluación presencial.
          </p>
          <CalendlyEmbed email={email} reportId={params.id} />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center px-4 pb-6 leading-relaxed">
          La evaluación presencial es para revisar tu caso y confirmar el presupuesto final. Los rangos referenciales del reporte pueden variar según diagnóstico clínico, radiografías y materiales.
        </p>

      </div>
    </div>
  );
}
