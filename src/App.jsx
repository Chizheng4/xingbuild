import { useEffect } from "react";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "./pages/HomePage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { ObservationPage } from "./pages/ObservationPage";
import { WorksPage } from "./pages/WorksPage";
import { WorkPage } from "./pages/WorkPage";
import { AboutPage } from "./pages/AboutPage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { FrameworkConceptPage } from "./pages/FrameworkConceptPage";
import { FrameworkApplicationPage } from "./pages/FrameworkApplicationPage";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { useLocation } from "./lib/navigation";
import { findObservation, findWork, site } from "./content/siteContent";
import {
  frameworkApplicationBySlug,
  frameworkConceptById,
} from "./content/frameworkModel";

const frameworkConceptExists = (id) => frameworkConceptById.has(id);
const frameworkApplicationExists = (slug) => frameworkApplicationBySlug.has(slug);

function resolvePage(location) {
  const { pathname, search, state } = location;
  if (pathname === "/") return <HomePage />;
  if (pathname === "/observations") return <ObservationsPage />;
  if (pathname === "/works") return <WorksPage />;
  if (pathname === "/about") return <AboutPage />;

  if (pathname.startsWith("/observations/")) {
    const observation = findObservation(pathname.split("/")[2]);
    return observation ? (
      <ObservationPage observation={observation} />
    ) : (
      <NotFoundPage />
    );
  }

  if (pathname.startsWith("/works/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[1] === "enterprise-operating-framework" && parts[2] === "explore") {
      return <FrameworkPage search={search} navigationState={state} />;
    }
    if (parts[1] === "enterprise-operating-framework" && parts[2] === "concepts" && parts[3]) {
      return frameworkConceptExists(parts[3]) ? (
        <FrameworkConceptPage conceptId={parts[3]} search={search} navigationState={state} />
      ) : <NotFoundPage />;
    }
    if (parts[1] === "enterprise-operating-framework" && parts[2] === "applications" && parts[3]) {
      return frameworkApplicationExists(parts[3]) ? (
        <FrameworkApplicationPage slug={parts[3]} search={search} />
      ) : <NotFoundPage />;
    }
    const work = findWork(pathname.split("/")[2]);
    return work ? <WorkPage work={work} /> : <NotFoundPage />;
  }

  return <NotFoundPage />;
}

export function App() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
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
