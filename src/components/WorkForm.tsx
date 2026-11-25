"use client";
/* eslint-disable @next/next/no-img-element -- アップロード直後の画像をそのまま表示するため */

import { useState, useTransition } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { deleteWork, saveWork } from "@/app/me/actions";
import { LIMITS, type WorkInput } from "@/lib/work-input";
import { deviceLabel, tint } from "@/lib/labels";
import type { Category, Device, Audience, Stage, Work, Feature, Plan } from "@/lib/types";
import { DeviceFrame } from "./DeviceFrame";

const DEVICES: [Device, string, string][] = [
  ["phone", "スマホ", "iPhone・Android のアプリ"],
  ["pc", "PC", "ブラウザや Windows・Mac で使う"],
  ["both", "両方", "どちらでも快適に使える"],
];
const AUDIENCES: [Audience, string, string][] = [
  ["personal", "個人向け", "一般の人に使ってほしい"],
  ["business", "法人向け", "会社や個人事業主に導入してほしい"],
];
const STAGES: [Stage, string][] = [
  ["released", "公開中"],
  ["beta", "ベータ版"],
  ["prototype", "試作"],
  ["preparing", "販売準備中"],
];
const ENVS = ["Chrome", "Edge", "Safari", "Chrome 拡張機能", "Windows アプリ", "Mac アプリ", "kintone"];

function emptyInput(categories: Category[]): WorkInput {
  return {
    slug: "",
    name: "",
    tagline: "",
    category_slug: categories[0]?.slug ?? "other",
    device: "phone",
    audience: "personal",
    stage: "released",
    description: "",
    recommended_for: ["", "", ""],
    features: [{ title: "", body: "" }],
    maker_note: "",
    tags: [],
    icon_url: null,
    screenshots: [],
    app_store_url: "",
    google_play_url: "",
    web_url: "",
    download_url: "",
    official_url: "",
    environments: [],
    price_text: "",
    business: null,
    status: "published",
  };
}

function fromWork(w: Work): WorkInput {
  const rec = [...(w.recommended_for ?? [])];
  while (rec.length < 3) rec.push("");
  return {
    id: w.id,
    slug: w.slug,
    name: w.name,
    tagline: w.tagline,
    category_slug: w.category_slug,
    device: w.device,
    audience: w.audience,
    stage: w.stage ?? "released",
    description: w.description ?? "",
    recommended_for: rec,
    features: w.features?.length ? w.features : [{ title: "", body: "" }],
    maker_note: w.maker_note ?? "",
    tags: w.tags ?? [],
    icon_url: w.icon_url,
    screenshots: w.screenshots ?? [],
    app_store_url: w.app_store_url ?? "",
    google_play_url: w.google_play_url ?? "",
    web_url: w.web_url ?? "",
    download_url: w.download_url ?? "",
    official_url: w.official_url ?? "",
    environments: w.environments ?? [],
    price_text: w.price_text ?? "",
    business: w.business,
    status: (w as Work & { status?: string }).status === "draft" ? "draft" : "published",
  };
}

