import type { MetadataRoute } from "next";
import { dentalGuides } from "@/lib/dentalSeoGuides";

const SITE_URL = "https://perfectolabs.cl";
const LAST_UPDATED = new Date("2026-09-21T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  const guideEntries: MetadataRoute.Sitemap = dentalGuides.map((guide) => ({
    url: `${SITE_URL}/dental-care/${guide.slug}`,
    lastModified: LAST_UPDATED,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: LAST_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/dental-care`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/dental-care/comparar-presupuesto`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...guideEntries,
  ];
}
