import { classifySourceUrl } from "../../content/sourceUrls";

export function ArticleHeader({ observation }) {
  return (
    <header className="article-header">
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
    <div className="reading-layout without-toc">
      <div className="prose">
        {observation.sections.flatMap((section) => section.paragraphs).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <p className="article-sources">来源：{sources.map((source, index) => <SourceItem key={source.id} source={source} prefix={index ? "、" : null} />)}</p>
      </div>
    </div>
  );
}

function SourceItem({ source, prefix }) {
  const safeUrl = classifySourceUrl(source);
  if (!safeUrl.valid) return null;
  return (
    <span id={source.id}>
      {prefix}
      <a
        href={safeUrl.href}
        {...(safeUrl.kind === "external" ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {source.publisher}
      </a>
    </span>
  );
}
