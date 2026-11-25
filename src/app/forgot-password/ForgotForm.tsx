"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setBusy(true);
    setError(null);
    const sb = createBrowserSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "短い時間に何度も送ったため、いまは送れません。しばらく待ってからお試しください。"
          : "メールを送れませんでした。時間をおいてもう一度お試しください。",
      );
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card-plain stack" role="status">
        <p style={{ fontWeight: 800 }}>メールを送りました</p>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink-3)" }}>
          登録されているメールアドレスなら、数分でリンクが届きます。届いたメールのリンクを、このページを開いたのと同じブラウザで開いてください。迷惑メールのフォルダも確かめてみてください。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-plain stack">
      <label className="field">
        メールアドレス
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <button type="submit" className="btn btn--accent" disabled={busy}>
        {busy ? "送っています…" : "リンクを送る"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
