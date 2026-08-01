import { PageCompositionRenderer } from "../components/page-compositions/PageCompositionRenderer";
import { getPageDefinition } from "../content/pageDefinitions";

export function AboutPage({ location }) {
  return <PageCompositionRenderer definition={getPageDefinition("about")} location={location} />;
}
