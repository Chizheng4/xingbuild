import { works } from "../../content/siteContent";
import { classifySourceUrl } from "../../content/sourceUrls";
import { Link } from "../../lib/navigation";
import { ObservationMeta } from "../content/Observations";

const claimKindLabels = {
  company_statement: "企业表述",
  media_report: "媒体报道",
  opinion: "作者观点",
  inference: "分析推断",
};

function articleSections(observation) {
  return [observation.rangeAndFacts, observation.operatingImpact, ...observation.sections];
}

export function ArticleToc({ observation }) {
  const sections = articleSections(observation);
  const hasToc = observation.level === "deep" && sections.length >= 3;
  if (!hasToc) return null;
  return (
    <>
      <aside className="reading-toc desktop-toc" aria-label="文章目录">
        <span>本文目录</span>
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`}>{section.heading}</a>
        ))}
      </aside>
      <details className="mobile-toc">
        <summary>本文目录</summary>
        <nav aria-label="手机文章目录">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>{section.heading}</a>
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
      <dl className="fact-overview" aria-label="事实概览">
        {observation.factOverview.map((item) => (
          <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>
        ))}
      </dl>
    </header>
  );
}

function EvidenceReferences({ ids, observation }) {
  const evidence = ids
    .map((id) => observation.evidenceUnits.find((unit) => unit.id === id))
    .filter(Boolean);
  if (!evidence.length) return null;
  return (
    <ul className="evidence-references" aria-label="本节证据引用">
      {evidence.map((unit) => (
        <li key={unit.id}>
          {unit.claimKind !== "verified_fact" ? (
            <span className="claim-kind">{claimKindLabels[unit.claimKind] || unit.claimKind}</span>
          ) : null}
          <span>{unit.claim}</span>
          <span className="source-ref-links">
            {unit.sourceRefs.map((ref) => {
              const source = observation.sources.find((item) => item.id === ref);
              return source ? <a key={ref} href={`#${source.id}`}>{source.publisher}</a> : null;
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ArticleBody({ observation }) {
  const related = works.filter((work) => observation.relatedWorks.includes(work.id));
  const sections = articleSections(observation);
  const hasToc = observation.level === "deep" && sections.length >= 3;
  return (
    <div className={`reading-layout ${hasToc ? "has-toc" : "without-toc"}`}>
      <ArticleToc observation={observation} />
      <div className="prose">
        {sections.map((section) => (
          <section id={section.id} key={section.id}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <EvidenceReferences ids={section.evidenceUnitIds} observation={observation} />
          </section>
        ))}
        <section className="evidence-and-boundary">
          <h2>证据与边界</h2>
          <p>{observation.evidenceBoundary}</p>
          <ol className="source-list">
            {observation.sources.map((source) => (
              <SourceItem key={source.id} source={source} />
            ))}
          </ol>
        </section>
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

function SourceItem({ source }) {
  const safeUrl = classifySourceUrl(source);
  if (!safeUrl.valid) return null;
  return (
    <li id={source.id}>
      <a
        href={safeUrl.href}
        {...(safeUrl.kind === "external" ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {source.title}
      </a>
      <span>{source.publisher} · {source.publishedAt} · 访问于 {source.accessedAt}</span>
    </li>
  );
}
