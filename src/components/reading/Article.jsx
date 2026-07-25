import { works } from "../../content/siteContent";
import { Link } from "../../lib/navigation";
import { ObservationMeta } from "../content/Observations";

export function ArticleToc({ observation }) {
  const hasToc = observation.format === "analysis" && observation.sections.length > 2;
  if (!hasToc) return null;
  return (
    <>
      <aside className="reading-toc desktop-toc" aria-label="文章目录">
        <span>本文目录</span>
        {observation.sections.map((section) => (
          <a key={section.heading} href={`#${section.heading}`}>{section.heading}</a>
        ))}
      </aside>
      <details className="mobile-toc">
        <summary>本文目录</summary>
        <nav aria-label="手机文章目录">
          {observation.sections.map((section) => (
            <a key={section.heading} href={`#${section.heading}`}>{section.heading}</a>
          ))}
        </nav>
      </details>
    </>
  );
}

export function ArticleHeader({ observation }) {
  return (
    <header className="article-header">
      <Link href="/observations" className="back-link"><span aria-hidden="true">←</span> 返回观察</Link>
      <ObservationMeta observation={observation} showUpdated />
      <h1>{observation.title}</h1>
      <p className="article-summary">{observation.summary}</p>
      {observation.discussionQuestion ? (
        <aside className="discussion-question">
          <span>本文讨论的问题</span>
          <p>{observation.discussionQuestion}</p>
        </aside>
      ) : null}
    </header>
  );
}

export function ArticleBody({ observation }) {
  const related = works.filter((work) => observation.relatedWorks.includes(work.id));
  const hasToc = observation.format === "analysis" && observation.sections.length > 2;
  return (
    <div className={`reading-layout ${hasToc ? "has-toc" : "without-toc"}`}>
      <ArticleToc observation={observation} />
      <div className="prose">
        {observation.sections.map((section) => (
          <section id={section.heading} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
        <aside className="source-note"><strong>内容来源与边界</strong><p>{observation.sourceNotes}</p></aside>
        {related.length ? (
          <section className="related-links">
            <h2>关联作品</h2>
            {related.map((work) => (
              <Link key={work.id} href={`/works/${work.slug}`}>{work.title} <span>→</span></Link>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}
