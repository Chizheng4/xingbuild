import { PracticePresentation } from "../practice/PracticePage.jsx";

/** Shared showcase composition entry point; product pages provide the data. */
export function ShowcaseFlow(props) {
  return <PracticePresentation {...props} />;
}
