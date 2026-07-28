export function SystemStage({ media, action, children, className = "" }) {
  if (children) return <div className={`system-stage system-stage--framework ${className}`.trim()}>{children}</div>;
  if (!media?.src) return null;

  const visual = media.type === "video"
    ? <video controls preload="metadata" src={media.src} aria-label={media.altZh} />
    : <img src={media.src} alt={media.altZh} />;
  if (!action?.href) return <div className={`system-stage system-stage--${media.type || "image"} ${className}`.trim()}>{visual}</div>;
  return (
    <a className={`system-stage system-stage--${media.type || "image"} is-interactive ${className}`.trim()} href={action.href} target="_blank" rel="noreferrer">
      {visual}
    </a>
  );
}
