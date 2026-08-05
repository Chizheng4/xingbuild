import { productConfiguration } from "../../content/productConfiguration.js";

export function ResumeActions() {
  const artifact = productConfiguration.resumeArtifact;
  return (
    <section className="resume-actions" aria-labelledby="resume-actions-title">
      <div>
        <p className="eyebrow">已核验简历制品</p>
        <h2 id="resume-actions-title">简历</h2>
      </div>
      <div className="resume-actions__links">
        <a href={artifact.htmlPath} target="_blank" rel="noreferrer">查看简历 HTML</a>
        <a href={artifact.pdfPath} download>下载简历 PDF</a>
      </div>
    </section>
  );
}
