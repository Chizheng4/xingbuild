import { RichDocument } from "./RichDocument";
import { ReadingTOC } from "./ReadingTOC";

export function EvergreenArticle({
  article,
  headingLevel = 2,
  headingId = "business-observation-article-title",
  showSummary = true,
  showFigures = true,
  showArchitectureViews = true,
}) {
  if (!article) {
    return <section className="evergreen-article content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
  }
  const Heading = `h${headingLevel}`;
  return (
    <article className="evergreen-article" aria-labelledby={headingId}>
      <header className="evergreen-article__header">
        <Heading id={headingId}>{article.title}</Heading>
        {showSummary && article.summary ? <p>{article.summary}</p> : null}
      </header>
      <div className="evergreen-article__reading">
        <ReadingTOC blocks={article.blocks} />
        <RichDocument blocks={article.blocks} sources={article.sources} showFigures={showFigures} showArchitectureViews={showArchitectureViews} />
      </div>
    </article>
  );
}
