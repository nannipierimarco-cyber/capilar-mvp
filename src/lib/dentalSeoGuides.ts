export type DentalGuideSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  note?: string;
};

export type DentalGuide = {
  slug: string;
  shortTitle: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  quickAnswer: string;
  highlights: string[];
  sections: DentalGuideSection[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const dentalGuides: DentalGuide[] = [
  {
    slug: "presupuesto-dental-caro",
    shortTitle: "¿Tu presupuesto dental está caro?",
    eyebrow: "Guía para comparar una cotización",
    title: "¿Tu presupuesto dental te pareció caro? Qué revisar antes de decidir",
    metaTitle: "¿Presupuesto dental caro? Qué revisar y comparar",
    description:
      "Aprende a revisar una cotización dental, detectar diferencias de alcance y comparar una alternativa antes de decidir. Guía clara y gratuita.",
    intro:
      "Un total alto no basta para saber si una cotización dental es cara. Primero hay que entender qué tratamiento incluye, qué materiales considera y qué costos podrían aparecer después.",
    quickAnswer:
      "Pide el presupuesto por escrito y compara el mismo alcance: piezas dentales, procedimientos, materiales, controles y costos adicionales. Si las propuestas no incluyen lo mismo, comparar solo el total puede llevarte a una conclusión equivocada.",
    highlights: [
      "Revisa el alcance, no solo el total",
      "Confirma qué está incluido y qué no",
      "Compara alternativas por escrito",
    ],
    sections: [
      {
        id: "revisar",
        title: "1. Revisa si el presupuesto está suficientemente detallado",
        paragraphs: [
          "Una cotización útil debería permitirte identificar qué se realizará, en qué dientes y cuántas veces. Si aparecen conceptos generales como “tratamiento completo” sin desglose, pide una versión más específica antes de comparar.",
          "También conviene distinguir entre prestaciones principales y costos complementarios. Una propuesta puede parecer más económica porque deja fuera exámenes, provisionales o controles que otra sí incorporó desde el inicio.",
        ],
        bullets: [
          "Nombre de cada procedimiento y pieza dental involucrada.",
          "Cantidad, material o sistema propuesto cuando corresponda.",
          "Exámenes, imágenes, laboratorio y controles incluidos.",
          "Etapas del tratamiento y forma de pago.",
          "Costos que podrían agregarse según la evaluación clínica.",
        ],
      },
      {
        id: "diferencias",
        title: "2. Entiende por qué dos cotizaciones pueden ser distintas",
        paragraphs: [
          "Dos presupuestos pueden tener totales diferentes sin representar exactamente el mismo servicio. El diagnóstico, la complejidad del caso, los materiales, el laboratorio, la experiencia del equipo y el seguimiento ofrecido pueden modificar el valor.",
          "Una diferencia de precio tampoco demuestra por sí sola que una opción sea mejor o peor. La comparación sirve para ordenar la información y formular preguntas; la indicación definitiva debe confirmarse mediante una evaluación odontológica.",
        ],
      },
      {
        id: "preguntas",
        title: "3. Haz estas preguntas antes de aceptar",
        paragraphs: [
          "Pedir claridad no significa desconfiar del profesional. Es una forma razonable de comprender la decisión y evitar comparar propuestas incompletas.",
        ],
        bullets: [
          "¿Qué problema busca resolver cada procedimiento?",
          "¿Hay alternativas clínicas que debiera evaluar?",
          "¿El valor incluye controles, provisionales y laboratorio?",
          "¿Qué situaciones podrían aumentar el costo final?",
          "¿Cuánto dura la propuesta y cómo se distribuyen los pagos?",
        ],
      },
      {
        id: "comparar",
        title: "4. Cómo buscar una alternativa comparable",
        paragraphs: [
          "Usa la cotización original como punto de partida. Mantén visible el detalle de procedimientos y solicita que la nueva propuesta indique cualquier diferencia de alcance. Así podrás distinguir una reducción real de precio de una propuesta que simplemente contiene menos prestaciones.",
          "Perfecto Labs puede revisar el documento y buscar una alternativa con atención presencial en Providencia. El servicio es gratuito y no te obliga a aceptar una nueva cotización.",
        ],
        note:
          "Si tu dentista indicó que necesitas atención urgente, no postergues la evaluación únicamente para comparar precios.",
      },
    ],
    faqs: [
      {
        question: "¿Cómo sé si un presupuesto dental es caro?",
        answer:
          "No existe una respuesta basada solo en el total. Debes comparar el mismo diagnóstico, procedimientos, piezas, materiales y servicios incluidos. Una evaluación clínica puede cambiar el alcance necesario.",
      },
      {
        question: "¿Puedo comparar una foto o un PDF del presupuesto?",
        answer:
          "Sí. Puedes subir una foto legible, un screenshot o un PDF. Si quieres, puedes ocultar datos personales como tu nombre o RUT antes de enviarlo.",
      },
      {
        question: "¿La alternativa es gratuita?",
        answer:
          "La revisión inicial y la búsqueda de una alternativa no tienen costo ni compromiso. El tratamiento dental, si decides realizarlo, se cotiza y confirma después de una evaluación profesional.",
      },
      {
        question: "¿Dónde sería la atención?",
        answer:
          "Actualmente buscamos alternativas con atención presencial en Providencia, Santiago. Te informaremos los detalles antes de que decidas si quieres avanzar.",
      },
    ],
  },
  {
    slug: "segunda-opinion-presupuesto-dental",
    shortTitle: "Segunda opinión sobre un presupuesto",
    eyebrow: "Antes de aceptar un tratamiento",
    title: "Segunda opinión de un presupuesto dental: qué comparar y qué preguntar",
    metaTitle: "Segunda opinión de presupuesto dental: guía práctica",
    description:
      "Conoce la diferencia entre comparar una cotización y obtener una segunda opinión clínica, qué documentos llevar y qué preguntas hacer.",
    intro:
      "Buscar una segunda opinión puede ayudarte a comprender mejor un tratamiento y sus costos. Para que sea útil, conviene distinguir entre revisar el documento y realizar una nueva evaluación clínica.",
    quickAnswer:
      "Una comparación documental permite revisar precios, partidas e inclusiones. Una segunda opinión clínica requiere que otro dentista evalúe tu caso y determine si coincide con el diagnóstico y el plan propuesto. Son procesos relacionados, pero no equivalentes.",
    highlights: [
      "Distingue precio de indicación clínica",
      "Lleva antecedentes completos",
      "Pide que expliquen cualquier diferencia",
    ],
    sections: [
      {
        id: "diferencia",
        title: "1. Comparación de presupuesto y segunda opinión no son lo mismo",
        paragraphs: [
          "Revisar una cotización permite verificar si está desglosada, qué servicios incluye y cómo se compara su estructura con otra propuesta. Sin examinarte, esa revisión no puede confirmar un diagnóstico ni decidir qué tratamiento necesitas.",
          "La segunda opinión clínica incorpora una evaluación realizada por otro profesional y, cuando corresponda, antecedentes como radiografías o exámenes. Solo después de esa evaluación puede confirmarse o modificarse el plan.",
        ],
      },
      {
        id: "cuando",
        title: "2. Cuándo puede ser útil pedir otra evaluación",
        paragraphs: [
          "Puede darte más claridad cuando el tratamiento es extenso, el presupuesto tiene conceptos que no entiendes, existen varias etapas o quieres conocer alternativas antes de comprometerte.",
          "También puede ser útil si recibiste propuestas diferentes. El objetivo no es elegir automáticamente la más barata, sino entender por qué cambian y cuál responde mejor a tu situación clínica y a tus prioridades.",
        ],
      },
      {
        id: "documentos",
        title: "3. Qué información conviene reunir",
        paragraphs: [
          "Mientras más completa sea la información, más fácil será comparar. Pide una copia legible de la cotización y conserva los antecedentes que la clínica pueda entregarte.",
        ],
        bullets: [
          "Presupuesto detallado y fecha de emisión.",
          "Plan de tratamiento y piezas dentales indicadas.",
          "Radiografías o exámenes disponibles.",
          "Materiales o sistemas incluidos, si aplican.",
          "Condiciones de pago, controles y garantías informadas.",
        ],
      },
      {
        id: "preguntas",
        title: "4. Preguntas para aprovechar la segunda opinión",
        paragraphs: [
          "Pide que la explicación sea concreta y que las diferencias queden asociadas a una razón clínica o a un cambio de alcance.",
        ],
        bullets: [
          "¿Coincide el diagnóstico con el presupuesto original?",
          "¿Qué parte del tratamiento es prioritaria y qué podría esperar?",
          "¿Existen opciones distintas y qué cambia entre ellas?",
          "¿La nueva cotización incluye las mismas etapas y controles?",
          "¿Qué información falta para confirmar el precio final?",
        ],
        note:
          "Perfecto Labs compara tu documento y busca una alternativa en Providencia. La confirmación clínica siempre corresponde al dentista que te evalúe presencialmente.",
      },
    ],
    faqs: [
      {
        question: "¿Una segunda opinión significa que el primer diagnóstico está mal?",
        answer:
          "No. Puede confirmar el plan original, proponer otra alternativa o explicar diferencias de criterio. Su valor está en darte más información para decidir.",
      },
      {
        question: "¿Pueden darme una segunda opinión solo con el presupuesto?",
        answer:
          "El documento permite comparar partidas y costos, pero no reemplaza el examen clínico. Para confirmar diagnóstico y tratamiento debes ser evaluado por un dentista.",
      },
      {
        question: "¿Debo enviar radiografías?",
        answer:
          "Para la comparación inicial basta con una cotización legible. Si avanzas a una evaluación, el profesional indicará qué antecedentes necesita.",
      },
      {
        question: "¿Comparar me obliga a cambiar de clínica?",
        answer:
          "No. Recibir una alternativa es gratuito y sin compromiso. Tú decides si continúas con tu clínica original o si evalúas otra opción.",
      },
    ],
  },
  {
    slug: "comparar-presupuesto-implantes-dentales",
    shortTitle: "Comparar presupuesto de implantes",
    eyebrow: "Guía de implantes dentales",
    title: "Cómo comparar un presupuesto de implantes dentales sin mirar solo el precio",
    metaTitle: "Comparar presupuesto de implantes dentales: guía",
    description:
      "Revisa qué puede incluir una cotización de implantes dentales y cómo comparar cirugía, implante, corona, exámenes y controles.",
    intro:
      "Los presupuestos de implantes suelen dividirse en varias etapas. Antes de comparar totales, confirma si cada propuesta incluye la cirugía, los componentes protésicos, la corona y el seguimiento.",
    quickAnswer:
      "Compara el tratamiento completo y no una sola partida. Verifica implante, pilar, corona, cirugía, exámenes, provisionales y controles. Si una cotización omite una etapa, puede parecer más barata sin ser equivalente.",
    highlights: [
      "Compara el tratamiento completo",
      "Identifica componentes y etapas",
      "Confirma costos condicionados",
    ],
    sections: [
      {
        id: "incluye",
        title: "1. Qué puede incluir una cotización de implantes",
        paragraphs: [
          "Un implante dental no suele corresponder a una única prestación. El plan puede separar la fase quirúrgica de la fase protésica y distribuir los cobros en momentos distintos.",
          "Los nombres pueden variar entre clínicas, por lo que conviene pedir una explicación simple de cada partida y saber si el total cubre todo el proceso previsto.",
        ],
        bullets: [
          "Evaluación, imágenes y planificación.",
          "Cirugía y colocación del implante.",
          "Implante, pilar u otros componentes.",
          "Corona definitiva y, si corresponde, provisional.",
          "Controles posteriores y ajustes informados.",
        ],
      },
      {
        id: "adicionales",
        title: "2. Identifica prestaciones que dependen del caso",
        paragraphs: [
          "Algunas personas pueden necesitar procedimientos adicionales para que el tratamiento sea viable. No deben darse por incluidos ni por necesarios sin una evaluación, pero sí conviene preguntar cómo afectarían el presupuesto si fueran indicados.",
        ],
        bullets: [
          "Injertos o procedimientos complementarios.",
          "Extracciones previas.",
          "Sedación o medicamentos asociados.",
          "Prótesis provisionales durante la espera.",
          "Repetición de imágenes o exámenes.",
        ],
      },
      {
        id: "equivalentes",
        title: "3. Asegúrate de comparar propuestas equivalentes",
        paragraphs: [
          "Pregunta por el sistema utilizado, el material de la corona, el profesional responsable de cada etapa y el seguimiento. No necesitas elegir por una marca específica, pero sí entender qué estás comparando y si la trazabilidad de los componentes está informada.",
          "Revisa también el calendario de pagos. Un precio mostrado por etapa o por cuota no siempre representa el costo total del tratamiento terminado.",
        ],
      },
      {
        id: "checklist",
        title: "4. Checklist antes de decidir",
        paragraphs: [
          "Una cotización clara debería responder estas preguntas sin que tengas que inferir la información.",
        ],
        bullets: [
          "¿El precio corresponde a una pieza o a todo el tratamiento indicado?",
          "¿Incluye cirugía, pilar, corona, laboratorio y controles?",
          "¿Qué elementos podrían cobrarse por separado?",
          "¿Cuándo se confirma el precio definitivo?",
          "¿Qué cambia si la evaluación indica un procedimiento adicional?",
        ],
        note:
          "Puedes subir tu cotización para buscar una alternativa en Providencia. La indicación y el precio final se confirman después de la evaluación clínica.",
      },
    ],
    faqs: [
      {
        question: "¿Por qué un implante aparece con varios precios?",
        answer:
          "Porque el tratamiento puede separar cirugía, implante, pilar, corona, laboratorio y controles. Pide el total estimado de todas las etapas indicadas para tu caso.",
      },
      {
        question: "¿La corona siempre está incluida en el valor del implante?",
        answer:
          "No necesariamente. Algunas cotizaciones la muestran por separado. Confirma por escrito qué componentes incluye cada partida.",
      },
      {
        question: "¿Se puede confirmar el precio sin una evaluación?",
        answer:
          "La cotización previa sirve para comparar, pero el profesional debe evaluar el caso y los antecedentes necesarios para confirmar el plan y el valor final.",
      },
      {
        question: "¿Perfecto Labs realiza el tratamiento?",
        answer:
          "Perfecto Labs revisa la cotización y facilita la búsqueda de una alternativa. La evaluación y el tratamiento los realiza una clínica dental.",
      },
    ],
  },
  {
    slug: "comparar-presupuesto-ortodoncia",
    shortTitle: "Comparar presupuesto de ortodoncia",
    eyebrow: "Guía de ortodoncia",
    title: "Cómo comparar un presupuesto de ortodoncia y calcular el costo completo",
    metaTitle: "Comparar presupuesto de ortodoncia: costo completo",
    description:
      "Aprende qué revisar en una cotización de brackets o alineadores: estudio inicial, instalación, controles, refinamientos y retenedores.",
    intro:
      "En ortodoncia, la cuota o el valor de instalación rara vez cuenta toda la historia. Para comparar opciones necesitas estimar el costo completo y entender qué ocurre si el tratamiento dura más de lo previsto.",
    quickAnswer:
      "Suma evaluación, estudio, aparato o alineadores, instalación, controles, reposiciones y retenedores. Compara por separado propuestas de brackets y alineadores, porque su funcionamiento y estructura de cobro pueden ser diferentes.",
    highlights: [
      "Calcula el costo total estimado",
      "Revisa controles y retenedores",
      "No mezcles planes de alcance distinto",
    ],
    sections: [
      {
        id: "partidas",
        title: "1. Partidas que conviene identificar",
        paragraphs: [
          "Pide que la clínica separe los pagos iniciales de los costos recurrentes. Así podrás estimar el total bajo la duración prevista y entender qué pagos continuarían si el tratamiento se extiende.",
        ],
        bullets: [
          "Evaluación y estudio inicial.",
          "Radiografías, fotografías o modelos solicitados.",
          "Instalación de brackets o entrega del plan de alineadores.",
          "Controles periódicos y urgencias relacionadas.",
          "Reposiciones, refinamientos y retenedores finales.",
        ],
      },
      {
        id: "total",
        title: "2. Convierte cuotas y controles en un costo comparable",
        paragraphs: [
          "Una cuota baja puede acompañar un pago inicial mayor o una cantidad más extensa de controles. Solicita una duración estimada, la frecuencia de atención y qué sucede con el cobro si el tratamiento necesita más tiempo.",
          "La duración es una estimación clínica, no una garantía. Por eso es importante que el presupuesto explique las condiciones y no solo multiplique una mensualidad por un número fijo de meses.",
        ],
      },
      {
        id: "tipos",
        title: "3. Compara brackets con brackets y alineadores con alineadores",
        paragraphs: [
          "Dos técnicas distintas no necesariamente ofrecen el mismo plan, controles o responsabilidades para el paciente. Si estás evaluando brackets y alineadores, pide que el profesional explique por qué ambas serían adecuadas para tu caso antes de comparar sus precios.",
          "En alineadores, confirma cuántas etapas o refinamientos contempla el plan. En brackets, pregunta por controles, reparaciones o reposiciones. En ambos casos, verifica si los retenedores están incluidos.",
        ],
      },
      {
        id: "preguntas",
        title: "4. Preguntas que deben quedar resueltas",
        paragraphs: [
          "Estas respuestas te ayudarán a evaluar el compromiso económico completo y las diferencias entre propuestas.",
        ],
        bullets: [
          "¿Cuál es el costo inicial y cuánto se paga en cada control?",
          "¿Qué duración se estima y qué pasa si se prolonga?",
          "¿Qué exámenes, reparaciones o refinamientos se cobran aparte?",
          "¿Los retenedores y sus controles están incluidos?",
          "¿Quién realizará el seguimiento y con qué frecuencia?",
        ],
        note:
          "La comparación documental ordena costos e inclusiones. La técnica adecuada y la duración deben confirmarse con una evaluación de ortodoncia.",
      },
    ],
    faqs: [
      {
        question: "¿Cómo calculo el precio total de una ortodoncia?",
        answer:
          "Considera el pago inicial, los controles durante el tiempo estimado, estudios, reposiciones y retenedores. Pregunta qué pagos continuarían si el tratamiento se extiende.",
      },
      {
        question: "¿Los retenedores están incluidos?",
        answer:
          "Depende de cada cotización. Deben aparecer expresamente o ser confirmados por escrito, incluyendo los controles posteriores si los hubiera.",
      },
      {
        question: "¿Puedo comparar brackets y alineadores solo por precio?",
        answer:
          "No es recomendable. Primero debe confirmarse que ambas alternativas son adecuadas para tu caso y luego comparar el alcance completo de cada plan.",
      },
      {
        question: "¿Necesito tener una cotización para usar el servicio?",
        answer:
          "Sí. El servicio de comparación está pensado para personas que ya recibieron un presupuesto dental por escrito.",
      },
    ],
  },
  {
    slug: "como-leer-un-presupuesto-dental",
    shortTitle: "Cómo leer un presupuesto dental",
    eyebrow: "Guía paso a paso",
    title: "Cómo leer un presupuesto dental y saber qué estás pagando",
    metaTitle: "Cómo leer un presupuesto dental paso a paso",
    description:
      "Guía para entender procedimientos, piezas dentales, materiales, cantidades, controles, pagos y posibles costos adicionales de una cotización.",
    intro:
      "Una cotización dental puede contener códigos, abreviaturas y varias etapas. Aprender a leerla te ayuda a formular mejores preguntas y a comparar alternativas de manera justa.",
    quickAnswer:
      "Empieza por identificar el procedimiento, la pieza dental, la cantidad, el valor unitario y el subtotal. Después revisa qué servicios complementarios están incluidos, qué costos son estimados y cuándo se confirma el total.",
    highlights: [
      "Relaciona cada cobro con una pieza",
      "Separa valores unitarios y totales",
      "Detecta inclusiones y exclusiones",
    ],
    sections: [
      {
        id: "estructura",
        title: "1. Ubica los datos básicos de cada prestación",
        paragraphs: [
          "Aunque el formato cambie, la lógica suele repetirse: una descripción, una pieza o zona, una cantidad y un precio. Recorre el documento línea por línea y marca los conceptos que no puedas relacionar con una explicación recibida en consulta.",
        ],
        bullets: [
          "Procedimiento o prestación.",
          "Número de pieza o zona de la boca.",
          "Cantidad y valor unitario.",
          "Descuento, cobertura o copago si corresponde.",
          "Subtotal por etapa y total informado.",
        ],
      },
      {
        id: "etapas",
        title: "2. Ordena el tratamiento por etapas",
        paragraphs: [
          "Algunos planes se ejecutan en una sola visita y otros requieren varias fases. Identificar el orden ayuda a saber qué se paga al comienzo, qué depende de resultados posteriores y qué parte corresponde al cierre o mantenimiento.",
          "Pide que te indiquen qué prestaciones son prioritarias, cuáles son opcionales y cuáles solo se realizarían si la evaluación o los exámenes muestran que son necesarias.",
        ],
      },
      {
        id: "incluido",
        title: "3. Busca lo que no aparece en el total",
        paragraphs: [
          "Un presupuesto también se entiende por sus exclusiones. Si un concepto importante no aparece, no asumas que está incluido: confírmalo antes de aceptar.",
        ],
        bullets: [
          "Radiografías, scanner u otros exámenes.",
          "Laboratorio, provisionales y materiales específicos.",
          "Medicamentos o sedación.",
          "Controles, ajustes y mantenciones.",
          "Reposiciones o procedimientos condicionados al caso.",
        ],
      },
      {
        id: "comparar",
        title: "4. Prepara una versión fácil de comparar",
        paragraphs: [
          "Agrupa las prestaciones por tratamiento y anota al lado qué incluye cada clínica. Si una propuesta usa otro nombre, pregunta si representa el mismo procedimiento antes de alinearla con la original.",
          "Guarda la versión escrita y su vigencia. Cuando recibas otra cotización, revisa primero las diferencias de alcance y después el total. Esa secuencia evita elegir una cifra menor que deja costos relevantes fuera.",
        ],
        note:
          "No necesitas interpretar el documento como un profesional. Basta con detectar qué no entiendes y pedir que la clínica lo explique en lenguaje claro.",
      },
    ],
    faqs: [
      {
        question: "¿Qué significa el número de pieza dental?",
        answer:
          "Es una forma de identificar el diente al que corresponde una prestación. Si no sabes qué sistema usa la cotización, pide a la clínica que te señale la pieza en un esquema.",
      },
      {
        question: "¿El total del presupuesto siempre es definitivo?",
        answer:
          "No necesariamente. Puede cambiar si faltan exámenes o si la evaluación revela necesidades adicionales. Pregunta qué está confirmado y qué permanece sujeto a evaluación.",
      },
      {
        question: "¿Qué hago si el presupuesto no está desglosado?",
        answer:
          "Solicita una versión escrita con procedimientos, cantidades, piezas, etapas e inclusiones. Sin ese detalle es difícil hacer una comparación equivalente.",
      },
      {
        question: "¿Perfecto Labs puede ayudarme a leerlo?",
        answer:
          "Puedes subir una foto o PDF para que revisemos la cotización y busquemos una alternativa. La revisión es documental y no reemplaza una evaluación odontológica.",
      },
    ],
  },
];

export function getDentalGuide(slug: string): DentalGuide {
  const guide = dentalGuides.find((item) => item.slug === slug);

  if (!guide) {
    throw new Error(`Dental guide not found: ${slug}`);
  }

  return guide;
}
