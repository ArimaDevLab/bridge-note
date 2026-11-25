import Link from "next/link";
import type { Category } from "@/lib/types";
import { listWorks, type ListParams } from "@/lib/data";
import { WorkCard } from "./WorkCard";

/** 絞り込み条件をURLに直す（カテゴリはパス、ほかはクエリ） */
function href(p: ListParams, patch: Partial<ListParams>): string {
  const n = { ...p, ...patch };
  const path = n.category ? `/category/${n.category}` : "/";
  const q = new URLSearchParams();
  if (n.device !== "all") q.set("device", n.device);
  if (n.audience !== "all") q.set("aud", n.audience);
  if (n.sort !== "new") q.set("sort", n.sort);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

const DEVICE_OPTS = [
  ["all", "すべて"],
  ["phone", "スマホ"],
  ["pc", "PC"],
] as const;

const AUD_OPTS = [
  ["all", "すべて"],
  ["personal", "個人向け"],
  ["business", "法人向け"],
] as const;

export async function Listing({
  params,
  categories,
  heading,
}: {
  params: ListParams;
  categories: Category[];
  heading: string;
}) {
  const works = await listWorks(params);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <>
      <div className="filters">
        <nav className="tabs" aria-label="カテゴリ">
          <Link
            href={href(params, { category: undefined })}
            className="tab"
            aria-current={!params.category ? "page" : undefined}
          >
            すべて
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={href(params, { category: c.slug })}
              className="tab"
              aria-current={params.category === c.slug ? "page" : undefined}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="subfilters">
          <div className="seg-group" role="group" aria-label="使う場所">
            <span className="seg-label">使う場所</span>
            <div className="seg">
              {DEVICE_OPTS.map(([v, label]) => (
                <Link
                  key={v}
                  href={href(params, { device: v })}
                  aria-current={params.device === v ? "true" : undefined}
                  rel="nofollow"
                  scroll={false}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="seg-group" role="group" aria-label="対象">
            <span className="seg-label">対象</span>
            <div className="seg">
              {AUD_OPTS.map(([v, label]) => (
                <Link
                  key={v}
                  href={href(params, { audience: v })}
                  aria-current={params.audience === v ? "true" : undefined}
                  rel="nofollow"
                  scroll={false}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="container">
        <div className="list-head">
          <h2>{heading}</h2>
          <div className="sort" aria-label="並び順">
            <Link href={href(params, { sort: "new" })} aria-current={params.sort === "new" ? "true" : undefined} rel="nofollow" scroll={false}>
              新着順
            </Link>
            <span aria-hidden="true">・</span>
            <Link href={href(params, { sort: "popular" })} aria-current={params.sort === "popular" ? "true" : undefined} rel="nofollow" scroll={false}>
              人気順
            </Link>
          </div>
        </div>

        {works.length > 0 ? (
          <div className="grid">
            {works.map((w) => (
              <WorkCard key={w.id} work={w} categoryName={catName.get(w.category_slug) ?? "その他"} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>まだ作品がありません</strong>
            {params.category || params.device !== "all" || params.audience !== "all"
              ? "条件を変えて探してみてください。"
              : "最初の作品が届くのを待っています。"}
          </div>
        )}
      </main>
    </>
  );
}
