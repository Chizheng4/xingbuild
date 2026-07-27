import {
  CardGrid,
  CardMeta,
  CardSummary,
  CardTitle,
  ContentCard,
} from "../cards/ContentCards";

const formatLabels = { analysis: "分析", brief: "短观察" };

export function ObservationMeta({ observation, showUpdated = false }) {
  return (
    <div className="observation-meta object-identity">
      <time dateTime={observation.publishedAt}>{observation.publishedAt}</time>
      <span>{formatLabels[observation.format] || observation.format}</span>
      <span>{observation.topics[0]}</span>
      {showUpdated && observation.updatedAt !== observation.publishedAt ? (
        <time dateTime={observation.updatedAt}>更新 {observation.updatedAt}</time>
      ) : null}
    </div>
  );
}

export function ObservationCard({ observation }) {
  return (
    <ContentCard
      href={`/observations/${observation.slug}`}
      accessibleName={`阅读观察：${observation.title}`}
      type="observation"
    >
      <CardTitle>{observation.title}</CardTitle>
      <CardSummary>{observation.summary}</CardSummary>
      <CardMeta>
        <span>{formatLabels[observation.format] || observation.format}</span>
        <span>{observation.primaryTopic}</span>
        <time dateTime={observation.publishedAt}>{observation.publishedAt}</time>
      </CardMeta>
    </ContentCard>
  );
}

export function ObservationArchive({ items }) {
  return (
    <CardGrid type="observation">
      {items.map((item) => <ObservationCard key={item.id} observation={item} />)}
    </CardGrid>
  );
}
