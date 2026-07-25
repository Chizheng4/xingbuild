import { useEffect, useState } from "react";
import {
  findObservation,
  findWork,
  profile,
  publishedObservations,
  site,
  works,
} from "./content/siteContent.js";

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
}

function Link({ href, children, className, onNavigate }) {
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

  return <a href={href} className={className} onClick={navigate}>{children}</a>;
}

function SiteHeader({ pathname }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = [
    { href: "/observations", label: "观察" },
    { href: "/works", label: "作品" },
    { href: "/about", label: "关于我" },
  ];

  return (
    <header className="site-header">
      <div className="identity">
        <Link href="/" className="wordmark">{site.name}</Link>
        <span className="author-name">{site.author}</span>
      </div>
      <button
        className="menu-button"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? "关闭" : "菜单"}
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
      <span>{site.author}</span>
      <span>{site.location}</span>
      <span>更新于 {site.updatedAt}</span>
    </footer>
  );
}

function PageIntro({ eyebrow, title, description, meta }) {
  return (
    <header className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description ? <p className="page-description">{description}</p> : null}
      {meta ? <div className="page-meta">{meta}</div> : null}
    </header>
  );
}

function ObservationList({ items, limit }) {
  const visible = limit ? items.slice(0, limit) : items;

  return (
    <div className="observation-list">
      {visible.map((item) => (
        <article className="observation-row" key={item.id}>
          <time dateTime={item.publishedAt}>{item.publishedAt.slice(5).replace("-", ".")}</time>
          <span className="topic">{item.topics[0]}</span>
          <div>
            <h3><Link href={`/observations/${item.slug}`}>{item.title}</Link></h3>
            <p>{item.summary}</p>
          </div>
          <span className="row-arrow" aria-hidden="true">↗</span>
        </article>
      ))}
    </div>
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

function WorkPreview({ work }) {
  return (
    <article className="work-preview">
      <div className="work-index">{work.index}</div>
      <div className="work-copy">
        <p className="eyebrow">{work.eyebrow}</p>
        <h3><Link href={`/works/${work.slug}`}>{work.title}</Link></h3>
        <p>{work.summary}</p>
        <div className="work-status">
          <span>{work.status}</span>
          <time dateTime={work.updatedAt}>更新 {work.updatedAt}</time>
        </div>
      </div>
      <ArchitectureDiagram work={work} />
    </article>
  );
}

function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-statement">
          <p className="eyebrow">{site.author}</p>
          <h1>观察企业如何经营，<br />把判断构建成可以运行和验证的系统。</h1>
        </div>
        <aside className="hero-aside">
          <div><span>当前关注</span><strong>企业经营、业务架构与数字化实现</strong></div>
          <div><span>最新更新</span><strong>{site.updatedAt}</strong></div>
          <div><span>所在地</span><strong>{site.location}</strong></div>
        </aside>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div><span>01</span><h2>最新观察</h2></div>
          <Link href="/observations">查看全部 <span aria-hidden="true">→</span></Link>
        </div>
        <ObservationList items={publishedObservations} limit={2} />
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div><span>02</span><h2>置顶作品</h2></div>
          <Link href="/works">进入作品 <span aria-hidden="true">→</span></Link>
        </div>
        <div className="work-list">{works.map((work) => <WorkPreview key={work.id} work={work} />)}</div>
      </section>

      <section className="home-about">
        <p className="eyebrow">关于我</p>
        <p>{profile.positioning}</p>
        <Link href="/about">了解经历、能力与当前方向 <span aria-hidden="true">→</span></Link>
      </section>
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
        description="记录我对 Robotaxi、企业经营、业务架构与数字化的阶段性判断。这里保存可以长期引用的版本，而不是自动生成的工程动态。"
      />
      {years.map((year) => (
        <section className="year-group" key={year}>
          <h2>{year}</h2>
          <ObservationList items={publishedObservations.filter((item) => item.publishedAt.startsWith(year))} />
        </section>
      ))}
    </>
  );
}

function ObservationPage({ observation }) {
  if (!observation) return <NotFoundPage />;
  const related = works.filter((work) => observation.relatedWorks.includes(work.id));
  return (
    <article className="reading-page">
      <PageIntro
        eyebrow={`${observation.format} · ${observation.topics.join(" / ")}`}
        title={observation.title}
        description={observation.summary}
        meta={<><time dateTime={observation.publishedAt}>发布 {observation.publishedAt}</time><time dateTime={observation.updatedAt}>更新 {observation.updatedAt}</time></>}
      />
      <div className="reading-layout">
        <aside className="reading-toc" aria-label="文章目录">
          <span>本页内容</span>
          {observation.sections.map((section) => <a key={section.heading} href={`#${section.heading}`}>{section.heading}</a>)}
        </aside>
        <div className="prose">
          {observation.sections.map((section) => (
            <section id={section.heading} key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
          <aside className="source-note"><strong>内容来源与边界</strong><p>{observation.sourceNotes}</p></aside>
          <section className="related-links">
            <h2>相关作品</h2>
            {related.map((work) => <Link key={work.id} href={`/works/${work.slug}`}>{work.title} <span>→</span></Link>)}
          </section>
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
        description="作品不是功能清单。每一项都说明它面对的问题、系统边界、架构、实现状态、事实证据与局限。"
      />
      <div className="work-list work-index-list">
        {works.map((work) => <WorkPreview key={work.id} work={work} />)}
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
      <aside className="evidence-boundary">
        <div><span>证据边界</span><strong>{work.boundary}</strong></div>
        <div><span>上游事实源</span><strong>{work.upstream}</strong></div>
      </aside>
      <section className="related-observations">
        <div className="section-heading"><div><span>↳</span><h2>相关观察</h2></div></div>
        <ObservationList items={related} />
      </section>
      {work.publicUrl ? <a className="primary-action" href={work.publicUrl}>打开公开作品 <span>↗</span></a> : null}
    </article>
  );
}

function AboutPage() {
  const sections = [
    ["positioning", "当前定位"],
    ["problems", "能够解决的问题"],
    ["capabilities", "能力组合"],
    ["experience", "经历与证据"],
    ["direction", "当前方向"],
    ["resume", "简历与联系"],
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
          <section id="capabilities"><h2>能力组合</h2><div className="capability-list">{profile.capabilities.map((item, index) => <div key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><p>{item.description}</p></div>)}</div></section>
          <section id="experience"><h2>经历与证据</h2><p>{profile.experience.summary}</p><p className="boundary-text">{profile.experience.note}</p></section>
          <section id="direction"><h2>当前方向</h2><p>{profile.direction}</p></section>
          <section id="resume"><h2>简历与联系</h2><div className="contact-grid"><div><span>简历 · {profile.resume.status}</span><p>{profile.resume.note}</p></div><div><span>{profile.contact.location}</span><p>{profile.contact.note}</p></div></div></section>
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
