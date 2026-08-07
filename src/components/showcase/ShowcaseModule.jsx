import { SystemStage } from "./SystemStage.jsx";

export function ShowcaseModule({ module, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  const label = typeof module.group === "string" ? module.group.trim() : "";
  return (
    <article className="showcase-module">
      <div className="showcase-module__copy">
        {label ? <p className="showcase-module__label">{label}</p> : null}
        <Heading>{module.label}</Heading>
        {module.shortDescription ? <p>{module.shortDescription}</p> : null}
      </div>
      <SystemStage media={module.media} action={module.action} />
    </article>
  );
}
