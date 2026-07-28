import { LayoutShell, ShowcaseLayout, TwoColumnLayout } from "../site/LayoutShell";
import { SystemStage } from "../showcase/SystemStage";

export function PracticeHeader({ practice, headingLevel = 1, headingId }) {
  const Heading = `h${headingLevel}`;
  return (
    <header className="practice-header">
      <Heading id={headingId}>{practice.title}</Heading>
      <p>{practice.intro}</p>
      <p className="practice-header__boundary">{practice.boundary}</p>
    </header>
  );
}

export function PracticeModule({ module, headingLevel = 2 }) {
  if (!module.media?.src) return null;
  const Heading = `h${headingLevel}`;
  return (
    <ShowcaseLayout
      className="practice-module"
      description={<><Heading>{module.label}</Heading><p>{module.shortDescription}</p></>}
      stage={<SystemStage media={module.media} action={module.action} />}
    />
  );
}

export function PracticeModuleList({ modules }) {
  const visibleModules = modules.filter((module) => module.media?.src);
  if (!visibleModules.length) return null;
  return <section className="practice-module-list">{visibleModules.map((module) => <PracticeModule key={module.id} module={module} />)}</section>;
}

export function PracticePresentation({ practice, headingLevel = 1, headingId }) {
  const hasModules = practice.modules.some((module) => module.media?.src);
  return (
    <div className="practice-presentation">
      <PracticeHeader practice={practice} headingLevel={headingLevel} headingId={headingId} />
      {hasModules ? <PracticeModuleList modules={practice.modules} /> : null}
    </div>
  );
}

export function PracticePage({ practice, renderRail }) {
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}><PracticePresentation practice={practice} /></TwoColumnLayout>
    </LayoutShell>
  );
}
