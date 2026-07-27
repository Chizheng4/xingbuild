import { FrameworkExplorer } from "../components/framework/FrameworkExplorer";

export function FrameworkPage() {
  return (
    <article className="framework-page">
      <header className="framework-hero">
        <p className="eyebrow">WORK · ENTERPRISE SYSTEMS</p>
        <h1>认知企业经营体系</h1>
        <p>
          {"用四张相互衔接的架构图，理解企业如何经营、如何设计业务、如何实现企\u2060业\u2060数\u2060字\u2060化，以及复杂现实如何被一致表达。"}
        </p>
      </header>
      <FrameworkExplorer />
    </article>
  );
}
