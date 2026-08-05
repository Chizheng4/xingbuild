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
    <section className="latest-update-card" aria-labelledby="latest-update-title">
      <div className="latest-update-card__copy">
        <p className="eyebrow">最新更新</p>
        <p id="latest-update-title" className="latest-update-card__title">Robotaxi 运营平台</p>
        <p>真实产品版本：{release.version}</p>
      </div>
      <div className="latest-update-card__meta" aria-live="polite">
        <span>{status === "live" ? "已从 Robotaxi 核验" : "使用最近一次已核验快照"}</span>
        <code>{release.commit.slice(0, 12)}</code>
        <a href={action.href} target="_blank" rel="noreferrer">进入 Robotaxi 运营平台</a>
      </div>
    </section>
  );
}
