import { PracticePage } from "../components/practice/PracticePage";
import { findPractice } from "../content/practiceRepository";

export function RobotaxiPage() {
  const practice = findPractice("robotaxi");
  return <PracticePage practice={practice} />;
}
