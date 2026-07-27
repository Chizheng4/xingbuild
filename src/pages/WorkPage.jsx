import { ObservationArchive } from "../components/content/Observations";
import { PageIntro, SectionIntro } from "../components/site/PageStructure";
import { ArchitectureDiagram } from "../components/works/Works";
import { publishedObservations } from "../content/siteContent";
import { Link } from "../lib/navigation";

export function WorkPage({ work }) {
  const related = publishedObservations.filter((item) => item.relatedWorks.includes(work.id));
  return (
    <article className="work-page">
      <PageIntro eyebrow={work.eyebrow} title={work.title} summary={work.summary}>
        <div className="page-meta"><span>{work.status}</span><time dateTime={work.updatedAt}>更新 {work.updatedAt}</time></div>
      </PageIntro>
      <div className="work-page-body collection-flow">
        <section className="work-problem object-stack"><span>核心问题</span><p>{work.problem}</p></section>
        <aside className="evidence-boundary">
          <div><span>当前状态</span><strong>{work.status}</strong></div>
          <div><span>证据边界</span><strong>{work.boundary}</strong></div>
        </aside>
        <ArchitectureDiagram work={work} />
        <div className="work-detail-grid">
          {work.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <aside className="source-boundary"><span>上游事实源</span><strong>{work.upstream}</strong></aside>
        {related.length ? (
          <section className="related-observations section-flow">
            <SectionIntro title="相关观察" />
            <ObservationArchive items={related} />
          </section>
        ) : null}
        {work.publicUrl ? <a className="primary-action" href={work.publicUrl}>打开公开作品 <span>↗</span></a> : null}
      </div>
    </article>
  );
}
