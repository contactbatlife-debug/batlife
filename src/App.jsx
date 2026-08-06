import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import SplashScreen from "./components/SplashScreen";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Toast from "./components/Toast";
import Onboarding, { isOnboardingDone } from "./components/Onboarding";
import Landing from "./components/Landing";
import IOSInstallBanner from "./components/IOSInstallBanner";
import { useApp } from "./context/AppContext";
import useLocalStorage from "./hooks/useLocalStorage";
import useTranslation from "./hooks/useTranslation";
import useSwipe from "./hooks/useSwipe";

// ✅ Lazy loading — chaque page chargée à la demande
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Stats      = lazy(() => import("./pages/Stats"));
const Coach      = lazy(() => import("./pages/Coach"));
const Outils     = lazy(() => import("./pages/Outils"));
const Reglages   = lazy(() => import("./pages/Reglages"));
const Badges     = lazy(() => import("./pages/Badges"));
const Entretien  = lazy(() => import("./pages/Entretien"));

// Ordre des onglets — doit correspondre à Navigation.jsx
const PAGES = ["accueil", "stats", "coach", "outils", "badges", "reglages"];

// ✅ Clé localStorage pour mémoriser qu'un visiteur a déjà vu la landing
const LANDING_SEEN_KEY = "batlife_landing_vue";

// ✅ Détecte si l'app tourne en mode installé (PWA standalone)
// Dans ce cas on ne montre JAMAIS la landing — l'utilisateur a déjà
// installé l'app, il veut aller directement dedans.
function isStandalonePWA() {
  if (typeof window === "undefined") return false;
  const isStandaloneDisplay = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const isIOSStandalone = window.navigator?.standalone === true;
  return Boolean(isStandaloneDisplay || isIOSStandalone);
}

function App() {
  const [showSplash, setShowSplash]         = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [page, setPage]                     = useState("accueil");
  const { toast, hideToast } = useApp();

  // ✅ Landing affichée seulement si : web (pas PWA installée) ET jamais vue
  const [showLanding, setShowLanding] = useState(() => {
    if (isStandalonePWA()) return false;
    try {
      return localStorage.getItem(LANDING_SEEN_KEY) !== "1";
    } catch {
      return false; // si localStorage indisponible, on ne bloque pas l'accès à l'app
    }
  });

  const [reglages, setReglages] = useLocalStorage("batlife_reglages", {
    nomBatterie: "Ma batterie",
    vehicule: "vae",
    mode: "debutant",
    langue: "fr",
  });

  const { t } = useTranslation(reglages.langue);
  const setLangueGlobal = (nouvelleLangue) =>
    setReglages({ ...reglages, langue: nouvelleLangue });

  // Toujours dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  // SEO meta tags
  useEffect(() => {
    document.documentElement.lang = reglages.langue;
    document.title = t("seo_title");
    const set = (sel, attr, val) =>
      document.querySelector(sel)?.setAttribute(attr, val);
    set('meta[name="description"]',             "content", t("seo_desc"));
    set('meta[name="title"]',                   "content", t("seo_title"));
    set('meta[property="og:title"]',            "content", t("seo_title"));
    set('meta[property="og:description"]',      "content", t("seo_desc"));
    set('meta[property="twitter:title"]',       "content", t("seo_title"));
    set('meta[property="twitter:description"]', "content", t("seo_desc"));
  }, [reglages.langue, t]);

  // Navigation par swipe
  const goNext = useCallback(() => {
    setPage(current => {
      const idx = PAGES.indexOf(current);
      return idx < PAGES.length - 1 ? PAGES[idx + 1] : current;
    });
  }, []);

  const goPrev = useCallback(() => {
    setPage(current => {
      const idx = PAGES.indexOf(current);
      return idx > 0 ? PAGES[idx - 1] : current;
    });
  }, []);

  const swipeHandlers = useSwipe(goNext, goPrev);

  // ✅ Quitter la landing → marque comme vue, puis enchaîne sur le splash/app normal
  const handleEnterFromLanding = () => {
    try { localStorage.setItem(LANDING_SEEN_KEY, "1"); } catch {}
    setShowLanding(false);
  };

  // Landing → Splash → Onboarding → App
  if (showLanding) return (
    <Landing onEnter={handleEnterFromLanding} />
  );

  if (showSplash) return (
    <SplashScreen onEnter={() => {
      setShowSplash(false);
      if (!isOnboardingDone()) setShowOnboarding(true);
    }} />
  );

  if (showOnboarding) return (
    <Onboarding onFinish={() => setShowOnboarding(false)} />
  );

  return (
    <div className="h-screen flex flex-col text-white"
      style={{ background: "var(--bg-app)" }}>
      <Toast message={toast} onClose={hideToast} />
      <IOSInstallBanner t={t} />

      <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
        <Header langue={reglages.langue} setLangue={setLangueGlobal} />

        {/* Zone swipeable */}
        <main
          className="flex-1 overflow-y-auto p-6 pb-24"
          {...swipeHandlers}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <p style={{ color:"rgba(148,197,240,0.4)" }}>⚡</p>
            </div>
          }>
            {page === "accueil"   && <Dashboard reglages={reglages} t={t} />}
            {page === "stats"     && <Stats reglages={reglages} t={t} />}
            {page === "coach"     && <Coach reglages={reglages} t={t} />}
            {page === "entretien" && <Entretien t={t} />}
            {page === "outils"    && <Outils t={t} setPage={setPage} />}
            {page === "badges"    && <Badges langue={reglages.langue} />}
            {page === "reglages"  && <Reglages reglages={reglages} setReglages={setReglages} t={t} />}
          </Suspense>
        </main>

        <Navigation page={page} setPage={setPage} langue={reglages.langue} />
      </div>
    </div>
  );
}

export default App;
