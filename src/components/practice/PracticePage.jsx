import { robotaxiProductConfiguration } from "../../content/productConfiguration.js";
import { ActionGroup } from "../site/ActionGroup.jsx";
import { LayoutShell, TwoColumnLayout } from "../site/LayoutShell";
import { ClosingAction } from "../showcase/ClosingAction.jsx";
import { LatestUpdateCard } from "../showcase/LatestUpdateCard.jsx";
import { ShowcaseModule } from "../showcase/ShowcaseModule.jsx";

export function ProductHero({ practice, headingLevel = 1, headingId, actions = [], eyebrow = null }) {
  const Heading = `h${headingLevel}`;
  return (
    <header className={`product-hero${headingLevel > 1 ? " product-hero--compact" : ""}`}>
      <div className="product-hero__heading">
        {eyebrow ? <p className="eyebrow product-hero__eyebrow">{eyebrow}</p> : null}
        <Heading id={headingId}>{practice.title}</Heading>
      </div>
      {practice.intro ? <p className="product-hero__intro">{practice.intro}</p> : null}
      {practice.boundary ? <p className="product-hero__boundary">{practice.boundary}</p> : null}
      {actions.length ? <ActionGroup actions={actions} /> : null}
    </header>
  );
}

export function PracticeHeader({ practice, headingLevel = 1, headingId, showLatestUpdate = false, actions = robotaxiProductConfiguration.heroActions, eyebrow = null }) {
  return (
    <>
      {showLatestUpdate ? <LatestUpdateCard /> : null}
      <ProductHero practice={practice} headingLevel={headingLevel} headingId={headingId} actions={actions} eyebrow={eyebrow} />
    </>
  );
}

export function PracticeModule({ module, headingLevel = 2 }) {
  return <ShowcaseModule module={module} headingLevel={headingLevel} />;
}

export function PracticeModuleList({ modules = [], headingLevel = 2 }) {
  if (!modules.length) return <section className="practice-module-list content-empty-state" aria-label="产品模块状态"><p>暂无已发布产品模块</p></section>;
  return <section className="practice-module-list" aria-label="产品说明与媒体">{modules.map((module) => <PracticeModule key={module.id} module={module} headingLevel={headingLevel} />)}</section>;
}

export function PracticePresentation({ practice, headingLevel = 1, headingId, showLatestUpdate = false, showClosing = false, actions = robotaxiProductConfiguration.heroActions, heroEyebrow = null }) {
  if (!practice) {
    return <section className="practice-presentation content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
  }
  return (
    <div className="practice-presentation">
      <PracticeHeader practice={practice} headingLevel={headingLevel} headingId={headingId} showLatestUpdate={showLatestUpdate} actions={actions} eyebrow={heroEyebrow} />
      <PracticeModuleList modules={practice.modules} headingLevel={headingLevel + 1} />
      {showClosing ? <ClosingAction closing={practice.closing || robotaxiProductConfiguration.closing} /> : null}
    </div>
  );
}

export function PracticePage({ practice, renderRail }) {
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}><PracticePresentation practice={practice} showLatestUpdate showClosing /></TwoColumnLayout>
    </LayoutShell>
  );
}
