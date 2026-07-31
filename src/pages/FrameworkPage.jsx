import { EvergreenArticle } from "../components/reading/EvergreenArticle";
import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findEvergreenArticle } from "../content/evergreenArticleRepository";

export function FrameworkPage() {
  const article = findEvergreenArticle("enterprise-operating-system");
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/business-observations" />
    : undefined;
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout renderRail={renderRail}>
        <EvergreenArticle article={article} />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
