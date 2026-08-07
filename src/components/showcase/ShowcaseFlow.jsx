import { PracticeModuleList } from "../practice/PracticePrimitives.jsx";

/** Compatibility slot helper; page-level composition is intentionally local. */
export function ShowcaseFlow({ modules = [], headingLevel = 2 }) {
  return <PracticeModuleList modules={modules} headingLevel={headingLevel} />;
}
