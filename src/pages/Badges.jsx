import { useApp } from "../context/AppContext";
import { checkBadges } from "../services/badges";

const LISTE_BADGES = [
  { id: "first_charge",   emoji: "🔋", nom: "Première charge",     desc: "Tu as fait ta première charge !" },
  { id: "ten_charges",    emoji: "🔟", nom: "10 charges",           desc: "10 charges effectuées" },
  { id: "fifty_charges",  emoji: "🏆", nom: "50 charges",           desc: "50 charges effectuées" },
  { id: "century",        emoji: "💯", nom: "100 charges",          desc: "100 charges effectuées" },
  { id: "eco_master",     emoji: "🌱", nom: "Éco Master",           desc: "8 charges quotidiennes sur 10" },
  { id: "precision",      emoji: "🎯", nom: "Précision",            desc: "5 mesures précises" },
  { id: "rest_champion",  emoji: "🧊", nom: "Champion du repos",    desc: "5 charges avec repos" },
  { id: "long_life",      emoji: "♾️", nom: "Longue vie",           desc: "10 charges sans descendre sous 20%" },
  { id: "explorer",       emoji: "🗺️", nom: "Explorateur",         desc: "500 km parcourus" },
];

export default function Badges() {
  const { history } = useApp();
  const badges = checkBadges(history || []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-white mb-4">🏅 Mes Badges</h1>

      <div className="grid grid-cols-3 gap-3">
        {LISTE_BADGES.map((badge) => {
          const gagne = badges[badge.id];
          return (
            <div
              key={badge.id}
              className={`rounded-xl p-3 text-center ${
                gagne ? "bg-[#152642] border border-yellow-400" : "bg-[#152642] opacity-40"
              }`}
            >
              <div className="text-3xl mb-1">{badge.emoji}</div>
              <div className="text-white text-xs font-bold">{badge.nom}</div>
              <div className="text-gray-400 text-xs mt-1">{badge.desc}</div>
              {gagne && <div className="text-yellow-400 text-xs mt-1">✅ Débloqué</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}