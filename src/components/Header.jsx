import React from 'react';
import { useApp } from "../context/AppContext";

function Header({ langue, setLangue }) {
  // On récupère les données multi-batteries depuis le cerveau central
  // (Si elles ne sont pas encore définies dans ton AppContext, on met des fallbacks)
  const { batteries = [], activeBatteryId, switchBattery, profile } = useApp();

  const langues = [
    { code: "fr", flag: "🇫🇷", nom: "Français" },
    { code: "en", flag: "🇬🇧", nom: "English" },
    { code: "es", flag: "🇪🇸", nom: "Español" },
    { code: "de", flag: "🇩🇪", nom: "Deutsch" },
  ];

  // On détermine le nom à afficher par défaut si le multi-batteries n'a pas encore de données
  const nomBatterieActuelle = profile?.customName || "Ma batterie";

  const handleBatteryChange = (e) => {
    const id = Number(e.target.value);
    if (switchBattery) {
      switchBattery(id);
    }
  };

  return (
    <header className="bg-[#0a1830] border-b border-[#1a2f50] p-3 shadow-md">
      <div className="flex justify-between items-center max-w-2xl mx-auto gap-2">

        <h1 className="text-lg font-bold text-blue-400 flex items-center gap-1 min-w-0 shrink-0">
          <span>🔋</span>
          <span>BatLife</span>
        </h1>

        <div className="flex items-center gap-2 min-w-0">

          {/* SÉLECTEUR MULTI-BATTERIES DYNAMIQUE */}
          {batteries && batteries.length > 0 ? (
            <select
              value={activeBatteryId || ""}
              onChange={handleBatteryChange}
              className="bg-[#1f3460] text-zinc-300 text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[130px] truncate"
            >
              {batteries.map((b) => (
                <option key={b.id} value={b.id}>
                  🚲 {b.name || b.profile?.customName || "Sans nom"}
                </option>
              ))}
            </select>
          ) : (
            /* Petit badge de secours si aucune liste n'est configurée */
            <div className="text-xs bg-[#1f3460] px-2 py-1.5 rounded text-zinc-400 truncate max-w-[120px]">
              {nomBatterieActuelle}
            </div>
          )}

          {/* SÉLECTEUR DE LANGUE */}
          <select
            value={langue}
            onChange={(e) => setLangue(e.target.value)}
            className="bg-[#1f3460] text-white text-sm rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
          >
            {langues.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.nom}
              </option>
            ))}
          </select>

        </div>
      </div>
    </header>
  );
}

export default Header;