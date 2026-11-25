export const site = {
  name: "Bridge Note",
  volume: "vol.0.1",
  tagline: "作ったものを、作った人から。",
  description:
    "個人や小さなチームが作ったアプリ・ゲーム・ツールが集まる場所。作った人と、それを伝えたい人をつなぎます。",
};

/** 末尾スラッシュなしの公開URL */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
