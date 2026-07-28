import { PracticePage } from "../components/practice/PracticePage";
import { ObservationRail } from "../components/observations/Briefs";
import { selectObservationBriefs } from "../content/observationRepository";
import { findPractice } from "../content/practiceRepository";
import { site } from "../content/siteContent";

export function HomePage() {
  const practice = findPractice("robotaxi");
  const briefs = selectObservationBriefs(practice.observationQuery);
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} />
    : undefined;
  return <PracticePage practice={practice} homeTitle={site.homeTitle} renderRail={renderRail} />;
}
