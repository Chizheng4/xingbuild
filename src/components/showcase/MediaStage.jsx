import { useEffect, useRef, useState } from "react";
import { safePracticeAction } from "../../content/practiceAction.js";

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  return reduced;
}

function ratioStyle(ratio) {
  const match = /^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/.exec(ratio || "");
  return match ? { "--media-ratio": `${match[1]} / ${match[2]}` } : undefined;
}

function MediaFallback({ label, state = "empty" }) {
  const copy = state === "failed" ? "媒体暂时无法显示" : state === "revoked" ? "媒体已撤下" : "演示内容准备中";
  return <span className="media-stage__fallback" role="img" aria-label={label}>{copy}</span>;
}

export function MediaStage({ media, action, className = "" }) {
  const [status, setStatus] = useState(media?.src ? "loading" : (media?.state || "empty"));
  const videoRef = useRef(null);
  const isReducedMotion = useReducedMotion();
  const safeAction = safePracticeAction(action);
  const mediaLabel = media?.altZh || media?.alt || "产品媒体";

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || isReducedMotion) {
        video.pause();
        return;
      }
      video.play().catch(() => {});
    }, { threshold: 0.2 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [isReducedMotion, media?.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isReducedMotion) video.pause();
    else if (video.getBoundingClientRect().top < window.innerHeight && video.getBoundingClientRect().bottom > 0) video.play().catch(() => {});
  }, [isReducedMotion]);

  const content = !media?.src || ["failed", "revoked"].includes(status)
    ? <MediaFallback label={!media?.src ? "暂无可用媒体" : `${mediaLabel}加载失败`} state={media?.state || status} />
    : media.type === "video"
      ? <video
          ref={videoRef}
          src={media.src}
          aria-label={safeAction ? undefined : mediaLabel}
          aria-hidden={safeAction ? "true" : undefined}
          autoPlay={!isReducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setStatus("ready")}
          onError={() => setStatus("failed")}
        />
      : <img src={media.src} alt={safeAction ? "" : mediaLabel} onLoad={() => setStatus("ready")} onError={() => setStatus("failed")} />;

  const stageClass = `media-stage media-stage--${media?.type || "empty"}${safeAction ? " is-interactive" : ""}${className ? ` ${className}` : ""}`;
  const stage = safeAction
    ? <a className={stageClass} style={ratioStyle(media?.ratio)} href={safeAction.href} target="_blank" rel="noreferrer" aria-label="进入 Robotaxi运营平台" aria-busy={status === "loading"}>{content}{status === "loading" && media?.src ? <span className="media-stage__loading" aria-hidden="true">媒体加载中</span> : null}</a>
    : <div className={stageClass} style={ratioStyle(media?.ratio)} aria-busy={status === "loading"}>{content}{status === "loading" && media?.src ? <span className="media-stage__loading" aria-hidden="true">媒体加载中</span> : null}</div>;
  return stage;
}

export { MediaFallback };
