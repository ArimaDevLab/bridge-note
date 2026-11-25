import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "ログイン", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/me";
  return (
    <main className="container narrow">
      <h1 className="page-title">ログイン</h1>
      <p className="page-lead">作品を載せたり編集したりするにはログインしてください。</p>
      {sp.error && <p className="form-error" role="alert">ログインできませんでした。もう一度お試しください。</p>}
      <LoginForm next={next} />
    </main>
  );
}
