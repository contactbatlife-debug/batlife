import React from "react";

function Navigation({ page, setPage, langue }) {
  const textes = {
    fr: {
      accueil: "Acc.",
      stats: "Stats",
      coach: "Coach",
      entretien: "Maint.",
      outils: "Outils",
      badges: "Badges",
      reglages: "Régl.",
    },
    en: {
      accueil: "Home",
      stats: "Stats",
      coach: "Coach",
      entretien: "Maint.",
      outils: "Tools",
      badges: "Badges",
      reglages: "Sets",
    },
    es: {
      accueil: "Ini.",
      stats: "Stats",
      coach: "Coach",
      entretien: "Maint.",
      outils: "Tools",
      badges: "Badges",
      reglages: "Ajus.",
    },
    de: {
      accueil: "Start",
      stats: "Stats",
      coach: "Coach",
      entretien: "Maint.",
      outils: "Tools",
      badges: "Badges",
      reglages: "Einst.",
    },
  };

  const t = textes[langue] || textes.fr;

  const onglets = [
    { id: "accueil",   icon: "🔋", label: t.accueil },
    { id: "stats",     icon: "📊", label: t.stats },
    { id: "coach",     icon: "🧠", label: t.coach },
    { id: "entretien", icon: "📋", label: t.entretien }, // <-- Nouvel onglet Entretien
    { id: "outils",    icon: "🔧", label: t.outils },
    { id: "badges",    icon: "🏅", label: t.badges },
    { id: "reglages",  icon: "⚙️", label: t.reglages },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a1830] border-t border-[#1a2f50] z-50">
      {/* Modification ici : grid-cols-7 pour accueillir le 7ème bouton sans écraser le reste */}
      <div className="grid grid-cols-7 max-w-2xl mx-auto py-1">
        {onglets.map((onglet) => (
          <button
            key={onglet.id}
            onClick={() => setPage(onglet.id)}
            className={`flex flex-col items-center justify-center py-2 min-w-0 transition-all ${
              page === onglet.id
                ? "text-blue-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="text-lg leading-none">{onglet.icon}</span>
            <span className="text-[9px] leading-tight mt-1 text-center truncate max-w-full px-0.5">
              {onglet.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navigation;