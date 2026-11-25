"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function github() {
    setBusy(true);
    setError(null);
    const sb = createBrowserSupabase();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setError("GitHub でのログインを始められませんでした。");
      setBusy(false);
    }
  }

  async function password(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const sb = createBrowserSupabase();
    const { error } = await sb.auth.signInWithPassword({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (error) {
      setError("メールアドレスかパスワードが違います。");
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="card-plain stack">
      <button type="button" className="btn btn--dark" onClick={github} disabled={busy} style={{ width: "100%" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.3 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .5z" />
        </svg>
        GitHub でログイン
      </button>
      <div className="divider">
        <span>メールアドレスでログイン</span>
      </div>
      <form onSubmit={password} className="stack">
        <label className="field">
          メールアドレス
          <input type="email" name="email" autoComplete="email" required />
        </label>
        <label className="field">
          パスワード
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="btn btn--accent" disabled={busy}>
          ログイン
        </button>
        <Link href="/forgot-password" className="hint" style={{ textDecoration: "underline", alignSelf: "flex-start" }}>
          パスワードを忘れた方
        </Link>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <p className="hint">はじめての方は「GitHub でログイン」から始められます。</p>
    </div>
  );
}
