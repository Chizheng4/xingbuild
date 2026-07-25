import { ArticleBody, ArticleHeader } from "../components/reading/Article";

export function ObservationPage({ observation }) {
  return (
    <article className={`reading-page reading-${observation.format}`}>
      <ArticleHeader observation={observation} />
      <ArticleBody observation={observation} />
    </article>
  );
}
