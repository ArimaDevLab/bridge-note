import Link from "next/link";
import { site } from "@/lib/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="logo" aria-label={`${site.name} ${site.volume} トップへ`}>
          {site.name}
          <span className="logo__vol">{site.volume}</span>
        </Link>
        <nav className="site-nav" aria-label="メイン">
          <Link href="/">見つける</Link>
        </nav>
        {/* 投稿フォームは次のステップで追加します */}
      </div>
    </header>
  );
}
