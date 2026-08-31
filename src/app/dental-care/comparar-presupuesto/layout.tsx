import type { Metadata } from "next";

const PAGE_URL = "https://perfectolabs.cl/dental-care/comparar-presupuesto";
const OG_IMAGE_URL = "https://perfectolabs.cl/dental-quote-compare-og.jpg";

export const metadata: Metadata = {
  title: "Compara tu cotización dental gratis | Perfecto Labs",
  description:
    "Sube tu cotización dental y recibe una alternativa competitiva de clínicas seleccionadas. Gratis, sin compromiso y por WhatsApp.",
  openGraph: {
    title: "¿Ya tienes una cotización dental? Compárala gratis",
    description:
      "Sube tu presupuesto y busca una alternativa más competitiva. Gratis, sin compromiso y con respuesta por WhatsApp.",
    url: PAGE_URL,
    siteName: "Perfecto Labs",
    type: "website",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Compara tu cotización dental gratis | Perfecto Labs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "¿Ya tienes una cotización dental? Compárala gratis",
    description:
      "Sube tu presupuesto y busca una alternativa más competitiva. Gratis, sin compromiso y con respuesta por WhatsApp.",
    images: [OG_IMAGE_URL],
  },
};

export default function CompararPresupuestoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
