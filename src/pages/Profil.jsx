import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { VEHICLE_DATABASE } from "../services/config";
import { vdb } from "../services/calculs";

function Profil({ t, onRetour }) {
  const { profile, updateProfile } = useApp();

  const [marqueSelectionnee, setMarqueSelectionnee] = useState(() => {
    const v = VEHICLE_DATABASE.find(v => v.id === profile.vehicle);
    return v ? v.brand : "";
  });

  const [modeleSelectionne, setModeleSelectionne] = useState(profile.vehicle || "");
  const [niveau, setNiveau] = useState(profile.level || "beginner");
  const [modeAjout, setModeAjout] = useState(false);

  // Champs ajout manuel
  const [customName, setCustomName] = useState(profile.customName || "");
  const [customVoltage, setCustomVoltage] = useState(profile.nominalVoltage || 48);
  const [customCapacity, setCustomCapacity] = useState(profile.capacityAh || 15);
  const [customCurrent, setCustomCurrent] = useState(profile.Idefault || 2);

  // Liste unique des marques triées
  const marques = useMemo(() => {
    const set = new Set(VEHICLE_DATABASE.map(v => v.brand));
    return Array.from(set).sort();
  }, []);

  // Modèles filtrés par marque
  const modeles = useMemo(() => {
    return VEHICLE_DATABASE.filter(v => v.brand === marqueSelectionnee);
  }, [marqueSelectionnee]);

  function enregistrer() {
    if (modeAjout) {
      if (!customName.trim()) {
        alert("Veuillez entrer un nom de véhicule");
        return;
      }
      updateProfile({
        ...profile,
        vehicle: "custom",
        customName: customName.trim(),
        nominalVoltage: Number(customVoltage),
        capacityAh: Number(customCapacity),
        Idefault: Number(customCurrent),
        level: niveau
      });
    } else {
      if (!modeleSelectionne) {
        alert("Veuillez choisir un modèle");
        return;
      }
      const v = VEHICLE_DATABASE.find(v => v.id === modeleSelectionne);
      if (!v) return;
      updateProfile({
        ...profile,
        vehicle: v.id,
        customName: "",
        nominalVoltage: v.voltage,
        capacityAh: v.capacity,
        Idefault: v.current,
        level: niveau
      });
    }
    if (onRetour) onRetour();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-300">
        🚴 Mon profil
      </h2>

      {/* Mode débutant / expert */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-2">
        <label className="text-zinc-400 text-sm">
          🎯 Niveau d'utilisation
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setNiveau("beginner")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              niveau === "beginner"
                ? "bg-green-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🟢 Débutant (%)
          </button>
          <button
            onClick={() => setNiveau("expert")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              niveau === "expert"
                ? "bg-purple-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            🔵 Expert (V)
          </button>
        </div>
      </div>

      {/* Choix : liste ou ajout manuel */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setModeAjout(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              !modeAjout
                ? "bg-blue-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            📋 Liste
          </button>
          <button
            onClick={() => setModeAjout(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              modeAjout
                ? "bg-blue-600 text-white"
                : "bg-[#1f3460] text-zinc-400"
            }`}
          >
            ➕ Manuel
          </button>
        </div>

        {!modeAjout && (
          <>
            {/* Choix de la marque */}
            <div>
              <label className="text-zinc-400 text-sm">Marque</label>
              <select
                value={marqueSelectionnee}
                onChange={(e) => {
                  setMarqueSelectionnee(e.target.value);
                  setModeleSelectionne("");
                }}
                className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
              >
                <option value="">-- Choisir une marque --</option>
                {marques.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Choix du modèle */}
            {marqueSelectionnee && (
              <div>
                <label className="text-zinc-400 text-sm">Modèle</label>
                <select
                  value={modeleSelectionne}
                  onChange={(e) => setModeleSelectionne(e.target.value)}
                  className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">-- Choisir un modèle --</option>
                  {modeles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Aperçu */}
            {modeleSelectionne && (() => {
              const v = VEHICLE_DATABASE.find(v => v.id === modeleSelectionne);
              if (!v) return null;
              return (
                <div className="bg-[#0a1830] rounded-xl p-3 text-sm text-zinc-300 space-y-1">
                  <p>⚡ Tension : <span className="text-white font-bold">{v.voltage}V</span></p>
                  <p>🔋 Capacité : <span className="text-white font-bold">{v.capacity}Ah</span></p>
                  <p>🔌 Chargeur : <span className="text-white font-bold">{v.current}A</span></p>
                </div>
              );
            })()}
          </>
        )}

        {modeAjout && (
          <div className="space-y-3">
            <div>
              <label className="text-zinc-400 text-sm">Nom du véhicule</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Mon vélo perso"
                className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Tension (V)</label>
              <select
                value={customVoltage}
                onChange={(e) => setCustomVoltage(e.target.value)}
                className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
              >
                <option value="36">36V</option>
                <option value="48">48V</option>
                <option value="52">52V</option>
                <option value="60">60V</option>
                <option value="72">72V</option>
              </select>
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Capacité (Ah)</label>
              <input
                type="number"
                step="0.1"
                value={customCapacity}
                onChange={(e) => setCustomCapacity(e.target.value)}
                className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm">Courant chargeur (A)</label>
              <input
                type="number"
                step="0.1"
                value={customCurrent}
                onChange={(e) => setCustomCurrent(e.target.value)}
                className="w-full mt-1 bg-[#1f3460] text-white rounded-xl px-3 py-2 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bouton enregistrer */}
      <button
        onClick={enregistrer}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
      >
        💾 Enregistrer mon profil
      </button>
    </div>
  );
}

export default Profil;