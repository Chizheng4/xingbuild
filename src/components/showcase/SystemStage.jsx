export function SystemStage({ media, children, className = "" }) {
  if (children) return <div className={`system-stage system-stage--framework ${className}`.trim()}>{children}</div>;
  if (!media?.src) return null;

  const visual = media.type === "video"
    ? <video controls preload="metadata" src={media.src} aria-label={media.altZh} />
    : <img src={media.src} alt={media.altZh} />;
  return <div className={`system-stage system-stage--${media.type || "image"} ${className}`.trim()}>{visual}</div>;
}
