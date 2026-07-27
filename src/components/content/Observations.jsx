import {
  CardGrid,
  CardMeta,
  CardSummary,
  CardTitle,
  ContentCard,
} from "../cards/ContentCards";
import {
  observationDimensionMetadata,
  observationScopeLabel,
} from "../../content/observationQueries";

const levelLabels = { brief: "精简", standard: "标准", deep: "深度" };
const natureLabels = { "evidence-led": "事实", "opinion-led": "观点" };

export function ObservationMeta({ observation, showUpdated = false }) {
  const scopeLabel = observationScopeLabel(observation);
  return (
    <div className="observation-meta object-identity">
      <time dateTime={observation.publishedAt}>{observation.publishedAt}</time>
      <span>{levelLabels[observation.level] || observation.level}</span>
      <span>{natureLabels[observation.nature] || observation.nature}</span>
      <span>{scopeLabel || observation.primaryDimension}</span>
      {showUpdated && observation.updatedAt !== observation.publishedAt ? (
        <time dateTime={observation.updatedAt}>更新 {observation.updatedAt}</time>
      ) : null}
    </div>
  );
}

export function ObservationCard({ observation }) {
  const dimensionMetadata = observationDimensionMetadata(observation);
  return (
    <ContentCard
      href={`/observations/${observation.slug}`}
      accessibleName={`阅读观察：${observation.title}`}
      type="observation"
    >
      <CardTitle>{observation.title}</CardTitle>
      <CardSummary>{observation.summary}</CardSummary>
      <CardMeta>
        <span>{observation.nature === "opinion-led" ? natureLabels[observation.nature] : levelLabels[observation.level]}</span>
        {dimensionMetadata.map((item) => <span key={item}>{item}</span>)}
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
