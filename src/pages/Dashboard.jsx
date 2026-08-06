import { useEffect, useState, useCallback } from "react";
import { useApp } from "../context/AppContext";
import ChargeStarter from "../components/ChargeStarter";
import ChargeActive from "../components/ChargeActive";
import Tooltip from "../components/Tooltip";
import { calculerAutonomieReelle } from "../services/autonomie";
import { energyStats } from "../services/energyService";
import { calculerRappels, planifierNotificationsRappel } from "../services/reminderService";

// ============================================================
// LOGIQUE TEMPÉRATURE — conseils dynamiques
// ============================================================
function getTempConfig(temp, t) {
  if (temp < 0) return {
    emoji: "🥶",
    label: t("temp.label.gel"),
    rgb: "56,189,248", accent: "#38bdf8", niveau: 1,
    conseil: t("temp.conseil.gel"),
    impact: t("temp.impact.gel"),
    couleurImpact: "#f87171",
  };
  if (temp < 5) return {
    emoji: "❄️",
    label: t("temp.label.tres_froid"),
    rgb: "96,165,250", accent: "#60a5fa", niveau: 2,
    conseil: t("temp.conseil.tres_froid"),
    impact: t("temp.impact.tres_froid"),
    couleurImpact: "#fb923c",
  };
  if (temp < 10) return {
    emoji: "🌨️",
    label: t("temp.label.froid"),
    rgb: "129,140,248", accent: "#818cf8", niveau: 2,
    conseil: t("temp.conseil.froid"),
    impact: t("temp.impact.froid"),
    couleurImpact: "#fbbf24",
  };
  if (temp <= 25) return {
    emoji: "✅",
    label: t("temp.label.ideal"),
    rgb: "74,222,128", accent: "#4ade80", niveau: 3,
    conseil: t("temp.conseil.ideal"),
    impact: t("temp.impact.ideal"),
    couleurImpact: "#4ade80",
  };
  if (temp <= 30) return {
    emoji: "🌡️",
    label: t("temp.label.chaud"),
    rgb: "250,204,21", accent: "#facc15", niveau: 4,
    conseil: t("temp.conseil.chaud"),
    impact: t("temp.impact.chaud"),
    couleurImpact: "#fbbf24",
  };
  if (temp <= 35) return {
    emoji: "🌶️",
    label: t("temp.label.tres_chaud"),
    rgb: "251,146,60", accent: "#fb923c", niveau: 4,
    conseil: t("temp.conseil.tres_chaud"),
    impact: t("temp.impact.tres_chaud"),
    couleurImpact: "#fb923c",
  };
  return {
    emoji: "🥵",
    label: t("temp.label.danger"),
    rgb: "248,113,113", accent: "#f87171", niveau: 5,
    conseil: t("temp.conseil.danger"),
    impact: t("temp.impact.danger"),
    couleurImpact: "#f87171",
  };
}

function getTempPosition(temp) {
  const min = -20, max = 45;
  return Math.max(0, Math.min(100, ((temp - min) / (max - min)) * 100));
}

