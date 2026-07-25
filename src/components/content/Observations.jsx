import { Link } from "../../lib/navigation";

const formatLabels = { analysis: "分析", brief: "短观察" };

export function ObservationMeta({ observation, showUpdated = false }) {
  return (
    <div className="observation-meta">
      <time dateTime={observation.publishedAt}>{observation.publishedAt}</time>
      <span>{formatLabels[observation.format] || observation.format}</span>
      <span>{observation.topics[0]}</span>
      {showUpdated && observation.updatedAt !== observation.publishedAt ? (
        <time dateTime={observation.updatedAt}>更新 {observation.updatedAt}</time>
      ) : null}
    </div>
  );
}

export function ObservationFeature({ observation }) {
  if (!observation) return null;
  const href = `/observations/${observation.slug}`;
  return (
    <article className="observation-feature">
      <ObservationMeta observation={observation} />
      <h3><Link href={href}>{observation.title}</Link></h3>
      <p>{observation.summary}</p>
      <Link className="feature-link" href={href}>
        继续阅读 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export function ObservationRow({ observation, showSummary = false }) {
  return (
    <article className="observation-row">
      <Link
        href={`/observations/${observation.slug}`}
        className="observation-row-link"
        aria-label={`阅读：${observation.title}`}
      >
        <ObservationMeta observation={observation} />
        <div className="observation-row-copy">
          <h3>{observation.title}</h3>
          {showSummary ? <p>{observation.summary}</p> : null}
        </div>
        <span className="row-arrow" aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

export function ObservationArchive({ items, featureFirst = false }) {
  const feature = featureFirst ? items[0] : null;
  const archiveItems = featureFirst ? items.slice(1) : items;
  return (
    <>
      {feature ? <ObservationFeature observation={feature} /> : null}
      {archiveItems.length ? (
        <div className="observation-list">
          {archiveItems.map((item, index) => (
            <ObservationRow
              key={item.id}
              observation={item}
              showSummary={!featureFirst && index === 0}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
