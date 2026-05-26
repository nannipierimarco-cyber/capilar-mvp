TAREA 1 — Calibración del prompt (ambos endpoints)

En src/app/api/mapa-capilar/analyze/route.ts, agrega estas instrucciones al final de PASS1_SYSTEM:

"Para calibrar la escala Norwood correctamente:
- Norwood 1-2: línea frontal intacta o mínima recesión en sienes, sin adelgazamiento visible en coronilla
- Norwood 3: recesión moderada en sienes formando M, posible adelgazamiento leve en coronilla
- Norwood 4: recesión profunda en sienes + adelgazamiento claro en coronilla con banda de pelo en medio
- Norwood 5-7: pérdida extensa, zonas fusionadas
Sé conservador — si hay duda entre dos etapas, elige la menor.
Para el mapa de densidad, usa muy_baja solo si el cuero cabelludo es claramente visible en esa zona.
Usa baja si hay adelgazamiento notable pero el cuero no es completamente visible.
Usa media si la densidad es menor que lo normal pero funcional.
Usa alta para zonas con densidad normal o superior."

Haz el mismo cambio en src/app/api/ai/patient-report/route.ts agregando las mismas instrucciones al system prompt.

TAREA 2 — Perfil clínico en /results

En src/app/results/page.tsx, debajo del componente HairReportNew, agrega una segunda sección 
"Tu Perfil Clínico" que muestre los datos del intake del paciente.
La sección debe incluir:
1. Duración de la caída (hair_loss_duration)
2. Historial familiar (family_history: si/no)
3. Tratamientos previos (previous_treatments array)
4. Condiciones médicas relevantes (medical_conditions array)
5. Medicamentos actuales (current_medications: si/no)
6. Nivel de pérdida (loss_severity: mild/moderate/advanced)
7. Señales de alerta - mostrar en rojo si hay: severe_irritation, heart_disease, liver_disease, kidney_disease
8. Ruta recomendada - si journey es "transplant" mostrar "Evaluación de trasplante",
   si es "treatment" mostrar "Tratamiento médico online"

El diseño debe ser igual al resto del reporte - mismos colores (GOLD, CREAM, BORDER, DARK, MUTED),
mismas Cards, mismo estilo de SectionTitle.

Los datos del intake deben estar disponibles en la respuesta del endpoint /api/ai/patient-report.
Si no están, modifica el endpoint para incluirlos junto al HairMapReport.

Al final de todo el reporte, el CTA "Iniciar mi tratamiento" debe ser muy visible -
botón grande, color dorado (#c9a84c), texto blanco, ancho completo, padding generoso.

Al terminar ambas tareas, hacer commit y deploy a producción con vercel --prod.