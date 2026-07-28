import { RichDocument } from "../components/reading/RichDocument";
import { LayoutShell, ReadingShell } from "../components/site/LayoutShell";
import { profile } from "../content/profileRepository";

export function AboutPage() {
  return <LayoutShell className="about-page"><ReadingShell><header className="reading-shell__header"><h1>{profile.title}</h1><p>{profile.summary}</p></header><RichDocument blocks={profile.blocks} /></ReadingShell></LayoutShell>;
}
