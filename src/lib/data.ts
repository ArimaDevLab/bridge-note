import { unstable_cache } from "next/cache";
import { getSupabase } from "./supabase";
import type { Category, Work, WorkSummary, WorkUpdate } from "./types";

const REVALIDATE = 120; // 秒。投稿が一覧に反映されるまでの最大待ち時間

const SUMMARY_COLUMNS =
  "id, slug, name, tagline, category_slug, device, audience, icon_url, screenshots, app_store_url, google_play_url, web_url, download_url, cheer_count, published_at, author:tm_profiles(handle, display_name, avatar_url)";

export type DeviceFilter = "all" | "phone" | "pc";
export type AudienceFilter = "all" | "personal" | "business";
export type SortOrder = "new" | "popular";

export type ListParams = {
  category?: string;
  device: DeviceFilter;
  audience: AudienceFilter;
  sort: SortOrder;
};

/** カテゴリ一覧（データベースにつながらないときは既定の8つ） */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb
        .from("tm_categories")
        .select("slug, name, sort")
        .order("sort");
      if (!error && data && data.length > 0) return data;
      if (error) console.error("getCategories", error.message);
    }
    return FALLBACK_CATEGORIES;
  },
  ["tm-categories"],
  { revalidate: 3600, tags: ["categories"] },
);

export const listWorks = unstable_cache(
  async (params: ListParams): Promise<WorkSummary[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    let q = sb
      .from("tm_works")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .limit(60);
    if (params.category) q = q.eq("category_slug", params.category);
    if (params.device === "phone") q = q.in("device", ["phone", "both"]);
    if (params.device === "pc") q = q.in("device", ["pc", "both"]);
    if (params.audience !== "all") q = q.eq("audience", params.audience);
    q =
      params.sort === "popular"
        ? q.order("cheer_count", { ascending: false }).order("published_at", { ascending: false })
        : q.order("published_at", { ascending: false });
    const { data, error } = await q;
    if (error) {
      console.error("listWorks", error.message);
      return [];
    }
    return (data ?? []) as unknown as WorkSummary[];
  },
  ["tm-list-works"],
  { revalidate: REVALIDATE, tags: ["works"] },
);

export const getWork = unstable_cache(
  async (slug: string): Promise<Work | null> => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from("tm_works")
      .select(
        "*, author:tm_profiles(handle, display_name, bio, avatar_url)",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) {
      console.error("getWork", error.message);
      return null;
    }
    return data as unknown as Work | null;
  },
  ["tm-get-work"],
  { revalidate: REVALIDATE, tags: ["works"] },
);

export const getWorkUpdates = unstable_cache(
  async (workId: string): Promise<WorkUpdate[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from("tm_work_updates")
      .select("id, version, note, released_on")
      .eq("work_id", workId)
      .order("released_on", { ascending: false })
      .limit(20);
    if (error) {
      console.error("getWorkUpdates", error.message);
      return [];
    }
    return data ?? [];
  },
  ["tm-work-updates"],
  { revalidate: REVALIDATE, tags: ["works"] },
);

/** 同じ作者のほかの作品 */
export const listWorksByAuthor = unstable_cache(
  async (authorId: string, excludeId: string): Promise<WorkSummary[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb
      .from("tm_works")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .eq("author_id", authorId)
      .neq("id", excludeId)
      .order("published_at", { ascending: false })
      .limit(4);
    if (error) {
      console.error("listWorksByAuthor", error.message);
      return [];
    }
    return (data ?? []) as unknown as WorkSummary[];
  },
  ["tm-works-by-author"],
  { revalidate: REVALIDATE, tags: ["works"] },
);

export const countWorksByAuthor = unstable_cache(
  async (authorId: string): Promise<number> => {
    const sb = getSupabase();
    if (!sb) return 0;
    const { count } = await sb
      .from("tm_works")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("author_id", authorId);
    return count ?? 0;
  },
  ["tm-count-by-author"],
  { revalidate: REVALIDATE, tags: ["works"] },
);

/** サイトマップ用 */
export const listAllWorkSlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string }[]> => {
    const sb = getSupabase();
    if (!sb) return [];
    const { data } = await sb
      .from("tm_works")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(5000);
    return data ?? [];
  },
  ["tm-all-slugs"],
  { revalidate: 3600, tags: ["works"] },
);

const FALLBACK_CATEGORIES: Category[] = [
  { slug: "game", name: "ゲーム", sort: 1 },
  { slug: "productivity", name: "仕事効率化", sort: 2 },
  { slug: "life", name: "生活・家計", sort: 3 },
  { slug: "learning", name: "学習", sort: 4 },
  { slug: "creative", name: "クリエイティブ", sort: 5 },
  { slug: "ai", name: "AI", sort: 6 },
  { slug: "dev-tools", name: "開発者ツール", sort: 7 },
  { slug: "other", name: "その他", sort: 8 },
];

export function parseListParams(
  sp: { [key: string]: string | string[] | undefined },
  category?: string,
): ListParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const device = one(sp.device);
  const audience = one(sp.aud);
  const sort = one(sp.sort);
  return {
    category,
    device: device === "phone" || device === "pc" ? device : "all",
    audience: audience === "personal" || audience === "business" ? audience : "all",
    sort: sort === "popular" ? "popular" : "new",
  };
}
