import { ArticleBody, ArticleHeader } from "../components/reading/Article";
import { LayoutShell, ReadingShell } from "../components/site/LayoutShell";
import { safeReturnTo } from "../lib/navigation";

export function ObservationPage({ observation, isDraft = false, location }) {
  const returnTo = safeReturnTo(new URLSearchParams(location?.search || "").get("returnTo"), "/observations");
  return (
    <LayoutShell>
    <ReadingShell className={`reading-page reading-${observation.level}`}>
      {isDraft ? <p className="draft-preview-banner">本地草稿预览 · 不进入公开集合与生产构建</p> : null}
      <ArticleHeader observation={observation} returnTo={returnTo} />
      <ArticleBody observation={observation} />
    </ReadingShell>
    </LayoutShell>
  );
}
