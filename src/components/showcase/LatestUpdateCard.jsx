import { useRobotaxiRelease } from "../../content/robotaxiReleaseReference.js";
import { safePracticeAction } from "../../content/practiceAction.js";

const ROBOTAXI_URL = "https://robotaxi.xingbuild.top/";

export function LatestUpdateCard() {
  const { status, release } = useRobotaxiRelease();
  const action = safePracticeAction({ href: ROBOTAXI_URL });
  if (!release || !action) {
    return <section className="latest-update-card latest-update-card--empty" aria-label="最新更新"><p>最新更新暂时无法核验</p></section>;
  }
  return (
    <section
      className="latest-update-card"
      aria-labelledby="latest-update-title"
      data-release-status={status}
      data-release-commit={release.commit}
    >
      <a className="latest-update-card__link" href={action.href} target="_blank" rel="noreferrer" aria-label={`查看 Robotaxi 最新版本 ${release.version}`}>
        <span className="eyebrow">NEW</span>
        <span id="latest-update-title" className="latest-update-card__title">{release.version}</span>
        <span className="latest-update-card__action">查看最新版</span>
      </a>
    </section>
  );
}
