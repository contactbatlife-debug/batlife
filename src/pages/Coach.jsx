import { useState } from "react";
import { useApp } from "../context/AppContext"; // On récupère le profil de la batterie
import { vdb } from "../services/calculs";   // On récupère le fichier de calculs

function Coach({ t, reglages }) {
  const [ouvert, setOuvert] = useState(null);
  const { profile } = useApp(); // Accès aux données de la batterie active
  
  const langue = reglages?.langue || "fr";

  const toggle = (index) => {
    setOuvert(ouvert === index ? null : index);
  };

  // --- CALCULS DYNAMIQUES POUR L'HIVERNAGE ---
  const tensionNominale = profile?.nominalVoltage || 48;
  const d = vdb(tensionNominale);
  // On récupère la tension idéale (ex: 46.8V) ou une valeur par défaut
  const vStockage = d?.storage || (tensionNominale === 48 ? 46.8 : 35.1);

  const reglesParLangue = {
    fr: [
      { icon: "⚡", titre: "Évitez la charge complète", texte: "Ne chargez pas à 100% tous les jours. Préférez 80% pour prolonger la durée de vie.", couleur: "border-blue-500" },
      { icon: "🌡️", titre: "Évitez la chaleur", texte: "Ne laissez pas votre batterie au soleil ou dans une voiture chaude.", couleur: "border-orange-500" },
      { icon: "❄️", titre: "Attention au froid", texte: "En hiver, gardez la batterie au chaud avant de l'utiliser.", couleur: "border-cyan-500" },
      { icon: "🔋", titre: "Ne videz pas complètement", texte: "Évitez de descendre sous 20%. Rechargez avant d'atteindre 0%.", couleur: "border-red-500" },
      { icon: "👁️", titre: "Surveillez la charge", texte: "Ne laissez pas la batterie branchée toute la nuit sans surveillance.", couleur: "border-yellow-500" },
      { icon: "🔧", titre: "Respectez le fabricant", texte: "Utilisez uniquement le chargeur d'origine recommandé.", couleur: "border-purple-500" },
      { icon: "📅", titre: "Stockage longue durée (Hivernage)", texte: `Pour un stockage de plusieurs semaines, ne la laissez pas pleine ni vide. Stabilisez votre batterie à environ 45% soit une tension idéale de ${vStockage} V. Entreposez-la dans un endroit sec entre 10°C et 20°C.`, couleur: "border-green-500" },
    ],
    en: [
      { icon: "⚡", titre: "Avoid full charge", texte: "Do not charge to 100% every day. Prefer 80% to extend battery life.", couleur: "border-blue-500" },
      { icon: "🌡️", titre: "Avoid heat", texte: "Do not leave your battery in the sun or in a hot car.", couleur: "border-orange-500" },
      { icon: "❄️", titre: "Beware of cold", texte: "In winter, keep the battery warm before using it.", couleur: "border-cyan-500" },
      { icon: "🔋", titre: "Do not fully discharge", texte: "Avoid going below 20%. Recharge before reaching 0%.", couleur: "border-red-500" },
      { icon: "👁️", titre: "Monitor charging", texte: "Do not leave the battery plugged in all night without supervision.", couleur: "border-yellow-500" },
      { icon: "🔧", titre: "Follow manufacturer advice", texte: "Use only the original recommended charger.", couleur: "border-purple-500" },
      { icon: "📅", titre: "Long-term storage", texte: `For storage of several weeks, do not leave it full or empty. Stabilize your battery at around 45%, i.e., an ideal voltage of ${vStockage} V. Store it in a dry place between 10°C and 20°C.`, couleur: "border-green-500" },
    ],
    es: [
      { icon: "⚡", titre: "Evita la carga completa", texte: "No cargues al 100% todos los días. Prefiere 80% para prolongar la vida útil.", couleur: "border-blue-500" },
      { icon: "🌡️", titre: "Evita el calor", texte: "No dejes la batería al sol ni dentro de un coche caliente.", couleur: "border-orange-500" },
      { icon: "❄️", cultura: "Cuidado con el frío", texte: "En invierno, mantén la batería caliente antes de usarla.", couleur: "border-cyan-500" },
      { icon: "🔋", titre: "No descargues completamente", texte: "Evita bajar del 20%. Recarga antes de llegar a 0%.", couleur: "border-red-500" },
      { icon: "👁️", titre: "Vigila la carga", texte: "No dejes la batería enchufada toda la noche sin supervisión.", couleur: "border-yellow-500" },
      { icon: "🔧", titre: "Respeta al fabricante", texte: "Utiliza solo el cargador original recomendado.", couleur: "border-purple-500" },
      { icon: "📅", titre: "Almacenamiento prolongado", texte: `Para un almacenamiento de varias semanas, no la dejes ni llena ni vacía. Estabiliza tu batería en torno al 45%, es decir, una tensión ideal de ${vStockage} V. Guárdala en un lugar seco entre 10°C y 20°C.`, couleur: "border-green-500" },
    ],
    de: [
      { icon: "⚡", titre: "Vollladung vermeiden", texte: "Laden Sie nicht jeden Tag auf 100%. 80% verlängern die Lebensdauer.", couleur: "border-blue-500" },
      { icon: "🌡️", titre: "Hitze vermeiden", texte: "Lassen Sie die Batterie nicht in der Sonne oder in einem heißen Auto.", couleur: "border-orange-500" },
      { icon: "❄️", titre: "Vorsicht bei Kälte", texte: "Halten Sie die Batterie im Winter vor der Nutzung warm.", couleur: "border-cyan-500" },
      { icon: "🔋", titre: "Nicht vollständig entladen", texte: "Vermeiden Sie es, unter 20% zu fallen. Laden Sie vor 0% wieder auf.", couleur: "border-red-500" },
      { icon: "👁️", titre: "Ladevorgang überwachen", texte: "Lassen Sie die Batterie nicht unbeaufsichtigt die ganze Nacht angeschlossen.", couleur: "border-yellow-500" },
      { icon: "🔧", titre: "Herstellerhinweise beachten", texte: "Verwenden Sie nur das empfohlene Original-Ladegerät.", couleur: "border-purple-500" },
      { icon: "📅", titre: "Langzeitlagerung", texte: `Bei einer Lagerung von mehreren Wochen nicht voll oder leer lassen. Stabilisieren Sie Ihre Batterie bei ca. 45%, d.h. einer idealen Spannung von ${vStockage} V. Lagern Sie sie an einem trockenen Ort zwischen 10°C und 20°C.`, couleur: "border-green-500" },
    ],
  };

  const conseils = reglesParLangue[langue] || reglesParLangue.fr;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-300">
        {t("coach_titre")}
      </h2>

      <div className="bg-blue-900 border border-blue-700 rounded-2xl p-4">
        <p className="text-blue-200 text-sm">
          💬 <span className="font-semibold">{t("conseil_jour")} :</span>{" "}
          {t("conseil_jour_texte")}
        </p>
      </div>

      <h3 className="text-md font-semibold text-zinc-400">
        {t("regles_or")}
      </h3>

      <div className="space-y-2">
        {conseils.map((conseil, index) => (
          <div
            key={index}
            className={`bg-[#152642] rounded-2xl border-l-4 ${conseil.couleur} border border-[#1f3460] overflow-hidden transition-all`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#1f3460]/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl shrink-0">{conseil.icon}</span>
                <p className="text-white font-semibold leading-snug">
                  {conseil.titre}
                </p>
              </div>
              <span className={`text-zinc-400 text-xl shrink-0 transition-transform ${ouvert === index ? "rotate-180" : ""}`}>
                ⌄
              </span>
            </button>

            {ouvert === index && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-zinc-400 text-sm leading-relaxed pl-11">
                  {conseil.texte}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#152642] border border-zinc-600 rounded-2xl p-4">
        <p className="text-zinc-500 text-xs text-center">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}

export default Coach;