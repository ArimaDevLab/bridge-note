import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

export const metadata: Metadata = { title: "パスワードを忘れた方", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="container narrow">
      <h1 className="page-title">パスワードを忘れた方</h1>
      <p className="page-lead">
        登録したメールアドレスに、パスワードを決め直すためのリンクを送ります。
      </p>
      <ForgotForm />
      <p className="hint" style={{ marginTop: 16 }}>
        <Link href="/login" style={{ textDecoration: "underline" }}>
          ログインに戻る
        </Link>
      </p>
    </main>
  );
}
