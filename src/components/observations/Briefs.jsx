import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "../../lib/navigation";
import { countCompleteBriefs } from "../../content/briefRail";
import { classifySourceUrl } from "../../content/sourceUrls";

function BriefBody({ item }) {
  const sources = item.sourceRefs
    .map((id) => item.sources.find((source) => source.id === id))
    .filter((source, index, all) => source && all.findIndex((candidate) => candidate?.publisher === source.publisher) === index);
  return (
    <>
      <p className="brief-item__identity">
        <span>{item.subject}</span>
        <time dateTime={item.eventAt}>{item.eventAt}</time>
      </p>
      <p className="brief-item__dimension">
        <span>#{item.primaryDimension}</span>
        {item.isOpinion ? <span>#观点</span> : null}
      </p>
      <p className="brief-item__statement">{item.body || item.statement}</p>
      {item.articlePreview ? <Link className="brief-item__article-preview" href={`${item.articlePreview.href}?returnTo=${encodeURIComponent("/observations")}`}>{item.articlePreview.title}<span>{item.articlePreview.excerpt}</span></Link> : null}
      <p className="brief-item__sources">
        来源：{sources.map((source, index) => {
          const safe = classifySourceUrl(source);
          if (!safe.valid) return null;
          return <span key={source.id}>{index ? "、" : null}<a href={safe.href} {...(safe.kind === "external" ? { target: "_blank", rel: "noreferrer" } : {})}>{source.publisher}</a></span>;
        })}
      </p>
    </>
  );
}

export function BriefItem({ item }) {
  return <article className="brief-item"><BriefBody item={item} /></article>;
}

export function ObservationStream({ items }) {
  return <div className="observation-stream">{items.map((item) => <BriefItem item={item} key={item.id} />)}</div>;
}

export function ObservationEmptyState({ title, message, description }) {
  return (
    <section className="observation-empty-state" aria-labelledby="observations-empty-title">
      <p>{message}</p>
      {description ? <p>{description}</p> : null}
    </section>
  );
}

export function ObservationRail({ items, anchorRef }) {
  const railRef = useRef(null);
  const measureRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(Math.min(items.length, 2));

  useLayoutEffect(() => {
    if (!anchorRef?.current || !measureRef.current || !items.length) return undefined;
    const update = () => {
      const budget = Math.min(anchorRef.current.getBoundingClientRect().height, window.innerHeight * 2);
      const entries = [...measureRef.current.querySelectorAll("[data-brief-measure]")]
        .map((entry) => ({ top: entry.offsetTop, height: entry.offsetHeight }));
      const count = countCompleteBriefs(entries, budget);
      setVisibleCount(Math.max(1, Math.min(count, items.length)));
    };
    const observer = new ResizeObserver(update);
    observer.observe(anchorRef.current);
    update();
    return () => observer.disconnect();
  }, [anchorRef, items]);

  const visible = items.slice(0, visibleCount);
  return (
    <div className="observation-rail" ref={railRef}>
      <div className="observation-rail__measure" ref={measureRef} aria-hidden="true">
        {items.map((item) => (
          <article className="brief-item" data-brief-measure key={item.id}><BriefBody item={item} /></article>
        ))}
      </div>
      <ObservationStream items={visible} />
      <Link className="observation-rail__more" href="/observations">更多观察</Link>
    </div>
  );
}
