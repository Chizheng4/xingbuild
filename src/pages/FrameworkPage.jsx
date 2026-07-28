import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { PositioningStrip } from "../components/site/PageStructure";
import { selectObservationBriefs } from "../content/observationRepository";
import { site } from "../content/siteContent";

export function FrameworkPage() {
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} />
    : undefined;
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout renderRail={renderRail}>
        <PositioningStrip>{site.homeTitle}</PositioningStrip>
        <FrameworkExplorer />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
