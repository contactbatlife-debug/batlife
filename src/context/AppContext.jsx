import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { vdb } from "../services/calculs";
import translations from "../i18n/translations";

// ✅ Demande la persistance du stockage (protège contre l'éviction iOS/Chrome)
async function ensurePersistence() {
  if (!navigator.storage?.persist) return;
  const persisted = await navigator.storage.persisted();
  if (!persisted) await navigator.storage.persist();
}

// ✅ Détecte iOS Safari en mode non-installé (PWA non ajoutée à l'écran d'accueil)
function isIOSSafariNotInstalled() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.navigator.standalone === true;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return isIOS && isSafari && !isStandalone;
}

const AppContext = createContext();

const defaultProfile = {
  vehicle: "duotts_c29",
  customName: "Ma Batterie",
  level: "beginner",
  nominalVoltage: 48,
  capacityAh: 15,
  Idefault: 2,
  lang: "fr"
};

// Clés localStorage liées à une charge active
const ACTIVE_CHARGE_KEYS = [
  "bl_active_v5",
  "bl_rest_end_ts",
  "bl_rest_charge_snapshot",
  "bl_rest_notified_for_end_ts",
];

function clearAllChargeKeys() {
  ACTIVE_CHARGE_KEYS.forEach(k => localStorage.removeItem(k));
}

function defaultCalibration(nominalVoltage) {
  const d = vdb(nominalVoltage);
  return { daily: d.daily, course: d.course, storage: d.storage };
}

