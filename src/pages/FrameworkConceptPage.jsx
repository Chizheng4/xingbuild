import { ConceptDetail } from "../components/framework/FrameworkExplorer";
import {
  explorerHref,
  frameworkConceptById,
} from "../content/frameworkModel";
import { Link } from "../lib/navigation";

export function FrameworkConceptPage({ conceptId, search, navigationState }) {
  const concept = frameworkConceptById.get(conceptId);
  if (!concept) return null;
  const params = new URLSearchParams(search);
  const sourceView = params.get("from") || navigationState?.sourceView || "overview";
  const returnHref = explorerHref(sourceView, concept.id);
  return (
    <article className="framework-concept-page framework-section-flow">
      <header>
        <Link className="back-link" href={returnHref} state={{ restoreScrollY: navigationState?.scrollY ?? 0 }}>
          ← 返回{sourceView === "overview" ? "总览" : sourceView === "digital" ? "数字化实现" : "企业业务架构"}
        </Link>
      </header>
      <ConceptDetail concept={concept} viewId={sourceView} />
    </article>
  );
}
