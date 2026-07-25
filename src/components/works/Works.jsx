import { Link } from "../../lib/navigation";

export function ArchitectureDiagram({ work }) {
  const items = work.flow || work.planes;
  return (
    <ol
      className={`architecture ${work.flow ? "is-flow" : "is-planes"}`}
      aria-label={`${work.title}架构`}
    >
      {items.map((item, index) => (
        <li key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function WorkSummary({ work, showArchitecture = false }) {
  return (
    <article className={`work-summary ${showArchitecture ? "has-architecture" : ""}`}>
      <div className="work-index">{work.index}</div>
      <div className="work-summary-copy">
        <p className="eyebrow">{work.eyebrow}</p>
        <h3><Link href={`/works/${work.slug}`}>{work.title}</Link></h3>
        <p className="work-problem-summary">{work.problem}</p>
        <p className="work-built">{work.summary}</p>
        <div className="work-status">
          <span>{work.status}</span>
          <time dateTime={work.updatedAt}>更新 {work.updatedAt}</time>
        </div>
        <p className="work-boundary">{work.boundary}</p>
      </div>
      {showArchitecture ? <ArchitectureDiagram work={work} /> : null}
    </article>
  );
}
