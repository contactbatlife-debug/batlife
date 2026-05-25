import { checkBadges } from "../services/badges";
import { useApp } from "../context/AppContext";
import ChargeStarter from "../components/ChargeStarter";
import ChargeActive from "../components/ChargeActive";

function Dashboard({ reglages, t }) {
  // On récupère activeCharge, le profil, l'historique et la TEMPÉRATURE globale
  const { activeCharge, profile, history, temperature, setTemperature } = useApp();

  // --- 📐 LOGIQUE DE CALCUL DE L'AUTONOMIE EN KM (Étape D) ---
  const tension = profile?.nominalVoltage || 48;
  const capaciteAh = profile?.capacityAh || 15;
  const nomBatterie = profile?.customName || "Batterie";

  const niveauActuel = history.length > 0 ? (history[0].niveauFin || history[0].niveau || 100) : 100;
  const dernierTrajetAvecKm = history.find(entree => entree.kilometres && entree.kilometres > 0);
  
  // Autonomie de base à 20°C
  let autonomieMaxReference = dernierTrajetAvecKm ? Number(dernierTrajetAvecKm.kilometres) : 50;

  // --- 🌡️ CORRECTION DE L'AUTONOMIE SELON LA TEMPÉRATURE ---
  // Les batteries lithium perdent de la capacité quand il fait froid !
  let coefficientTemperature = 1;
  if (temperature < 20) {
    // On perd environ 0.5% d'autonomie par degré en dessous de 20°C
    coefficientTemperature = 1 - (20 - temperature) * 0.005;
  } else if (temperature > 30) {
    // Une légère baisse d'efficacité s'il fait extrêmement chaud
    coefficientTemperature = 0.95;
  }

  // Application du coefficient météo sur les kilomètres estimés
  const kmEstimes = Math.round(((autonomieMaxReference * niveauActuel) / 100) * coefficientTemperature);

  return (
    <div className="space-y-4">

      {/* Message de bienvenue */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460]">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👋</span>
          <div>
            <p className="text-white font-semibold">{t("bonjour")}</p>
            <p className="text-zinc-400 text-sm">
              {reglages.vehicule === "vae"
                ? t("vae_surveille")
                : t("tae_surveille")}
            </p>
          </div>
        </div>
      </div>

      {/* CARTE AUTONOMIE ESTIMÉE DYNAMIQUE */}
      <div className="bg-[#152642] rounded-2xl p-5 border border-[#1f3460] shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              {t("autonomie_estimee") || "Autonomie estimée"}
            </p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mt-1">
              {kmEstimes} <span className="text-xl text-zinc-300 font-bold">km</span>
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-bold">
              {nomBatterie} ({tension}V)
            </span>
            <p className="text-zinc-400 text-xs mt-2">
              Niveau : <span className="text-white font-bold">{niveauActuel}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* 🌡️ NOUVEAU BLOCK : CURSEUR DE TEMPÉRATURE AMBIANTE */}
      <div className="bg-[#152642] rounded-2xl p-4 border border-[#1f3460] space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {temperature <= 0 ? "❄️" : temperature >= 30 ? "🥵" : "🌡️"}
            </span>
            <span className="text-sm font-semibold text-zinc-300">Température ambiante</span>
          </div>
          <span className="text-lg font-black text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-lg border border-emerald-500/20">
            {temperature}°C
          </span>
        </div>

        <input
          type="range"
          min="-20"
          max="45"
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full h-2 bg-[#1f3460] rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
        
        <div className="flex justify-between text-[10px] text-zinc-500 font-medium px-1">
          <span>-20°C (Grand Froid)</span>
          <span>20°C (Idéal)</span>
          <span>45°C (Canicule)</span>
        </div>
      </div>

      {/* Affiche soit la charge Active, soit le démarrage */}
      {activeCharge ? (
        <ChargeActive t={t} />
      ) : (
        <ChargeStarter t={t} />
      )}

    </div>
  );
}

export default Dashboard;