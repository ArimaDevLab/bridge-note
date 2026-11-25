import type { Audience, Device } from "./types";

export function deviceLabel(d: Device): string {
  return d === "pc" ? "PC向け" : d === "both" ? "PC・スマホ" : "スマホ向け";
}

import type { Stage } from "./types";

/** 公開中以外のときだけラベルを返す */
export function stageLabel(s: Stage | null | undefined): string | null {
  if (s === "beta") return "ベータ版";
  if (s === "prototype") return "試作";
  if (s === "preparing") return "販売準備中";
  return null;
}

export function audienceLabel(a: Audience): string {
  return a === "business" ? "法人向け" : "個人向け";
}

/** プラットフォームの短い表記（カード用） */
export function platformText(w: {
  app_store_url: string | null;
  google_play_url: string | null;
  web_url: string | null;
  download_url: string | null;
}): string {
  const p: string[] = [];
  if (w.app_store_url) p.push("iOS");
  if (w.google_play_url) p.push("Android");
  if (w.web_url) p.push("Web");
  if (w.download_url) p.push(w.download_url.includes("chromewebstore.google.com") ? "Chrome拡張" : "デスクトップ");
  return p.join(" / ");
}

const TINTS: Record<string, [string, string]> = {
  game: ["#fcebdd", "#a4470f"],
  productivity: ["#e3eff8", "#1a5f94"],
  life: ["#eef6df", "#3e6b12"],
  learning: ["#fbf3d9", "#7a5a00"],
  creative: ["#f1e6f7", "#6b3a8a"],
  ai: ["#e1f3ec", "#16704f"],
  "dev-tools": ["#e4ecf6", "#2f4f7a"],
  other: ["#eef0f3", "#3a3f4b"],
};

/** カテゴリごとの淡い背景色と文字色 */
export function tint(category: string): { bg: string; fg: string } {
  const [bg, fg] = TINTS[category] ?? TINTS.other;
  return { bg, fg };
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 外部リンクとして安全なURLだけ通す */
export function safeUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
