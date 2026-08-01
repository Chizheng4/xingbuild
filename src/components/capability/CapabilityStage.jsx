import { ShowcaseLayout } from "../site/LayoutShell";
import { VisualizationHost } from "./VisualizationHost";

export function CapabilityStage({ capability, description, resolveMedia, onAction, allowFixture = false, className = "" }) {
  return (
    <ShowcaseLayout
      className={`capability-stage ${className}`.trim()}
      description={description || (capability.title ? <><h2>{capability.title}</h2><p>{capability.summary}</p></> : null)}
      stage={<VisualizationHost capability={capability} resolveMedia={resolveMedia} onAction={onAction} allowFixture={allowFixture} showHeader={false} />}
    />
  );
}
