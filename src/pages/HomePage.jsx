import { profile, site, works } from "../content/siteContent";
import { selectHomeObservations } from "../content/observationRepository";
import { Link } from "../lib/navigation";
import { ObservationArchive } from "../components/content/Observations";
import { HeroStatement, SectionIntro } from "../components/site/PageStructure";
import { WorkCardGrid } from "../components/works/Works";

export function HomePage() {
  const latestObservations = selectHomeObservations();
  return (
    <div className="home-page page-stack">
      <HeroStatement
        eyebrow={site.author}
        title={"观察企业如何经营，把判断构\u2060建成可以运行和验证的系统。"}
        summary="持续研究企业经营、业务架构与数字化实现，并把形成的判断沉淀为作品。"
      />
      <div className="home-sections page-section-stack">
        <section className="home-section home-observations section-flow">
          <SectionIntro
            title="最新观察"
            description="关于 Robotaxi、企业经营与数字化的持续观察和阶段性判断。"
            action={<Link href="/observations">查看全部 <span aria-hidden="true">→</span></Link>}
          />
          <ObservationArchive items={latestObservations} />
        </section>
        <section className="home-section section-flow">
          <SectionIntro
            title="核心作品"
            description="已经形成结构、实现和证据边界的系统与认知成果。"
            action={<Link href="/works">进入作品 <span aria-hidden="true">→</span></Link>}
          />
          <WorkCardGrid items={works} />
        </section>
        <section className="home-about content-object object-stack">
          <p className="eyebrow object-identity">关于我</p>
          <p className="object-proposition">{profile.positioning}</p>
          <Link className="object-action" href="/about">了解经历、能力与当前方向 <span aria-hidden="true">→</span></Link>
        </section>
        <aside className="home-status" aria-label="网站当前状态">
          <span>当前关注</span><strong>企业经营、业务架构与数字化实现</strong>
        </aside>
      </div>
    </div>
  );
}