export function AppProvider({ children }) {

  const [batteries, setBatteries] = useState(() => {
    const saved = localStorage.getItem("bl_batteries_v6");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch { /* Fallback */ }
    }
    return [{ id: 1, name: "Ma Batterie", profile: defaultProfile, history: [], calibration: defaultCalibration(48) }];
  });

  const [activeBatteryId, setActiveBatteryId] = useState(() => {
    const saved = localStorage.getItem("bl_active_battery_id_v6");
    return saved ? Number(saved) : 1;
  });

  const [profile, setProfile] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.profile || defaultProfile;
  });

  const [calibration, setCalibration] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.calibration || defaultCalibration(profile.nominalVoltage);
  });

  const [history, setHistory] = useState(() => {
    const currentBat = batteries.find(b => b.id === (Number(localStorage.getItem("bl_active_battery_id_v6")) || 1)) || batteries[0];
    return currentBat?.history || [];
  });

  const [activeCharge, setActiveChargeState] = useState(() => {
    const saved = localStorage.getItem("bl_active_v5");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem("bl_temperature_v6");
    try { return saved !== null ? JSON.parse(saved) : 20; } catch { return 20; }
  });

  const [chargeMode, setChargeMode] = useState("daily");
  const [toast, setToast] = useState(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);

  // ✅ Au démarrage : persistence + bandeau iOS + rappel sauvegarde
  useEffect(() => {
    // Demander la persistance du stockage
    ensurePersistence();

    // Bandeau iOS — affiché une seule fois si jamais fermé
    if (isIOSSafariNotInstalled()) {
      const dismissed = localStorage.getItem("bl_ios_banner_dismissed");
      if (!dismissed) setShowIOSBanner(true);
    }
  }, []);

  // ✅ Rappel sauvegarde — après 10 sessions sans backup depuis 30 jours
  useEffect(() => {
    if (history.length < 10) return;
    const lastBackup = +(localStorage.getItem("bl_last_backup_reminder") || 0);
    const daysSince = (Date.now() - lastBackup) / 86400000;
    if (daysSince > 30) {
      setTimeout(() => {
        showToast({
          text: "💾 Pensez à sauvegarder votre historique : Outils → Export JSON",
          variant: "warning"
        });
        localStorage.setItem("bl_last_backup_reminder", Date.now().toString());
      }, 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length]);

  // ✅ setActiveCharge enrichi : si null, nettoie TOUTES les clés de repos atomiquement
  const setActiveCharge = useCallback((value) => {
    if (value === null) {
      clearAllChargeKeys();
    }
    setActiveChargeState(value);
  }, []);

  // Sauvegarde de l'ID actif
  useEffect(() => {
    localStorage.setItem("bl_active_battery_id_v6", activeBatteryId.toString());
  }, [activeBatteryId]);

    // 1) Met à jour la batterie active dans la liste des batteries
  useEffect(() => {
    setBatteries(prev =>
      prev.map(b =>
        b.id === activeBatteryId
          ? { ...b, profile, calibration, history }
          : b
      )
    );
  }, [profile, calibration, history, activeBatteryId]);

    // 2) Sauvegarde les batteries avec un filet de sécurité
  useEffect(() => {
    try {
      localStorage.setItem("bl_batteries_v6", JSON.stringify(batteries));
    } catch (erreur) {
      console.error("Erreur de stockage BatLife :", erreur);

      // On essaie de récupérer la langue choisie par l'utilisateur
      let langue = profile?.lang || "fr";

      try {
        const rawReglages = localStorage.getItem("batlife_reglages");
        if (rawReglages) {
          const parsed = JSON.parse(rawReglages);
          if (parsed?.langue) {
            langue = parsed.langue;
          }
        }
      } catch (e) {
        // Si on ne trouve pas la langue, on reste en français
      }

            // Message traduit via le dictionnaire central (translations.js)
      setToast({
        text: translations[langue]?.stockage_plein || translations.fr.stockage_plein,
        variant: "warning"
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batteries]);

  // Charge active — sauvegarde uniquement si non null
  useEffect(() => {
    if (activeCharge) {
      localStorage.setItem("bl_active_v5", JSON.stringify(activeCharge));
    }
    // ✅ La suppression est gérée dans setActiveCharge directement (atomique)
  }, [activeCharge]);

  // Température
  useEffect(() => {
    localStorage.setItem("bl_temperature_v6", JSON.stringify(temperature));
  }, [temperature]);

  function switchBattery(id) {
    const target = batteries.find(b => b.id === id);
    if (!target) return;
    setActiveBatteryId(id);
    setProfile(target.profile || defaultProfile);
    setCalibration(target.calibration || defaultCalibration(target.profile?.nominalVoltage || 48));
    setHistory(target.history || []);
  }

  function addBattery(name) {
    const newId = batteries.length > 0 ? Math.max(...batteries.map(b => b.id)) + 1 : 1;
    const newBat = {
      id: newId,
      name,
      profile: { ...defaultProfile, customName: name },
      calibration: defaultCalibration(defaultProfile.nominalVoltage),
      history: []
    };
    setBatteries(prev => [...prev, newBat]);
    setActiveBatteryId(newId);
    setProfile(newBat.profile);
    setCalibration(newBat.calibration);
    setHistory(newBat.history);
  }

    function deleteBattery(id) {
    if (batteries.length <= 1) return;
    const updated = batteries.filter(b => b.id !== id);
    setBatteries(updated);
    if (activeBatteryId === id) {
      // ✅ Verrou robustesse : si une charge ou un repos était en cours
      // sur cette batterie, on nettoie tout pour éviter une "charge fantôme"
      if (activeCharge) {
        setActiveCharge(null);
      }
      const fallback = updated[0];
      setActiveBatteryId(fallback.id);
      setProfile(fallback.profile);
      setCalibration(fallback.calibration);
      setHistory(fallback.history);
    }
  }

  function addToHistory(entry) {
    setHistory(prev => [entry, ...prev].slice(0, 200));
  }

    function updateProfile(newProfile) {
    setProfile(newProfile);
    let updatedCalibration = calibration;
    if (newProfile.nominalVoltage !== profile.nominalVoltage) {
      updatedCalibration = defaultCalibration(newProfile.nominalVoltage);
      setCalibration(updatedCalibration);
    }
    setBatteries(prev => prev.map(b =>
      b.id === activeBatteryId
        ? { ...b, name: newProfile.customName || b.name, profile: newProfile, calibration: updatedCalibration }
        : b
    ));
  }

  function setLang(lang) {
    setProfile(prev => ({ ...prev, lang }));
  }

  function showToast(badge) { setToast(badge); }
  function hideToast() { setToast(null); }

  function dismissIOSBanner() {
    localStorage.setItem("bl_ios_banner_dismissed", "1");
    setShowIOSBanner(false);
  }

  function exportBackup() {
    const backup = { exportedAt: new Date().toISOString(), version: "6.0", data: {} };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("bl_")) continue;
      try { backup.data[key] = JSON.parse(localStorage.getItem(key)); }
      catch { backup.data[key] = localStorage.getItem(key); }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "batlife-sauvegarde.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

   function importBackup(file, onSuccess, onError) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        
        // 🛂 LE DOUANIER : Vérifie que c'est bien un fichier BatLife valide
        if (!p || !p.data || !p.data.bl_batteries_v6) {
          console.error("Fichier invalide : ce n'est pas une sauvegarde BatLife reconnue.");
          showToast({
            text: "❌ Fichier invalide. Ce n'est pas une sauvegarde BatLife reconnue.",
            variant: "error"
          });
          if (onError) onError();
          return; // On bloque tout, on ne touche pas aux données actuelles
        }

        // Si le douanier valide, on importe normalement
        if (p.data) {
          Object.keys(p.data).forEach(key => {
            localStorage.setItem(key, JSON.stringify(p.data[key]));
          });
        }
        
        const savedBats = localStorage.getItem("bl_batteries_v6");
        const savedActiveId = localStorage.getItem("bl_active_battery_id_v6");
        const savedTemp = localStorage.getItem("bl_temperature_v6");

        if (savedBats) setBatteries(JSON.parse(savedBats));
        if (savedActiveId) setActiveBatteryId(Number(savedActiveId));
        if (savedTemp) setTemperature(JSON.parse(savedTemp));

        const currentId = savedActiveId ? Number(savedActiveId) : 1;
        const list = savedBats ? JSON.parse(savedBats) : [];
        const currentBat = list.find(b => b.id === currentId) || list[0];
        if (currentBat) {
          setProfile(currentBat.profile || defaultProfile);
          setCalibration(currentBat.calibration || defaultCalibration(48));
          setHistory(currentBat.history || []);
        }
        
        showToast({
          text: "✅ Sauvegarde restaurée avec succès !",
          variant: "success"
        });
        
        if (onSuccess) onSuccess();
      } catch (e) {
        console.error("Erreur lors de la lecture du fichier :", e);
        showToast({
          text: "❌ Erreur de lecture. Le fichier est peut-être corrompu.",
          variant: "error"
        });
        if (onError) onError();
      }
    };
    r.readAsText(file);
  }

  const value = {
    batteries, activeBatteryId, switchBattery, addBattery, deleteBattery,
    profile, setProfile, updateProfile, setLang,
    calibration, setCalibration,
    history, setHistory, addToHistory,
    activeCharge, setActiveCharge,
    temperature, setTemperature,
    chargeMode, setChargeMode,
    toast, showToast, hideToast,
    exportBackup, importBackup,
    showIOSBanner, dismissIOSBanner,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