export function WorkForm({
  categories,
  userId,
  initial,
}: {
  categories: Category[];
  userId: string;
  initial?: Work;
}) {
  const [v, setV] = useState<WorkInput>(() => (initial ? fromWork(initial) : emptyInput(categories)));
  const [tagText, setTagText] = useState(() => (initial?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(Boolean(initial));
  const [pending, start] = useTransition();

  const set = <K extends keyof WorkInput>(k: K, val: WorkInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const biz = v.audience === "business";
  const showPhone = v.device !== "pc";
  const showPc = v.device !== "phone";
  const business = v.business ?? { plans: [{ name: "", price: "", note: "" }] };
  const setBiz = (patch: Partial<NonNullable<WorkInput["business"]>>) => set("business", { ...business, ...patch });

  async function upload(files: FileList | null, kind: "icon" | "shot") {
    if (!files || files.length === 0) return;
    setError(null);
    const sb = createBrowserSupabase();
    const list = Array.from(files).slice(0, kind === "icon" ? 1 : LIMITS.screenshots - v.screenshots.length);
    const urls: string[] = [];
    for (const f of list) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(f.type)) {
        setError("画像は PNG・JPEG・WebP にしてください。");
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        setError("画像は1枚5MBまでです。");
        continue;
      }
      setUploading(f.name);
      const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await sb.storage.from("tm-media").upload(path, f, { contentType: f.type });
      if (upErr) {
        setError("画像をアップロードできませんでした。");
        continue;
      }
      urls.push(sb.storage.from("tm-media").getPublicUrl(path).data.publicUrl);
    }
    setUploading(null);
    if (kind === "icon" && urls[0]) set("icon_url", urls[0]);
    if (kind === "shot" && urls.length) set("screenshots", [...v.screenshots, ...urls].slice(0, LIMITS.screenshots));
  }

  function submit(status: "draft" | "published") {
    setError(null);
    if (status === "published" && !agreed) {
      setError("投稿ガイドラインへの同意にチェックを入れてください。");
      return;
    }
    const tags = tagText
      .split(/[,、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, LIMITS.tags);
    start(async () => {
      const res = await saveWork({ ...v, tags, business: biz ? business : null, status });
      if (res?.error) {
        setError(res.error);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  function remove() {
    if (!v.id) return;
    if (!window.confirm("この作品を削除します。元に戻せません。よろしいですか？")) return;
    start(async () => {
      const res = await deleteWork(v.id!);
      if (res?.error) setError(res.error);
    });
  }

  const t = tint(v.category_slug);
  const catName = categories.find((c) => c.slug === v.category_slug)?.name ?? "";

  return (
    <div className="form-layout">
      <form className="form-main" onSubmit={(e) => e.preventDefault()}>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <section className="form-card">
          <h2>1. どんな作品？</h2>
          <fieldset className="choice-group">
            <legend>主に使う場所</legend>
            <div className="choice-grid choice-grid--3">
              {DEVICES.map(([val, label, hint]) => (
                <button type="button" key={val} className="choice" aria-pressed={v.device === val} onClick={() => set("device", val)}>
                  <span className="choice__label">{label}</span>
                  <span className="choice__hint">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="choice-group">
            <legend>使ってほしい人</legend>
            <div className="choice-grid choice-grid--2">
              {AUDIENCES.map(([val, label, hint]) => (
                <button type="button" key={val} className="choice" aria-pressed={v.audience === val} onClick={() => set("audience", val)}>
                  <span className="choice__label">{label}</span>
                  <span className="choice__hint">{hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="choice-group">
            <legend>いまの段階</legend>
            <div className="seg" style={{ alignSelf: "flex-start" }}>
              {STAGES.map(([val, label]) => (
                <button type="button" key={val} aria-pressed={v.stage === val} onClick={() => set("stage", val)}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="form-card">
          <h2>2. 基本情報</h2>
          <label className="field">
            作品名 <span className="hint">検索結果のタイトルになります</span>
            <input value={v.name} maxLength={LIMITS.name} onChange={(e) => set("name", e.target.value)} placeholder="例：ねこ家計簿" required />
          </label>
          <label className="field">
            ひとことで言うと？ <span className="hint">{v.tagline.length}/{LIMITS.tagline}文字。何ができるかを書くと検索されやすくなります</span>
            <input value={v.tagline} maxLength={LIMITS.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="例：レシートを撮るだけ、猫が家計を見張ってくれる" required />
          </label>
          <label className="field">
            URLの名前 <span className="hint">作品ページのURL（/works/〇〇）になります。半角の英小文字・数字・ハイフン</span>
            <input value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="例：neko-kakeibo" required pattern="[a-z0-9-]{2,60}" />
          </label>
          <div className="field-row">
            <label className="field">
              カテゴリ
              <select value={v.category_slug} onChange={(e) => set("category_slug", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              タグ <span className="hint">5つまで。カンマで区切る</span>
              <input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="例：家計簿, レシート読み取り" />
            </label>
          </div>
        </section>

        <section className="form-card">
          <h2>3. 紹介文</h2>
          <label className="field">
            {biz ? "どんなツール？" : "どんな作品？"}
            <textarea rows={5} value={v.description} maxLength={LIMITS.description} onChange={(e) => set("description", e.target.value)} placeholder={biz ? "例：取引先と品目を選ぶだけで、インボイス制度に沿った請求書を作れるWebツールです。" : "例：買い物のあとにレシートを撮るだけで、品目と金額を自動で記録する家計簿アプリです。"} />
          </label>
          <div className="field">
            {biz ? "こんな会社におすすめ" : "こんな人におすすめ"} <span className="hint">3つまで</span>
            {v.recommended_for.map((r, i) => (
              <input key={i} aria-label={`おすすめ ${i + 1}`} value={r} maxLength={80} onChange={(e) => set("recommended_for", v.recommended_for.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? (biz ? "例：社員10人以下で、経理専任の人がいない会社" : "例：家計簿をつけ始めても3日で止まってしまう人") : ""} />
            ))}
          </div>
          <div className="field">
            主な機能
            {v.features.map((f, i) => (
              <div key={i} className="field-pair">
                <input aria-label="機能名" value={f.title} maxLength={40} placeholder="機能名" onChange={(e) => set("features", v.features.map((x, j): Feature => (j === i ? { ...x, title: e.target.value } : x)))} />
                <input aria-label="機能の説明" value={f.body} maxLength={120} placeholder="ひとことで説明" onChange={(e) => set("features", v.features.map((x, j): Feature => (j === i ? { ...x, body: e.target.value } : x)))} />
              </div>
            ))}
            {v.features.length < LIMITS.features && (
              <button type="button" className="btn-add" onClick={() => set("features", [...v.features, { title: "", body: "" }])}>
                ＋ 機能を追加
              </button>
            )}
          </div>
          <label className="field">
            作った人のひとこと <span className="hint">作ったきっかけなど。なくても大丈夫です</span>
            <textarea rows={3} value={v.maker_note} maxLength={LIMITS.maker_note} onChange={(e) => set("maker_note", e.target.value)} placeholder="例：自分が家計簿を何度も挫折したので作りました" />
          </label>
        </section>

        <section className="form-card">
          <h2>4. 画像</h2>
          <div className="upload-row">
            <label className="upload upload--icon">
              {v.icon_url ? <img src={v.icon_url} alt="アイコン" /> : <span>＋ アイコン<small>正方形 512px以上</small></span>}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(e.target.files, "icon")} />
            </label>
            <label className="upload upload--shots">
              <span>
                ＋ スクリーンショット（最大{LIMITS.screenshots}枚）
                <small>{v.device === "phone" ? "縦長の画面（例：1290×2796）" : v.device === "pc" ? "横長の画面（例：1920×1080）" : "縦長・横長どちらもOK"}</small>
              </span>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(e.target.files, "shot")} />
            </label>
          </div>
          {uploading && <p className="hint">アップロード中：{uploading}</p>}
          {v.screenshots.length > 0 && (
            <ul className="thumbs">
              {v.screenshots.map((s, i) => (
                <li key={s}>
                  <img src={s} alt={`スクリーンショット ${i + 1}`} />
                  <button type="button" aria-label={`スクリーンショット ${i + 1} を外す`} onClick={() => set("screenshots", v.screenshots.filter((x) => x !== s))}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {v.icon_url && (
            <button type="button" className="btn-add" onClick={() => set("icon_url", null)}>
              アイコンを外す
            </button>
          )}
        </section>

        <section className="form-card">
          <h2>5. リンクと詳しい情報</h2>
          {showPhone && (
            <div className="field-row">
              <label className="field">
                App Store のURL
                <input type="url" value={v.app_store_url} onChange={(e) => set("app_store_url", e.target.value)} placeholder="https://apps.apple.com/..." />
              </label>
              <label className="field">
                Google Play のURL
                <input type="url" value={v.google_play_url} onChange={(e) => set("google_play_url", e.target.value)} placeholder="https://play.google.com/..." />
              </label>
            </div>
          )}
          <div className="field-row">
            <label className="field">
              ブラウザで使うURL
              <input type="url" value={v.web_url} onChange={(e) => set("web_url", e.target.value)} placeholder="https://" />
            </label>
            {showPc && (
              <label className="field">
                ダウンロードURL <span className="hint">Chrome ウェブストアなども</span>
                <input type="url" value={v.download_url} onChange={(e) => set("download_url", e.target.value)} placeholder="https://" />
              </label>
            )}
          </div>
          {showPc && (
            <fieldset className="choice-group">
              <legend>動作環境</legend>
              <div className="checks">
                {ENVS.map((env) => (
                  <label key={env}>
                    <input type="checkbox" checked={v.environments.includes(env)} onChange={(e) => set("environments", e.target.checked ? [...v.environments, env] : v.environments.filter((x) => x !== env))} />
                    {env}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="field-row">
            <label className="field">
              価格
              <input value={v.price_text} maxLength={60} onChange={(e) => set("price_text", e.target.value)} placeholder="例：無料（アプリ内課金あり）" />
            </label>
            <label className="field">
              作者のサイトの紹介ページ <span className="hint">あれば</span>
              <input type="url" value={v.official_url} onChange={(e) => set("official_url", e.target.value)} placeholder="https://" />
            </label>
          </div>

          {biz && (
            <div className="biz-block">
              <p className="biz-block__title">法人向けの情報</p>
              <div className="field-row">
                <label className="field">
                  資料のURL（PDFなど）
                  <input type="url" value={business.doc_url ?? ""} onChange={(e) => setBiz({ doc_url: e.target.value })} placeholder="https://" />
                </label>
                <label className="field">
                  問い合わせ先（URLかメール）
                  <input value={business.contact ?? ""} onChange={(e) => setBiz({ contact: e.target.value })} placeholder="https:// または メールアドレス" />
                </label>
                <label className="field">
                  無料期間
                  <input value={business.trial ?? ""} onChange={(e) => setBiz({ trial: e.target.value })} placeholder="例：30日間" />
                </label>
                <label className="field">
                  運営者名・会社名
                  <input value={business.operator ?? ""} onChange={(e) => setBiz({ operator: e.target.value })} placeholder="個人の場合は屋号やハンドル名でも可" />
                </label>
              </div>
              <div className="field">
                料金プラン <span className="hint">3つまで</span>
                {(business.plans ?? []).map((p, i) => (
                  <div key={i} className="field-triple">
                    <input aria-label="プラン名" value={p.name} placeholder="プラン名" onChange={(e) => setBiz({ plans: (business.plans ?? []).map((x, j): Plan => (j === i ? { ...x, name: e.target.value } : x)) })} />
                    <input aria-label="料金" value={p.price} placeholder="料金" onChange={(e) => setBiz({ plans: (business.plans ?? []).map((x, j): Plan => (j === i ? { ...x, price: e.target.value } : x)) })} />
                    <input aria-label="内容" value={p.note ?? ""} placeholder="内容（例：メンバー3人まで）" onChange={(e) => setBiz({ plans: (business.plans ?? []).map((x, j): Plan => (j === i ? { ...x, note: e.target.value } : x)) })} />
                  </div>
                ))}
                {(business.plans ?? []).length < LIMITS.plans && (
                  <button type="button" className="btn-add" onClick={() => setBiz({ plans: [...(business.plans ?? []), { name: "", price: "", note: "" }] })}>
                    ＋ プランを追加
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="form-footer">
          <label className="check-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            自分で作った作品であり、ほかの人の権利を侵害していないことを確認しました
          </label>
          <div className="actions" style={{ marginTop: 0 }}>
            {v.id && (
              <button type="button" className="btn btn--ghost" onClick={remove} disabled={pending}>
                削除
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => submit("draft")} disabled={pending || Boolean(uploading)}>
              下書き保存
            </button>
            <button type="button" className="btn btn--accent" onClick={() => submit("published")} disabled={pending || Boolean(uploading)}>
              {pending ? "保存しています…" : "公開する"}
            </button>
          </div>
        </div>
      </form>

      <aside className="form-side">
        <p className="form-side__title">一覧での見え方</p>
        <div className="card" style={{ pointerEvents: "none" }}>
          <div className="card__shot" style={{ background: t.bg }}>
            <DeviceFrame device={v.device} shot={v.screenshots[0]} alt="" />
            <span className="card__badges">
              <span className="badge">{catName}</span>
              {biz && <span className="badge badge--dark">法人向け</span>}
              {v.stage !== "released" && <span className="badge badge--stage">{STAGES.find(([s]) => s === v.stage)?.[1]}</span>}
            </span>
          </div>
          <div className="card__body">
            <span className="card__name">{v.name || "作品名"}</span>
            <span className="card__tagline">{v.tagline || "ひとことで言うと？がここに入ります"}</span>
            <span className="card__meta">{deviceLabel(v.device)}</span>
          </div>
        </div>
        <div className="tip">
          <strong>見つけてもらうコツ</strong>
          作品名だけでなく「何ができるか」「誰のためか」を紹介文に書くと、悩みの言葉で検索した人に届きやすくなります。
        </div>
      </aside>
    </div>
  );
}
