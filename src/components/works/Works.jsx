import {
  CardGrid,
  CardMeta,
  CardSummary,
  CardTitle,
  ContentCard,
} from "../cards/ContentCards";

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

export function WorkCard({ work }) {
  return (
    <ContentCard
      href={`/works/${work.slug}`}
      accessibleName={`查看作品：${work.title}`}
      type="work"
    >
      <CardTitle>{work.title}</CardTitle>
      <CardSummary>{work.problemSummary}</CardSummary>
      <CardMeta>
        <span>{work.status}</span>
        <time dateTime={work.updatedAt}>更新于 {work.updatedAt}</time>
      </CardMeta>
    </ContentCard>
  );
}

export function WorkCardGrid({ items }) {
  return (
    <CardGrid type="work">
      {items.map((work) => <WorkCard key={work.id} work={work} />)}
    </CardGrid>
  );
}
