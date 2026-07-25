import { PageIntro } from "../components/site/PageStructure";
import { WorkSummary } from "../components/works/Works";
import { works } from "../content/siteContent";

export function WorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Works"
        title="作品"
        summary="作品不是功能清单。每一项都说明它面对的问题、构建对象、当前状态、证据与局限。"
      />
      <div className="work-list work-index-list">
        {works.map((work) => <WorkSummary key={work.id} work={work} showArchitecture />)}
      </div>
    </>
  );
}
