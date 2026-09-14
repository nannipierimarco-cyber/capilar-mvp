import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const GOOGLE_ADS_ID = "AW-18449719988";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Capilar — Tratamiento capilar desde casa",
  description:
    "Evalúa tu caso, habla con un médico y recibe tu tratamiento mensual a domicilio. Minoxidil, dutasteride y más, coordinados por especialistas.",
  verification: {
    other: {
      "facebook-domain-verification": "byb5izhqm0hsnmx9jztx87rutuvzus",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-ads-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ADS_ID}');
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
