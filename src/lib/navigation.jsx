import { useEffect, useState } from "react";

export function useLocation() {
  const readLocation = () => ({
    pathname: window.location.pathname,
    search: window.location.search,
    state: window.history.state,
  });
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const syncPath = () => setLocation(readLocation());
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, []);

  return location;
}

export function usePathname() {
  return useLocation().pathname;
}

export function navigate(href, { replace = false, state = {}, scroll = true } = {}) {
  window.history[replace ? "replaceState" : "pushState"](state, "", href);
  window.dispatchEvent(new PopStateEvent("popstate", { state }));
  if (scroll) window.scrollTo({ top: 0, behavior: "auto" });
}

export function safeReturnTo(value, fallback = "/observations") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  const parsed = new URL(value, window.location.origin);
  if (parsed.origin !== window.location.origin || !["/", "/products", "/business-observations", "/observations", "/about"].some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) return fallback;
  return `${parsed.pathname}${parsed.search}`;
}

export function Link({ href, children, className, onNavigate, state, replace, ...props }) {
  const handleClick = (event) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      href.startsWith("http") ||
      href.startsWith("#")
    ) {
      return;
    }

    event.preventDefault();
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== href) {
      navigate(href, { replace, state });
    }
    onNavigate?.();
  };

  return (
    <a className={className} href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
