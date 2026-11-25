import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>
          © {site.name} {site.volume}
        </span>
        <span>{site.tagline}</span>
      </div>
    </footer>
  );
}
