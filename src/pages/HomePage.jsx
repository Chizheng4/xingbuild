import { ObservationRail } from "../components/observations/Briefs";
import { PracticePresentation } from "../components/practice/PracticePage";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { selectObservationBriefs } from "../content/observationRepository";
import { findPractice } from "../content/practiceRepository";
import { latestBusinessObservation } from "../content/showcaseRepository";
import { site } from "../content/siteContent";

export function HomePage() {
  const practice = findPractice("robotaxi");
  const framework = latestBusinessObservation();
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} /> : undefined;
  return (
    <LayoutShell className="home-page">
      <TwoColumnLayout renderRail={renderRail}>
        <h1 className="home-page__positioning">{site.homeTitle}</h1>
        <section className="home-page__projection" aria-labelledby="home-product-title"><PracticePresentation practice={{ ...practice, title: practice.title }} headingLevel={2} headingId="home-product-title" /></section>
        <section className="home-page__projection" aria-labelledby="home-business-title"><header className="home-page__business-header"><h2 id="home-business-title">{framework.title}</h2><p>{framework.summary}</p></header><FrameworkExplorer /></section>
      </TwoColumnLayout>
    </LayoutShell>
  );
}
