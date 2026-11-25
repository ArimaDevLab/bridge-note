import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { getCategories } from "@/lib/data";
import { WorkForm } from "@/components/WorkForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "作品を載せる", robots: { index: false } };

export default async function SubmitPage() {
  const { sb, user } = await getCurrentUser();
  if (!user) redirect("/login?next=/submit");
  const { data: profile } = await sb.from("tm_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/me");
  const categories = await getCategories();
  return (
    <main className="container">
      <h1 className="page-title">作品を載せる</h1>
      <p className="page-lead">入力した内容がそのまま作品ページになります。あとからいつでも直せます。</p>
      <WorkForm categories={categories} userId={user.id} />
    </main>
  );
}
