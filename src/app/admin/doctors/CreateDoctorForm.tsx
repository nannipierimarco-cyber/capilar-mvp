"use client";

import { useState } from "react";

interface FormState {
  full_name: string;
  email: string;
  temporary_password: string;
  specialty: string;
  vertical: "dental" | "hair" | "skin" | "";
  license_number: string;
  calendly_url: string;
  availability_notes: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  full_name: "",
  email: "",
  temporary_password: "",
  specialty: "",
  vertical: "",
  license_number: "",
  calendly_url: "",
  availability_notes: "",
  is_active: true,
};

export default function CreateDoctorForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/doctors/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error desconocido al crear el doctor.");
        return;
      }

      setSuccess(true);
      setForm(EMPTY);
      // Reload to refresh the doctor list
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError("Error de red. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h2 className="font-semibold text-base mb-4">Crear nuevo doctor</h2>

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Doctor creado correctamente. Ya puede iniciar sesión en el portal médico.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="full_name">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={handleChange}
              placeholder="Dr. Juan Pérez"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="doctor@ejemplo.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="temporary_password">
              Contraseña temporal <span className="text-red-500">*</span>
            </label>
            <input
              id="temporary_password"
              name="temporary_password"
              type="password"
              required
              value={form.temporary_password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="vertical">
              Vertical <span className="text-red-500">*</span>
            </label>
            <select
              id="vertical"
              name="vertical"
              required
              value={form.vertical}
              onChange={(e) => setForm((prev) => ({ ...prev, vertical: e.target.value as FormState["vertical"] }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>Selecciona vertical</option>
              <option value="dental">Dental</option>
              <option value="hair">Hair Care</option>
              <option value="skin">Skin Care</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="specialty">
              Especialidad
            </label>
            <input
              id="specialty"
              name="specialty"
              type="text"
              value={form.specialty}
              onChange={handleChange}
              placeholder="Odontología / Dermatología"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="license_number">
              Número de registro
            </label>
            <input
              id="license_number"
              name="license_number"
              type="text"
              value={form.license_number}
              onChange={handleChange}
              placeholder="LIC-12345"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground" htmlFor="calendly_url">
              Link de Calendly
            </label>
            <input
              id="calendly_url"
              name="calendly_url"
              type="url"
              value={form.calendly_url}
              onChange={handleChange}
              placeholder="https://calendly.com/dr-nombre/consulta"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground" htmlFor="availability_notes">
            Notas de disponibilidad
          </label>
          <textarea
            id="availability_notes"
            name="availability_notes"
            value={form.availability_notes}
            onChange={handleChange}
            rows={2}
            placeholder="Ej: Disponible lunes a viernes 9–13h"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label className="text-sm font-medium text-foreground" htmlFor="is_active">
            Doctor activo
          </label>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto rounded-lg bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creando..." : "Crear doctor"}
          </button>
        </div>
      </form>
    </div>
  );
}
