export type Device = "phone" | "pc" | "both";
export type Audience = "personal" | "business";
export type Stage = "released" | "beta" | "prototype" | "preparing";

export type MediaMention = { outlet: string; title?: string; url?: string; date?: string };

export type Category = {
  slug: string;
  name: string;
  sort: number;
};

export type Author = {
  handle: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
};

export type Feature = { title: string; body: string };

export type Plan = { name: string; price: string; note?: string };

export type BusinessInfo = {
  doc_url?: string;
  contact?: string;
  trial?: string;
  operator?: string;
  plans?: Plan[];
};

export type WorkSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category_slug: string;
  device: Device;
  audience: Audience;
  stage: Stage;
  icon_url: string | null;
  thumbnail_url: string | null;
  screenshots: string[];
  app_store_url: string | null;
  google_play_url: string | null;
  web_url: string | null;
  download_url: string | null;
  cheer_count: number;
  published_at: string | null;
  author: Author | null;
};

export type Work = WorkSummary & {
  author_id: string;
  description: string | null;
  recommended_for: string[];
  features: Feature[];
  maker_note: string | null;
  tags: string[];
  environments: string[];
  price_text: string | null;
  business: BusinessInfo | null;
  official_url: string | null;
  media_mentions: MediaMention[];
  updated_at: string;
};

export type WorkUpdate = {
  id: string;
  version: string | null;
  note: string;
  released_on: string;
};
