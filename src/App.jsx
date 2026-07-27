import { useEffect } from "react";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "./pages/HomePage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { ObservationPage } from "./pages/ObservationPage";
import { DraftObservationPage } from "./pages/DraftObservationPage";
import { WorksPage } from "./pages/WorksPage";
import { WorkPage } from "./pages/WorkPage";
import { AboutPage } from "./pages/AboutPage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { useLocation } from "./lib/navigation";
import { findWork, site } from "./content/siteContent";
import { findObservation } from "./content/observationRepository";
import { FRAMEWORK_BASE } from "./content/frameworkModel";

function resolvePage(location) {
  const { pathname } = location;
  if (pathname === "/") return <HomePage />;
  if (pathname === "/observations") return <ObservationsPage />;
  if (pathname === "/works") return <WorksPage />;
  if (pathname === "/about") return <AboutPage />;

  if (pathname.startsWith("/observations/")) {
    const slug = pathname.split("/")[2];
    if (new URLSearchParams(location.search).get("draft") === "1") {
      return <DraftObservationPage slug={slug} />;
    }
    const observation = findObservation(slug);
    return observation ? (
      <ObservationPage observation={observation} />
    ) : (
      <NotFoundPage />
    );
  }

  if (pathname.startsWith("/works/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[1] === "enterprise-operating-framework") return <FrameworkPage />;
    const work = findWork(pathname.split("/")[2]);
    return work ? <WorkPage work={work} /> : <NotFoundPage />;
  }

  return <NotFoundPage />;
}

export function App() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    if (pathname.startsWith(`${FRAMEWORK_BASE}/`)) {
      window.history.replaceState({}, "", FRAMEWORK_BASE);
    }
    const labels = {
      "/": site.name,
      "/observations": "观察",
      "/works": "作品",
      "/about": "关于我",
    };
    const title =
      labels[pathname] ??
      (pathname.startsWith("/works/") ? "作品" : "观察");
    document.title = title === site.name ? title : `${title} · ${site.name}`;
  }, [pathname]);

  return (
    <div className="site-shell">
      <SiteHeader pathname={pathname} />
      <main id="main-content">{resolvePage(location)}</main>
      <SiteFooter />
    </div>
  );
}
