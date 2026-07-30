import { useEffect } from "react";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "./pages/HomePage";
import { RobotaxiPage } from "./pages/RobotaxiPage";
import { ProductsPage } from "./pages/ProductsPage";
import { BusinessObservationsPage } from "./pages/BusinessObservationsPage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { ObservationPage } from "./pages/ObservationPage";
import { DraftObservationPage } from "./pages/DraftObservationPage";
import { AboutPage } from "./pages/AboutPage";
import { FrameworkPage } from "./pages/FrameworkPage";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { navigate, useLocation } from "./lib/navigation";
import { site } from "./content/siteContent";
import { findObservation } from "./content/observationRepository";
import { FRAMEWORK_BASE } from "./content/frameworkModel";
import { startVisitQualification } from "./lib/visitQualification";

function resolvePage(location) {
  const { pathname } = location;
  if (pathname === "/") return <HomePage />;
  if (pathname === "/products") return <ProductsPage />;
  if (pathname === "/business-observations") return <BusinessObservationsPage />;
  if (pathname === FRAMEWORK_BASE) return <FrameworkPage />;
  if (pathname === "/observations") return <ObservationsPage location={location} />;
  if (pathname === "/about") return <AboutPage />;

  if (pathname.startsWith("/observations/")) {
    const slug = pathname.split("/")[2];
    if (new URLSearchParams(location.search).get("draft") === "1") {
      return <DraftObservationPage slug={slug} />;
    }
    const observation = findObservation(slug);
    return observation ? (
      observation.presentation === "brief" ? <BriefRedirect /> : <ObservationPage observation={observation} location={location} />
    ) : (
      <NotFoundPage />
    );
  }

  if (pathname.startsWith("/works/")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts[1] === "enterprise-operating-framework") return <FrameworkPage />;
    if (parts[1] === "robotaxi") return <RobotaxiPage />;
    return <NotFoundPage />;
  }

  return <NotFoundPage />;
}

function BriefRedirect() {
  useEffect(() => { navigate("/observations", { replace: true }); }, []);
  return null;
}

export function App() {
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => startVisitQualification(), []);

  useEffect(() => {
    const redirects = {
      "/robotaxi": "/products",
      "/works": "/products",
      "/works/robotaxi": "/products",
      "/products/robotaxi": "/products",
      "/enterprise-operating-framework": "/business-observations",
      "/works/enterprise-operating-framework": "/business-observations",
    };
    if (redirects[pathname]) {
      navigate(redirects[pathname], { replace: true });
      return;
    }
    const labels = {
      "/": site.name,
      "/products": "B端产品",
      "/business-observations": "经营观察",
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
