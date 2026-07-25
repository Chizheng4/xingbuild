import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import {
  findObservation,
  findWork,
  profile,
  publishedObservations,
  site,
  works,
} from "./content/siteContent.js";

const formatLabels = {
  analysis: "分析",
  brief: "短观察",
};

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
}

function Link({ href, children, className, onNavigate, ariaLabel }) {
  function navigate(event) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      href.startsWith("http") ||
      href.startsWith("#")
    ) return;

    event.preventDefault();
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "instant" });
    onNavigate?.();
  }

  return <a href={href} className={className} onClick={navigate} aria-label={ariaLabel}>{children}</a>;
}

function SiteHeader({ pathname }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = [
    { href: "/observations", label: "观察" },
    { href: "/works", label: "作品" },
    { href: "/about", label: "关于我" },
  ];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const main = document.querySelector("main");
    const footer = document.querySelector("footer");
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    if (menuOpen) {
      document.body.style.overflow = "hidden";
      if (main) main.setAttribute("inert", "");
      if (footer) footer.setAttribute("inert", "");
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (main) main.removeAttribute("inert");
      if (footer) footer.removeAttribute("inert");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={`site-header ${menuOpen ? "has-open-menu" : ""}`}>
      <Link href="/" className="wordmark" onNavigate={() => setMenuOpen(false)}>{site.name}</Link>
      <button
        className="menu-button"
        type="button"
        aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? <X size={28} weight="light" aria-hidden="true" /> : <List size={28} weight="light" aria-hidden="true" />}
      </button>
      <nav id="primary-navigation" className={menuOpen ? "is-open" : ""} aria-label="主要导航">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname.startsWith(item.href) ? "is-current" : ""}
            onNavigate={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer>
      <span>© 2026 {site.name}</span>
    </footer>
  );
}

