import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { formatDate, stageLabel } from "@/lib/labels";
import type { Stage } from "@/lib/types";
import { ProfileForm } from "./ProfileForm";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "マイページ", robots: { index: false } };

type MyWork = { id: string; slug: string; name: string; tagline: string; status: string; stage: Stage; updated_at: string; cheer_count: number };

export default async function MePage({ searchParams }: PageProps<"/me">) {
  const { sb, user } = await getCurrentUser();
  if (!user) redirect("/login?next=/me");
  const sp = await searchParams;

  const { data: profile } = await sb
    .from("tm_profiles")
    .select("handle, display_name, bio")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <main className="container narrow">
        <h1 className="page-title">はじめまして！</h1>
        <p className="page-lead">作品ページに表示される、作者としてのプロフィールを作りましょう。</p>
        <ProfileForm />
      </main>
    );
  }

  const { data } = await sb
    .from("tm_works")
    .select("id, slug, name, tagline, status, stage, updated_at, cheer_count")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });
  const works = (data ?? []) as MyWork[];

  return (
    <main className="container">
      <div className="me-head">
        <div>
          <h1 className="page-title">{profile.display_name} さんの作品</h1>
          <p className="page-lead">公開中 {works.filter((w) => w.status === "published").length} ・ 下書き {works.filter((w) => w.status !== "published").length}</p>
        </div>
        <div className="actions" style={{ marginTop: 0 }}>
          <Link href="/submit" className="btn btn--accent">
            ＋ 作品を載せる
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn--ghost">
              ログアウト
            </button>
          </form>
        </div>
      </div>

      {sp.saved === "draft" && (
        <p className="form-ok" role="status">
          下書きを保存しました。公開するときは「編集」から「公開する」を押してください。
        </p>
      )}

      {works.length === 0 ? (
        <div className="empty">
          <strong>まだ作品がありません</strong>
          右上の「作品を載せる」から、最初の作品を登録しましょう。
        </div>
      ) : (
        <ul className="my-works">
          {works.map((w) => {
            const stage = stageLabel(w.stage);
            return (
              <li key={w.id} className="my-work">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="chips" style={{ marginBottom: 6 }}>
                    {w.status === "published" ? (
                      <span className="badge badge--outline">公開中</span>
                    ) : (
                      <span className="badge badge--draft">下書き</span>
                    )}
                    {stage && <span className="badge badge--stage">{stage}</span>}
                  </div>
                  <p className="my-work__name">{w.name}</p>
                  <p className="my-work__meta">
                    {w.tagline} ・ 更新 {formatDate(w.updated_at)} ・ 応援 {w.cheer_count}
                  </p>
                </div>
                <div className="actions" style={{ marginTop: 0 }}>
                  {w.status === "published" && (
                    <Link href={`/works/${w.slug}`} className="btn btn--ghost btn--sm">
                      見る
                    </Link>
                  )}
                  <Link href={`/me/works/${w.id}/edit`} className="btn btn--dark btn--sm">
                    編集
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
