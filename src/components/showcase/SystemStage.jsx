import { useState } from "react";
import { safePracticeAction } from "../../content/practiceAction";

function MediaFallback({ label }) {
  return <span className="system-stage__fallback" role="img" aria-label={label}>媒体暂时无法显示</span>;
}

export function SystemStage({ media, action, children, className = "" }) {
  const [status, setStatus] = useState("loading");
  if (children) return <div className={`system-stage system-stage--framework ${className}`.trim()}>{children}</div>;
  if (!media?.src) return <div className={`system-stage system-stage--empty ${className}`.trim()}><MediaFallback label="暂无可用媒体" /></div>;

  const safeAction = safePracticeAction(action);
  const label = media.altZh || "产品媒体";
  const visual = status === "failed"
    ? <MediaFallback label={`${label}加载失败`} />
    : media.type === "video"
      ? <video controls={!safeAction} preload="metadata" src={media.src} aria-label={safeAction ? undefined : label} aria-hidden={safeAction ? "true" : undefined} onLoadedMetadata={() => setStatus("ready")} onError={() => setStatus("failed")} />
      : <img src={media.src} alt={safeAction ? "" : label} onLoad={() => setStatus("ready")} onError={() => setStatus("failed")} />;
  const loading = status === "loading" ? <span className="system-stage__loading" aria-hidden="true">媒体加载中</span> : null;

  if (safeAction) {
    return <a className={`system-stage system-stage--${media.type || "image"} is-interactive ${className}`.trim()} href={safeAction.href} target="_blank" rel="noreferrer" aria-label={`查看产品演示：${label}`} aria-busy={status === "loading"}>{visual}{loading}</a>;
  }
  return <div className={`system-stage system-stage--${media.type || "image"} ${className}`.trim()} aria-busy={status === "loading"}>{visual}{loading}</div>;
}
