import { PageIntro } from "../components/site/PageStructure";
import { WorkCardGrid } from "../components/works/Works";
import { works } from "../content/siteContent";

export function WorksPage() {
  return (
    <div className="works-page page-stack">
      <PageIntro
        title="作品"
        summary="作品不是功能清单。每一项都说明它面对的问题、构建对象、当前状态、证据与局限。"
      />
      <WorkCardGrid items={works} />
    </div>
  );
}
