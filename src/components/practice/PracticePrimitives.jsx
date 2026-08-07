import { robotaxiProductConfiguration } from "../../content/productConfiguration.js";
import { ActionGroup } from "../site/ActionGroup.jsx";
import { ShowcaseModule } from "../showcase/ShowcaseModule.jsx";

/**
 * Page-neutral primitives shared by the Home and Products compositions.
 * Page-level structure and lifecycle decisions belong to their callers.
 */
export function ProductHero({ practice, headingLevel = 1, headingId, actions = [], eyebrow = null, showBoundary = false, align = "center" }) {
  const Heading = `h${headingLevel}`;
  const alignmentClass = align === "start" ? " product-hero--start" : "";
  return (
    <header className={`product-hero${headingLevel > 1 ? " product-hero--compact" : ""}${alignmentClass}`}>
      <div className="product-hero__heading">
        {eyebrow ? <p className="eyebrow product-hero__eyebrow">{eyebrow}</p> : null}
        <Heading id={headingId}>{practice.title}</Heading>
      </div>
      {practice.intro ? <p className="product-hero__intro">{practice.intro}</p> : null}
      {showBoundary && practice.boundary ? <p className="product-hero__boundary">{practice.boundary}</p> : null}
      {actions.length ? <ActionGroup actions={actions} equalWidth /> : null}
    </header>
  );
}

export function PracticeModule({ module, headingLevel = 2 }) {
  return <ShowcaseModule module={module} headingLevel={headingLevel} />;
}

export function PracticeModuleList({ modules = [], headingLevel = 2 }) {
  if (!modules.length) return <section className="practice-module-list content-empty-state" aria-label="产品模块状态"><p>暂无已发布产品模块</p></section>;
  return <section className="practice-module-list" aria-label="产品说明与媒体">{modules.map((module) => <PracticeModule key={module.id} module={module} headingLevel={headingLevel} />)}</section>;
}

export function projectClosingAction(practice) {
  const closing = practice.closing || robotaxiProductConfiguration.closing;
  const duplicateSummary = [practice.intro, practice.boundary]
    .filter((value) => typeof value === "string" && value.trim())
    .some((value) => typeof closing.summary === "string" && value.trim() === closing.summary.trim());
  return duplicateSummary ? { ...closing, summary: null } : closing;
}
