import { BusinessObservationPresentation } from "../components/business-observations/BusinessObservationPresentation";
import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findBusinessObservation } from "../content/showcaseRepository";

export function FrameworkPage() {
  const framework = findBusinessObservation("enterprise-operating-framework");
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/business-observations" />
    : undefined;
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout renderRail={renderRail}>
        <BusinessObservationPresentation observation={framework} headingLevel={1} headingId="business-observation-title" />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
