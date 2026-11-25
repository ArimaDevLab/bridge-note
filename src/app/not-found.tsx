import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>ページが見つかりません</h1>
      <p style={{ color: "var(--muted)", marginBottom: 24 }}>作品が非公開になったか、URLが変わった可能性があります。</p>
      <Link href="/" className="btn btn--accent">
        トップへ戻る
      </Link>
    </main>
  );
}
