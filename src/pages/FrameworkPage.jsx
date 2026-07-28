import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { works } from "../content/siteContent";

export function FrameworkPage() {
  const framework = works.find((work) => work.id === "enterprise-framework");
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} />
    : undefined;
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout renderRail={renderRail}>
        <header className="practice-header framework-page__header">
          <h1>企业经营体系</h1>
          <p>{framework.summary}</p>
          <p className="framework-page__boundary">{framework.boundary}</p>
        </header>
        <FrameworkExplorer />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
