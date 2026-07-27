import { PositioningStrip } from "../site/PageStructure";
import { LayoutShell, TwoColumnLayout } from "../site/LayoutShell";

export function EvidenceImageFrame({ image, href }) {
  if (!image?.src) return null;
  const media = <img src={image.src} alt={image.alt} />;
  return href ? <a className="evidence-image-frame" href={href}>{media}</a> : <div className="evidence-image-frame">{media}</div>;
}

export function PracticeModule({ module }) {
  const image = <EvidenceImageFrame image={module.image} href={module.href} />;
  if (!image) return null;
  return (
    <article className="practice-module">
      <div className="practice-module__copy">
        <h2>{module.label}</h2>
        <p>{module.shortDescription}</p>
        {module.loopRelation ? <p className="practice-module__relation">{module.loopRelation}</p> : null}
      </div>
      {image}
    </article>
  );
}

export function PracticeModuleList({ modules }) {
  const visibleModules = modules.filter((module) => module.image?.src);
  if (!visibleModules.length) return null;
  return <section className="practice-module-list">{visibleModules.map((module) => <PracticeModule key={module.id} module={module} />)}</section>;
}

export function PracticeHeader({ practice }) {
  return (
    <header className="practice-header">
      <h1>{practice.title}</h1>
      <p>{practice.intro}</p>
    </header>
  );
}

export function PracticeEmptyState({ practice }) {
  return (
    <section className="practice-empty-state" aria-label={`${practice.title}的作品边界`}>
      <p>{practice.boundary}</p>
      {practice.platformUrl ? <a href={practice.platformUrl}>访问公开平台</a> : null}
    </section>
  );
}

export function PracticePage({ practice, homeTitle, renderRail }) {
  const hasModules = practice.modules.some((module) => module.image?.src);
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}>
        <PositioningStrip>{homeTitle}</PositioningStrip>
        <PracticeHeader practice={practice} />
        {hasModules ? <PracticeModuleList modules={practice.modules} /> : <PracticeEmptyState practice={practice} />}
      </TwoColumnLayout>
    </LayoutShell>
  );
}
