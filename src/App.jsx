import { useEffect } from "react";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "./pages/HomePage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { ObservationPage } from "./pages/ObservationPage";
import { DraftObservationPage } from "./pages/DraftObservationPage";
import { WorkPage } from "./pages/WorkPage";
import { AboutPage } from "./pages/AboutPage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { navigate, useLocation } from "./lib/navigation";
import { findWork, site } from "./content/siteContent";
import { findObservation } from "./content/observationRepository";
import { FRAMEWORK_BASE } from "./content/frameworkModel";

function resolvePage(location) {
  const { pathname } = location;
  if (pathname === "/") return <HomePage />;
  if (pathname === "/robotaxi") return <HomePage />;
  if (pathname === FRAMEWORK_BASE) return <FrameworkPage />;
  if (pathname === "/observations") return <ObservationsPage />;
  if (pathname === "/works") return <HomePage />;
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
    if (parts[1] === "robotaxi") return <HomePage />;
    const work = findWork(pathname.split("/")[2]);
    return work ? <WorkPage work={work} /> : <NotFoundPage />;
  }

  return <NotFoundPage />;
}

export function App() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    const redirects = {
      "/works": "/robotaxi",
      "/works/robotaxi": "/robotaxi",
      "/works/enterprise-operating-framework": FRAMEWORK_BASE,
    };
    if (redirects[pathname]) {
      navigate(redirects[pathname], { replace: true });
      return;
    }
    const labels = {
      "/": site.name,
      "/robotaxi": "Robotaxi运营平台",
      [FRAMEWORK_BASE]: "企业经营体系",
      "/observations": "观察",
      "/about": "关于我",
    };
    const title =
      labels[pathname] ??
      (pathname.startsWith("/observations/") ? "观察" : site.name);
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
