import { ObservationEmptyState, ObservationStream } from "../components/observations/Briefs";
import { CollectionLayout, LayoutShell } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { site } from "../content/siteContent";
import { Link, observationCollectionHref, returnLabelFor, safeReturnTo } from "../lib/navigation";

export function ObservationsPage({ location }) {
  const briefs = selectObservationBriefs();
  const origin = safeReturnTo(new URLSearchParams(location?.search || "").get("origin"), "");
  const returnTo = observationCollectionHref(origin);
  return (
    <LayoutShell className="observations-page">
      <CollectionLayout>
        <header className="observation-stream-header">
          <h1>观察</h1>
          <p className="observation-stream-header__navigation">
            {origin ? <Link href={origin}>{returnLabelFor(origin)}</Link> : null}
            {origin && origin !== "/business-observations" ? <span aria-hidden="true"> · </span> : null}
            {origin !== "/business-observations" ? <Link href="/business-observations">经营观察</Link> : null}
          </p>
        </header>
        {briefs.length ? <ObservationStream items={briefs} returnTo={returnTo} /> : <ObservationEmptyState {...site.emptyStates.observations} />}
      </CollectionLayout>
    </LayoutShell>
  );
}
