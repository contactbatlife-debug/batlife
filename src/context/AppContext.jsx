import { createContext, useContext, useState, useEffect } from "react";
import { vdb } from "../services/calculs";

const AppContext = createContext();

// Profil par défaut
const defaultProfile = {
  vehicle: "duotts_c29",
  customName: "Ma Batterie",
  level: "beginner",
  nominalVoltage: 48,
  capacityAh: 15,
  Idefault: 2,
  lang: "fr"
};

// Calibration par défaut
function defaultCalibration(nominalVoltage) {
  const d = vdb(nominalVoltage);
  return {
    daily: d.daily,
    course: d.course,
    storage: d.storage
  };
}

export function AppProvider({ children }) {
  // ==========================================
  // 🚲 1. INITIALISATION DES ÉTATS (CONTEXTE)
  // ==========================================

  // Multi-batteries (Étape E)
  const [batteries, setBatteries] = useState(() => {
    const saved = localStorage.getItem("bl_batteries_v6");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) { /* Fallback */ }
    }
    // Par défaut, si vide, on crée la première batterie à partir du profil initial
    return [{ id: 1, name: "Ma Batterie", profile: defaultProfile, history: [], calibration: defaultCalibration(48) }];
  });

  const [activeBatteryId, setActiveBatteryId] = useState(() => {
    const saved = localStorage.getItem("bl_active_battery_id_v6");
    return saved ? Number(saved) : 1;
  });

  // Profil (Synchronisé sur la batterie active)
  const [profile, setProfile] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.profile || defaultProfile;
  });

  // Calibration (Synchronisée sur la batterie active)
  const [calibration, setCalibration] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.calibration || defaultCalibration(profile.nominalVoltage);
  });

  // Historique (Synchronisé sur la batterie active)
  const [history, setHistory] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.history || [];
  });

  // Charge active
  const [activeCharge, setActiveCharge] = useState(() => {
    const saved = localStorage.getItem("bl_active_v5");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  // Température ambiante
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem("bl_temperature_v6");
    try { return saved !== null ? JSON.parse(saved) : 20; } catch { return 20; }
  });

  // Mode de charge et Toast
  const [chargeMode, setChargeMode] = useState("daily");
  const [toast, setToast] = useState(null);

 // ==========================================
  // 💾 2. SAUVEGARDES ET SYNCHRONISATIONS (EFFECTS)
  // ==========================================

  // Sauvegarde centrale de l'ID actif
  useEffect(() => {
    localStorage.setItem("bl_active_battery_id_v6", activeBatteryId.toString());
  }, [activeBatteryId]);

  // Sauvegarde et synchronisation atomique de TOUTE la flotte
  useEffect(() => {
    const updatedBatteries = batteries.map(b => 
      b.id === activeBatteryId 
        ? { ...b, profile, calibration, history } 
        : b
    );
    localStorage.setItem("bl_batteries_v6", JSON.stringify(updatedBatteries));
  }, [profile, calibration, history, activeBatteryId]);

  // Charge active globale
  useEffect(() => {
    if (activeCharge) localStorage.setItem("bl_active_v5", JSON.stringify(activeCharge));
    else localStorage.removeItem("bl_active_v5");
  }, [activeCharge]);

  // Température
  useEffect(() => {
    localStorage.setItem("bl_temperature_v6", JSON.stringify(temperature));
  }, [temperature]);

  // ==========================================
  // ⚙️ 3. ACTIONS GESTION FLOTTE (ÉTAPE E)
  // ==========================================

  // Changer de batterie active
  function switchBattery(id) {
    const target = batteries.find(b => b.id === id);
    if (!target) return;
    setActiveBatteryId(id);
    setProfile(target.profile || defaultProfile);
    setCalibration(target.calibration || defaultCalibration(target.profile?.nominalVoltage || 48));
    setHistory(target.history || []);
  }

  // Ajouter une nouvelle batterie à la flotte
  function addBattery(name) {
    const newId = batteries.length > 0 ? Math.max(...batteries.map(b => b.id)) + 1 : 1;
    const newBat = {
      id: newId,
      name: name,
      profile: { ...defaultProfile, customName: name },
      calibration: defaultCalibration(defaultProfile.nominalVoltage),
      history: []
    };
    const updated = [...batteries, newBat];
    setBatteries(updated);
    // Bascule automatique sur la nouvelle
    setActiveBatteryId(newId);
    setProfile(newBat.profile);
    setCalibration(newBat.calibration);
    setHistory(newBat.history);
  }

  // Supprimer une batterie de la flotte
  function deleteBattery(id) {
    if (batteries.length <= 1) return;
    const updated = batteries.filter(b => b.id !== id);
    setBatteries(updated);
    if (activeBatteryId === id) {
      // Si on supprime la batterie courante, on bascule sur la première restante
      const fallback = updated[0];
      setActiveBatteryId(fallback.id);
      setProfile(fallback.profile);
      setCalibration(fallback.calibration);
      setHistory(fallback.history);
    }
  }

  // ==========================================
  // 📝 4. ACTIONS SECONDAIRES
  // ==========================================

  function addToHistory(entry) {
    setHistory(prev => [entry, ...prev].slice(0, 200));
  }

  // Met à jour le profil (Version corrigée Multi-batteries)
  function updateProfile(newProfile) {
    setProfile(newProfile);
    
    let updatedCalibration = calibration;
    if (newProfile.nominalVoltage !== profile.nominalVoltage) {
      updatedCalibration = defaultCalibration(newProfile.nominalVoltage);
      setCalibration(updatedCalibration);
    }

    // On force la synchronisation immédiate dans le tableau des batteries
    setBatteries(prev => prev.map(b => 
      b.id === activeBatteryId 
        ? { ...b, profile: newProfile, calibration: updatedCalibration } 
        : b
    ));
  }

  function setLang(lang) {
    setProfile(prev => ({ ...prev, lang }));
  }

  function showToast(badge) { setToast(badge); }
  function hideToast() { setToast(null); }

  // ==========================================
  // 💾 5. EXPORT / IMPORT JSON INTÉGRÉ
  // ==========================================
  
  function exportBackup() {
    const backup = { 
      exportedAt: new Date().toISOString(), 
      version: "6.0", 
      data: {} 
    };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("bl_")) continue;
      try { backup.data[key] = JSON.parse(localStorage.getItem(key)); }
      catch { backup.data[key] = localStorage.getItem(key); }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "batlife-sauvegarde.json"; a.click(); URL.revokeObjectURL(a.href);
  }

  function importBackup(file, onSuccess, onError) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        if (p.data) {
          Object.keys(p.data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(p.data[key]));
          });
        }

        // Forcer immédiatement la ré-actualisation de l'état en mémoire
        const savedBats = localStorage.getItem("bl_batteries_v6");
        const savedActiveId = localStorage.getItem("bl_active_battery_id_v6");
        const savedTemp = localStorage.getItem("bl_temperature_v6");

        if (savedBats) setBatteries(JSON.parse(savedBats));
        if (savedActiveId) setActiveBatteryId(Number(savedActiveId));
        if (savedTemp) setTemperature(JSON.parse(savedTemp));

        // Forcer le recalage de la batterie active après importation
        const currentId = savedActiveId ? Number(savedActiveId) : 1;
        const list = savedBats ? JSON.parse(savedBats) : [];
        const currentBat = list.find(b => b.id === currentId) || list[0];
        if (currentBat) {
          setProfile(currentBat.profile || defaultProfile);
          setCalibration(currentBat.calibration || defaultCalibration(48));
          setHistory(currentBat.history || []);
        }

        onSuccess();
      } catch (e) { 
        console.error(e);
        onError(); 
      }
    };
    r.readAsText(file);
  }

  // Valeurs injectées dans toute l'application
  const value = {
    batteries,
    activeBatteryId,
    switchBattery,
    addBattery,
    deleteBattery,

    profile,
    setProfile,
    updateProfile,
    setLang,

    calibration,
    setCalibration,

    history,
    setHistory,
    addToHistory,

    activeCharge,
    setActiveCharge,

    temperature,
    setTemperature,

    chargeMode,
    setChargeMode,

    toast,
    showToast,
    hideToast,

    exportBackup,
    importBackup
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}