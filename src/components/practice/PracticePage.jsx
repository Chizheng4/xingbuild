import { LayoutShell, TwoColumnLayout } from "../site/LayoutShell";
import { ProductsShowcase } from "../page-compositions/ProductsShowcase.jsx";

// Compatibility exports for legacy callers and fixtures. Page composition is
// owned by ProductsShowcase; these exports remain page-neutral primitives.
export {
  ProductHero,
  PracticeModule,
  PracticeModuleList,
  projectClosingAction,
} from "./PracticePrimitives.jsx";

export function PracticePage({ practice, renderRail }) {
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}><ProductsShowcase practice={practice} /></TwoColumnLayout>
    </LayoutShell>
  );
}
