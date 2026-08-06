import { useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb } from "../services/calculs";

const accentColors = {
  "border-blue-500":   { bg:"rgba(59,130,246,0.1)",  border:"rgba(59,130,246,0.35)",  dot:"#3b82f6", rgb:"59,130,246"  },
  "border-orange-500": { bg:"rgba(249,115,22,0.1)",  border:"rgba(249,115,22,0.35)",  dot:"#f97316", rgb:"249,115,22"  },
  "border-cyan-500":   { bg:"rgba(6,182,212,0.1)",   border:"rgba(6,182,212,0.35)",   dot:"#06b6d4", rgb:"6,182,212"   },
  "border-red-500":    { bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.35)",   dot:"#ef4444", rgb:"239,68,68"   },
  "border-yellow-500": { bg:"rgba(234,179,8,0.1)",   border:"rgba(234,179,8,0.35)",   dot:"#eab308", rgb:"234,179,8"   },
  "border-purple-500": { bg:"rgba(168,85,247,0.1)",  border:"rgba(168,85,247,0.35)",  dot:"#a855f7", rgb:"168,85,247"  },
  "border-green-500":  { bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.35)",   dot:"#22c55e", rgb:"34,197,94"   },
};

function Coach({ t, reglages }) {
  const [ouvert, setOuvert] = useState(null);
  const { profile } = useApp();
  const toggle = (i) => setOuvert(ouvert === i ? null : i);

  const tensionNominale = profile?.nominalVoltage || 48;
  const d = vdb(tensionNominale);
  const vStockage = d?.storage || (tensionNominale === 48 ? 46.8 : 35.1);

  // ✅ Utilise directement les clés t() présentes dans translations.js pour les 5 langues
  const conseils = [
    { icon: "⚡",  titre: t("regle_1_titre"), texte: t("regle_1_texte"), couleur: "border-blue-500"   },
    { icon: "🌡️", titre: t("regle_2_titre"), texte: t("regle_2_texte"), couleur: "border-orange-500" },
    { icon: "❄️", titre: t("regle_3_titre"), texte: t("regle_3_texte"), couleur: "border-cyan-500"   },
    { icon: "🔋", titre: t("regle_4_titre"), texte: t("regle_4_texte"), couleur: "border-red-500"    },
    { icon: "👁️", titre: t("regle_5_titre"), texte: t("regle_5_texte"), couleur: "border-yellow-500" },
    { icon: "🔧", titre: t("regle_6_titre"), texte: t("regle_6_texte"), couleur: "border-purple-500" },
    {
      icon: "📅",
      titre: t("regle_7_titre"),
      // ✅ Remplace {voltage} par la vraie valeur calculée
      texte: t("regle_7_texte").replace("{voltage}", vStockage),
      couleur: "border-green-500",
    },
  ];

  return (
    <div className="space-y-4 pb-28 px-1">
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        🧠 {t("coach_titre")}
      </h2>

      {/* Conseil du jour — gradient cyan→violet */}
      <div style={{
        background:"linear-gradient(135deg, rgba(56,189,248,0.12), rgba(139,92,246,0.1))",
        border:"0.5px solid rgba(56,189,248,0.3)",
        borderTop:"0.5px solid rgba(56,189,248,0.5)",
        borderRadius:"16px", padding:"16px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.8),rgba(139,92,246,0.6),transparent)" }} />
        <p className="text-sm" style={{ color:"rgba(200,235,255,0.85)" }}>
          💬 <span className="font-semibold" style={{ color:"#38bdf8" }}>{t("conseil_jour")} :</span>{" "}
          {t("conseil_jour_texte")}
        </p>
      </div>

      <h3 className="text-sm font-semibold" style={{ color:"rgba(148,197,240,0.5)", fontSize:"11px", letterSpacing:"0.1em", textTransform:"uppercase" }}>
        ✨ {t("regles_or")}
      </h3>

      {/* Règles */}
      <div className="space-y-2">
        {conseils.map((conseil, index) => {
          const accent = accentColors[conseil.couleur] || accentColors["border-blue-500"];
          const isOpen = ouvert === index;
          return (
            <div key={index} style={{
              background: isOpen ? accent.bg : "rgba(255,255,255,0.03)",
              border:`0.5px solid ${isOpen ? accent.border : "rgba(255,255,255,0.07)"}`,
              borderLeft:`3px solid ${accent.dot}`,
              borderRadius:"14px", overflow:"hidden", transition:"all 0.2s ease",
            }}>
              {/* Ligne lumineuse colorée si ouvert */}
              {isOpen && (
                <div style={{ height:"1px", background:`linear-gradient(90deg,transparent,rgba(${accent.rgb},0.6),transparent)` }} />
              )}

              <button onClick={() => toggle(index)}
                className="w-full p-4 flex items-center justify-between gap-3 text-left"
                style={{ background:"transparent" }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{conseil.icon}</span>
                  <p className="font-semibold leading-snug text-white">{conseil.titre}</p>
                </div>
                <span className="shrink-0 text-lg" style={{
                  color:isOpen ? accent.dot : "rgba(148,197,240,0.4)",
                  transform:isOpen?"rotate(180deg)":"rotate(0deg)",
                  display:"inline-block", transition:"transform 0.2s ease",
                }}>⌄</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed pl-11" style={{ color:"rgba(148,197,240,0.7)" }}>
                    {conseil.texte}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div style={{
        background:"rgba(255,255,255,0.02)", border:"0.5px solid rgba(255,255,255,0.06)",
        borderRadius:"14px", padding:"16px",
      }}>
        <p className="text-xs text-center leading-relaxed" style={{ color:"rgba(148,197,240,0.3)" }}>
          ⚠️ {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}

export default Coach;