function SectionIntro({ index, title, description, action }) {
  return (
    <header className="section-intro">
      <div className="section-title">
        {index ? <span>{index}</span> : null}
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

function PageIntro({ eyebrow, title, description, meta, className = "" }) {
  return (
    <header className={`page-intro ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description ? <p className="page-description">{description}</p> : null}
      {meta ? <div className="page-meta">{meta}</div> : null}
    </header>
  );
}

function ObservationMeta({ observation, showUpdated = false }) {
  return (
    <div className="observation-meta">
      <time dateTime={observation.publishedAt}>{observation.publishedAt}</time>
      <span>{formatLabels[observation.format] || observation.format}</span>
      <span>{observation.topics[0]}</span>
      {showUpdated && observation.updatedAt !== observation.publishedAt
        ? <time dateTime={observation.updatedAt}>更新 {observation.updatedAt}</time>
        : null}
    </div>
  );
}

function ObservationFeature({ observation }) {
  if (!observation) return null;
  return (
    <article className="observation-feature">
      <ObservationMeta observation={observation} />
      <h3><Link href={`/observations/${observation.slug}`}>{observation.title}</Link></h3>
      <p>{observation.summary}</p>
      <Link className="feature-link" href={`/observations/${observation.slug}`}>
        继续阅读 <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function ObservationRow({ observation, showSummary = false }) {
  return (
    <article className="observation-row">
      <Link
        href={`/observations/${observation.slug}`}
        className="observation-row-link"
        ariaLabel={`阅读：${observation.title}`}
      >
        <ObservationMeta observation={observation} />
        <div className="observation-row-copy">
          <h3>{observation.title}</h3>
          {showSummary ? <p>{observation.summary}</p> : null}
        </div>
        <span className="row-arrow" aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

function ObservationArchive({ items, featureFirst = false }) {
  const feature = featureFirst ? items[0] : null;
  const archiveItems = featureFirst ? items.slice(1) : items;
  return (
    <>
      {feature ? <ObservationFeature observation={feature} /> : null}
      {archiveItems.length ? (
        <div className="observation-list">
          {archiveItems.map((item, index) => (
            <ObservationRow key={item.id} observation={item} showSummary={!featureFirst && index === 0} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function ArchitectureDiagram({ work }) {
  const items = work.flow || work.planes;
  return (
    <ol className={`architecture ${work.flow ? "is-flow" : "is-planes"}`} aria-label={`${work.title}架构`}>
      {items.map((item, index) => (
        <li key={item.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function WorkSummary({ work, showArchitecture = false }) {
  return (
    <article className={`work-summary ${showArchitecture ? "has-architecture" : ""}`}>
      <div className="work-index">{work.index}</div>
      <div className="work-summary-copy">
        <p className="eyebrow">{work.eyebrow}</p>
        <h3><Link href={`/works/${work.slug}`}>{work.title}</Link></h3>
        <p className="work-problem-summary">{work.problem}</p>
        <p className="work-built">{work.summary}</p>
        <div className="work-status">
          <span>{work.status}</span>
          <time dateTime={work.updatedAt}>更新 {work.updatedAt}</time>
        </div>
        <p className="work-boundary">{work.boundary}</p>
      </div>
      {showArchitecture ? <ArchitectureDiagram work={work} /> : null}
    </article>
  );
}

function HomePage() {
  const featured = publishedObservations.find((item) => item.featured) || publishedObservations[0];
  const compact = publishedObservations.filter((item) => item.id !== featured?.id).slice(0, 4);

  return (
    <>
      <section className="home-hero">
        <p className="eyebrow">{site.author}</p>
        <h1>观察企业如何经营，<br />把判断构建成可以运行和验证的系统。</h1>
        <p className="hero-description">
          持续研究企业经营、业务架构与数字化实现，并把形成的判断沉淀为作品。
        </p>
      </section>

      <section className="home-section home-observations">
        <SectionIntro
          index="01"
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
          index="02"
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
        <div><span>当前关注</span><strong>企业经营、业务架构与数字化实现</strong></div>
      </aside>
    </>
  );
}

function ObservationsPage() {
  const years = [...new Set(publishedObservations.map((item) => item.publishedAt.slice(0, 4)))];
  return (
    <>
      <PageIntro
        eyebrow="Observations"
        title="观察"
        description="关于 Robotaxi、企业经营与数字化的持续观察和阶段性判断。"
        className="collection-intro"
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
    </>
  );
}

function ArticleToc({ observation }) {
  const hasToc = observation.format === "analysis" && observation.sections.length > 2;
  if (!hasToc) return null;
  return (
    <>
      <aside className="reading-toc desktop-toc" aria-label="文章目录">
        <span>本文目录</span>
        {observation.sections.map((section) => <a key={section.heading} href={`#${section.heading}`}>{section.heading}</a>)}
      </aside>
      <details className="mobile-toc">
        <summary>本文目录</summary>
        <nav aria-label="手机文章目录">
          {observation.sections.map((section) => <a key={section.heading} href={`#${section.heading}`}>{section.heading}</a>)}
        </nav>
      </details>
    </>
  );
}

function ArticleHeader({ observation }) {
  return (
    <header className="article-header">
      <Link href="/observations" className="back-link"><span aria-hidden="true">←</span> 返回观察</Link>
      <ObservationMeta observation={observation} showUpdated />
      <h1>{observation.title}</h1>
      <p className="article-summary">{observation.summary}</p>
      {observation.discussionQuestion ? (
        <aside className="discussion-question">
          <span>本文讨论的问题</span>
          <p>{observation.discussionQuestion}</p>
        </aside>
      ) : null}
    </header>
  );
}

function ObservationPage({ observation }) {
  if (!observation) return <NotFoundPage />;
  const related = works.filter((work) => observation.relatedWorks.includes(work.id));
  const hasToc = observation.format === "analysis" && observation.sections.length > 2;

  return (
    <article className={`reading-page reading-${observation.format}`}>
      <ArticleHeader observation={observation} />
      <div className={`reading-layout ${hasToc ? "has-toc" : "without-toc"}`}>
        <ArticleToc observation={observation} />
        <div className="prose">
          {observation.sections.map((section) => (
            <section id={section.heading} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <aside className="source-note"><strong>内容来源与边界</strong><p>{observation.sourceNotes}</p></aside>
          {related.length ? (
            <section className="related-links">
              <h2>关联作品</h2>
              {related.map((work) => <Link key={work.id} href={`/works/${work.slug}`}>{work.title} <span>→</span></Link>)}
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function WorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Works"
        title="作品"
        description="作品不是功能清单。每一项都说明它面对的问题、构建对象、当前状态、证据与局限。"
        className="collection-intro"
      />
      <div className="work-list work-index-list">
        {works.map((work) => <WorkSummary key={work.id} work={work} showArchitecture />)}
      </div>
    </>
  );
}

function WorkPage({ work }) {
  if (!work) return <NotFoundPage />;
  const related = publishedObservations.filter((item) => item.relatedWorks.includes(work.id));
  return (
    <article className="work-page">
      <PageIntro
        eyebrow={work.eyebrow}
        title={work.title}
        description={work.summary}
        meta={<><span>{work.status}</span><time dateTime={work.updatedAt}>更新 {work.updatedAt}</time></>}
      />
      <section className="work-problem">
        <span>核心问题</span>
        <p>{work.problem}</p>
      </section>
      <aside className="evidence-boundary">
        <div><span>当前状态</span><strong>{work.status}</strong></div>
        <div><span>证据边界</span><strong>{work.boundary}</strong></div>
      </aside>
      <ArchitectureDiagram work={work} />
      <div className="work-detail-grid">
        {work.sections.map((section, index) => (
          <section key={section.heading}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
      <aside className="source-boundary">
        <span>上游事实源</span><strong>{work.upstream}</strong>
      </aside>
      {related.length ? (
        <section className="related-observations">
          <SectionIntro title="相关观察" />
          <ObservationArchive items={related} />
        </section>
      ) : null}
      {work.publicUrl ? <a className="primary-action" href={work.publicUrl}>打开公开作品 <span>↗</span></a> : null}
    </article>
  );
}

function AboutPage() {
  const sections = [
    ["positioning", "当前定位"],
    ["problems", "能够解决的问题"],
    ["capabilities", "核心能力"],
    ["projects", "代表项目成果"],
    ["experience", "职业经历"],
    ["resume", "简历"],
    ["direction", "当前方向与联系"],
  ];
  return (
    <article className="about-page">
      <PageIntro eyebrow={site.author} title={profile.title} description={profile.introduction} />
      <div className="about-layout">
        <aside className="about-toc" aria-label="关于我目录">
          <span>本页目录</span>
          {sections.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}
        </aside>
        <div className="about-content">
          <section id="positioning"><h2>当前定位</h2><p className="about-positioning">{profile.positioning}</p></section>
          <section id="problems"><h2>能够解决的问题</h2><ol>{profile.problems.map((item) => <li key={item}>{item}</li>)}</ol></section>
          <section id="capabilities"><h2>核心能力</h2><div className="capability-list">{profile.capabilities.map((item, index) => <div key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><p>{item.description}</p></div>)}</div></section>
          <section id="projects"><h2>代表项目成果</h2><div className="profile-projects">{works.map((work) => <div key={work.id}><strong>{work.title}</strong><p>{work.summary}</p><Link href={`/works/${work.slug}`}>查看作品 →</Link></div>)}</div></section>
          <section id="experience"><h2>职业经历</h2><p>{profile.experience.summary}</p><p className="boundary-text">{profile.experience.note}</p></section>
          <section id="resume"><h2>简历</h2><div className="contact-grid single"><div><span>简历 · {profile.resume.status}</span><p>{profile.resume.note}</p></div></div></section>
          <section id="direction"><h2>当前方向与联系</h2><p>{profile.direction}</p><div className="contact-grid single"><div><span>{profile.contact.location}</span><p>{profile.contact.note}</p></div></div></section>
        </div>
      </div>
    </article>
  );
}

function NotFoundPage() {
  return <PageIntro eyebrow="404" title="这个页面还不存在" description="返回首页，或从观察和作品继续浏览。" />;
}

function resolvePage(pathname) {
  if (pathname === "/") return <HomePage />;
  if (pathname === "/observations") return <ObservationsPage />;
  if (pathname.startsWith("/observations/")) return <ObservationPage observation={findObservation(pathname.split("/")[2])} />;
  if (pathname === "/works") return <WorksPage />;
  if (pathname.startsWith("/works/")) return <WorkPage work={findWork(pathname.split("/")[2])} />;
  if (pathname === "/about") return <AboutPage />;
  return <NotFoundPage />;
}

export function App() {
  const pathname = usePathname();

  useEffect(() => {
    const labels = {
      "/": site.name,
      "/observations": `观察 — ${site.name}`,
      "/works": `作品 — ${site.name}`,
      "/about": `关于我 — ${site.name}`,
    };
    document.title = labels[pathname] || `${pathname.startsWith("/works/") ? "作品" : "观察"} — ${site.name}`;
  }, [pathname]);

  return (
    <div className="site-shell">
      <SiteHeader pathname={pathname} />
      <main>{resolvePage(pathname)}</main>
      <SiteFooter />
    </div>
  );
}
