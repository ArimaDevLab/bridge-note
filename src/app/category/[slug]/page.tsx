import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/Listing";
import { getCategories, parseListParams } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return {
    title: `${cat.name}のアプリ・ツール`,
    description: `個人や小さなチームが作った${cat.name}のアプリ・ゲーム・ツールの一覧。作った人の言葉と一緒に紹介しています。`,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp, categories] = await Promise.all([params, searchParams, getCategories()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  return (
    <>
      <section className="hero container" style={{ paddingBottom: 24 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>{cat.name}の作品</h1>
        <p>個人や小さなチームが作った、{cat.name}のアプリ・ツールを集めています。</p>
      </section>
      <Listing params={parseListParams(sp, slug)} categories={categories} heading={`${cat.name}の作品`} />
    </>
  );
}
