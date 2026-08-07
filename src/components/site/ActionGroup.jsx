import { Link } from "../../lib/navigation";
import { safePracticeAction } from "../../content/practiceAction";

function Action({ action, className = "" }) {
  if (!action?.href || !action?.label) return null;
  const safeExternal = safePracticeAction(action);
  if (safeExternal) {
    return <a className={`action-group__action ${className}`.trim()} href={safeExternal.href} target="_blank" rel="noreferrer">{action.label}</a>;
  }
  if (typeof action.href === "string" && action.href.startsWith("/") && !action.href.startsWith("//")) {
    return <Link className={`action-group__action ${className}`.trim()} href={action.href}>{action.label}</Link>;
  }
  return null;
}

export function ActionGroup({ actions = [], className = "", equalWidth = false }) {
  const visibleActions = actions.filter((action) => action?.href && action?.label);
  if (!visibleActions.length) return null;
  const classes = ["action-group", equalWidth ? "action-group--equal" : "", className].filter(Boolean).join(" ");
  return (
    <div
      className={classes}
      data-action-count={equalWidth ? visibleActions.length : undefined}
      style={equalWidth ? { "--action-count": String(visibleActions.length) } : undefined}
    >
      {visibleActions.map((action) => <Action action={action} key={action.id || `${action.href}:${action.label}`} />)}
    </div>
  );
}

export { Action };
