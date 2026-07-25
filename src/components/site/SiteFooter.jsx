import { site } from "../../content/siteContent";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>© {site.year} {site.name}</span>
    </footer>
  );
}
