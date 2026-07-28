import { ObservationRail } from "../components/observations/Briefs";
import { LayoutShell, TwoColumnLayout } from "../components/site/LayoutShell";
import { PositioningStrip } from "../components/site/PageStructure";
import { selectObservationBriefs } from "../content/observationRepository";
import { site, works } from "../content/siteContent";
import { Link } from "../lib/navigation";

export function HomePage() {
  const briefs = selectObservationBriefs();
  const renderRail = briefs.length
    ? (anchorRef) => <ObservationRail items={briefs} anchorRef={anchorRef} />
    : undefined;
  return (
    <LayoutShell className="home-page">
      <TwoColumnLayout renderRail={renderRail}>
        <h1 className="sr-only">{site.home.title}</h1>
        <PositioningStrip>{site.homeTitle}</PositioningStrip>
        <section className="home-practices" aria-labelledby="home-practices-title">
          <h2 id="home-practices-title">{site.home.practicesTitle}</h2>
          {works.map((work) => (
            <Link key={work.id} href={work.id === "robotaxi" ? "/robotaxi" : "/enterprise-operating-framework"} className="home-practice-link">
              <span>{work.title}</span><small>{work.summary}</small>
            </Link>
          ))}
        </section>
      </TwoColumnLayout>
    </LayoutShell>
  );
}
