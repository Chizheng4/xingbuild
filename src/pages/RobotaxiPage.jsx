import { ProductsShowcase } from "../components/page-compositions/ProductsShowcase.jsx";
import { LayoutShell } from "../components/site/LayoutShell";
import { findPractice } from "../content/practiceRepository";

export function RobotaxiPage() {
  const practice = findPractice("robotaxi");
  return <LayoutShell className="practice-page"><ProductsShowcase practice={practice} /></LayoutShell>;
}
