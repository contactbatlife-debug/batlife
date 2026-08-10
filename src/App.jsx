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
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const { t } = useTranslation(reglages.langue);
  const setLangueGlobal = (nouvelleLangue) =>
    setReglages({ ...reglages, langue: nouvelleLangue });

  // Toujours dark mode
useEffect(() => {
  // Vérifie immédiatement
  if (window.deferredPromptEvent) {
    console.log("✅ récupéré immédiatement !");
    setDeferredPrompt(window.deferredPromptEvent);
    return;
  }

  // Sinon on attend et on vérifie toutes les 500ms
  const interval = setInterval(() => {
    if (window.deferredPromptEvent) {
      console.log("✅ récupéré après attente !");
      setDeferredPrompt(window.deferredPromptEvent);
      clearInterval(interval);
    }
  }, 500);

  // On écoute aussi l'événement direct
  const handler = (e) => {
    e.preventDefault();
    console.log("✅ beforeinstallprompt reçu directement !");
    setDeferredPrompt(e);
    clearInterval(interval);
  };

  window.addEventListener("beforeinstallprompt", handler);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
    clearInterval(interval);
  };
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

    // ✅ Gestion du bouton "Retour" natif d'Android et des navigateurs
  useEffect(() => {
    // On ajoute la page actuelle à l'historique du navigateur
    window.history.pushState({ page: page }, "", `#${page}`);
  }, [page]);

  useEffect(() => {
    // Quand l'utilisateur clique sur "Retour", on intercepte l'action
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setPage(event.state.page);
      } else {
        setPage("accueil"); // Par défaut, on revient à l'accueil
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    
    // Nettoyage quand on quitte l'application
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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

{deferredPrompt && (
  <div className="px-4 py-2">
    <button
      onClick={async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setDeferredPrompt(null);
      }}
      className="w-full py-3 rounded-xl font-bold"
      style={{ background: "var(--accent)", color: "#fbbf24" }}
    >
      📲 Installer BatLife sur l'écran d'accueil
    </button>
  </div>
)}

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
