import { useEffect } from "react";
import { NotFoundPage } from "./pages/NotFoundPage";
import { HomePage } from "./pages/HomePage";
import { ObservationsPage } from "./pages/ObservationsPage";
import { ObservationPage } from "./pages/ObservationPage";
import { WorksPage } from "./pages/WorksPage";
import { WorkPage } from "./pages/WorkPage";
import { AboutPage } from "./pages/AboutPage";
import { SiteFooter } from "./components/site/SiteFooter";
import { SiteHeader } from "./components/site/SiteHeader";
import { usePathname } from "./lib/navigation";
import { findObservation, findWork, site } from "./content/siteContent";

function resolvePage(pathname) {
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
    const work = findWork(pathname.split("/")[2]);
    return work ? <WorkPage work={work} /> : <NotFoundPage />;
  }

  return <NotFoundPage />;
}

export function App() {
  const pathname = usePathname();

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
      <main id="main-content">{resolvePage(pathname)}</main>
      <SiteFooter />
    </div>
  );
}
