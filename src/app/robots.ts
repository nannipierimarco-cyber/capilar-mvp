import type { MetadataRoute } from "next";

const PRIVATE_OR_LOW_VALUE_ROUTES = [
  "/admin",
  "/api",
  "/checkout",
  "/doctor",
  "/results",
  "/success",
  "/dental/analizando",
  "/evaluacion-piel/gracias",
  "/mapa-capilar/analizando",
  "/mapa-capilar/reporte",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_OR_LOW_VALUE_ROUTES,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: PRIVATE_OR_LOW_VALUE_ROUTES,
      },
      {
        userAgent: ["Claude-SearchBot", "Claude-User"],
        allow: "/",
        disallow: PRIVATE_OR_LOW_VALUE_ROUTES,
      },
    ],
    sitemap: "https://perfectolabs.cl/sitemap.xml",
    host: "https://perfectolabs.cl",
  };
}
