/* eslint-disable @next/next/no-img-element -- 投稿者の画像URLは事前に分からないため素の img を使う */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  countWorksByAuthor,
  getCategories,
  getWork,
  getWorkUpdates,
  listWorks,
  listWorksByAuthor,
} from "@/lib/data";
import { audienceLabel, deviceLabel, formatDate, safeUrl, tint } from "@/lib/labels";
import { site, siteUrl } from "@/lib/site";
import type { Work } from "@/lib/types";
import { ExternalIcon, HeartIcon } from "@/components/icons";
import { WorkCard } from "@/components/WorkCard";

export const revalidate = 120;

export async function generateStaticParams() {
  return []; // 最初のアクセス時に作って、以後はキャッシュ
}

export async function generateMetadata({ params }: PageProps<"/works/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) return { title: "作品が見つかりません" };
  const desc = work.description
    ? `${work.tagline}。${work.description.replace(/\s+/g, " ").slice(0, 90)}`
    : work.tagline;
  const image = work.screenshots?.[0] ?? work.icon_url ?? undefined;
  return {
    title: `${work.name} — ${work.tagline}`,
    description: desc,
    alternates: { canonical: `/works/${work.slug}` },
    openGraph: {
      title: `${work.name} | ${site.name}`,
      description: work.tagline,
      url: `/works/${work.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function jsonLd(work: Work, categoryName: string) {
  const os = [
    work.app_store_url && "iOS",
    work.google_play_url && "Android",
    work.web_url && "Web",
    work.download_url && "Windows, macOS",
  ].filter(Boolean);
  const url = `${siteUrl()}/works/${work.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": work.device === "phone" ? "MobileApplication" : work.web_url ? "WebApplication" : "SoftwareApplication",
        name: work.name,
        description: work.description ?? work.tagline,
        url,
        applicationCategory: categoryName,
        operatingSystem: os.length ? os.join(", ") : undefined,
        image: work.icon_url ?? undefined,
        screenshot: work.screenshots?.length ? work.screenshots : undefined,
        datePublished: work.published_at ?? undefined,
        dateModified: work.updated_at,
        author: work.author ? { "@type": "Person", name: work.author.display_name } : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl() },
          { "@type": "ListItem", position: 2, name: categoryName, item: `${siteUrl()}/category/${work.category_slug}` },
          { "@type": "ListItem", position: 3, name: work.name, item: url },
        ],
      },
    ],
  };
}

