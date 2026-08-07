import { ObservationRail } from "../components/observations/Briefs";
import { BusinessObservationPresentation } from "../components/business-observations/BusinessObservationPresentation";
import { HomeProductProjection } from "../components/page-compositions/HomeProductProjection.jsx";
import { ActionGroup } from "../components/site/ActionGroup.jsx";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { findPractice } from "../content/practiceRepository";
import { latestBusinessObservation } from "../content/showcaseRepository";
import { home } from "../content/homeContentAdapter";
import { robotaxiProductConfiguration } from "../content/productConfiguration.js";

export function HomePage() {
  const practice = findPractice("robotaxi");
  const framework = latestBusinessObservation();
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/" /> : undefined;
  // `site.homeTitle` is the legacy source field; the home adapter owns its
  // active ContentSet projection and keeps the product-only fallback safe.
  return (
    <LayoutShell className="home-page">
      <section className="home-page__positioning-shell"><h1 className="home-page__positioning">{home.homeTitle}</h1></section>
      <div className="home-page__actions-align">
        <ActionGroup className="home-page__actions" actions={robotaxiProductConfiguration.homeActions} equalWidth />
      </div>
      <TwoColumnLayout renderRail={renderRail}>
        <section className="home-page__projection" aria-labelledby="home-product-section-label"><HomeProductProjection practice={practice ? { ...practice, title: practice.title } : null} /></section>
        <section className="home-page__projection"><BusinessObservationPresentation observation={framework} headingLevel={2} headingId="home-business-title" /></section>
      </TwoColumnLayout>
    </LayoutShell>
  );
}
