import { PracticePage } from "../components/practice/PracticePage";
import { ObservationRail } from "../components/observations/Briefs";
import { selectObservationBriefs } from "../content/observationRepository";
import { findPractice } from "../content/practiceRepository";

export function RobotaxiPage() {
  const practice = findPractice("robotaxi");
  const briefs = selectObservationBriefs(practice.observationQuery);
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/products" />
    : undefined;
  return <PracticePage practice={practice} renderRail={renderRail} />;
}
