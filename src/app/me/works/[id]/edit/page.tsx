import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { getCategories } from "@/lib/data";
import { WorkForm } from "@/components/WorkForm";
import type { Work } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "作品を編集", robots: { index: false } };

export default async function EditPage({ params }: PageProps<"/me/works/[id]/edit">) {
  const { id } = await params;
  const { sb, user } = await getCurrentUser();
  if (!user) redirect(`/login?next=/me/works/${id}/edit`);
  const { data } = await sb.from("tm_works").select("*").eq("id", id).eq("author_id", user.id).maybeSingle();
  if (!data) notFound();
  const categories = await getCategories();
  return (
    <main className="container">
      <h1 className="page-title">作品を編集</h1>
      <p className="page-lead">「{(data as Work).name}」の内容を直せます。</p>
      <WorkForm categories={categories} userId={user.id} initial={data as Work} />
    </main>
  );
}
