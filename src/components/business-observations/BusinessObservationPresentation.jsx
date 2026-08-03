import { Link } from "../../lib/navigation";

export function BusinessObservationPresentation({ observation, headingLevel = 1, headingId }) {
  if (!observation) {
    return <section className="business-observation-presentation content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
  }
  const Heading = `h${headingLevel}`;
  return (
    <section className="business-observation-presentation" aria-labelledby={headingId}>
      <header className="business-observation-presentation__header">
        <Heading id={headingId}>{observation.title}</Heading>
        <p>{observation.summary}</p>
      </header>
      <Link className="business-observation-presentation__link" href="/business-observations">阅读企业经营体系</Link>
    </section>
  );
}
