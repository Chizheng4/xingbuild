import { EvergreenArticle } from "../components/reading/EvergreenArticle";
import { ObservationEmptyState, ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findEvergreenArticle } from "../content/evergreenArticleRepository";
import { home } from "../content/homeContentAdapter";

export function FrameworkPage() {
  const article = findEvergreenArticle("enterprise-operating-system");
  const briefs = selectObservationBriefs();
  const renderRail = (anchorRef) => (
    <div className="business-observations-rail">
      <header className="business-observations-rail__header"><h2>最新简讯</h2></header>
      {briefs.length
        ? <ObservationRail items={briefs} anchorRef={anchorRef} origin="/business-observations" />
        : <ObservationEmptyState {...home.emptyStates.observations} />}
    </div>
  );
  return (
    <LayoutShell className="framework-page">
      <header className="business-observations-page__header"><h1>经营观察</h1></header>
      <TwoColumnLayout renderRail={renderRail}>
        <header className="business-observations-column-heading"><h2>最新经营观察</h2></header>
        <EvergreenArticle article={article} headingLevel={3} showSummary={false} showFigures={false} showArchitectureViews={false} />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
