import { useState } from "react";
import { about, hero, siteMeta, works } from "./content/siteContent.js";

function Arrow() {
  return <span className="flow-arrow" aria-hidden="true">→</span>;
}

function RobotaxiDiagram({ items }) {
  return (
    <div className="flow-diagram" aria-label="Robotaxi 经营闭环">
      <ol className="flow-list">
        {items.map((item, index) => (
          <li className="flow-item" key={item.title}>
            <div className="flow-node">
              <span className="node-order">{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </div>
            {index < items.length - 1 ? <Arrow /> : null}
          </li>
        ))}
      </ol>
      <div className="feedback-line" aria-hidden="true">
        <span>经营反馈回到需求、供给与策略</span>
      </div>
    </div>
  );
}

function FrameworkDiagram({ items }) {
  return (
    <ol className="framework-diagram" aria-label="企业经营与数字化四个平面">
      {items.map((item, index) => (
        <li className="plane" key={item.title}>
          <span className="node-order">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.detail}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

function WorkSection({ work }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`work work-${work.id}`} id={work.id}>
      <header className="work-copy">
        <span className="section-index">{work.index}</span>
        <div>
          <h2>{work.title}</h2>
          <p className="work-summary">{work.summary}</p>
          <p className={`work-description ${expanded ? "is-visible" : ""}`}>
            {work.description}
          </p>
          {work.boundary ? <p className="boundary">{work.boundary}</p> : null}
          <button
            className="text-action"
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "收起说明" : work.linkLabel}
            <span aria-hidden="true">{expanded ? "−" : "↗"}</span>
          </button>
        </div>
      </header>
      <div className="work-visual">
        {work.flow ? <RobotaxiDiagram items={work.flow} /> : null}
        {work.planes ? <FrameworkDiagram items={work.planes} /> : null}
      </div>
    </article>
  );
}

export function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#works" aria-label="xingbuild 首页">
          {siteMeta.name}
        </a>
        <nav aria-label="主要导航">
          <a href="#works">作品</a>
          <a href="#about">关于我</a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <h1 id="hero-title">
            <span className="desktop-title">{hero.title}</span>
            <span className="mobile-title">{hero.mobileTitle}</span>
          </h1>
          <ul className="disciplines" aria-label="专业方向">
            {hero.disciplines.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <div className="version-stamp">
            <span>版本 {siteMeta.version}</span>
            <time dateTime={siteMeta.updatedAt}>{siteMeta.updatedAt}</time>
          </div>
        </section>

        <section id="works" className="works" aria-label="作品">
          {works.map((work) => <WorkSection key={work.id} work={work} />)}
        </section>

        <section id="about" className="about">
          <h2>{about.title}</h2>
          <div className="about-copy">
            <p className="about-lead">{about.lead}</p>
            <p>{about.body}</p>
          </div>
          <nav className="about-actions" aria-label="关于我的相关入口">
            {about.links.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}<span aria-hidden="true">→</span>
              </a>
            ))}
          </nav>
          <p className="contact-note" id="contact">公开联系方式待事实核实后补充</p>
        </section>
      </main>

      <footer>
        <span>© 2026 {siteMeta.name}</span>
        <span>{siteMeta.location}</span>
        <span>更新于 {siteMeta.updatedAt}</span>
      </footer>
    </div>
  );
}
