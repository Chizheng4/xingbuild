import { ObservationEmptyState, ObservationStream } from "../components/observations/Briefs";
import { CollectionLayout, LayoutShell } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { site } from "../content/siteContent";

export function ObservationsPage() {
  const briefs = selectObservationBriefs();
  return (
    <LayoutShell className="observations-page">
      <CollectionLayout>
        <header className="observation-stream-header"><h1>观察</h1></header>
        {briefs.length ? <ObservationStream items={briefs} /> : <ObservationEmptyState {...site.emptyStates.observations} />}
      </CollectionLayout>
    </LayoutShell>
  );
}
