import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { calculerProgression } from "../services/charge";
import { fmt } from "../services/calculs";
import { checkBadges } from "../services/badges";

function ChargeActive({ t }) {
  const {
    activeCharge,
    setActiveCharge,
    addToHistory,
    history,
    profile,
    showToast
  } = useApp();

  const [tick, setTick] = useState(0);
  const [alerteDeclenchee, setAlerteDeclenchee] = useState(false);
  
  // États pour la phase de repos (30 min) et la tension réelle
  const [enRepos, setEnRepos] = useState(false);
  const [tensionReelleSaisie, setTensionReelleSaisie] = useState("");

  // Met à jour toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!activeCharge) return null;

  const progression = calculerProgression(activeCharge);
  if (!progression) return null;

  const estExpert = profile.level === "expert";

  // --- 🔔 EFFET : ALERTE FIN DE CHARGE (SON / VIBRATION / NOTIF) ---
  if (progression.isComplete && !alerteDeclenchee) {
    setAlerteDeclenchee(true);

    // 1. Vibration du téléphone (si supporté par l'appareil)
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]); 
    }

    // 2. Alerte Sonore (Bip synthétique universel)
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Note LA (A5)
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2); // Sonne pendant 1.2s
    } catch (e) {
      console.log("Audio non supporté ou bloqué par le navigateur");
    }

    // 3. Notification Push sur l'écran
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("⚡ BatLife : Charge Terminée !", {
        body: "Votre batterie a atteint sa cible. Vous pouvez la débrancher.",
        icon: "🔋"
      });
    }
  }

  // --- 🏁 ACTION : FIN DE CHARGE & PASSAGE AU REPOS ---
  function debrancher() {
    // Au lieu de tout couper, on passe en mode repos pour attendre les 30 min de stabilisation
    setEnRepos(true);
  }

  // --- 💾 ACTION : ENREGISTREMENT FINAL APRÈS REPOS (AVEC ÉCART V) ---
  function validerTensionReelle() {
    const tensionV = parseFloat(tensionReelleSaisie) || progression.currentV;
    const ecartCalculé = parseFloat((tensionV - activeCharge.targetV).toFixed(2));

    const nouvelleSession = {
      date: Date.now(),
      vehicle: activeCharge.vehicle,
      nominal: activeCharge.nominal,
      mode: activeCharge.mode,
      startV: activeCharge.startV,
      startPct: activeCharge.startPct,
      targetV: activeCharge.targetV,
      targetPct: activeCharge.targetPct,
      finalV: progression.currentV,
      finalPct: progression.currentPct,
      duration: Date.now() - activeCharge.startTs,
      realMeasure: true,
      realVAfterRest: tensionV,
      voltageGap: ecartCalculé, // Contient l'écart de tension !
      kmRidden: activeCharge.kmRidden,
      temperature: activeCharge.temperature
    };

    addToHistory(nouvelleSession);

    // Vérifier les badges après la charge
    const nouvelHistorique = [nouvelleSession, ...history];
    const nouveauxBadges = checkBadges(nouvelHistorique);

    if (nouveauxBadges.length > 0) {
      nouveauxBadges.forEach((badge, index) => {
        setTimeout(() => {
          showToast(badge);
        }, index * 2000);
      });
    }

    // On ferme enfin la session globale de charge active
    setActiveCharge(null);
  }

  function annuler() {
    if (!confirm("Annuler la charge en cours ?")) return;
    setActiveCharge(null);
  }

  // Couleur du cercle selon progression
  let couleurCercle = "#3b82f6";
  if (progression.ratio >= 0.5) couleurCercle = "#10b981";
  if (progression.isComplete) couleurCercle = "#22c55e";

  const rayon = 60;
  const circonference = 2 * Math.PI * rayon;
  const offset = circonference - progression.ratio * circonference;

  const finDate = new Date(activeCharge.endTs);
  const heureFin = finDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  // 🕒 ÉCRAN TEMPORAIRE : PÉRIODE DE REPOS ET DEMANDE DE TENSION RÉELLE
  if (enRepos) {
    return (
      <div className="bg-[#152642] rounded-2xl p-6 shadow-md border border-[#1f3460] space-y-5 text-center">
        <h2 className="text-xl font-bold text-white">⏳ Période de Repos (30 mm)</h2>
        <p className="text-zinc-400 text-sm">
          Pour calculer l'écart exact, attendez que la batterie se stabilise, puis mesurez sa tension réelle au voltmètre.
        </p>

        <div className="bg-[#1f3460] p-4 rounded-xl space-y-3 max-w-xs mx-auto">
          <label className="block text-zinc-300 text-sm font-medium">
            Tension mesurée après repos (V) :
          </label>
          <input
            type="number"
            step="0.1"
            placeholder={`${activeCharge.targetV} V`}
            value={tensionReelleSaisie}
            onChange={(e) => setTensionReelleSaisie(e.target.value)}
            className="w-full bg-[#152642] border border-[#3b82f6] rounded-xl py-2 px-3 text-white font-bold text-center text-lg focus:outline-none"
          />
        </div>

        <button
          onClick={validerTensionReelle}
          className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          Enregistrer le trajet & l'écart
        </button>
      </div>
    );
  }

  // ⚡ ÉCRAN PRINCIPAL : CHARGE ACTIVE
  return (
    <div className="bg-[#152642] rounded-2xl p-6 shadow-md border border-[#1f3460] space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">⚡ Charge en cours</h2>
        <p className="text-zinc-400 text-sm mt-1">
          {profile.nominalVoltage}V • {profile.capacityAh}Ah
        </p>
      </div>

      {/* Cercle de progression */}
      <div className="flex flex-col items-center">
        <svg width="160" height="160" className="rotate-[-90deg]">
          <circle cx="80" cy="80" r={rayon} fill="none" stroke="#1f3460" strokeWidth="14" />
          <circle
            cx="80" cy="80" r={rayon} fill="none"
            stroke={couleurCercle} strokeWidth="14"
            strokeDasharray={circonference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="relative" style={{ marginTop: "-110px" }}>
          <p className="text-5xl font-bold text-white text-center">
            {Math.round(progression.ratio * 100)}%
          </p>
          <p className="text-sm text-zinc-400 text-center mt-1">progression</p>
        </div>
      </div>

      {/* Tableau d'infos */}
      <div className="space-y-2 pt-4">
        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">🔋 Départ</span>
          <span className="text-white font-bold">
            {estExpert ? `${activeCharge.startV}V` : `${activeCharge.startPct}%`}
          </span>
        </div>

        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">🎯 Cible</span>
          <span className="text-white font-bold">
            {estExpert ? `${activeCharge.targetV}V` : `${activeCharge.targetPct}%`}
          </span>
        </div>

        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">📊 En cours</span>
          <span className="text-white font-bold">
            {estExpert ? `${progression.currentV}V` : `${progression.currentPct}%`}
          </span>
        </div>

        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">⏱️ Temps écoulé</span>
          <span className="text-white font-bold">{fmt(progression.elapsed)}</span>
        </div>

        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">⏳ Temps restant</span>
          <span className="text-white font-bold">
            {progression.isComplete ? "✅ Terminé" : fmt(progression.remaining)}
          </span>
        </div>

        <div className="bg-[#1f3460] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-zinc-300">🕐 Fin estimée</span>
          <span className="text-white font-bold">{heureFin}</span>
        </div>
      </div>

      {/* Alerte fin visuelle */}
      {progression.isComplete && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 p-3 rounded-xl text-center animate-bounce">
          🎉 Charge terminée ! Vous pouvez débrancher.
        </div>
      )}

      {/* Boutons de contrôle */}
      <div className="flex gap-2">
        <button
          onClick={annuler}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium transition-colors"
        >
          ❌ Annuler
        </button>
        <button
          onClick={debrancher}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors"
        >
          🔌 Débrancher
        </button>
      </div>
    </div>
  );
}

export default ChargeActive;