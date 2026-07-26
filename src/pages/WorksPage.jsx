import { PageIntro } from "../components/site/PageStructure";
import { WorkSummary } from "../components/works/Works";
import { works } from "../content/siteContent";

export function WorksPage() {
  return (
    <div className="works-page page-stack">
      <PageIntro
        eyebrow="Works"
        title="作品"
        summary="作品不是功能清单。每一项都说明它面对的问题、构建对象、当前状态、证据与局限。"
      />
      <div className="work-list work-page-list collection-flow">
        {works.map((work) => <WorkSummary key={work.id} work={work} showArchitecture />)}
      </div>
    </div>
  );
}
