/* eslint-disable @next/next/no-img-element -- 投稿者の画像URLは事前に分からないため素の img を使う */
import type { Device } from "@/lib/types";

/** 一覧カード用の小さな端末枠。スクショがあれば1枚目を入れる */
export function DeviceFrame({
  device,
  shot,
  alt,
}: {
  device: Device;
  shot?: string | null;
  alt: string;
}) {
  if (device === "phone") {
    return shot ? (
      <div className="frame-phone frame-phone--img">
        <img src={shot} alt={alt} loading="lazy" />
      </div>
    ) : (
      <div className="frame-phone" aria-hidden="true">
        <span className="ph" style={{ height: 10, width: "40%", background: "var(--accent)" }} />
        <span className="ph" style={{ height: 8, width: "70%" }} />
        <span className="ph" style={{ height: 40, borderRadius: 8 }} />
        <span className="ph" style={{ height: 8, width: "50%" }} />
      </div>
    );
  }
  return (
    <div className={shot ? "frame-pc frame-pc--img" : "frame-pc"}>
      <div className="frame-pc__bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="frame-pc__body">
        {shot ? (
          <img src={shot} alt={alt} loading="lazy" />
        ) : (
          <>
            <div style={{ width: 48, display: "flex", flexDirection: "column", gap: 6 }} aria-hidden="true">
              <span className="ph" style={{ height: 10, background: "var(--accent)" }} />
              <span className="ph" style={{ height: 6 }} />
              <span className="ph" style={{ height: 6 }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }} aria-hidden="true">
              <span className="ph" style={{ height: 8, width: "60%" }} />
              <span style={{ flex: 1, borderRadius: 6, background: "var(--bg-soft)", border: "1px solid var(--line)" }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
