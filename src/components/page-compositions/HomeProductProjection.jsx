import { ClosingAction } from "../showcase/ClosingAction.jsx";
import { ProductHero, PracticeModuleList, projectClosingAction } from "../practice/PracticePrimitives.jsx";

function EmptyHomeProduct() {
  return <section className="home-product-section content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
}

/** Home owns its product-section label, hero semantics, actions and closing. */
export function HomeProductProjection({ practice }) {
  if (!practice) return <EmptyHomeProduct />;
  return (
    <div className="home-product-section">
      <p id="home-product-section-label" className="eyebrow home-product-section__section-label">最新作品</p>
      <ProductHero practice={practice} headingLevel={2} headingId="home-product-title" actions={[]} align="start" />
      <PracticeModuleList modules={practice.modules} headingLevel={3} />
      <ClosingAction closing={projectClosingAction(practice)} />
    </div>
  );
}
