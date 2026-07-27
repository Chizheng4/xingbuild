import { ObservationEmptyState, ObservationStream } from "../components/observations/Briefs";
import { LayoutShell } from "../components/site/LayoutShell";
import { PositioningStrip } from "../components/site/PageStructure";
import { observationBriefs } from "../content/observationBriefs";
import { selectObservationBriefs } from "../content/observationQueries";
import { site } from "../content/siteContent";

export function ObservationsPage() {
  const briefs = selectObservationBriefs(observationBriefs);
  return (
    <LayoutShell className="observations-page">
      <PositioningStrip>{site.homeTitle}</PositioningStrip>
      {briefs.length ? <ObservationStream items={briefs} /> : <ObservationEmptyState {...site.emptyStates.observations} />}
    </LayoutShell>
  );
}
