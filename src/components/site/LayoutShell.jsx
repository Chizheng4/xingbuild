import { useRef } from "react";

export function LayoutShell({ className = "", children }) {
  return <div className={`layout-shell ${className}`.trim()}>{children}</div>;
}

export function TwoColumnLayout({ children, renderRail }) {
  const mainRef = useRef(null);
  const rail = renderRail?.(mainRef) ?? null;

  return (
    <div className={rail ? "two-column-layout has-rail" : "two-column-layout"}>
      <div className="two-column-layout__main" ref={mainRef}>{children}</div>
      {rail ? <aside className="two-column-layout__rail" aria-label="最新观察">{rail}</aside> : null}
    </div>
  );
}

export function CollectionLayout({ className = "", children }) {
  return <div className={`collection-layout ${className}`.trim()}>{children}</div>;
}

export function ReadingShell({ className = "", children }) {
  return <article className={`reading-shell ${className}`.trim()}>{children}</article>;
}

export function ShowcaseLayout({ className = "", description, stage }) {
  return (
    <section className={`showcase-layout ${className}`.trim()}>
      <div className="showcase-layout__description">{description}</div>
      <div className="showcase-layout__stage">{stage}</div>
    </section>
  );
}
