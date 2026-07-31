import { RichDocument } from "./RichDocument";
import { ReadingTOC } from "./ReadingTOC";

export function EvergreenArticle({ article }) {
  return (
    <article className="evergreen-article" aria-labelledby="business-observation-title">
      <header className="evergreen-article__header">
        <h1 id="business-observation-title">{article.title}</h1>
        <p>{article.summary}</p>
      </header>
      <div className="evergreen-article__reading">
        <ReadingTOC blocks={article.blocks} />
        <RichDocument blocks={article.blocks} sources={article.sources} />
      </div>
    </article>
  );
}
