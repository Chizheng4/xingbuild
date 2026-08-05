import { useEffect, useState } from "react";
import { robotaxiReleaseSnapshot } from "../generated/robotaxiReleaseSnapshot.js";
import { projectRobotaxiRelease } from "./robotaxiRelease.js";

const fallbackRelease = projectRobotaxiRelease(robotaxiReleaseSnapshot, {
  verifiedAt: robotaxiReleaseSnapshot.verifiedAt,
  source: "last-verified",
});

export function useRobotaxiRelease() {
  const [state, setState] = useState({ status: fallbackRelease ? "fallback" : "unavailable", release: fallbackRelease });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4500);
    fetch("/__xingbuild/robotaxi-release", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`release adapter returned ${response.status}`);
        const payload = await response.json();
        const release = projectRobotaxiRelease(payload, {
          verifiedAt: payload.verifiedAt || new Date().toISOString(),
          source: "live",
        });
        if (!release) throw new Error("release adapter returned an invalid identity");
        setState({ status: "live", release });
      })
      .catch(() => {
        setState({ status: fallbackRelease ? "fallback" : "unavailable", release: fallbackRelease });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return state;
}

export { fallbackRelease };
