# Bridge Note vol.0.1

個人や小さなチームが作ったアプリ・ゲーム・ツールを紹介するサイトです。
作った人と、それを伝えたいメディアの人をつなぐ場所を目指しています。

## 構成

- Next.js（App Router）
- Supabase（データベースと画像の置き場所。テーブルはすべて `tm_` で始まる名前）
- Vercel で公開

## ページ

| URL | 内容 |
| --- | --- |
| `/` | トップ。カテゴリ・使う場所（スマホ / PC）・対象（個人 / 法人）で絞り込み |
| `/category/[slug]` | カテゴリごとの一覧（検索の入口になるページ） |
| `/works/[slug]` | 作品詳細。スマホ向け・PC向け、個人向け・法人向けで見せ方が変わる |
| `/sitemap.xml`, `/robots.txt` | 検索エンジン向け |

## 手元で動かす

```bash
cp .env.example .env.local   # 値を入れる
npm install
npm run dev
```

## 環境変数

| 名前 | 内容 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase のプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase の publishable key（公開してよいキー） |
| `NEXT_PUBLIC_SITE_URL` | 任意。独自ドメインを使うときだけ |

作品の一覧は最大2分ごとに更新されます（`src/lib/data.ts` の `REVALIDATE`）。
