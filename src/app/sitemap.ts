import type { MetadataRoute } from "next";
import { getCategories, listAllWorkSlugs } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [categories, works] = await Promise.all([getCategories(), listAllWorkSlugs()]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({
      url: `${base}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...works.map((w) => ({
      url: `${base}/works/${w.slug}`,
      lastModified: new Date(w.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
