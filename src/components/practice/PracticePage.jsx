import { LayoutShell, TwoColumnLayout } from "../site/LayoutShell";

export function InteractiveMedia({ media, action }) {
  if (!media?.src || media.type !== "image") return null;
  const image = <img src={media.src} alt={media.altZh} />;
  if (!action?.href) return <div className="evidence-image-frame">{image}</div>;
  return (
    <a className="evidence-image-frame interactive-media" href={action.href} target="_blank" rel="noreferrer">
      {image}
    </a>
  );
}

export function PracticeModule({ module, headingLevel = 2 }) {
  const image = <InteractiveMedia media={module.media} action={module.action} />;
  if (!image) return null;
  const Heading = `h${headingLevel}`;
  return (
    <article className="practice-module">
      <div className="practice-module__copy">
        <Heading>{module.label}</Heading>
        <p>{module.shortDescription}</p>
        {module.loopRelation ? <p className="practice-module__relation">{module.loopRelation}</p> : null}
      </div>
      {image}
    </article>
  );
}

function groupPracticeModules(modules) {
  return modules.reduce((groups, module) => {
    const currentGroup = groups.at(-1);
    if (currentGroup?.label === module.group) {
      currentGroup.modules.push(module);
      return groups;
    }
    groups.push({ label: module.group, modules: [module] });
    return groups;
  }, []);
}

export function PracticeModuleGroup({ group }) {
  const hasVisibleLabel = group.modules.length > 1;
  const labelId = hasVisibleLabel ? `practice-group-${group.modules[0].id}` : undefined;
  return (
    <div className="practice-module-group" aria-label={hasVisibleLabel ? undefined : group.label} aria-labelledby={labelId}>
      {hasVisibleLabel ? <h2 className="practice-module-group__title" id={labelId}>{group.label}</h2> : null}
      <div className="practice-module-group__items">
        {group.modules.map((module) => <PracticeModule key={module.id} module={module} headingLevel={hasVisibleLabel ? 3 : 2} />)}
      </div>
    </div>
  );
}

export function PracticeModuleList({ modules }) {
  const visibleModules = modules.filter((module) => module.media?.src);
  if (!visibleModules.length) return null;
  const groups = groupPracticeModules(visibleModules);
  return <section className="practice-module-list">{groups.map((group) => <PracticeModuleGroup key={group.modules[0].id} group={group} />)}</section>;
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

export function PracticePage({ practice, renderRail }) {
  const hasModules = practice.modules.some((module) => module.media?.src);
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}>
        <PracticeHeader practice={practice} />
        {hasModules ? <PracticeModuleList modules={practice.modules} /> : <PracticeEmptyState practice={practice} />}
      </TwoColumnLayout>
    </LayoutShell>
  );
}
