import { getCategories, getWork } from "@/lib/data";
import { audienceLabel, deviceLabel, stageLabel } from "@/lib/labels";
import { OG_SIZE, renderOgImage } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name} の作品紹介`;
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return renderOgImage({ title: site.name, subtitle: site.tagline });
  const cat = (await getCategories()).find((c) => c.slug === work.category_slug)?.name;
  const stage = stageLabel(work.stage);
  return renderOgImage({
    title: work.name,
    subtitle: work.tagline,
    badges: [cat, deviceLabel(work.device), work.audience === "business" ? audienceLabel(work.audience) : null, stage].filter(
      (b): b is string => Boolean(b),
    ),
    image: work.thumbnail_url ?? work.screenshots?.[0] ?? null,
  });
}
