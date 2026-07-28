import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findBusinessObservation } from "../content/showcaseRepository";

export function FrameworkPage() {
  const framework = findBusinessObservation("enterprise-operating-framework");
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} />
    : undefined;
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout renderRail={renderRail}>
        <header className="practice-header framework-page__header">
          <h1>{framework.title}</h1>
          <p>{framework.summary}</p>
          <p className="framework-page__boundary">{framework.boundary}</p>
        </header>
        <FrameworkExplorer />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
