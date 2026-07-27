import { ArticleBody, ArticleHeader } from "../components/reading/Article";

export function ObservationPage({ observation, isDraft = false }) {
  return (
    <article className={`reading-page reading-${observation.level}`}>
      {isDraft ? <p className="draft-preview-banner">本地草稿预览 · 不进入公开集合与生产构建</p> : null}
      <ArticleHeader observation={observation} />
      <ArticleBody observation={observation} />
    </article>
  );
}
