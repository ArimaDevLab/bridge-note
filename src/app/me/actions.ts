"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { getCategories } from "@/lib/data";
import { validateWork, type WorkInput } from "@/lib/work-input";

export type ActionResult = { error: string } | undefined;

export async function saveProfile(_: ActionResult, fd: FormData): Promise<ActionResult> {
  const { sb, user } = await getCurrentUser();
  if (!user) redirect("/login");
  const handle = String(fd.get("handle") ?? "").trim().toLowerCase();
  const display_name = String(fd.get("display_name") ?? "").trim();
  const bio = String(fd.get("bio") ?? "").trim();
  if (!/^[a-z0-9_]{3,30}$/.test(handle))
    return { error: "URL用の名前は、半角の英小文字・数字・アンダーバーで3〜30文字にしてください。" };
  if (!display_name || display_name.length > 50) return { error: "表示名は1〜50文字で入れてください。" };
  if (bio.length > 300) return { error: "自己紹介は300文字までです。" };
  const { error } = await sb
    .from("tm_profiles")
    .upsert({ id: user.id, handle, display_name, bio: bio || null }, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") return { error: "そのURL用の名前はすでに使われています。別の名前にしてください。" };
    return { error: "保存できませんでした。時間をおいてもう一度お試しください。" };
  }
  updateTag("works");
  redirect("/me");
}

export async function saveWork(input: WorkInput): Promise<ActionResult> {
  const { sb, user } = await getCurrentUser();
  if (!user) return { error: "ログインが切れました。もう一度ログインしてください。" };

  const { data: profile } = await sb.from("tm_profiles").select("id").eq("id", user.id).maybeSingle();
  if (!profile) return { error: "先にマイページでプロフィールを作ってください。" };

  const categories = (await getCategories()).map((c) => c.slug);
  const v = validateWork(input, categories);
  if (!v.ok) return { error: v.error };

  const row = { ...v.row, author_id: user.id };
  const q = input.id
    ? sb.from("tm_works").update(row).eq("id", input.id).eq("author_id", user.id).select("slug, status").single()
    : sb.from("tm_works").insert(row).select("slug, status").single();
  const { data, error } = await q;
  if (error || !data) {
    if (error?.code === "23505") return { error: "そのURLの名前はほかの作品で使われています。別の名前にしてください。" };
    return { error: "保存できませんでした。入力内容を確かめて、もう一度お試しください。" };
  }

  updateTag("works");
  redirect(data.status === "published" ? `/works/${data.slug}` : "/me?saved=draft");
}

export async function deleteWork(id: string): Promise<ActionResult> {
  const { sb, user } = await getCurrentUser();
  if (!user) return { error: "ログインが切れました。" };
  const { error } = await sb.from("tm_works").delete().eq("id", id).eq("author_id", user.id);
  if (error) return { error: "削除できませんでした。" };
  updateTag("works");
  redirect("/me");
}

export async function signOut() {
  const { sb } = await getCurrentUser();
  await sb.auth.signOut();
  redirect("/");
}
