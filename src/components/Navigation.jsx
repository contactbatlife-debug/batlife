import React from "react";
import useTranslation from "../hooks/useTranslation";

function Navigation({ page, setPage, langue = "fr", t: tProp }) {
  const { t: hookT } = useTranslation(langue);
  const t = tProp || hookT;

  const onglets = [
    { id: "accueil", icon: "🔋", label: t("nav_accueil") },
    { id: "stats",   icon: "📊", label: t("nav_stats") },
    { id: "coach",   icon: "🧠", label: t("nav_coach") },
    { id: "outils",  icon: "🔧", label: t("nav_outils") },
    { id: "badges",  icon: "🏅", label: t("nav_badges") },
    { id: "reglages",icon: "⚙️", label: t("nav_reglages") },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 w-full h-16 flex z-50"
      style={{
        background: "rgba(8,16,32,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {onglets.map((onglet) => {
        const actif = page === onglet.id;

        return (
          <button
            key={onglet.id}
            onClick={() => setPage(onglet.id)}
            className="flex-1 flex flex-col items-center justify-center transition-all relative"
            style={{ color: actif ? "#38bdf8" : "rgba(148,197,240,0.4)" }}
          >
            {/* Indicateur actif : trait top avec halo */}
            {actif && (
              <span
                className="absolute top-0 w-8 rounded-b-full"
                style={{
                  height: "2px",
                  background: "#38bdf8",
                  boxShadow: "0 0 10px rgba(56,189,248,0.7), 0 0 20px rgba(56,189,248,0.3)",
                }}
              />
            )}

            {/* Fond actif subtil */}
            {actif && (
              <span
                className="absolute inset-1 rounded-xl"
                style={{ background: "rgba(56,189,248,0.06)" }}
              />
            )}

            <span
              className="relative transition-transform"
              style={{
                fontSize: "1.2rem",
                transform: actif ? "scale(1.15)" : "scale(1)",
              }}
            >
              {onglet.icon}
            </span>

            <span
              className="relative text-[10px] mt-1 font-medium leading-none"
              style={{ color: actif ? "#38bdf8" : "rgba(148,197,240,0.4)" }}
            >
              {onglet.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default Navigation;