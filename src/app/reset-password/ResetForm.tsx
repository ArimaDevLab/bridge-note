"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export function ResetForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    setError(null);
    if (password.length < 8) return setError("パスワードは8文字以上にしてください。");
    if (password !== confirm) return setError("確認用のパスワードが一致しません。");
    setBusy(true);
    const sb = createBrowserSupabase();
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(
        error.code === "same_password"
          ? "前と同じパスワードは使えません。"
          : "パスワードを変えられませんでした。リンクの有効期限が切れている場合は、もう一度メールを送ってください。",
      );
      return;
    }
    router.replace("/me");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card-plain stack">
      <label className="field">
        新しいパスワード <span className="hint">8文字以上</span>
        <input type="password" name="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label className="field">
        もう一度入力
        <input type="password" name="confirm" autoComplete="new-password" minLength={8} required />
      </label>
      <button type="submit" className="btn btn--accent" disabled={busy}>
        {busy ? "保存しています…" : "パスワードを変える"}
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
