import { Link } from "../../lib/navigation";
import { RichDocument, SourceLinks } from "./RichDocument";

export function ArticleHeader({ observation, returnTo = "/observations" }) {
  return (
    <header className="article-header">
      <Link className="article-header__return" href={returnTo}>返回经营观察</Link>
      <h1>{observation.title}</h1>
      <p className="article-dimensions">{observation.dimensions.map((dimension) => `#${dimension}`).join(" ")}</p>
      <p className="article-summary">{observation.summary}</p>
    </header>
  );
}

export function ArticleBody({ observation }) {
  const sources = (observation.article?.sourceRefs || observation.sources.map((source) => source.id))
    .map((sourceId) => observation.sources.find((item) => item.id === sourceId))
    .filter((source, index, all) => source && all.findIndex((candidate) => candidate?.publisher === source.publisher) === index);
  return (
    <RichDocument blocks={observation.document?.blocks || observation.sections.flatMap((section) => section.paragraphs.map((text) => ({ type: "paragraph", text })))} sources={sources} />
  );
}
