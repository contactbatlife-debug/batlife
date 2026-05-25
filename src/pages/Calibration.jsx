import { useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb, v2p } from "../services/calculs";

function Calibration({ onRetour }) {
  const { profile, calibration, setCalibration } = useApp();

  const d = vdb(profile.nominalVoltage);

  const [daily, setDaily] = useState(calibration.daily);
  const [course, setCourse] = useState(calibration.course);
  const [storage, setStorage] = useState(calibration.storage);

  function enregistrer() {
    const dailyNum = parseFloat(daily);
    const courseNum = parseFloat(course);
    const storageNum = parseFloat(storage);

    if (isNaN(dailyNum) || isNaN(courseNum) || isNaN(storageNum)) {
      alert("Valeurs invalides");
      return;
    }

    setCalibration({
      daily: dailyNum,
      course: courseNum,
      storage: storageNum
    });

    if (onRetour) onRetour();
  }

  function reinitialiser() {
    setDaily(d.daily);
    setCourse(d.course);
    setStorage(d.storage);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-300">
        🎯 Étalonnage
      </h2>

      {/* Info batterie */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460]">
        <p className="text-zinc-400 text-sm">Batterie actuelle</p>
        <p className="text-white font-bold mt-1">
          {profile.nominalVoltage}V • {profile.capacityAh}Ah
        </p>
        <p className="text-zinc-500 text-xs mt-2">
          Plage : {d.min}V → {d.max}V
        </p>
      </div>

      {/* Quotidien */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2 border-l-4 border-l-green-500">
        <div className="flex justify-between items-center">
          <label className="text-zinc-300 text-sm font-semibold">
            🟢 Quotidien (80%)
          </label>
          <span className="text-green-400 text-xs">
            {v2p(parseFloat(daily) || 0, profile.nominalVoltage)}%
          </span>
        </div>
        <input
          type="number"
          step="0.1"
          value={daily}
          onChange={(e) => setDaily(e.target.value)}
          className="w-full bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-zinc-500 text-xs">
          Recommandé : {d.daily}V (charge quotidienne)
        </p>
      </div>

      {/* Grande course */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2 border-l-4 border-l-blue-500">
        <div className="flex justify-between items-center">
          <label className="text-zinc-300 text-sm font-semibold">
            🔵 Grande course (100%)
          </label>
          <span className="text-blue-400 text-xs">
            {v2p(parseFloat(course) || 0, profile.nominalVoltage)}%
          </span>
        </div>
        <input
          type="number"
          step="0.1"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="w-full bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-zinc-500 text-xs">
          Recommandé : {d.course}V (longues sorties)
        </p>
      </div>

      {/* Hivernage */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2 border-l-4 border-l-cyan-500">
        <div className="flex justify-between items-center">
          <label className="text-zinc-300 text-sm font-semibold">
            ❄️ Hivernage (50%)
          </label>
          <span className="text-cyan-400 text-xs">
            {v2p(parseFloat(storage) || 0, profile.nominalVoltage)}%
          </span>
        </div>
        <input
          type="number"
          step="0.1"
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          className="w-full bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-zinc-500 text-xs">
          Recommandé : {d.storage}V (stockage long terme)
        </p>
      </div>

      {/* Boutons */}
      <div className="flex gap-2">
        <button
          onClick={reinitialiser}
          className="flex-1 bg-[#1f3460] hover:bg-[#2a4470] text-white py-3 rounded-xl font-medium transition-colors"
        >
          🔄 Recommandé
        </button>
        <button
          onClick={enregistrer}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
        >
          💾 Enregistrer
        </button>
      </div>
    </div>
  );
}

export default Calibration;