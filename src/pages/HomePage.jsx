import { profile, publishedObservations, site, works } from "../content/siteContent";
import { Link } from "../lib/navigation";
import { ObservationFeature, ObservationRow } from "../components/content/Observations";
import { HeroStatement, SectionIntro } from "../components/site/PageStructure";
import { WorkSummary } from "../components/works/Works";

export function HomePage() {
  const featured = publishedObservations.find((item) => item.featured) || publishedObservations[0];
  const compact = publishedObservations.filter((item) => item.id !== featured?.id).slice(0, 4);
  return (
    <>
      <HeroStatement
        eyebrow={site.author}
        title={"观察企业如何经营，把判断构\u2060建成可以运行和验证的系统。"}
        summary="持续研究企业经营、业务架构与数字化实现，并把形成的判断沉淀为作品。"
      />
      <section className="home-section home-observations">
        <SectionIntro
          eyebrow="01"
          title="最新观察"
          description="关于 Robotaxi、企业经营与数字化的持续观察和阶段性判断。"
          action={<Link href="/observations">查看全部 <span aria-hidden="true">→</span></Link>}
        />
        <ObservationFeature observation={featured} />
        <div className="observation-list">
          {compact.map((item) => <ObservationRow key={item.id} observation={item} />)}
        </div>
      </section>
      <section className="home-section">
        <SectionIntro
          eyebrow="02"
          title="核心作品"
          description="已经形成结构、实现和证据边界的系统与认知成果。"
          action={<Link href="/works">进入作品 <span aria-hidden="true">→</span></Link>}
        />
        <div className="work-list">{works.map((work) => <WorkSummary key={work.id} work={work} />)}</div>
      </section>
      <section className="home-about">
        <p className="eyebrow">关于我</p>
        <p>{profile.positioning}</p>
        <Link href="/about">了解经历、能力与当前方向 <span aria-hidden="true">→</span></Link>
      </section>
      <aside className="home-status" aria-label="网站当前状态">
        <span>当前关注</span><strong>企业经营、业务架构与数字化实现</strong>
      </aside>
    </>
  );
}
