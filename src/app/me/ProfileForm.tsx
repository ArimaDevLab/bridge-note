"use client";

import { useActionState } from "react";
import { saveProfile, type ActionResult } from "./actions";

export function ProfileForm() {
  const [state, action, pending] = useActionState<ActionResult, FormData>(saveProfile, undefined);
  return (
    <form action={action} className="card-plain stack">
      <label className="field">
        表示名 <span className="hint">作品ページに出る名前です</span>
        <input name="display_name" required maxLength={50} placeholder="例：ArimaDevLab" />
      </label>
      <label className="field">
        URL用の名前 <span className="hint">半角の英小文字・数字・アンダーバー（3〜30文字）</span>
        <input name="handle" required pattern="[a-z0-9_]{3,30}" placeholder="例：arima" />
      </label>
      <label className="field">
        ひとことの自己紹介 <span className="hint">なくても大丈夫です（300文字まで）</span>
        <textarea name="bio" maxLength={300} rows={3} />
      </label>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn--accent" disabled={pending}>
        {pending ? "保存しています…" : "プロフィールを作る"}
      </button>
    </form>
  );
}
