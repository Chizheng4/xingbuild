import { ObservationEmptyState, ObservationStream, ObservationRail } from "../observations/Briefs";
import { BusinessObservationPresentation } from "../business-observations/BusinessObservationPresentation";
import { PracticePresentation } from "../practice/PracticePage";
import { EvergreenArticle } from "../reading/EvergreenArticle";
import { RichDocument } from "../reading/RichDocument";
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

function EmptyContentState() {
  return <section className="content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
}

function HomeComposition({ content }) {
  const practice = content.practice;
  const framework = content.businessObservation;
  const briefs = content.briefs;
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/" />
    : undefined;
  return (
    <LayoutShell className="home-page">
      <section className="home-page__positioning-shell"><h1 className="home-page__positioning">{content.site.homeTitle}</h1></section>
      <TwoColumnLayout renderRail={renderRail}>
        <section className="home-page__projection" aria-labelledby="home-product-title"><PracticePresentation practice={practice ? { ...practice, title: practice.title } : null} headingLevel={2} headingId="home-product-title" /></section>
        <section className="home-page__projection"><BusinessObservationPresentation observation={framework} headingLevel={2} headingId="home-business-title" /></section>
      </TwoColumnLayout>
    </LayoutShell>
  );
}

function ShowcaseComposition({ content }) {
  const practice = content.practice;
  const briefs = content.briefs;
  const renderRail = practice?.modules?.length && briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} origin="/products" />
    : undefined;
  return (
    <LayoutShell className="practice-page">
      <TwoColumnLayout renderRail={renderRail}>{practice ? <PracticePresentation practice={practice} /> : <EmptyContentState />}</TwoColumnLayout>
    </LayoutShell>
  );
}

function CollectionComposition({ content, location }) {
  const briefs = content.briefs;
  const origin = safeReturnTo(new URLSearchParams(location?.search || "").get("origin"), "");
  const returnTo = observationCollectionHref(origin);
  return (
    <LayoutShell className="observations-page">
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
  return (
    <LayoutShell className="about-page">
      <ReadingShell>
        <header className="reading-shell__header"><h1>{about.title}</h1><p>{about.summary}</p></header>
        <RichDocument blocks={about.blocks} />
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
    <LayoutShell className="framework-page">
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
