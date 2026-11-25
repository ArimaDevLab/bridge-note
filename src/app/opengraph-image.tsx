import { OG_SIZE, renderOgImage } from "@/lib/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    title: "作ったものを、作った人から。",
    subtitle: "個人開発のアプリ・ツールが見つかる場所",
  });
}
