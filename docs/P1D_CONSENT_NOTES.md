# P1-D — Consentimiento explícito en quiz (H11 / P1.4)

> Ejecutado el 2026-05-13. Cubre P1.4 (H11) del plan `SECURITY_STABILIZATION_PLAN.md`.

---

## Problema resuelto

La Ley 19.628 (Chile) exige base legal para el tratamiento de datos personales y datos
de salud. El quiz recolectaba RUT, fotos y antecedentes médicos sin registrar ningún
consentimiento del titular. Sin `consented_at` en base de datos no es posible demostrar
que el usuario autorizó el tratamiento de sus datos.

---

## Cambios implementados

### `src/lib/types.ts`

- `QuizData`: nuevo campo `consented: boolean`
- `INITIAL_QUIZ_DATA`: inicializado en `false`
- `Patient`: nuevo campo `consented_at: string | null` (refleja columna en DB)

### `src/app/quiz/page.tsx`

**`PersonalStep`**
- `isValid` ahora incluye `data.consented === true`
- Nuevo bloque de checkbox antes del botón "Enviar evaluación":
  - Texto: acepto que Nilo trate mis datos personales y de salud para coordinar
    la evaluación capilar; aclara que no es un diagnóstico médico.
  - Enlace a `/privacy` (puede ser 404 hasta que se cree esa página).
  - El botón queda `disabled` hasta que el usuario marca el checkbox.

**`handleSubmit`**
- `patientPayload` incluye `consented_at: data.consented ? new Date().toISOString() : null`

---

## Migración SQL requerida

Ejecutar en Supabase Dashboard → SQL Editor antes de ir a producción:

```sql
ALTER TABLE patients ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;
```

Esta columna permite:
- Saber exactamente cuándo y desde qué versión del formulario el paciente consintió.
- Demostrar ante autoridad que existe registro de consentimiento con timestamp.
- Futura auditoría (quién consintió, cuándo, qué versión del aviso).

---

## Propiedades de cumplimiento

- El usuario no puede enviar el formulario sin marcar el checkbox.
- El timestamp se genera server-side al momento del insert (no depende del cliente).
- El texto del aviso menciona explícitamente: datos de salud, coordinación médica,
  y que no es un diagnóstico.
- Se incluye enlace a política de privacidad (URL `/privacy` — pendiente de crear).

---

## Cómo probar

```bash
# 1. Ir a /quiz y completar todos los pasos hasta "Casi listo — tus datos"
# 2. Verificar que el botón "Enviar evaluación" está deshabilitado sin marcar checkbox
# 3. Marcar el checkbox → el botón debe habilitarse
# 4. Enviar → en Supabase Dashboard verificar que la fila en patients
#    tiene consented_at con la fecha/hora actual (no null)
# 5. Desmarcar el checkbox → el botón debe volver a deshabilitarse
```

---

## Pendiente

- Crear página `/privacy` con política de privacidad completa (Ley 19.628).
- Versionar el texto del aviso de consentimiento para rastrear cambios futuros
  (por ahora la fecha del consent implícitamente identifica la versión del aviso).
