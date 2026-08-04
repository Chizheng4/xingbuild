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
  const Heading = `h${headingLevel}`;
  const description = (
    <>
      <Heading>{module.label}</Heading>
      <p>{module.shortDescription}</p>
    </>
  );
  if (!module.media?.src) {
    return <section className="showcase-layout practice-module"><div className="showcase-layout__description">{description}</div></section>;
  }
  return (
    <ShowcaseLayout
      className="practice-module"
      description={description}
      stage={<SystemStage media={module.media} action={module.action} />}
    />
  );
}

export function PracticeModuleList({ modules, headingLevel = 2 }) {
  if (!modules.length) return null;
  return <section className="practice-module-list">{modules.map((module) => <PracticeModule key={module.id} module={module} headingLevel={headingLevel} />)}</section>;
}

export function PracticePresentation({ practice, headingLevel = 1, headingId }) {
  if (!practice) {
    return <section className="practice-presentation content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
  }
  const hasModules = practice.modules.length > 0;
  return (
    <div className="practice-presentation">
      <PracticeHeader practice={practice} headingLevel={headingLevel} headingId={headingId} />
      {hasModules ? <PracticeModuleList modules={practice.modules} headingLevel={headingLevel + 1} /> : null}
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
