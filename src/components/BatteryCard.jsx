import { useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb, v2p, p2v } from "../services/calculs";

function BatteryCard({ reglages, t }) {
  const { profile } = useApp();

  // Récupération des vraies tensions de la batterie
  const d = vdb(profile.nominalVoltage);

  const [charge, setCharge] = useState(82);
  const [temperature, setTemperature] = useState(18);

  // Vraie tension calculée selon la batterie réelle
  const volts = p2v(charge, profile.nominalVoltage);

  let sante = t("excellent");
  let couleurSante = "text-green-400";
  let couleurCercle = "#22c55e";

  if (charge < 50) {
    sante = t("moyenne");
    couleurSante = "text-yellow-400";
    couleurCercle = "#eab308";
  }

  if (charge < 20) {
    sante = t("critique");
    couleurSante = "text-red-400";
    couleurCercle = "#ef4444";
  }

  if (temperature < 0 || temperature > 35) {
    sante = t("a_surveiller");
    couleurSante = "text-orange-400";
    couleurCercle = "#f97316";
  }

  const rayon = 54;
  const circonference = 2 * Math.PI * rayon;
  const progression = circonference - (charge / 100) * circonference;

  const estExpert = reglages?.mode === "expert";

  // Quand on bouge le slider en mode Expert, on entre une tension réelle
  function handleVoltageChange(v) {
    const newVolts = parseFloat(v);
    if (!isNaN(newVolts)) {
      setCharge(v2p(newVolts, profile.nominalVoltage));
    }
  }

  return (
    <div className="bg-[#152642] rounded-2xl p-6 shadow-md border border-[#1f3460] space-y-6">

      <div className="flex flex-col items-center">
        <svg width="140" height="140" className="rotate-[-90deg]">
          <circle cx="70" cy="70" r={rayon} fill="none" stroke="#3f3f46" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={rayon} fill="none"
            stroke={couleurCercle} strokeWidth="12"
            strokeDasharray={circonference}
            strokeDashoffset={progression}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="relative" style={{ marginTop: "-90px" }}>
          <p className="text-4xl font-bold text-white text-center">
            {estExpert ? `${volts}V` : `${charge}%`}
          </p>
          <p className="text-sm text-zinc-400 text-center mt-1">
            {estExpert ? t("tension") : t("charge")}
          </p>
        </div>
        <div style={{ marginTop: "20px" }}>
          <p className={`text-center font-semibold ${couleurSante}`}>
            {sante}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <span className={`text-xs px-3 py-1 rounded-full ${
          estExpert
            ? "bg-purple-800 text-purple-200"
            : "bg-green-800 text-green-200"
        }`}>
          {estExpert ? t("mode_expert") : t("mode_debutant")}
        </span>
      </div>

      {/* Info batterie active */}
      <div className="text-center text-xs text-zinc-500">
        🚴 {profile.nominalVoltage}V • {profile.capacityAh}Ah
        {profile.customName ? ` • ${profile.customName}` : ""}
      </div>

      <div className="space-y-2 text-zinc-300">

        <div className="flex justify-between items-center gap-3 bg-[#1f3460] rounded-xl px-4 py-3 min-w-0">
          <span className="truncate min-w-0">🌡️ {t("temperature")}</span>
          <span className="text-white font-bold shrink-0">{temperature}°C</span>
        </div>

        <div className="flex justify-between items-center gap-3 bg-[#1f3460] rounded-xl px-4 py-3 min-w-0">
          <span className="truncate min-w-0">❤️ {t("etat_sante")}</span>
          <span className={`font-bold shrink-0 ${couleurSante}`}>{sante}</span>
        </div>

        {estExpert && (
          <div className="flex justify-between items-center gap-3 bg-[#1f3460] rounded-xl px-4 py-3 min-w-0">
            <span className="truncate min-w-0">⚡ {t("tension")}</span>
            <span className="text-white font-bold shrink-0">{volts}V</span>
          </div>
        )}

      </div>

      {/* Slider charge ou tension */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          {estExpert
            ? `${t("regler_tension")} : ${volts}V`
            : `${t("regler_charge")} : ${charge}%`}
        </label>

        {estExpert ? (
          <input
            type="range"
            min={d.min}
            max={d.max}
            step="0.1"
            value={volts}
            onChange={(e) => handleVoltageChange(e.target.value)}
            className="w-full"
          />
        ) : (
          <input
            type="range"
            min="0"
            max="100"
            value={charge}
            onChange={(e) => setCharge(Number(e.target.value))}
            className="w-full"
          />
        )}

        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          {estExpert ? (
            <>
              <span>{d.min}V</span>
              <span>{d.max}V</span>
            </>
          ) : (
            <>
              <span>0%</span>
              <span>100%</span>
            </>
          )}
        </div>
      </div>

      {/* Slider température */}
      <div>
        <label className="block text-sm text-zinc-400 mb-2">
          {t("regler_temperature")} : {temperature}°C
        </label>
        <input
          type="range" min="-20" max="45" value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors">
        {t("demarrer_suivi")}
      </button>

    </div>
  );
}

export default BatteryCard;