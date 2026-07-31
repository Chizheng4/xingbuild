import { Link, safeReturnTo } from "../../lib/navigation";

/** A single, safe return affordance shared by reading and showcase paths. */
export function ReturnNavigation({
  href,
  destination,
  origin,
  returnTo,
  focusTarget,
  state,
  replace = false,
  secondary,
}) {
  const safeHref = safeReturnTo(href, "/business-observations");
  return (
    <nav
      className="return-navigation"
      aria-label="返回导航"
      data-origin={origin || undefined}
      data-return-to={returnTo || safeHref}
      data-focus-target={focusTarget || undefined}
    >
      <Link className="return-navigation__primary" href={safeHref} state={state} replace={replace}>
        ← 返回{destination}
      </Link>
      {secondary ? <Link className="return-navigation__secondary" href={safeReturnTo(secondary.href, "/business-observations")}>{secondary.label}</Link> : null}
    </nav>
  );
}