export default async function WorkPage({ params }: PageProps<"/works/[slug]">) {
  const { slug } = await params;
  const work = await getWork(slug);
  if (!work) notFound();

  const [categories, updates, others, authorCount, related] = await Promise.all([
    getCategories(),
    getWorkUpdates(work.id),
    listWorksByAuthor(work.author_id, work.id),
    countWorksByAuthor(work.author_id),
    listWorks({ category: work.category_slug, device: "all", audience: "all", sort: "new" }),
  ]);
  const catName = new Map(categories.map((c) => [c.slug, c.name]));
  const categoryName = catName.get(work.category_slug) ?? "その他";
  const t = tint(work.category_slug);
  const isBiz = work.audience === "business";
  const isPc = work.device !== "phone";
  const biz = work.business ?? {};
  const relatedWorks = related.filter((w) => w.id !== work.id).slice(0, 3);
  const features = Array.isArray(work.features) ? work.features.filter((f) => f?.title) : [];
  const recommended = (work.recommended_for ?? []).filter(Boolean);

  const appStore = safeUrl(work.app_store_url);
  const googlePlay = safeUrl(work.google_play_url);
  const web = safeUrl(work.web_url);
  const download = safeUrl(work.download_url);
  const docUrl = safeUrl(biz.doc_url);
  const contact = biz.contact
    ? biz.contact.includes("@") && !biz.contact.startsWith("http")
      ? `mailto:${biz.contact}`
      : safeUrl(biz.contact)
    : null;

  return (
    <main className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(work, categoryName)).replace(/</g, "\\u003c") }}
      />
      <nav className="crumbs" aria-label="パンくずリスト">
        <Link href="/">ホーム</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/category/${work.category_slug}`}>{categoryName}</Link>
        <span aria-hidden="true">›</span>
        <span style={{ color: "var(--ink)" }}>{work.name}</span>
      </nav>

      <section className="work-head">
        <div className="work-icon" style={{ background: t.bg, color: t.fg }}>
          {work.icon_url ? <img src={work.icon_url} alt="" /> : work.name.slice(0, 1)}
        </div>
        <div className="work-head__main">
          <div className="chips">
            {isBiz && <span className="badge badge--dark">法人向け</span>}
            <span className="badge badge--outline">{deviceLabel(work.device)}</span>
          </div>
          <h1>{work.name}</h1>
          <p className="work-head__tagline">{work.tagline}</p>
          <div className="chips">
            <Link href={`/category/${work.category_slug}`} className="chip">
              {categoryName}
            </Link>
            {(work.tags ?? []).map((tag) => (
              <span key={tag} className="chip">
                #{tag}
              </span>
            ))}
          </div>
          <div className="actions">
            {appStore && (
              <a className="btn btn--accent" href={appStore} target="_blank" rel="noopener">
                App Store で見る
              </a>
            )}
            {googlePlay && (
              <a className="btn btn--accent" href={googlePlay} target="_blank" rel="noopener">
                Google Play で見る
              </a>
            )}
            {web && (
              <a className="btn btn--accent" href={web} target="_blank" rel="noopener">
                {isBiz ? "無料で試す（ブラウザで開く）" : "ブラウザで使う"} <ExternalIcon />
              </a>
            )}
            {download && (
              <a className={web ? "btn btn--outline" : "btn btn--accent"} href={download} target="_blank" rel="noopener">
                ダウンロード
              </a>
            )}
            {isBiz && docUrl && (
              <a className="btn btn--outline" href={docUrl} target="_blank" rel="noopener">
                資料をダウンロード
              </a>
            )}
            {isBiz && contact && (
              <a className="btn btn--ghost" href={contact} target="_blank" rel="noopener">
                導入の相談・問い合わせ
              </a>
            )}
            <span className="btn btn--ghost" aria-label={`応援 ${work.cheer_count}`}>
              <HeartIcon /> {work.cheer_count}
            </span>
          </div>
        </div>
      </section>

      {work.screenshots?.length > 0 && (
        <section className="shots" aria-label="スクリーンショット">
          {work.screenshots.map((src, i) =>
            isPc && work.device === "pc" ? (
              <figure key={src} className="shot-pc" style={{ margin: 0 }}>
                <div className="shot-pc__bar" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <img src={src} alt={`${work.name}の画面 ${i + 1}`} loading={i > 1 ? "lazy" : undefined} />
              </figure>
            ) : (
              <div key={src} className="shot-phone">
                <img src={src} alt={`${work.name}の画面 ${i + 1}`} loading={i > 2 ? "lazy" : undefined} />
              </div>
            ),
          )}
        </section>
      )}

      <div className="work-body">
        <article className="work-main">
          {work.description && (
            <section>
              <h2 className="section-title">{isBiz ? "どんなツール？" : "どんな作品？"}</h2>
              <p className="prose">{work.description}</p>
            </section>
          )}
          {recommended.length > 0 && (
            <section>
              <h2 className="section-title">{isBiz ? "こんな会社におすすめ" : "こんな人におすすめ"}</h2>
              <ul className="prose-list">
                {recommended.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {features.length > 0 && (
            <section>
              <h2 className="section-title">主な機能</h2>
              <div className="features">
                {features.map((f) => (
                  <div key={f.title} className="feature">
                    <h3>{f.title}</h3>
                    {f.body && <p>{f.body}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {isBiz && biz.plans && biz.plans.length > 0 && (
            <section>
              <h2 className="section-title">料金プラン</h2>
              <div className="plans">
                {biz.plans.map((p) => (
                  <div key={p.name} className="plan">
                    <span className="plan__name">{p.name}</span>
                    <span className="plan__price">{p.price}</span>
                    {p.note && <span className="plan__note">{p.note}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}
          {work.maker_note && (
            <section className="note-box">
              <h2>作った人のひとこと</h2>
              <p>{work.maker_note}</p>
            </section>
          )}
          {updates.length > 0 && (
            <section>
              <h2 className="section-title">アップデート履歴</h2>
              <div className="updates">
                {updates.map((u) => (
                  <div key={u.id} className="update">
                    <span className="update__date">{formatDate(u.released_on)}</span>
                    <span className="update__ver">{u.version}</span>
                    <span>{u.note}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="work-side">
          {isPc && work.environments?.length > 0 && (
            <div className="panel">
              <h2>動作環境</h2>
              <dl className="facts">
                <dt>使う場所</dt>
                <dd>{deviceLabel(work.device)}</dd>
                <dt>対応</dt>
                <dd>{work.environments.join(" / ")}</dd>
              </dl>
            </div>
          )}
          <div className="panel">
            <h2>{isBiz ? "導入について" : "基本情報"}</h2>
            <dl className="facts">
              <dt>対象</dt>
              <dd>{audienceLabel(work.audience)}</dd>
              {work.price_text && (
                <>
                  <dt>価格</dt>
                  <dd>{work.price_text}</dd>
                </>
              )}
              {isBiz && biz.trial && (
                <>
                  <dt>無料期間</dt>
                  <dd>{biz.trial}</dd>
                </>
              )}
              {isBiz && biz.operator && (
                <>
                  <dt>運営</dt>
                  <dd>{biz.operator}</dd>
                </>
              )}
              {work.published_at && (
                <>
                  <dt>掲載日</dt>
                  <dd>{formatDate(work.published_at)}</dd>
                </>
              )}
              <dt>最終更新</dt>
              <dd>{formatDate(work.updated_at)}</dd>
            </dl>
            {isBiz && contact && (
              <a className="btn btn--dark btn--sm" style={{ width: "100%", marginTop: 16 }} href={contact} target="_blank" rel="noopener">
                導入の相談・問い合わせ
              </a>
            )}
          </div>

          {work.author && (
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="author">
                <span className="avatar">
                  {work.author.avatar_url ? <img src={work.author.avatar_url} alt="" /> : work.author.display_name.slice(0, 1)}
                </span>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800 }}>{work.author.display_name}</p>
                  <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{authorCount}作品を公開中</p>
                </div>
              </div>
              {work.author.bio && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink-3)" }}>{work.author.bio}</p>}
            </div>
          )}

          {others.length > 0 && (
            <div className="panel">
              <h2>この作者のほかの作品</h2>
              <div className="mini-list">
                {others.map((o) => {
                  const ot = tint(o.category_slug);
                  return (
                    <Link key={o.id} href={`/works/${o.slug}`} className="mini">
                      <span className="mini__icon" style={{ background: ot.bg, color: ot.fg }}>
                        {o.icon_url ? <img src={o.icon_url} alt="" loading="lazy" /> : o.name.slice(0, 1)}
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{o.name}</span>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{catName.get(o.category_slug)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {relatedWorks.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div className="list-head" style={{ marginTop: 0 }}>
            <h2>{categoryName}の作品をもっと見る</h2>
            <Link href={`/category/${work.category_slug}`} style={{ fontSize: 14, fontWeight: 700 }}>
              すべて見る →
            </Link>
          </div>
          <div className="grid">
            {relatedWorks.map((w) => (
              <WorkCard key={w.id} work={w} categoryName={catName.get(w.category_slug) ?? "その他"} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
