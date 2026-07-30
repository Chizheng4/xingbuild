import { lazy, Suspense } from "react";

const FrameworkExplorer = lazy(() => import("../framework/FrameworkExplorer").then((module) => ({ default: module.FrameworkExplorer })));

export function BusinessObservationPresentation({ observation, headingLevel = 1, headingId }) {
  const Heading = `h${headingLevel}`;
  return (
    <section className="business-observation-presentation" aria-labelledby={headingId}>
      <header className="business-observation-presentation__header">
        <Heading id={headingId}>{observation.title}</Heading>
        <p>{observation.summary}</p>
      </header>
      <Suspense fallback={<p className="framework-runtime-loading" role="status">正在载入企业经营体系架构图…</p>}>
        <FrameworkExplorer descriptionHeadingLevel={headingLevel + 1} />
      </Suspense>
    </section>
  );
}
