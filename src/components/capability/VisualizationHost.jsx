import { useMemo, useState } from "react";
import { diagramFigureAssets } from "../../content/diagramFigureAssets";
import { CAPABILITY_STATES, assertCapabilityPresentation } from "../../content/capabilityPresentation";

const STATE_LABELS = Object.freeze({
  idle: "待开始",
  active: "进行中",
  selected: "已选择",
  result: "结果",
  error: "出错",
  fallback: "文本降级",
});

function resolveInitialState(capability) {
  const requested = capability.initialState || "idle";
  return CAPABILITY_STATES.includes(requested) ? requested : "idle";
}

function FigureProjection({ capability }) {
  const assets = diagramFigureAssets(capability.sourcePath);
  if (!assets) return null;
  return (
    <picture className="visualization-host__picture">
      <source media="(max-width: 32.4375rem)" srcSet={assets.mobile} />
      <img src={assets.desktop} alt={capability.alt} loading="lazy" />
    </picture>
  );
}

function MediaProjection({ capability, resolveMedia }) {
  const media = resolveMedia?.(capability.mediaId);
  if (!media?.src) return null;
  return media.type === "video"
    ? <video controls preload="metadata" src={media.src} aria-label={capability.alt} />
    : <img src={media.src} alt={capability.alt} loading="lazy" />;
}

function Projection({ capability, resolveMedia }) {
  if (["architecture", "flow", "state", "lifecycle"].includes(capability.kind)) return <FigureProjection capability={capability} />;
  if (capability.kind === "media") return <MediaProjection capability={capability} resolveMedia={resolveMedia} />;
  if (capability.kind === "interactive-system") return <div className="visualization-host__system-placeholder" aria-hidden="true">↗</div>;
  return null;
}

export function VisualizationHost({ capability: rawCapability, resolveMedia, onAction, allowFixture = false, showHeader = true }) {
  const capability = useMemo(() => assertCapabilityPresentation(rawCapability, { allowFixture }), [allowFixture, rawCapability]);
  const [state, setState] = useState(resolveInitialState(capability));
  const figureAssets = capability.sourcePath ? diagramFigureAssets(capability.sourcePath) : null;
  const media = capability.mediaId ? resolveMedia?.(capability.mediaId) : null;
  const canProject = capability.kind === "interactive-system"
    ? Boolean(capability.route)
    : capability.kind === "media" ? Boolean(media?.src) : Boolean(figureAssets);
  const isFailure = state === "error" || state === "fallback" || !canProject;
  const nextState = state === "idle" ? "active" : state === "active" ? "selected" : state === "selected" ? "result" : "selected";
  const activate = () => {
    if (!canProject) { setState("fallback"); return; }
    setState(nextState);
    onAction?.(capability);
  };
  const reset = () => setState(resolveInitialState(capability));
  const actionLabel = state === "idle" ? capability.action?.label || "开始展示" : state === "result" ? "再次查看" : "继续查看";

  return (
    <div className={`visualization-host visualization-host--${capability.kind}`} data-capability-id={capability.id} data-state={isFailure ? "fallback" : state}>
      {showHeader ? <div className="visualization-host__header">
        {capability.title ? <h3>{capability.title}</h3> : null}
        {capability.summary ? <p>{capability.summary}</p> : null}
      </div> : null}
      <div className="visualization-host__viewport" aria-live="polite">
        {isFailure ? (
          <div className="visualization-host__fallback" role="status">
            <strong>{state === "error" ? "展示失败" : "可读降级"}</strong>
            <p>{capability.fallback?.text || "当前能力暂不可用，仍可继续阅读相关说明。"}</p>
          </div>
        ) : capability.kind === "interactive-system" ? (
          <a className="visualization-host__action" href={capability.route}>{capability.action?.label || "打开系统"}</a>
        ) : (
          <button className="visualization-host__projection" type="button" onClick={activate} aria-pressed={state === "selected" || state === "result"}>
            <Projection capability={capability} resolveMedia={resolveMedia} />
          </button>
        )}
      </div>
      <div className="visualization-host__controls">
        {isFailure ? <button type="button" onClick={reset}>恢复展示</button> : <button type="button" onClick={activate}>{actionLabel}</button>}
        <span className="visualization-host__state" data-state={state}>{STATE_LABELS[state]}</span>
      </div>
      {capability.caption ? <p className="visualization-host__caption">{capability.caption}</p> : null}
    </div>
  );
}