// ============================================================
// COMPOSANT WIDGET TEMPÉRATURE — avec debounce intégré
// ============================================================
function TemperatureWidget({ temperature, setTemperature, t }) {
  // ✅ État local pour la réactivité visuelle immédiate
  const [localTemp, setLocalTemp] = useState(temperature);

  // ✅ Sync si temperature change de l'extérieur
  useEffect(() => { setLocalTemp(temperature); }, [temperature]);

  // ✅ Debounce : on ne propage vers le contexte qu'après 150ms de pause
  useEffect(() => {
    const timer = setTimeout(() => {
      setTemperature(localTemp);
    }, 150);
    return () => clearTimeout(timer);
  }, [localTemp, setTemperature]);

  const cfg = getTempConfig(localTemp, t);
  const pos = getTempPosition(localTemp);
  const isDanger  = cfg.niveau === 1 || cfg.niveau === 5;
  const isWarning = cfg.niveau === 2 || cfg.niveau === 4;

  // ✅ Handler optimisé avec useCallback
  const handleChange = useCallback((e) => {
    setLocalTemp(Number(e.target.value));
  }, []);

  return (
    <div className="p-4 space-y-3" style={{
      background: isDanger
        ? `linear-gradient(135deg, rgba(${cfg.rgb},0.1), rgba(0,0,0,0.2))`
        : "rgba(255,255,255,0.04)",
      border: `0.5px solid rgba(${cfg.rgb},${isDanger ? "0.4" : "0.15"})`,
      borderTop: `0.5px solid rgba(${cfg.rgb},${isDanger ? "0.6" : "0.25"})`,
      borderRadius: "16px",
      position: "relative", overflow: "hidden",
      transition: "all 0.4s ease",
    }}>
      {/* Ligne lumineuse */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, rgba(${cfg.rgb},0.7), transparent)`,
        transition: "background 0.4s ease",
      }} />

      {/* Titre + valeur */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.emoji}</span>
          <div>
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              {t("temperature")}
            </span>
            <span className="text-xs ml-2 font-medium" style={{ color: `rgba(${cfg.rgb},0.8)` }}>
              {cfg.label}
            </span>
          </div>
          <Tooltip text={t("temp.tooltip")} />
        </div>
        <span className="text-lg font-black px-3 py-0.5 rounded-lg" style={{
          color: cfg.accent,
          background: `rgba(${cfg.rgb},0.12)`,
          border: `0.5px solid rgba(${cfg.rgb},0.3)`,
          transition: "all 0.3s ease",
        }}>
          {localTemp}°C
        </span>
      </div>

      {/* Jauge + slider superposés */}
      <div style={{ position: "relative" }}>
        <div style={{
          height: "10px", borderRadius: "5px",
          background: "linear-gradient(90deg, #38bdf8 0%, #60a5fa 15%, #4ade80 35%, #4ade80 55%, #facc15 70%, #fb923c 85%, #f87171 100%)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            left: "35%", width: "20%", top: 0, bottom: 0,
            background: "rgba(255,255,255,0.15)",
            borderLeft: "1px dashed rgba(255,255,255,0.5)",
            borderRight: "1px dashed rgba(255,255,255,0.5)",
          }} />
        </div>

        {/* ✅ Slider utilise localTemp + handleChange optimisé */}
        <input
          type="range" min="-20" max="45" value={localTemp}
          onChange={handleChange}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            width: "100%", height: "10px",
            opacity: 0, cursor: "pointer", margin: 0,
            WebkitAppearance: "none",
          }}
        />

        {/* Curseur visuel */}
        <div style={{
          position: "absolute",
          left: `${pos}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "20px", height: "20px",
          borderRadius: "50%",
          background: cfg.accent,
          border: "2.5px solid rgba(255,255,255,0.95)",
          boxShadow: `0 0 10px rgba(${cfg.rgb},0.8), 0 2px 4px rgba(0,0,0,0.4)`,
          transition: "left 0.1s ease, background 0.3s ease, box-shadow 0.3s ease",
          pointerEvents: "none",
          zIndex: 2,
        }} />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs" style={{ color: "rgba(148,197,240,0.35)", marginTop: "2px" }}>
        <span>-20°C</span>
        <span style={{ color: "rgba(74,222,128,0.5)" }}>✓ 10–25°C</span>
        <span>45°C</span>
      </div>

      {/* Conseil dynamique */}
      <div style={{
        background: `rgba(${cfg.rgb},${isDanger ? "0.12" : "0.07"})`,
        border: `0.5px solid rgba(${cfg.rgb},${isDanger ? "0.4" : "0.2"})`,
        borderLeft: `3px solid rgba(${cfg.rgb},0.7)`,
        borderRadius: "10px", padding: "10px 12px",
        transition: "all 0.3s ease",
      }}>
        <p className="text-xs font-semibold" style={{ color: cfg.accent, marginBottom: "3px" }}>
          {isDanger ? "⚠️ " : isWarning ? "💡 " : "✅ "}{cfg.conseil}
        </p>
        <p className="text-xs" style={{ color: cfg.couleurImpact, opacity: 0.8 }}>
          📊 {cfg.impact}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
