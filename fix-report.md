En src/components/mapa-capilar/HairReportNew.tsx haz solo estos 3 cambios:

1. En el componente PhotoWithAnnotations, elimina todo el bloque que renderiza 
las anotaciones (el que empieza con {imageUrl && annotations.map(...)}).
Deja solo la foto sin labels.

2. En el componente DensityOval, reemplaza:
fill={zn.data.color_hex || levelColor[zn.data.level]}
por:
fill={levelColor[zn.data.level]}

3. En la seccion Clinical Next Steps, reemplaza el bloque completo que mapea 
priority/recommended/optional/long_term con esto:

<Card className="!p-4">
  <p className="text-[8px] font-bold uppercase tracking-wider mb-2" style={{ color: "#c0392b" }}>
    Recomendación Clínica
  </p>
  <p className="text-[11px] font-bold leading-snug" style={{ color: DARK }}>
    Consulta con Dermatólogo Capilar
  </p>
  <p className="text-[9px] mt-1.5 leading-relaxed" style={{ color: MUTED }}>
    Para un diagnóstico preciso y un plan de tratamiento personalizado, 
    te recomendamos agendar una consulta con un dermatólogo especializado 
    en salud capilar.
  </p>
</Card>

Nada mas. No toques ninguna otra parte del archivo.