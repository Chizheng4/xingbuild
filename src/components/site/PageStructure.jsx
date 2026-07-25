export function PageIntro({ eyebrow, title, summary, children }) {
  return (
    <header className="page-intro">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <div className="page-intro__content">
        <h1>{title}</h1>
        {summary ? <p className="page-summary">{summary}</p> : null}
        {children}
      </div>
    </header>
  );
}

export function HeroStatement({ eyebrow, title, summary }) {
  return (
    <section className="home-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="hero-description">{summary}</p>
    </section>
  );
}

export function SectionIntro({ eyebrow, title, description, action }) {
  return (
    <header className="section-intro">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? (
          <p className="section-intro__description">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
