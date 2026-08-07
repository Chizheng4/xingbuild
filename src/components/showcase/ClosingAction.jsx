import { ActionGroup } from "../site/ActionGroup.jsx";

export function ClosingAction({ closing }) {
  if (!closing) return null;
  const eyebrow = typeof closing.eyebrow === "string" ? closing.eyebrow.trim() : "";
  return (
    <section className="closing-action" aria-labelledby="closing-action-title">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id="closing-action-title">{closing.title}</h2>
        {closing.summary ? <p>{closing.summary}</p> : null}
      </div>
      <ActionGroup actions={[closing.action]} />
    </section>
  );
}
