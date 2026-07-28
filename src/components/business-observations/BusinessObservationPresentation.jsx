import { FrameworkExplorer } from "../framework/FrameworkExplorer";

export function BusinessObservationPresentation({ observation, headingLevel = 1, headingId }) {
  const Heading = `h${headingLevel}`;
  return (
    <section className="business-observation-presentation" aria-labelledby={headingId}>
      <header className="business-observation-presentation__header">
        <Heading id={headingId}>{observation.title}</Heading>
        <p>{observation.summary}</p>
      </header>
      <FrameworkExplorer descriptionHeadingLevel={headingLevel + 1} />
    </section>
  );
}
