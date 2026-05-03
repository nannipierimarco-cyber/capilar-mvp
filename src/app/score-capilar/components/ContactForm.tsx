"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ContactData {
  nombre: string;
  whatsapp: string;
  email: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({
  onComplete,
  onBack,
}: {
  onComplete: (data: ContactData) => void;
  onBack: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<ContactData>>({});

  function validate(): boolean {
    const e: Partial<ContactData> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!whatsapp.trim() || whatsapp.replace(/\D/g, "").length < 7)
      e.whatsapp = "Ingresa un número de WhatsApp válido.";
    if (!EMAIL_RE.test(email.trim())) e.email = "Ingresa un email válido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) {
      onComplete({ nombre: nombre.trim(), whatsapp: whatsapp.trim(), email: email.trim() });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Tus datos de contacto</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Necesitamos esto para enviarte tu Score y orientarte en el siguiente paso.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="sc-nombre" className="text-sm mb-1.5 block">
            Nombre
          </Label>
          <Input
            id="sc-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Juan"
            autoComplete="given-name"
          />
          {errors.nombre && (
            <p className="text-xs text-destructive mt-1">{errors.nombre}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sc-whatsapp" className="text-sm mb-1.5 block">
            WhatsApp
          </Label>
          <Input
            id="sc-whatsapp"
            type="tel"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
          />
          {errors.whatsapp && (
            <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>
          )}
        </div>

        <div>
          <Label htmlFor="sc-email" className="text-sm mb-1.5 block">
            Email
          </Label>
          <Input
            id="sc-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="juan@email.com"
            autoComplete="email"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email}</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tus datos son confidenciales y no serán compartidos con terceros.
      </p>

      <Button onClick={handleSubmit} className="w-full mt-6 rounded-full h-12">
        Continuar
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Volver
      </button>
    </div>
  );
}
