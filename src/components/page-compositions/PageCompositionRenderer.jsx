import { ObservationEmptyState, ObservationStream, ObservationRail } from "../observations/Briefs";
import { ShowcaseFlow } from "../showcase/ShowcaseFlow.jsx";
import { EvergreenArticle } from "../reading/EvergreenArticle";
import { RichDocument } from "../reading/RichDocument";
import { ResumeActions } from "../profile/ResumeActions.jsx";
import { ActionGroup } from "../site/ActionGroup.jsx";
import { ReturnNavigation } from "../navigation/ReturnNavigation";
import {
  CollectionLayout,
  LayoutShell,
  ReadingShell,
  TwoColumnLayout,
} from "../site/LayoutShell";
import { resolvePageContent } from "../../content/pageContentResolver";
import {
  observationCollectionHref,
  returnDestinationFor,
  safeReturnTo,
} from "../../lib/navigation";
import { robotaxiProductConfiguration } from "../../content/productConfiguration.js";

function EmptyContentState() {
  return <section className="content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
}

function HomeComposition({ content }) {
  const practice = content.practice;
  const briefs = content.briefs;
  return (
    <LayoutShell className="page-composition page-composition--home home-page">
      <section className="home-page__positioning-shell"><h1 className="home-page__positioning">{content.site.homeTitle}</h1></section>
      <ActionGroup className="home-page__actions" actions={robotaxiProductConfiguration.heroActions} />
      <section className="home-page__projection" aria-labelledby="home-product-title"><ShowcaseFlow practice={practice ? { ...practice, title: practice.title } : null} headingLevel={2} headingId="home-product-title" actions={[]} /></section>
      <section className="home-page__latest-briefs" aria-labelledby="home-briefs-title">
        <header className="section-heading"><p className="eyebrow">最新短文</p><h2 id="home-briefs-title">经营观察</h2></header>
        {briefs.length ? <ObservationStream items={briefs.slice(0, 3)} returnTo="/" /> : <ObservationEmptyState {...content.site.emptyStates.observations} />}
      </section>
    </LayoutShell>
  );
}

function ShowcaseComposition({ content }) {
  const practice = content.practice;
  return (
    <LayoutShell className="page-composition page-composition--showcase practice-page">
      {practice ? <ShowcaseFlow practice={practice} showLatestUpdate showClosing /> : <EmptyContentState />}
    </LayoutShell>
  );
}

function CollectionComposition({ content, location }) {
  const briefs = content.briefs;
  const origin = safeReturnTo(new URLSearchParams(location?.search || "").get("origin"), "");
  const returnTo = observationCollectionHref(origin);
  return (
    <LayoutShell className="page-composition page-composition--collection observations-page">
      <CollectionLayout>
        <ReturnNavigation
          href={origin || "/business-observations"}
          destination={returnDestinationFor(origin || "/business-observations")}
          origin={origin}
          returnTo={returnTo}
          secondary={origin && origin !== "/business-observations" ? { href: "/business-observations", label: "经营观察" } : null}
        />
        <header className="observation-stream-header">
          <h1>观察</h1>
        </header>
        {briefs.length ? <ObservationStream items={briefs} returnTo={returnTo} /> : <ObservationEmptyState {...content.site.emptyStates.observations} />}
      </CollectionLayout>
    </LayoutShell>
  );
}

function ProfileReading({ profile: about }) {
  if (!about) return <EmptyContentState />;
  const hiddenHeadingIds = new Set(["resume", "direction"]);
  const blocks = [];
  let suppressed = false;
  for (const block of about.blocks || []) {
    if (block.type === "heading" && hiddenHeadingIds.has(block.id)) {
      suppressed = true;
      continue;
    }
    if (block.type === "heading") suppressed = false;
    if (!suppressed) blocks.push(block);
  }
  return (
    <LayoutShell className="page-composition page-composition--reading about-page">
      <ReadingShell>
        <header className="reading-shell__header"><h1>{about.title}</h1><p>{about.summary}</p></header>
        <RichDocument blocks={blocks} />
        <ResumeActions />
      </ReadingShell>
    </LayoutShell>
  );
}

function ArticleReading({ article, briefs }) {
  if (!article) return <EmptyContentState />;
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/business-observations" />
    : undefined;
  return (
    <LayoutShell className="page-composition page-composition--reading framework-page">
      <TwoColumnLayout renderRail={renderRail}><EvergreenArticle article={article} /></TwoColumnLayout>
    </LayoutShell>
  );
}

function ReadingComposition({ content }) {
  if (content.profile) return <ProfileReading profile={content.profile} />;
  if (content.article) return <ArticleReading article={content.article} briefs={content.briefs || []} />;
  return <EmptyContentState />;
}

const compositionRenderers = Object.freeze({
  HomeComposition,
  ShowcaseComposition,
  CollectionComposition,
  ReadingComposition,
});

export function PageCompositionRenderer({ definition, location }) {
  if (!definition || !compositionRenderers[definition.composition]) {
    throw new Error(`Unknown PageComposition: ${definition?.composition ?? "undefined"}`);
  }
  const Renderer = compositionRenderers[definition.composition];
  return <Renderer definition={definition} content={resolvePageContent(definition)} location={location} />;
}

export { compositionRenderers };
