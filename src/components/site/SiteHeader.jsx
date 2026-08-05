import { useEffect, useRef, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { site } from "../../content/siteContent";
import { Link } from "../../lib/navigation";

export function SiteHeader({ pathname }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");
    footer?.setAttribute("inert", "");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const syncScrolled = () => setScrolled(window.scrollY > 8);
    syncScrolled();
    window.addEventListener("scroll", syncScrolled, { passive: true });
    return () => window.removeEventListener("scroll", syncScrolled);
  }, []);

  const navItems = [
    { href: "/products", label: "B端产品" },
    { href: "/business-observations", label: "经营观察" },
    { href: "/about", label: "关于我" },
  ];

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <Link className="identity-lockup" href="/" aria-label="xingbuild 首页">
        <span className="wordmark">{site.name}</span>
      </Link>

      <nav
        id="primary-navigation"
        className={menuOpen ? "primary-nav is-open" : "primary-nav"}
        aria-label="主导航"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "is-active" : undefined}
            aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
            onNavigate={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        ref={menuButtonRef}
        className="menu-button"
        type="button"
        aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
        aria-controls="primary-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <List aria-hidden="true" />}
      </button>
    </header>
  );
}
