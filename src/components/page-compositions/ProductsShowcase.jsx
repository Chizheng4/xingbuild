import { robotaxiProductConfiguration } from "../../content/productConfiguration.js";
import { ClosingAction } from "../showcase/ClosingAction.jsx";
import { LatestUpdateCard } from "../showcase/LatestUpdateCard.jsx";
import { ProductHero, PracticeModuleList, projectClosingAction } from "../practice/PracticePrimitives.jsx";

function EmptyProductsShowcase() {
  return <section className="products-showcase content-empty-state" aria-label="内容状态"><p>暂无已发布内容</p></section>;
}

/** Products owns its release card, hero actions, module flow and closing. */
export function ProductsShowcase({ practice }) {
  if (!practice) return <EmptyProductsShowcase />;
  return (
    <div className="products-showcase">
      <LatestUpdateCard />
      <ProductHero practice={practice} headingLevel={1} actions={robotaxiProductConfiguration.heroActions} />
      <PracticeModuleList modules={practice.modules} headingLevel={2} />
      <ClosingAction closing={projectClosingAction(practice)} />
    </div>
  );
}
