import { SystemStage } from "./SystemStage.jsx";

export function ShowcaseModule({ module, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;
  return (
    <article className="showcase-module">
      <div className="showcase-module__copy">
        <p className="showcase-module__label">{module.group || module.label}</p>
        <Heading>{module.label}</Heading>
        <p>{module.shortDescription}</p>
      </div>
      <SystemStage media={module.media} action={module.action} />
    </article>
  );
}
