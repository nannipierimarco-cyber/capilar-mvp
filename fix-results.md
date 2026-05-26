Quiero agregar un reporte pre-pago al funnel del quiz. El flujo debe ser:

Quiz completo → /results?intake_id=XXX → muestra reporte del paciente → CTA a /membership

Necesito que hagas todo esto:

1. Nuevo endpoint POST /api/ai/patient-report que recibe intake_id, lee los datos 
del paciente e intake de Supabase, lee las fotos de la tabla photos, y llama a 
OpenAI gpt-4o con las fotos y datos del quiz para generar un JSON con el mismo 
schema HairMapReport que está en src/lib/types.ts. El system prompt debe ser en 
español y pedir análisis clínico completo basado en fotos + respuestas del quiz.

2. Nueva página src/app/results/page.tsx que lee intake_id de los query params, 
llama al endpoint, muestra un loading de 30 segundos mientras espera, y cuando 
tiene el reporte renderiza HairReportNew de src/components/mapa-capilar/HairReportNew.tsx
con las fotos del paciente. Abajo del reporte un CTA grande que diga 
"Iniciar mi tratamiento" que lleva a /membership.

3. En src/app/quiz/page.tsx cambiar el router.push final de 
/membership?plan=inicio&journey=${journeyQuery}
a 
/results?intake_id=${intakeId}&journey=${journeyQuery}
donde intakeId es el ID del intake recién creado (ya debe estar disponible 
en ese punto del código).

Usa el mismo estilo visual que el resto del proyecto. El reporte debe verse 
idéntico al de /mapa-capilar/reporte/[id]/page.tsx.

Revisa todos los archivos relevantes antes de empezar y dime si tienes alguna 
duda antes de proceder.