import { ObservationEmptyState, ObservationStream } from "../components/observations/Briefs";
import { CollectionLayout, LayoutShell } from "../components/site/LayoutShell";
import { selectObservationBriefs } from "../content/observationRepository";
import { site } from "../content/siteContent";
import { observationCollectionHref, returnDestinationFor, safeReturnTo } from "../lib/navigation";
import { ReturnNavigation } from "../components/navigation/ReturnNavigation";

export function ObservationsPage({ location }) {
  const briefs = selectObservationBriefs();
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
        {briefs.length ? <ObservationStream items={briefs} returnTo={returnTo} /> : <ObservationEmptyState {...site.emptyStates.observations} />}
      </CollectionLayout>
    </LayoutShell>
  );
}
