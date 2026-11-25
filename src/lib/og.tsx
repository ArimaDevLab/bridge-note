import { ImageResponse } from "next/og";
import { site } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };

/**
 * 画像に出す文字だけを含んだ日本語フォントを Google Fonts から取ってくる。
 * 取れなかったときは null（その場合も画像は作るが、日本語が欠ける可能性がある）
 */
async function loadFont(text: string, weight: 500 | 800): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=M+PLUS+1:wght@${weight}&text=${encodeURIComponent(text)}`,
      { cache: "force-cache" },
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url, { cache: "force-cache" }).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

type Card = {
  title: string;
  subtitle?: string;
  badges?: string[];
  image?: string | null;
  accent?: string;
};

/** Bridge Note の見た目でシェア用画像を作る */
export async function renderOgImage({ title, subtitle, badges = [], image, accent = "#7cc8ff" }: Card) {
  const brand = `${site.name} ${site.volume}`;
  const text = [title, subtitle, ...badges, brand, site.tagline].join("");
  const [bold, regular] = await Promise.all([loadFont(text, 800), loadFont(text, 500)]);
  const fonts = [
    ...(bold ? [{ name: "MPLUS1", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "MPLUS1", data: regular, weight: 500 as const, style: "normal" as const }] : []),
  ];
  const titleSize = title.length > 18 ? 52 : title.length > 12 ? 60 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#ffffff",
          fontFamily: "MPLUS1",
          color: "#15171c",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 56px 56px 72px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {badges.length > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                {badges.map((b) => (
                  <div
                    key={b}
                    style={{
                      display: "flex",
                      fontSize: 24,
                      fontWeight: 500,
                      padding: "6px 18px",
                      borderRadius: 999,
                      background: "#f3f4f6",
                      color: "#3a3f4b",
                    }}
                  >
                    {b}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 800, lineHeight: 1.25 }}>{title}</div>
            {subtitle && (
              <div style={{ display: "flex", fontSize: 32, fontWeight: 500, lineHeight: 1.5, color: "#3a3f4b" }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>{site.name}</div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 999,
                background: accent,
                color: "#111214",
              }}
            >
              {site.volume}
            </div>
          </div>
        </div>
        {image ? (
          <div style={{ display: "flex", width: 460, height: "100%", background: "#f4faff", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse の中では img を使う */}
            <img src={image} alt="" width={460} height={630} style={{ width: 460, height: 630, objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ display: "flex", width: 24, height: "100%", background: accent }} />
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
