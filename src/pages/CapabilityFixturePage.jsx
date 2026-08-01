import { LayoutShell, ShowcaseLayout } from "../components/site/LayoutShell";
import { SystemStage } from "../components/showcase/SystemStage";
import { capabilityFixtures } from "../content/capabilityPresentation";
import { VisualizationHost } from "../components/capability/VisualizationHost";

export function CapabilityFixturePage() {
  const architecture = capabilityFixtures[0];
  const system = capabilityFixtures[1];
  return (
    <LayoutShell className="capability-fixture-page">
      <header className="page-intro"><h1>能力展示控件 fixture</h1><p className="page-summary">仅用于验证声明式能力、状态和响应式容器；不属于公开内容。</p></header>
      <ShowcaseLayout
        className="capability-stage"
        description={<><h2>{architecture.title}</h2><p>{architecture.summary}</p></>}
        stage={<SystemStage><VisualizationHost capability={architecture} allowFixture showHeader={false} /></SystemStage>}
      />
      <ShowcaseLayout
        className="capability-stage"
        description={<><h2>{system.title}</h2><p>{system.summary}</p></>}
        stage={<SystemStage><VisualizationHost capability={system} allowFixture showHeader={false} /></SystemStage>}
      />
    </LayoutShell>
  );
}