export default function Dashboard({ reglages, t }) {
  const { activeCharge, history, temperature, setTemperature, profile } = useApp();

  const niveauActuel =
    history.length > 0
      ? history[0].targetPct ?? history[0].finalPct ?? history[0].charge ?? 100
      : 100;

  // ✅ autonomie utilise temperature (propagé après debounce)
  const autonomie = calculerAutonomieReelle(history, niveauActuel, temperature);
  const rappels   = calculerRappels(history);
  const energy    = energyStats(history, profile);

  useEffect(() => {
    planifierNotificationsRappel(history);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 pb-28 px-1" style={{ position: "relative" }}>

      {/* Orbes de fond */}
      {[
        { w:280, h:280, top:"-80px",  right:"-80px", color:"rgba(56,189,248,0.18)" },
        { w:220, h:220, bottom:"80px", left:"-60px",  color:"rgba(139,92,246,0.16)" },
        { w:160, h:160, top:"320px",  right:"-40px",  color:"rgba(34,197,94,0.1)"  },
      ].map((o, i) => (
        <div key={i} style={{
          position:"fixed", width:o.w, height:o.h, borderRadius:"50%",
          background:`radial-gradient(circle, ${o.color} 0%, transparent 65%)`,
          top:o.top, bottom:o.bottom, left:o.left, right:o.right,
          pointerEvents:"none", zIndex:0,
        }} />
      ))}

      {/* Bannière — pas de charge depuis +5 jours */}
      {rappels.noCharge.active && (
        <div style={{
          background:"linear-gradient(135deg, rgba(251,146,60,0.15), rgba(251,146,60,0.08))",
          border:"0.5px solid rgba(251,146,60,0.4)",
          borderTop:"0.5px solid rgba(251,146,60,0.6)",
          borderLeft:"3px solid rgba(251,146,60,0.7)",
          borderRadius:"14px", padding:"14px 16px",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
            background:"linear-gradient(90deg, transparent, rgba(251,146,60,0.7), transparent)" }} />
          <div className="flex items-start gap-3">
            <span style={{ fontSize:"24px", flexShrink:0 }}>🔋</span>
            <div>
              <p className="font-semibold text-sm" style={{ color:"#fb923c" }}>
                {rappels.noCharge.daysSince === 5
                  ? t("rappel_5_jours_titre") || "Pensez à recharger !"
                  : (t("rappel_n_jours_titre") || `${rappels.noCharge.daysSince} jours sans recharge`).replace("{n}", rappels.noCharge.daysSince)}
              </p>
              <p className="text-xs mt-0.5" style={{ color:"rgba(251,146,60,0.75)" }}>
                {t("rappel_5_jours_texte") || "Une batterie Li-ion se décharge même à l'arrêt."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bannière — charge d'équilibrage mensuelle */}
      {rappels.fullCharge.active && (
        <div style={{
          background:"linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.08))",
          border:"0.5px solid rgba(139,92,246,0.4)",
          borderTop:"0.5px solid rgba(139,92,246,0.6)",
          borderLeft:"3px solid rgba(139,92,246,0.7)",
          borderRadius:"14px", padding:"14px 16px",
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
            background:"linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)" }} />
          <div className="flex items-start gap-3">
            <span style={{ fontSize:"24px", flexShrink:0 }}>⚖️</span>
            <div>
              <p className="font-semibold text-sm" style={{ color:"#a78bfa" }}>
                {t("rappel_equilibrage_titre") || "Charge d'équilibrage recommandée"}
              </p>
              <p className="text-xs mt-0.5" style={{ color:"rgba(167,139,250,0.75)" }}>
                {(t("rappel_equilibrage_texte") || "Cela fait {n} jours sans charge complète.")
                  .replace("{n}", rappels.fullCharge.daysSince)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bienvenue */}
      <div className="relative" style={{
        background:"rgba(255,255,255,0.04)",
        border:"0.5px solid rgba(255,255,255,0.1)",
        borderTop:"0.5px solid rgba(255,255,255,0.18)",
        borderRadius:"16px", padding:"16px",
      }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">👋</span>
          <div>
            <p className="text-white font-semibold">{t("bonjour")}</p>
            <p className="text-sm mt-0.5" style={{ color:"rgba(148,197,240,0.55)" }}>
              {reglages.vehicule === "vae" ? `🚴 ${t("vae_surveille")}` : `🛴 ${t("tae_surveille")}`}
            </p>
          </div>
        </div>
      </div>

      {/* Autonomie */}
      {autonomie.hasData ? (
        <>
          <div className="relative p-5" style={{
            background:"linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(99,102,241,0.12) 50%, rgba(56,189,248,0.08) 100%)",
            border:"0.5px solid rgba(56,189,248,0.3)",
            borderTop:"0.5px solid rgba(56,189,248,0.5)",
            borderRadius:"18px", overflow:"hidden",
          }}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
              background:"linear-gradient(90deg, transparent, rgba(56,189,248,0.8), rgba(139,92,246,0.6), transparent)" }} />
            <div className="flex items-center gap-1.5">
              <p style={{ fontSize:"11px", letterSpacing:"0.08em", color:"rgba(148,197,240,0.55)", textTransform:"uppercase" }}>
                {t("autonomie_restante")}
              </p>

              {/* ✅ CORRIGÉ — tooltip autonomie traduit */}
              <Tooltip position="bottom" text={t("autonomie.tooltip")} />
            </div>
            <div className="flex items-end gap-2 mt-1">
              <p className="font-black" style={{
                fontSize:"44px", lineHeight:1.1,
                background:"linear-gradient(135deg, #fff 0%, #38bdf8 60%, #818cf8 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
              }}>
                {autonomie.autonomieRestante}{" "}
                <span style={{ fontSize:"18px", fontWeight:400 }}>km</span>
              </p>
              <p className="mb-1 ml-auto text-sm" style={{ color:"rgba(148,197,240,0.6)" }}>
                {t("niveau")} : <span style={{ color:"#38bdf8", fontWeight:700 }}>{niveauActuel}%</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { val:`${autonomie.consommationParKm}%`, label:`📊 ${t("consommation_moyenne")}`, color:"#fb923c", rgb:"251,146,60", tip: t("autonomie.tip.consommation") },
              { val:`${autonomie.autonomieTotale} km`, label:`🔋 ${t("autonomie_totale_estimee")}`, color:"#a78bfa", rgb:"167,139,250", tip: t("autonomie.tip.totale") },
              { val:`${autonomie.kmRestantsA80} km`, label:`🎯 ${t("km_restants_80")}`, color:"#60a5fa", rgb:"96,165,250", tip: t("autonomie.tip.km80") },
            ].map((item, i) => (
              <div key={i} className="p-3 text-center" style={{
                background:`rgba(${item.rgb},0.1)`,
                border:`0.5px solid rgba(${item.rgb},0.3)`,
                borderRadius:"14px", position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
                  background:`linear-gradient(90deg, transparent, rgba(${item.rgb},0.6), transparent)` }} />
                <p className="font-bold text-lg" style={{ color:item.color }}>{item.val}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <p className="text-[10px] leading-tight" style={{ color:"rgba(148,197,240,0.45)" }}>{item.label}</p>
                  <Tooltip text={item.tip} position="top" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="p-5" style={{
          background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.1)", borderRadius:"16px",
        }}>
          <p style={{ fontSize:"11px", letterSpacing:"0.08em", color:"rgba(148,197,240,0.5)", textTransform:"uppercase" }}>
            {t("autonomie_estimee")}
          </p>
          <p className="font-black mt-1" style={{ fontSize:"42px", color:"rgba(148,197,240,0.3)" }}>
            -- <span style={{ fontSize:"18px", fontWeight:400 }}>km</span>
          </p>
          <p className="text-xs mt-2 text-center" style={{ color:"rgba(148,197,240,0.4)" }}>
            {t("pas_assez_historique")}
          </p>
        </div>
      )}

      {/* Carte Wh/km */}
      {energy.disponible && (
        <div className="p-4" style={{
          background:"rgba(255,255,255,0.04)",
          border:"0.5px solid rgba(255,255,255,0.1)",
          borderTop:"0.5px solid rgba(255,255,255,0.18)",
          borderRadius:"16px", position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",
            background:"linear-gradient(90deg, transparent, rgba(251,146,60,0.6), rgba(129,140,248,0.5), transparent)" }} />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>

              {/* ✅ CORRIGÉ */}
              <p className="text-sm font-semibold" style={{ color:"rgba(255,255,255,0.85)" }}>
                {t("energy.titre")}
              </p>

              {/* ✅ CORRIGÉ */}
              <Tooltip text={t("energy.tooltip")} />
            </div>

            {/* ✅ CORRIGÉ */}
            <span className="text-xs" style={{ color:"rgba(148,197,240,0.4)" }}>
              {energy.nbSessions} {energy.nbSessions > 1 ? t("energy.trajets") : t("energy.trajet")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 text-center rounded-xl" style={{
              background:"rgba(251,146,60,0.08)",
              border:"0.5px solid rgba(251,146,60,0.25)",
            }}>
              <p className="font-black text-xl" style={{ color:"#fb923c" }}>
                {energy.whPerKm}
              </p>
              {/* ✅ CORRIGÉ */}
              <p className="text-[10px] mt-1" style={{ color:"rgba(148,197,240,0.45)" }}>
                {t("energy.wh_km")}
              </p>
            </div>

            <div className="p-3 text-center rounded-xl" style={{
              background:"rgba(74,222,128,0.08)",
              border:"0.5px solid rgba(74,222,128,0.25)",
            }}>
              <p className="font-black text-xl" style={{ color:"#4ade80" }}>
                {energy.autonomieWh}
              </p>
              {/* ✅ CORRIGÉ */}
              <p className="text-[10px] mt-1" style={{ color:"rgba(148,197,240,0.45)" }}>
                {t("energy.km_autonomie")}
              </p>
            </div>

            <div className="p-3 text-center rounded-xl" style={{
              background:"rgba(129,140,248,0.08)",
              border:"0.5px solid rgba(129,140,248,0.25)",
            }}>
              <p className="font-black text-xl" style={{ color:"#818cf8" }}>
                {energy.coutPour100km}€
              </p>
              {/* ✅ CORRIGÉ */}
              <p className="text-[10px] mt-1" style={{ color:"rgba(148,197,240,0.45)" }}>
                {t("energy.cout_100km")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Widget température avec debounce intégré */}
      <TemperatureWidget temperature={temperature} setTemperature={setTemperature} t={t} />

      {activeCharge ? <ChargeActive t={t} /> : <ChargeStarter t={t} />}
    </div>
  );
}