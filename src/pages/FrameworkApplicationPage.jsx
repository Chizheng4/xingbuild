import {
  conceptHref,
  frameworkApplicationBySlug,
  frameworkConceptById,
} from "../content/frameworkModel";
import { Link } from "../lib/navigation";

export function FrameworkApplicationPage({ slug, search }) {
  const application = frameworkApplicationBySlug.get(slug);
  if (!application) return null;
  const params = new URLSearchParams(search);
  const conceptId = params.get("concept") || "object";
  const concept = frameworkConceptById.get(conceptId) ?? frameworkConceptById.get("object");
  return (
    <article className="framework-application-page framework-section-flow">
      <header className="object-stack">
        <Link className="back-link" href={conceptHref(concept.id, "business-architecture")}>← 返回{concept.name}</Link>
        <p className="eyebrow">场景应用</p>
        <h1>{application.name}</h1>
        <p>应用只映射权威概念，不改变定义，也不扩大项目事实边界。</p>
      </header>
      <section className="application-mapping object-stack">
        <h2>{concept.name}如何进入 Robotaxi 场景</h2>
        <p>{application.mapping}</p>
      </section>
      <aside className="framework-evidence-note">
        <strong>证据边界</strong>
        <p>{application.evidenceBoundary}</p>
      </aside>
      <aside className="framework-source">
        <span>来源与版本</span>
        <p>{application.source.name} <span className="source-version">· {application.source.version}</span></p>
      </aside>
    </article>
  );
}
