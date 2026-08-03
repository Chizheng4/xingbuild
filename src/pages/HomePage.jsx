import { ObservationRail } from "../components/observations/Briefs";
import { BusinessObservationPresentation } from "../components/business-observations/BusinessObservationPresentation";
import { PracticePresentation } from "../components/practice/PracticePage";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findPractice } from "../content/practiceRepository";
import { latestBusinessObservation } from "../content/showcaseRepository";
import { site } from "../content/siteContent";

export function HomePage() {
  const practice = findPractice("robotaxi");
  const framework = latestBusinessObservation();
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/" /> : undefined;
  return (
    <LayoutShell className="home-page">
      <section className="home-page__positioning-shell"><h1 className="home-page__positioning">{site.homeTitle}</h1></section>
      <TwoColumnLayout renderRail={renderRail}>
        <section className="home-page__projection" aria-labelledby="home-product-title"><PracticePresentation practice={practice ? { ...practice, title: practice.title } : null} headingLevel={2} headingId="home-product-title" /></section>
        <section className="home-page__projection"><BusinessObservationPresentation observation={framework} headingLevel={2} headingId="home-business-title" /></section>
      </TwoColumnLayout>
    </LayoutShell>
  );
}
