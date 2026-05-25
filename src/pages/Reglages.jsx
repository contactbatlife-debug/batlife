import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Profil from "./Profil";
import Calibration from "./Calibration";

function Reglages({ reglages, setReglages, t }) {
  const [pageActive, setPageActive] = useState("reglages");
  
  // On récupère le système multi-batteries du cerveau central
  const { 
    batteries = [], 
    activeBatteryId, 
    switchBattery, 
    addBattery, 
    deleteBattery,
    profile
  } = useApp();

  // Permet de synchroniser le champ "Nom de la batterie" avec la batterie active
  useEffect(() => {
    if (profile?.customName && reglages.nomBatterie !== profile.customName) {
      setReglages(prev => ({ ...prev, nomBatterie: profile.customName }));
    }
  }, [activeBatteryId, profile]);

  const changerValeur = (cle, valeur) => {
    setReglages({ ...reglages, [cle]: valeur });
  };

  // Action : Ajouter une nouvelle batterie
  const handleAddBattery = () => {
    // Demande le nom du nouveau véhicule à l'utilisateur
    const name = prompt("Entrez le nom du nouveau véhicule (ex: Ma Trottinette, Vélo 36V) :");
    if (!name || !name.trim()) return;
    
    if (addBattery) {
      addBattery(name.trim());
      alert(`🚀 Batterie "${name.trim()}" ajoutée ! Pensez à aller dans "Mon Profil" pour régler sa tension.`);
    }
  };

  // Action : Supprimer une batterie
  const handleDeleteBattery = (id, name, e) => {
    e.stopPropagation(); // Évite de sélectionner la batterie en cliquant sur la corbeille
    if (batteries.length <= 1) {
      alert("Vous devez conserver au moins une batterie active.");
      return;
    }
    if (confirm(`Voulez-vous vraiment supprimer la batterie "${name}" ? Toutes ses données seront perdues.`)) {
      if (deleteBattery) deleteBattery(id);
    }
  };

  // Page Profil
  if (pageActive === "profil") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setPageActive("reglages")}
          className="text-blue-400 text-sm flex items-center gap-1"
        >
          ← Retour aux réglages
        </button>
        <Profil t={t} onRetour={() => setPageActive("reglages")} />
      </div>
    );
  }

  // Page Calibration
  if (pageActive === "calibration") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setPageActive("reglages")}
          className="text-blue-400 text-sm flex items-center gap-1"
        >
          ← Retour aux réglages
        </button>
        <Calibration onRetour={() => setPageActive("reglages")} />
      </div>
    );
  }

  // Page Réglages principale
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-300">
        {t("reglages_titre")}
      </h2>

      {/* BOUTON MON PROFIL */}
      <button
        onClick={() => setPageActive("profil")}
        className="w-full bg-[#152642] hover:bg-[#1a2f50] rounded-2xl p-4 border border-[#1f3460] flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚴</span>
          <div className="text-left">
            <p className="text-white font-semibold">Mon profil</p>
            <p className="text-zinc-400 text-sm">Véhicule et niveau</p>
          </div>
        </div>
        <span className="text-zinc-400 text-xl">›</span>
      </button>

      {/* BOUTON CALIBRATION */}
      <button
        onClick={() => setPageActive("calibration")}
        className="w-full bg-[#152642] hover:bg-[#1a2f50] rounded-2xl p-4 border border-[#1f3460] flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="text-left">
            <p className="text-white font-semibold">Étalonnage</p>
            <p className="text-zinc-400 text-sm">Tensions de charge personnalisées</p>
          </div>
        </div>
        <span className="text-zinc-400 text-xl">›</span>
      </button>

      {/* ==========================================
          🔋 BLOC GESTION MULTI-BATTERIES
          ========================================== */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-zinc-400 text-sm font-medium">Gestion de la flotte ({batteries.length})</label>
          <button
            onClick={handleAddBattery}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-lg font-medium transition-colors"
          >
            + Ajouter
          </button>
        </div>

        {batteries.length > 0 ? (
          <div className="space-y-2">
            {batteries.map((b) => {
              const isSelected = b.id === activeBatteryId;
              return (
                <div
                  key={b.id}
                  onClick={() => switchBattery && switchBattery(b.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? "bg-[#1f3460]/50 border-blue-500 text-white font-semibold"
                      : "bg-[#0d1f3a]/40 border-[#1f3460] text-zinc-300 hover:bg-[#1f3460]/20"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{isSelected ? "⚡" : "🚲"}</span>
                    <span className="truncate text-sm">{b.name || "Sans nom"}</span>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteBattery(b.id, b.name, e)}
                    className="text-zinc-500 hover:text-red-400 p-1 text-xs transition-colors"
                    title="Supprimer cette batterie"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic pt-1">Utilise le profil par défaut.</p>
        )}
      </div>

      {/* Nom batterie */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2">
        <label className="text-zinc-400 text-sm">{t("nom_batterie")}</label>
        <input
          type="text"
          value={reglages.nomBatterie || ""}
          onChange={(e) => changerValeur("nomBatterie", e.target.value)}
          className="w-full bg-[#1f3460] text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Type véhicule */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2">
        <label className="text-zinc-400 text-sm">{t("type_vehicule")}</label>
        <div className="flex gap-2">
          {["vae", "tae"].map((v) => (
            <button
              key={v}
              onClick={() => changerValeur("vehicule", v)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                reglages.vehicule === v
                  ? "bg-blue-600 text-white"
                  : "bg-[#1f3460] text-zinc-400"
              }`}
            >
              {v === "vae" ? "🚴 VAE" : "🛴 Trottinette"}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2">
        <label className="text-zinc-400 text-sm">{t("mode_affichage")}</label>
        <div className="flex gap-2">
          <button
            onClick={() => changerValeur("mode", "debutant")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              reglages.mode === "debutant"
                ? "bg-green-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🟢 %
          </button>
          <button
            onClick={() => changerValeur("mode", "expert")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              reglages.mode === "expert"
                ? "bg-purple-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🔵 V
          </button>
        </div>
        <p className="text-zinc-500 text-xs">
          {reglages.mode === "debutant"
            ? t("debutant_desc")
            : t("expert_desc")}
        </p>
      </div>
    </div>
  );
}

export default Reglages;