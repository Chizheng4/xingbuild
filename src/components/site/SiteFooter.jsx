import { site } from "../../content/siteContent";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© 2026 {site.name} · {__XINGBUILD_VERSION__}</span>
    </footer>
  );
}
