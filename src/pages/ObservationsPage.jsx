import { ObservationEmptyState, ObservationStream } from "../components/observations/Briefs";
import { LayoutShell } from "../components/site/LayoutShell";
import { PositioningStrip } from "../components/site/PageStructure";
import { selectObservationBriefs } from "../content/observationRepository";
import { site } from "../content/siteContent";

export function ObservationsPage() {
  const briefs = selectObservationBriefs();
  return (
    <LayoutShell className="observations-page">
      <PositioningStrip>{site.homeTitle}</PositioningStrip>
      {briefs.length ? (
        <>
          <header className="observation-stream-header"><h1>观察</h1></header>
          <ObservationStream items={briefs} />
        </>
      ) : <ObservationEmptyState {...site.emptyStates.observations} />}
    </LayoutShell>
  );
}
