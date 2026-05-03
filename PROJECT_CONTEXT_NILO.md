# Nilo — Project Context

## 1. Qué es Nilo

Nilo es una plataforma capilar digital en Chile.

No somos clínica.
No somos farmacia.
No vendemos medicamentos directamente como merchant principal.

Nilo conecta:
- paciente;
- médico;
- farmacia autorizada;
- clínica capilar partner si corresponde.

La propuesta central:
ayudar al usuario a entender cuál es su ruta capilar correcta: frenar la caída o evaluar recuperación/trasplante.

## 2. Posicionamiento

Nilo no parte vendiendo cirugía.
Nilo parte entendiendo la caída.

Mensajes clave:
- Entiende tu caída antes de decidir qué hacer.
- Nilo te ayuda a identificar si hoy necesitas frenar la caída o evaluar una recuperación capilar más avanzada.
- La evaluación de Nilo orienta tu siguiente paso, pero no reemplaza la revisión médica.
- El tratamiento final depende exclusivamente de la revisión médica.

## 3. Journeys principales

Hay dos rutas:

### A. Frenar la caída
Para usuarios que todavía tienen pelo que cuidar.

Ruta:
quiz → recomendación → membresía → checkout → pago Flow → revisión médica → farmacia/despacho si corresponde.

Producto recomendado:
Dutasteride + Minoxidil
Siempre con disclosure:
- sujeto a revisión médica;
- receta si corresponde;
- farmacia autorizada;
- despacho a domicilio;
- seguimiento por WhatsApp + AI;
- historial capilar consolidado.

Nunca mostrar dosis.

### B. Evaluar trasplante / recuperación capilar
Para usuarios que ya perdieron densidad o están considerando trasplante.

Ruta:
quiz → recomendación de recuperación capilar → revisión médica / preparación / clínica partner si corresponde.

No decir:
- candidato a trasplante;
- aprobado;
- necesitas trasplante.

Usar:
- evaluar;
- preparar;
- si corresponde;
- clínica partner.

## 4. Compliance

Reglas importantes:
- No diagnosticar.
- No garantizar receta.
- No garantizar medicamento.
- No garantizar resultados.
- No decir “aprobado”.
- No decir “tratamiento perfecto”.
- No decir que AI diagnostica.
- No decir que Nilo vende medicamentos directamente.
- Siempre decir que el médico decide.
- Siempre decir que la farmacia autorizada prepara/dispensa si corresponde.

## 5. AI

La AI se usa como copiloto interno y de seguimiento.

Funciones:
- ordenar respuestas;
- generar informe preliminar para médico;
- analizar fotos de forma preliminar;
- detectar señales de alerta;
- sugerir preguntas para el médico;
- ayudar a construir historial capilar.

La AI no diagnostica, no prescribe, no aprueba tratamiento.

El informe AI debe estar en español y estructurado:
1. Resumen del caso
2. Observación preliminar de fotos
3. Ruta preliminar sugerida
4. Nivel de atención
5. Señales de alerta
6. Preguntas sugeridas para el médico
7. Consideraciones clínicas posibles
8. Próximo paso operacional
9. Nota para comunicación al paciente
10. Nota interna de seguridad

## 6. Membresía

La página de membresía debe tener tres opciones:

### 6 meses
- $19.990/mes
- Total $119.940
- Más popular
- Ahorra 33%

### 3 meses
- $24.990/mes
- Total $74.970
- Ahorra 17%

### 1 mes
- $29.990/mes
- Total $29.990

El costo de envío es adicional:
- Envío: $3.990

El checkout debe mostrar:
- subtotal membresía;
- envío $3.990;
- total final.

Totales:
- 6 meses: $123.930
- 3 meses: $78.960
- 1 mes: $33.980

## 7. Pago

Se usa Flow Chile.

Flujo:
usuario paga ahora → caso queda paid_pending_medical_review → doctor revisa → si corresponde, se activa el proceso → si no corresponde, se marca refund_pending y operación reembolsa manualmente en Flow.

Copy clave:
“Reserva tu plan. El cargo queda sujeto a revisión médica. Si el médico determina que no corresponde avanzar, no activaremos el tratamiento y gestionaremos la devolución del pago.”

El pago no garantiza receta ni medicamento.

## 8. Doctor portal

Hay múltiples doctores.
Cada doctor debe tener login propio vía Supabase Auth.

Rutas:
- /doctor/login
- /doctor
- /doctor/patients/[id]

El doctor ve:
- pacientes asignados;
- respuestas del quiz;
- fotos;
- informe AI;
- observación preliminar de fotos;
- estado de pago;
- link de Calendly;
- formulario de decisión médica.

Decisiones:
- Revisión pendiente
- Solicitar más información
- Corresponde avanzar con tratamiento
- No corresponde avanzar por este flujo
- Derivar a evaluación clínica
- Consulta completada

## 9. Calendly

Fase 1:
Cada doctor tiene un calendly_url guardado en doctor_profiles.

Cuando un paciente se asigna al doctor:
- admin ve el link;
- doctor ve el link;
- paciente agenda con el link.

Fase 2 futura:
Webhook de Calendly para actualizar:
- consultation_scheduled_at;
- calendly_event_url;
- status = consultation_booked.

## 10. Diseño

Preferencias:
- Fondo blanco, no crema.
- Marca debe decir Nilo, no Capilar.
- Estilo premium, limpio, mobile-first.
- Cards redondeadas.
- Mucho whitespace.
- CTA principal oscuro/negro.
- Botón secundario más liviano que el principal.
- No parecer copia de BOE.
- Tomar principios de UX, no copiar visuales.

## 11. Imagen hero

Usar:
public/hero-hair-contrast.png

Debe mostrarse completa:
- cabeza;
- hombros/polera;
- no solo una franja del cuello/cabeza.

Usar object-contain, no object-cover, si se está cortando.

## 12. Flujos importantes

Treatment flow:
home → quiz → route selection → preguntas → fotos → contacto → recomendación → membership → checkout → Flow → success → admin/doctor review.

Payment flow:
membership → checkout?plan=inicio&membership=6m/3m/1m → Flow → checkout/return → success.

## 13. Variables de entorno

Local:
NEXT_PUBLIC_APP_URL=http://localhost:3000

Producción:
NEXT_PUBLIC_APP_URL=https://capilar-mvp.vercel.app o dominio nuevo.

Variables:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_SECRET
OPENAI_API_KEY
FLOW_API_KEY
FLOW_SECRET_KEY
FLOW_BASE_URL
NEXT_PUBLIC_APP_URL

## 14. No romper

Al hacer cambios, no romper:
- Supabase saving;
- AI doctor report;
- photo upload;
- admin;
- doctor portal;
- membership;
- checkout;
- Flow;
- Vercel build.