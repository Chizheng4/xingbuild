import { ObservationArchive } from "../components/content/Observations";
import { PageIntro } from "../components/site/PageStructure";
import { publishedObservations } from "../content/siteContent";

export function ObservationsPage() {
  const years = [...new Set(publishedObservations.map((item) => item.publishedAt.slice(0, 4)))];
  return (
    <div className="observations-page page-stack">
      <PageIntro
        eyebrow="Observations"
        title="观察"
        summary="关于 Robotaxi、企业经营与数字化的持续观察和阶段性判断。"
      />
      {years.map((year) => {
        const items = publishedObservations.filter((item) => item.publishedAt.startsWith(year));
        return (
          <section className="year-group" key={year}>
            <h2>{year}</h2>
            <div><ObservationArchive items={items} featureFirst={year === years[0]} /></div>
          </section>
        );
      })}
    </div>
  );
}
