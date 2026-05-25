import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import Stats from "./pages/Stats";
import Coach from "./pages/Coach";
import Outils from "./pages/Outils";
import Reglages from "./pages/Reglages";
import Badges from "./pages/Badges";
import Toast from "./components/Toast";
import Entretien from "./pages/Entretien";
import { useApp } from "./context/AppContext";
import useLocalStorage from "./hooks/useLocalStorage";
import useTranslation from "./hooks/useTranslation";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [page, setPage] = useState("accueil");
  const { toast, hideToast } = useApp();

  const [reglages, setReglages] = useLocalStorage("batlife_reglages", {
    nomBatterie: "Ma batterie",
    vehicule: "vae",
    mode: "debutant",
    langue: "fr",
  });

  const { t } = useTranslation(reglages.langue);

  // Sécurité Batterie 5 et 30 jours
  useEffect(() => {
    const lastCharge = localStorage.getItem("bl_derniere_charge");
    if (lastCharge) {
      const daysPassed = (new Date() - new Date(lastCharge)) / (1000 * 60 * 60 * 24);
      if (daysPassed >= 30) {
        alert("🚨 ATTENTION : 30 jours sans charge ! Veuillez charger votre batterie.");
      } else if (daysPassed >= 5) {
        alert("⚠️ Rappel : 5 jours sans charge. Pensez à votre batterie !");
      }
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onEnter={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1f3a] text-white pb-20">
      <Toast message={toast} onClose={hideToast} />
      
      <Header
        langue={reglages.langue}
        setLangue={(nouvelleLangue) =>
          setReglages({ ...reglages, langue: nouvelleLangue })
        }
      />

      <main className="p-6 max-w-2xl mx-auto">
        {page === "accueil" && <Dashboard reglages={reglages} t={t} />}
        {page === "stats" && <Stats reglages={reglages} t={t} />}
        {page === "coach" && <Coach reglages={reglages} t={t} />}
        {page === "entretien" && <Entretien t={t} />}
        {page === "outils" && <Outils reglages={reglages} t={t} />}
        {page === "badges" && <Badges />}
        {page === "reglages" && (
          <Reglages reglages={reglages} setReglages={setReglages} t={t} />
        )}
      </main>

      <Navigation page={page} setPage={setPage} langue={reglages.langue} />
    </div>
  );
}

export default App;