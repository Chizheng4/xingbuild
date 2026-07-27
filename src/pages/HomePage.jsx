import { PracticePage } from "../components/practice/PracticePage";
import { findPractice, site } from "../content/siteContent";

export function HomePage() {
  return <PracticePage practice={findPractice("robotaxi")} homeTitle={site.homeTitle} />;
}
