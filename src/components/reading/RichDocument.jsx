import { Link } from "../../lib/navigation";
import { classifySourceUrl } from "../../content/sourceUrls";

function SourceLinks({ sources = [], prefix = "来源：" }) {
  return <p className="rich-document__sources">{prefix}{sources.map((source, index) => {
    const safe = classifySourceUrl(source);
    if (!safe.valid) return null;
    return <span key={source.id}>{index ? "、" : null}<a href={safe.href} {...(safe.kind === "external" ? { target: "_blank", rel: "noreferrer" } : {})}>{source.publisher}</a></span>;
  })}</p>;
}

export function RichDocument({ blocks = [], sources }) {
  return (
    <div className="rich-document">
      {blocks.map((block, index) => {
        if (block.type === "lead") return <p className="rich-document__lead" key={index}>{block.text}</p>;
        if (block.type === "heading") { const Heading = `h${block.level || 2}`; return <Heading id={block.id} key={index}>{block.text}</Heading>; }
        if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
        if (block.type === "list") return <ul key={index}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
        if (block.type === "definitionList") return <dl key={index}>{block.items.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.description}</dd></div>)}</dl>;
        if (block.type === "callout") return <aside className="rich-document__callout" key={index}>{block.text}</aside>;
        if (block.type === "figure") return <figure key={index}><img src={block.src} alt={block.alt} /><figcaption>{block.caption}</figcaption></figure>;
        if (block.type === "link") return <p key={index}><Link href={block.href}>{block.text}</Link></p>;
        return null;
      })}
      {sources?.length ? <SourceLinks sources={sources} /> : null}
    </div>
  );
}

export { SourceLinks };
