import { PageIntro } from "../components/site/PageStructure";
import { profile, site, works } from "../content/siteContent";
import { Link } from "../lib/navigation";

const sections = [
  ["positioning", "当前定位"],
  ["problems", "能够解决的问题"],
  ["capabilities", "核心能力"],
  ["projects", "代表项目成果"],
  ["experience", "职业经历"],
  ["resume", "简历"],
  ["direction", "当前方向与联系"],
];

export function AboutPage() {
  return (
    <article className="about-page">
      <PageIntro eyebrow={site.author} title={profile.title} summary={profile.introduction} />
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
