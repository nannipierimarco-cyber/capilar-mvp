import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { dentalGuides, type DentalGuide } from "@/lib/dentalSeoGuides";

const SITE_URL = "https://perfectolabs.cl";
const OG_IMAGE_URL = `${SITE_URL}/dental-quote-compare-og.jpg`;
const PUBLISHED_DATE = "2026-09-21";

export function createDentalGuideMetadata(guide: DentalGuide): Metadata {
  const pageUrl = `${SITE_URL}/dental-care/${guide.slug}`;

  return {
    title: `${guide.metaTitle} | Perfecto Labs`,
    description: guide.description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.description,
      url: pageUrl,
      siteName: "Perfecto Labs",
      locale: "es_CL",
      type: "article",
      publishedTime: PUBLISHED_DATE,
      modifiedTime: PUBLISHED_DATE,
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.description,
      images: [OG_IMAGE_URL],
    },
  };
}

export default function DentalGuidePage({ guide }: { guide: DentalGuide }) {
  const pageUrl = `${SITE_URL}/dental-care/${guide.slug}`;
  const comparisonUrl = `/dental-care/comparar-presupuesto?ref=guia-${guide.slug}`;
  const relatedGuides = dentalGuides.filter((item) => item.slug !== guide.slug).slice(0, 3);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: guide.title,
        description: guide.description,
        datePublished: PUBLISHED_DATE,
        dateModified: PUBLISHED_DATE,
        inLanguage: "es-CL",
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "Perfecto Labs",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "Perfecto Labs",
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Dental Care",
            item: `${SITE_URL}/dental-care`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: guide.shortTitle,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <Header />
      <main className="flex-1">
        <section className="border-b border-[#BAE6FD] bg-[#F0F9FF]">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
            <nav aria-label="Migas de pan" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <Link href="/" className="transition-colors hover:text-[#0284C7]">
                Inicio
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/dental-care" className="transition-colors hover:text-[#0284C7]">
                Dental Care
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-700">{guide.shortTitle}</span>
            </nav>

            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0284C7]">
                {guide.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-[#0C4A6E] sm:text-5xl">
                {guide.title}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{guide.intro}</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {guide.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-[#BAE6FD] bg-white px-3 py-1.5 text-xs font-semibold text-[#0C4A6E]"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
              <Link
                href={comparisonUrl}
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#0EA5E9] px-7 py-3 text-center text-base font-bold text-white shadow-sm transition-colors hover:bg-[#0284C7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
              >
                Comparar mi presupuesto gratis
              </Link>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Necesitas una cotización previa · Sin compromiso · Atención presencial en Providencia
              </p>
            </div>
          </div>
        </section>

        <article className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-16">
          <div className="min-w-0">
            <section aria-labelledby="respuesta-rapida" className="rounded-2xl border border-[#BAE6FD] bg-[#F0F9FF] p-6 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0284C7]">Respuesta rápida</p>
              <h2 id="respuesta-rapida" className="mt-2 text-xl font-bold text-[#0C4A6E]">
                Lo esencial antes de comparar
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-700">{guide.quickAnswer}</p>
            </section>

            <div className="mt-12 space-y-12">
              {guide.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24" aria-labelledby={`${section.id}-title`}>
                  <h2 id={`${section.id}-title`} className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-7 text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3 text-base leading-7 text-slate-700">
                          <span aria-hidden="true" className="mt-2.5 h-2 w-2 flex-none rounded-full bg-[#0EA5E9]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.note && (
                    <p className="mt-6 rounded-xl border-l-4 border-[#0EA5E9] bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700">
                      {section.note}
                    </p>
                  )}
                </section>
              ))}
            </div>

            <section id="preguntas-frecuentes" aria-labelledby="faq-title" className="mt-14 scroll-mt-24 border-t border-slate-200 pt-12">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0284C7]">Preguntas frecuentes</p>
              <h2 id="faq-title" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Dudas comunes
              </h2>
              <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
                {guide.faqs.map((faq) => (
                  <details key={faq.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-semibold text-slate-900 marker:content-none">
                      <span>{faq.question}</span>
                      <span aria-hidden="true" className="text-xl leading-none text-[#0284C7] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 pr-8 text-sm leading-6 text-slate-600">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="mt-14 rounded-3xl bg-[#0C4A6E] px-6 py-9 text-center sm:px-10 sm:py-11">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                ¿Ya tienes una cotización dental por escrito?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-sky-100">
                Sube una foto o PDF. Revisamos el documento y buscamos una alternativa con atención presencial en Providencia.
              </p>
              <Link
                href={comparisonUrl}
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-center text-base font-bold text-[#0C4A6E] transition-colors hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Subir mi cotización gratis
              </Link>
              <p className="mt-3 text-xs text-sky-200">Gratis y sin compromiso</p>
            </section>

            <footer className="mt-8 text-xs leading-5 text-slate-500">
              <p>
                Contenido informativo de Perfecto Labs · Actualizado el 21 de septiembre de 2026.
              </p>
              <p className="mt-2">
                Esta guía ayuda a entender y comparar documentos. No entrega un diagnóstico ni reemplaza una evaluación odontológica. El tratamiento y su precio final deben ser confirmados por un profesional.
              </p>
            </footer>
          </div>

          <aside className="hidden space-y-6 lg:block">
            <nav aria-label="Contenido de esta guía" className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <p className="text-sm font-bold text-slate-900">En esta guía</p>
              <ol className="mt-4 space-y-3">
                {guide.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-sm leading-5 text-slate-600 transition-colors hover:text-[#0284C7]">
                      {section.title.replace(/^\d+\.\s*/, "")}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#preguntas-frecuentes" className="text-sm leading-5 text-slate-600 transition-colors hover:text-[#0284C7]">
                    Preguntas frecuentes
                  </a>
                </li>
              </ol>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="text-xs leading-5 text-slate-500">
                  ¿Tienes el presupuesto a mano?
                </p>
                <Link href={comparisonUrl} className="mt-2 inline-block text-sm font-bold text-[#0284C7] hover:underline">
                  Compararlo gratis →
                </Link>
              </div>
            </nav>
          </aside>
        </article>

        <section aria-labelledby="guias-relacionadas" className="border-t border-slate-200 bg-slate-50 py-12 sm:py-16">
          <div className="mx-auto max-w-5xl px-4">
            <h2 id="guias-relacionadas" className="text-2xl font-bold tracking-tight text-slate-900">
              Guías relacionadas
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {relatedGuides.map((item) => (
                <Link
                  key={item.slug}
                  href={`/dental-care/${item.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#7DD3FC] hover:shadow-sm"
                >
                  <p className="text-sm font-bold leading-6 text-[#0C4A6E] group-hover:text-[#0284C7]">
                    {item.shortTitle}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Leer la guía →</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
