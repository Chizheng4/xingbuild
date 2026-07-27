import { Link } from "../../lib/navigation";

export function ContentCard({ href, accessibleName, type, children }) {
  return (
    <article className={`content-card ${type}-card`}>
      <Link
        href={href}
        className="content-card__link"
        aria-label={accessibleName}
      >
        {children}
      </Link>
    </article>
  );
}

export function CardTitle({ children }) {
  return <h3 className="content-card__title">{children}</h3>;
}

export function CardSummary({ children }) {
  return <p className="content-card__summary">{children}</p>;
}

export function CardMeta({ children }) {
  return <div className="content-card__meta">{children}</div>;
}

export function CardGrid({ children, type, className = "" }) {
  return (
    <div className={`card-grid ${className}`.trim()} data-card-type={type}>
      {children}
    </div>
  );
}
