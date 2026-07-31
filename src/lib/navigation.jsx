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
  const parsed = new URL(value, "https://xingbuild.top");
  if (!["/", "/products", "/business-observations", "/observations", "/about"].some((prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`))) return fallback;
  return `${parsed.pathname}${parsed.search}`;
}

export function returnLabelFor(href) {
  return `返回${returnDestinationFor(href)}`;
}

export function returnDestinationFor(href) {
  const pathname = new URL(href, "https://xingbuild.top").pathname;
  if (pathname === "/") return "首页";
  if (pathname === "/products" || pathname.startsWith("/products/")) return "B端产品";
  if (pathname === "/business-observations" || pathname.startsWith("/business-observations/")) return "经营观察";
  return "观察";
}

export function observationCollectionHref(origin) {
  const safeOrigin = safeReturnTo(origin, "");
  return safeOrigin ? `/observations?origin=${encodeURIComponent(safeOrigin)}` : "/observations";
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
