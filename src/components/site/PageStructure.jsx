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

export function SectionIntro({ eyebrow, title, action }) {
  return (
    <header className="section-intro">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </header>
  );
}
