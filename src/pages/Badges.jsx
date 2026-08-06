import { useApp } from "../context/AppContext";
import { checkBadges } from "../services/badges";
import useTranslation from "../hooks/useTranslation";

const LISTE_BADGES = [
  { id:"first_charge",  emoji:"🔋", nomKey:"badge_first_charge_nom",  descKey:"badge_first_charge_desc",  rgb:"56,189,248"  },
  { id:"ten_charges",   emoji:"🔟", nomKey:"badge_ten_charges_nom",   descKey:"badge_ten_charges_desc",   rgb:"99,102,241"  },
  { id:"fifty_charges", emoji:"🏆", nomKey:"badge_fifty_charges_nom", descKey:"badge_fifty_charges_desc", rgb:"250,204,21"  },
  { id:"century",       emoji:"💯", nomKey:"badge_century_nom",       descKey:"badge_century_desc",       rgb:"251,146,60"  },
  { id:"eco_master",    emoji:"🌱", nomKey:"badge_eco_master_nom",    descKey:"badge_eco_master_desc",    rgb:"34,197,94"   },
  { id:"precision",     emoji:"🎯", nomKey:"badge_precision_nom",     descKey:"badge_precision_desc",     rgb:"56,189,248"  },
  { id:"rest_champion", emoji:"🧊", nomKey:"badge_rest_champion_nom", descKey:"badge_rest_champion_desc", rgb:"6,182,212"   },
  { id:"long_life",     emoji:"♾️",  nomKey:"badge_long_life_nom",     descKey:"badge_long_life_desc",     rgb:"168,85,247"  },
  { id:"explorer",      emoji:"🗺️", nomKey:"badge_explorer_nom",      descKey:"badge_explorer_desc",      rgb:"239,68,68"   },
];

export default function Badges({ langue }) {
  const { history } = useApp();
  const { t } = useTranslation(langue);
  const badges = checkBadges(history || []);

  const total = LISTE_BADGES.length;
  const gagnes = LISTE_BADGES.filter(b => badges[b.id]).length;
  const pct = Math.round((gagnes / total) * 100);

  return (
    <div className="pb-28 px-1 space-y-4">

      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        🏅 {t("mes_badges")}
      </h1>

      {/* Barre de progression — gradient coloré */}
      <div style={{
        background:"rgba(255,255,255,0.04)",
        border:"0.5px solid rgba(255,255,255,0.1)",
        borderTop:"0.5px solid rgba(255,255,255,0.18)",
        borderRadius:"16px", padding:"16px",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(250,204,21,0.6),rgba(251,146,60,0.4),transparent)" }} />
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold" style={{ color:"rgba(148,197,240,0.6)" }}>Progression</span>
          <span className="text-sm font-black" style={{
            background:"linear-gradient(135deg,#facc15,#fb923c)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{gagnes} / {total}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.07)" }}>
          <div className="h-full rounded-full transition-all" style={{
            width:`${pct}%`,
            background:"linear-gradient(90deg,#facc15,#fb923c)",
            boxShadow:"0 0 10px rgba(250,204,21,0.4)",
          }} />
        </div>
        <p className="text-xs mt-2 text-center" style={{ color:"rgba(148,197,240,0.35)" }}>
          {pct}% des badges débloqués
        </p>
      </div>

      {/* Grille des badges */}
      <div className="grid grid-cols-3 gap-3">
        {LISTE_BADGES.map((badge) => {
          const gagne = badges[badge.id];
          return (
            <div key={badge.id} style={{
              background: gagne ? `rgba(${badge.rgb},0.1)` : "rgba(255,255,255,0.02)",
              border: gagne ? `0.5px solid rgba(${badge.rgb},0.35)` : "0.5px solid rgba(255,255,255,0.06)",
              borderTop: gagne ? `0.5px solid rgba(${badge.rgb},0.55)` : "0.5px solid rgba(255,255,255,0.08)",
              borderRadius:"14px", padding:"12px 8px", textAlign:"center",
              opacity: gagne ? 1 : 0.35,
              transition:"all 0.2s ease",
              position:"relative", overflow:"hidden",
            }}>
              {/* Ligne lumineuse colorée si gagné */}
              {gagne && (
                <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${badge.rgb},0.8),transparent)` }} />
              )}
              {/* Halo si gagné */}
              {gagne && (
                <div style={{
                  position:"absolute", top:"-30px", left:"50%", transform:"translateX(-50%)",
                  width:"70px", height:"70px", borderRadius:"50%",
                  background:`radial-gradient(circle, rgba(${badge.rgb},0.2) 0%, transparent 70%)`,
                  pointerEvents:"none",
                }} />
              )}

              <div className="text-3xl mb-1.5 relative">{badge.emoji}</div>
              <div className="text-xs font-bold leading-tight text-white mb-1">{t(badge.nomKey)}</div>
              <div className="text-xs leading-tight" style={{ color:"rgba(148,197,240,0.4)" }}>{t(badge.descKey)}</div>
              {gagne && (
                <div className="text-xs mt-2 font-bold" style={{
                  background:`linear-gradient(135deg,rgba(${badge.rgb},1),rgba(${badge.rgb},0.7))`,
                  WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                }}>
                  ✅ {t("debloque")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}