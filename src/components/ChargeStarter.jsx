import { useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb, v2p, p2v } from "../services/calculs";
import { creerSessionCharge, calculerCible } from "../services/charge";

function ChargeStarter({ t }) {
  const {
    profile,
    calibration,
    temperature,
    setActiveCharge
  } = useApp();

  const d = vdb(profile.nominalVoltage);
  const estExpert = profile.level === "expert";

  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState("daily");
  const [km, setKm] = useState("");
  const [erreur, setErreur] = useState("");

  function demarrerCharge() {
    setErreur("");

    let startV, startPct;
    const val = parseFloat(inputValue);

    if (isNaN(val)) {
      setErreur("Veuillez entrer une valeur");
      return;
    }

    if (estExpert) {
      if (val < d.min || val > d.max) {
        setErreur(`Tension entre ${d.min}V et ${d.max}V`);
        return;
      }
      startV = val;
      startPct = v2p(val, profile.nominalVoltage);
    } else {
      if (val < 0 || val > 100) {
        setErreur("Pourcentage entre 0 et 100");
        return;
      }
      startPct = val;
      startV = p2v(val, profile.nominalVoltage);
    }

    const { targetV, targetPct } = calculerCible({
      mode,
      calibration,
      nominalVoltage: profile.nominalVoltage
    });

    if (targetV <= startV) {
      setErreur("Vous avez déjà atteint ou dépassé la cible");
      return;
    }

    // Enregistrement de la date de charge pour la sécurité
    localStorage.setItem("bl_derniere_charge", new Date().toISOString());

    const kmRidden = parseFloat(km);
    const session = creerSessionCharge({
      startV,
      startPct,
      targetV,
      targetPct,
      mode,
      vehicle: profile.vehicle,
      nominalVoltage: profile.nominalVoltage,
      capacityAh: profile.capacityAh,
      chargerCurrent: profile.Idefault,
      temperature,
      level: profile.level,
      kmRidden: !isNaN(kmRidden) && kmRidden > 0 ? kmRidden : null
    });

    setActiveCharge(session);
  }

  return (
    <div className="bg-[#152642] rounded-2xl p-6 shadow-md border border-[#1f3460] space-y-5">
      <div className="text-center">
        <p className="text-zinc-400 text-sm">🚴 Batterie active</p>
        <p className="text-white font-bold mt-1">
          {profile.nominalVoltage}V • {profile.capacityAh}Ah
          {profile.customName ? ` • ${profile.customName}` : ""}
        </p>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          {estExpert
            ? `⚡ Tension actuelle (${d.min}V - ${d.max}V)`
            : "🔋 Charge actuelle (0% - 100%)"}
        </label>
        <input
          type="number"
          step={estExpert ? "0.1" : "1"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={estExpert ? `Ex: ${d.daily}` : "Ex: 30"}
          className="w-full bg-[#1f3460] text-white text-lg rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">🎯 Mode de charge</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("daily")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              mode === "daily" ? "bg-green-600 text-white" : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🟢 Quotidien
          </button>
          <button
            onClick={() => setMode("course")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
              mode === "course" ? "bg-blue-600 text-white" : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🔵 Grande course
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-zinc-400 mb-2">🛣️ Distance prévue (km)</label>
        <input
          type="number"
          step="0.1"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          className="w-full bg-[#1f3460] text-white rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {erreur && <div className="bg-red-900/50 border border-red-700 text-red-200 text-sm p-3 rounded-xl">⚠️ {erreur}</div>}

      <button
        onClick={demarrerCharge}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-colors text-lg"
      >
        🔋 Démarrer le suivi
      </button>
    </div>
  );
}

export default ChargeStarter;