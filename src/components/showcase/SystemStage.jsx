import { MediaStage } from "./MediaStage.jsx";

export function SystemStage({ media, action, children, className = "" }) {
  if (children) return <div className={`system-stage system-stage--framework ${className}`.trim()}>{children}</div>;
  return <MediaStage media={media} action={action} className={className} />;
}
