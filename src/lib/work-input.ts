import type { Audience, BusinessInfo, Device, Feature, Plan, Stage } from "./types";

/** 投稿フォームからサーバーへ送る形 */
export type WorkInput = {
  id?: string;
  slug: string;
  name: string;
  tagline: string;
  category_slug: string;
  device: Device;
  audience: Audience;
  stage: Stage;
  description: string;
  recommended_for: string[];
  features: Feature[];
  maker_note: string;
  tags: string[];
  icon_url: string | null;
  thumbnail_url: string | null;
  screenshots: string[];
  app_store_url: string;
  google_play_url: string;
  web_url: string;
  download_url: string;
  official_url: string;
  environments: string[];
  price_text: string;
  business: BusinessInfo | null;
  status: "draft" | "published";
};

export const LIMITS = {
  name: 60,
  tagline: 40,
  description: 3000,
  maker_note: 1000,
  tags: 5,
  screenshots: 6,
  recommended: 3,
  features: 6,
  plans: 3,
};

const isUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const cleanUrl = (v: unknown) => {
  const s = clean(v, 500);
  return s && isUrl(s) ? s : null;
};
const cleanList = (v: unknown, n: number, max: number) =>
  Array.isArray(v) ? v.map((x) => clean(x, max)).filter(Boolean).slice(0, n) : [];

export type Validated = { ok: true; row: Record<string, unknown> } | { ok: false; error: string };

/** サーバー側の入力チェック。データベースの制約より先に、わかりやすい言葉で止める */
export function validateWork(input: WorkInput, categories: string[]): Validated {
  const name = clean(input.name, LIMITS.name);
  const tagline = clean(input.tagline, LIMITS.tagline);
  const slug = clean(input.slug, 60).toLowerCase();
  if (!name) return { ok: false, error: "作品名を入れてください。" };
  if (!tagline) return { ok: false, error: "「ひとことで言うと？」を入れてください。" };
  if (!/^[a-z0-9-]{2,60}$/.test(slug))
    return { ok: false, error: "URLの名前は、半角の英小文字・数字・ハイフンで2〜60文字にしてください。" };
  if (!categories.includes(input.category_slug)) return { ok: false, error: "カテゴリを選んでください。" };
  if (!["phone", "pc", "both"].includes(input.device)) return { ok: false, error: "使う場所を選んでください。" };
  if (!["personal", "business"].includes(input.audience)) return { ok: false, error: "対象を選んでください。" };
  if (!["released", "beta", "prototype", "preparing"].includes(input.stage))
    return { ok: false, error: "公開の段階を選んでください。" };

  const urls = ["app_store_url", "google_play_url", "web_url", "download_url", "official_url"] as const;
  for (const k of urls) {
    const v = clean(input[k], 500);
    if (v && !isUrl(v)) return { ok: false, error: "URLは https:// から始まる形で入れてください。" };
  }

  const features = (Array.isArray(input.features) ? input.features : [])
    .map((f) => ({ title: clean(f?.title, 40), body: clean(f?.body, 120) }))
    .filter((f) => f.title)
    .slice(0, LIMITS.features);

  let business: BusinessInfo | null = null;
  if (input.audience === "business" && input.business) {
    const plans: Plan[] = (Array.isArray(input.business.plans) ? input.business.plans : [])
      .map((p) => ({ name: clean(p?.name, 30), price: clean(p?.price, 30), note: clean(p?.note, 80) }))
      .filter((p) => p.name)
      .slice(0, LIMITS.plans);
    const contact = clean(input.business.contact, 200);
    business = {
      doc_url: cleanUrl(input.business.doc_url) ?? undefined,
      contact: contact || undefined,
      trial: clean(input.business.trial, 40) || undefined,
      operator: clean(input.business.operator, 60) || undefined,
      plans,
    };
  }

  const screenshots = cleanList(input.screenshots, LIMITS.screenshots, 500).filter(isUrl);

  return {
    ok: true,
    row: {
      slug,
      name,
      tagline,
      category_slug: input.category_slug,
      device: input.device,
      audience: input.audience,
      stage: input.stage,
      description: clean(input.description, LIMITS.description) || null,
      recommended_for: cleanList(input.recommended_for, LIMITS.recommended, 80),
      features,
      maker_note: clean(input.maker_note, LIMITS.maker_note) || null,
      tags: cleanList(
        input.tags.map((t) => t.replace(/^#/, "")),
        LIMITS.tags,
        20,
      ),
      icon_url: cleanUrl(input.icon_url),
      thumbnail_url: cleanUrl(input.thumbnail_url),
      screenshots,
      app_store_url: input.device === "pc" ? null : cleanUrl(input.app_store_url),
      google_play_url: input.device === "pc" ? null : cleanUrl(input.google_play_url),
      web_url: cleanUrl(input.web_url),
      download_url: cleanUrl(input.download_url),
      official_url: cleanUrl(input.official_url),
      environments: cleanList(input.environments, 8, 40),
      price_text: clean(input.price_text, 60) || null,
      business,
      status: input.status === "published" ? "published" : "draft",
    },
  };
}
