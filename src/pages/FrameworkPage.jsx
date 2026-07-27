import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { PositioningStrip } from "../components/site/PageStructure";
import { site } from "../content/siteContent";

export function FrameworkPage() {
  return (
    <LayoutShell className="framework-page">
      <TwoColumnLayout>
        <PositioningStrip>{site.homeTitle}</PositioningStrip>
        <FrameworkExplorer />
      </TwoColumnLayout>
    </LayoutShell>
  );
}
