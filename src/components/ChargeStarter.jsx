import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { vdb, v2p, p2v } from "../services/calculs";
import { creerSessionCharge, calculerCible } from "../services/charge";
import { calculerAutonomieReelle } from "../services/autonomie";

const QUICK_CHARGE_KEY = "bl_derniers_reglages";

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.18)",
    borderRadius:"18px", padding:"24px",
  },
  input: {
    background:"rgba(255,255,255,0.06)",
    border:"0.5px solid rgba(255,255,255,0.15)",
    borderRadius:"12px", color:"white",
    width:"100%", padding:"12px 16px", fontSize:"16px", outline:"none",
  },
  label: { fontSize:"12px", color:"rgba(148,197,240,0.55)", marginBottom:"8px", display:"block" },
};

// ============================================================
// MINI RÉSUMÉ AVANT DÉMARRAGE RAPIDE
// ============================================================
function QuickConfirm({ reglages, onConfirm, onCancel, t, estExpert, d, nominalVoltage }) {
  const [departVal, setDepartVal] = useState(
    estExpert ? String(reglages.startV) : String(reglages.startPct)
  );
  const [erreurDepart, setErreurDepart] = useState("");

  function handleConfirm() {
    const val = parseFloat(departVal);
    if (isNaN(val)) { setErreurDepart(t("erreur_valeur")); return; }
    if (estExpert) {
      if (val < d.min || val > d.max) {
        setErreurDepart(`${t("erreur_tension")} ${d.min}V ${t("et")} ${d.max}V`);
        return;
      }
    } else {
      if (val < 0 || val > 100) { setErreurDepart(t("erreur_pourcentage")); return; }
    }
    setErreurDepart("");
    onConfirm(val);
  }

  return (
    <div style={{
      background:"linear-gradient(135deg, rgba(56,189,248,0.12), rgba(99,102,241,0.08))",
      border:"0.5px solid rgba(56,189,248,0.35)",
      borderTop:"0.5px solid rgba(56,189,248,0.55)",
      borderRadius:"16px", padding:"16px",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"absolute", top:0, left:0, right:0, height:"1px",
        background:"linear-gradient(90deg, transparent, rgba(56,189,248,0.8), transparent)",
      }} />

      <p className="font-semibold text-sm mb-3" style={{ color:"#38bdf8" }}>
        ⚡ {t("charge_rapide_confirmer") || "Confirmer la charge rapide"}
      </p>

      {/* Champ Départ modifiable */}
      <div className="mb-3">
        <p className="text-xs mb-1.5" style={{ color:"rgba(148,197,240,0.55)" }}>
          🔋 {t("depart")} — {t("charge_rapide_depart_hint") || "modifiez si nécessaire"}
        </p>
        <div className="relative">
          <input
            type="number"
            step={estExpert ? "0.1" : "1"}
            value={departVal}
            onChange={(e) => { setDepartVal(e.target.value); setErreurDepart(""); }}
            style={{
              background:"rgba(255,255,255,0.08)",
              border:`0.5px solid ${erreurDepart ? "rgba(248,113,113,0.5)" : "rgba(56,189,248,0.35)"}`,
              borderRadius:"12px", color:"white",
              width:"100%", padding:"10px 40px 10px 14px",
              fontSize:"15px", fontWeight:700, outline:"none",
            }}
          />
          <span style={{
            position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)",
            fontSize:"12px", color:"rgba(56,189,248,0.7)", fontWeight:600,
          }}>
            {estExpert ? "V" : "%"}
          </span>
        </div>
        {erreurDepart && (
          <p className="text-xs mt-1" style={{ color:"#f87171" }}>⚠️ {erreurDepart}</p>
        )}
      </div>

      {/* Mode et Km en lecture seule */}
      <div className="space-y-2 mb-4">
        {[
          {
            label: t("mode_charge"),
            val: reglages.mode === "daily"
              ? `🟢 ${t("quotidien")}`
              : `🔵 ${t("grande_course")}`,
          },
          {
            label: "🛣️ Km",
            val: reglages.km > 0 ? `${reglages.km} km` : "—",
          },
        ].map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm px-3 py-2 rounded-xl"
            style={{ background:"rgba(0,0,0,0.2)", border:"0.5px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color:"rgba(148,197,240,0.55)", fontSize:"12px" }}>{row.label}</span>
            <span className="font-semibold text-white text-xs">{row.val}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background:"rgba(255,255,255,0.04)",
            border:"0.5px solid rgba(255,255,255,0.1)",
            color:"rgba(148,197,240,0.6)",
          }}>
          ✕ {t("annuler") || "Annuler"}
        </button>
        <button onClick={handleConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background:"linear-gradient(135deg, rgba(56,189,248,0.25), rgba(99,102,241,0.2))",
            border:"0.5px solid rgba(56,189,248,0.4)",
            color:"#38bdf8",
            boxShadow:"0 0 16px rgba(56,189,248,0.15)",
          }}>
          ⚡ {t("demarrer_suivi_btn") || "Démarrer"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CHARGE STARTER
// ============================================================
function ChargeStarter({ t }) {
  const { profile, calibration, temperature, setActiveCharge, history } = useApp();
  const d = vdb(profile.nominalVoltage);
  const estExpert = profile.level === "expert";

  const [inputValue, setInputValue] = useState("");
  const [mode, setMode]             = useState("daily");
  const [km, setKm]                 = useState("");
  const [erreur, setErreur]         = useState("");
  const [kmTip, setKmTip]           = useState("");
  const [showQuickConfirm, setShowQuickConfirm] = useState(false);

  // Derniers réglages sauvegardés
  const derniersReglages = useMemo(() => {
    try {
      const saved = localStorage.getItem(QUICK_CHARGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  }, []);

  // Sauvegarde des réglages après démarrage
  function sauvegarderReglages(startV, startPct, modeVal, kmVal) {
    try {
      localStorage.setItem(QUICK_CHARGE_KEY, JSON.stringify({
        startV, startPct, mode: modeVal, km: kmVal || 0,
      }));
    } catch {}
  }

  function demarrerCharge(forceStartV, forceStartPct, forceMode, forceKm) {
    setErreur("");

    let startV, startPct, modeVal, kmVal;

    if (forceStartV !== undefined) {
      // Charge rapide — valeurs forcées
      startV   = forceStartV;
      startPct = forceStartPct;
      modeVal  = forceMode;
      kmVal    = forceKm;
    } else {
      // Formulaire classique
      const val = parseFloat(inputValue);
      if (isNaN(val)) { setErreur(t("erreur_valeur")); return; }

      if (estExpert) {
        if (val < d.min || val > d.max) {
          setErreur(`${t("erreur_tension")} ${d.min}V ${t("et")} ${d.max}V`);
          return;
        }
        startV   = val;
        startPct = v2p(val, profile.nominalVoltage);
      } else {
        if (val < 0 || val > 100) { setErreur(t("erreur_pourcentage")); return; }
        startPct = val;
        startV   = p2v(val, profile.nominalVoltage);
      }
      modeVal = mode;
      kmVal   = parseFloat(km);
    }

    const { targetV, targetPct } = calculerCible({
      mode: modeVal, calibration, nominalVoltage: profile.nominalVoltage,
    });

    if (targetV <= startV) { setErreur(t("erreur_cible")); return; }

    localStorage.setItem("bl_derniere_charge", new Date().toISOString());
    sauvegarderReglages(startV, startPct, modeVal, kmVal);

    setActiveCharge(creerSessionCharge({
      startV, startPct, targetV, targetPct,
      mode: modeVal,
      vehicle: profile.vehicle,
      nominalVoltage: profile.nominalVoltage,
      capacityAh: profile.capacityAh,
      chargerCurrent: profile.Idefault,
      temperature,
      level: profile.level,
      kmRidden: !isNaN(kmVal) && kmVal > 0 ? kmVal : null,
    }));
  }

  function onQuickConfirm(departSaisi) {
    setShowQuickConfirm(false);
    // Recalcule V et Pct selon le départ saisi
    let startV, startPct;
    if (estExpert) {
      startV   = departSaisi;
      startPct = v2p(departSaisi, profile.nominalVoltage);
    } else {
      startPct = departSaisi;
      startV   = p2v(departSaisi, profile.nominalVoltage);
    }
    demarrerCharge(startV, startPct, derniersReglages.mode, derniersReglages.km);
  }

  return (
    <div style={g.card} className="space-y-5">

      {/* Batterie active */}
      <div className="text-center pb-3" style={{ borderBottom:"0.5px solid rgba(255,255,255,0.07)" }}>
        <p style={{ fontSize:"11px", color:"rgba(148,197,240,0.45)", letterSpacing:"0.08em", textTransform:"uppercase" }}>
          🚴 {t("batterie_active")}
        </p>
        <p className="font-bold mt-1 text-white">
          {profile.nominalVoltage}V • {profile.capacityAh}Ah
          {profile.customName ? ` • ${profile.customName}` : ""}
        </p>
      </div>

      {/* ✅ BOUTON CHARGE RAPIDE — visible si derniers réglages existent */}
      {derniersReglages && !showQuickConfirm && (
        <div style={{ position:"relative" }}>
          <button
            onClick={() => setShowQuickConfirm(true)}
            className="w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              background:"linear-gradient(135deg, rgba(99,102,241,0.2), rgba(56,189,248,0.15))",
              border:"0.5px solid rgba(99,102,241,0.45)",
              borderTop:"0.5px solid rgba(99,102,241,0.65)",
              color:"#818cf8",
              boxShadow:"0 0 20px rgba(99,102,241,0.12)",
              position:"relative", overflow:"hidden",
            }}
          >
            <div style={{
              position:"absolute", top:0, left:0, right:0, height:"1px",
              background:"linear-gradient(90deg, transparent, rgba(99,102,241,0.8), transparent)",
            }} />
            <span style={{ fontSize:"18px" }}>⚡</span>
            <div className="text-left">
              <p className="text-sm font-bold leading-tight">
                {t("charge_rapide") || "Charge rapide"}
              </p>
              <p className="text-xs font-normal leading-tight" style={{ color:"rgba(129,140,248,0.7)" }}>
                {estExpert
                  ? `${derniersReglages.startV}V • ${derniersReglages.mode === "daily" ? t("quotidien") : t("grande_course")}`
                  : `${derniersReglages.startPct}% • ${derniersReglages.mode === "daily" ? t("quotidien") : t("grande_course")}`
                }
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Mini résumé de confirmation */}
      {showQuickConfirm && derniersReglages && (
        <QuickConfirm
          reglages={derniersReglages}
          onConfirm={onQuickConfirm}
          onCancel={() => setShowQuickConfirm(false)}
          t={t}
          estExpert={estExpert}
          d={d}
          nominalVoltage={profile.nominalVoltage}
        />
      )}

      {/* Séparateur si charge rapide visible */}
      {derniersReglages && !showQuickConfirm && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.07)" }} />
          <span className="text-xs" style={{ color:"rgba(148,197,240,0.35)" }}>
            {t("ou") || "ou"}
          </span>
          <div className="flex-1 h-px" style={{ background:"rgba(255,255,255,0.07)" }} />
        </div>
      )}

      {/* Saisie */}
      <div>
        <label style={g.label}>
          {estExpert
            ? `⚡ ${t("tension_actuelle")} (${d.min}V - ${d.max}V)`
            : `🔋 ${t("charge_actuelle")}`}
        </label>
        <input
          type="number" step={estExpert ? "0.1" : "1"} value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={estExpert
            ? `${t("placeholder_tension")}${d.daily}`
            : t("placeholder_charge")}
          style={g.input}
        />
      </div>

      {/* Mode de charge */}
      <div>
        <label style={g.label}>🎯 {t("mode_charge")}</label>
        <div className="flex gap-2">
          <button onClick={() => setMode("daily")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={mode === "daily"
              ? { background:"linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))", border:"0.5px solid rgba(34,197,94,0.4)", color:"#4ade80", boxShadow:"0 0 16px rgba(34,197,94,0.1)" }
              : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", color:"rgba(148,197,240,0.4)" }
            }>
            🟢 {t("quotidien")}
          </button>
          <button onClick={() => setMode("course")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            style={mode === "course"
              ? { background:"linear-gradient(135deg, rgba(56,189,248,0.2), rgba(99,102,241,0.15))", border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8", boxShadow:"0 0 16px rgba(56,189,248,0.1)" }
              : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", color:"rgba(148,197,240,0.4)" }
            }>
            🔵 {t("grande_course")}
          </button>
        </div>
      </div>

      {/* Km */}
      <div>
        <label style={g.label}>🛣️ {t("km_parcourus_depuis_charge")}</label>
        <input type="number" step="0.1" value={km}
          onChange={(e) => {
            const val = e.target.value;
            setKm(val);
            const kmNum = parseFloat(val);
            if (!isNaN(kmNum) && kmNum > 0) {
              const stats = calculerAutonomieReelle(history, 100, temperature);
              if (stats.hasData && stats.consommationParKm > 0) {
                const pct = Math.round(kmNum * parseFloat(stats.consommationParKm));
                setKmTip(`≈ ${pct}% de batterie consommée pour ${kmNum} km`);
              } else {
                setKmTip(`✅ ${kmNum} km enregistrés pour cette session.`);
              }
            } else {
              setKmTip("");
            }
          }}
          placeholder="0" style={{ ...g.input, fontSize:"14px" }} />
        {kmTip ? (
          <p className="text-xs mt-1.5" style={{ color:"#38bdf8" }}>{kmTip}</p>
        ) : (
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color:"rgba(148,197,240,0.35)" }}>
            💡 {t("km_parcourus_aide")}
          </p>
        )}
      </div>

      {/* Erreur */}
      {erreur && (
        <div className="p-3 rounded-xl text-sm" style={{
          background:"rgba(239,68,68,0.1)",
          border:"0.5px solid rgba(239,68,68,0.25)",
          color:"#f87171",
        }}>
          ⚠️ {erreur}
        </div>
      )}

      {/* Bouton démarrer classique */}
      <button onClick={() => demarrerCharge()}
        className="w-full py-3 rounded-xl font-semibold text-lg transition-all"
        style={{
          background:"linear-gradient(135deg, rgba(56,189,248,0.25), rgba(99,102,241,0.2))",
          border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8",
          boxShadow:"0 0 24px rgba(56,189,248,0.15)",
        }}>
        🔋 {t("demarrer_suivi_btn")}
      </button>
    </div>
  );
}

export default ChargeStarter;
