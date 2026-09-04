import React, { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb } from "../services/calculs";
import { exportBackupJson, importBackupJson } from "../services/backup";
import MigrationCard from "../components/MigrationCard";

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.16)",
    borderRadius:"16px", padding:"16px",
  },
  inner: {
    background:"rgba(0,0,0,0.2)",
    border:"0.5px solid rgba(255,255,255,0.06)",
    borderRadius:"12px",
  },
  label: { color:"rgba(148,197,240,0.5)", fontSize:"12px" },
};

const btnStyles = {
  entretien:   { bg:"linear-gradient(135deg,rgba(16,185,129,0.2),rgba(16,185,129,0.1))",  border:"rgba(16,185,129,0.4)",  color:"#34d399", glow:"rgba(16,185,129,0.15)"  },
  demo:        { bg:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(168,85,247,0.1))",  border:"rgba(168,85,247,0.4)",  color:"#c084fc", glow:"rgba(168,85,247,0.12)"  },
  calibration: { bg:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"rgba(56,189,248,0.4)",  color:"#38bdf8", glow:"rgba(56,189,248,0.15)"  },
  hivernage:   { bg:"linear-gradient(135deg,rgba(6,182,212,0.2),rgba(56,189,248,0.12))",  border:"rgba(6,182,212,0.4)",   color:"#22d3ee", glow:"rgba(6,182,212,0.12)"   },
  export:      { bg:"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(74,222,128,0.12))",  border:"rgba(34,197,94,0.4)",   color:"#4ade80", glow:"rgba(34,197,94,0.12)"   },
  import:      { bg:"linear-gradient(135deg,rgba(234,179,8,0.2),rgba(251,191,36,0.12))",  border:"rgba(234,179,8,0.4)",   color:"#facc15", glow:"rgba(234,179,8,0.1)"    },
  reset:       { bg:"linear-gradient(135deg,rgba(239,68,68,0.18),rgba(239,68,68,0.08))",  border:"rgba(239,68,68,0.35)",  color:"#f87171", glow:"rgba(239,68,68,0.1)"    },
};

function Outils({ t, setPage }) {
  const { showToast, profile } = useApp();
  const fileInputRef = useRef(null);

  const [showHivernage, setShowHivernage]     = useState(false);
  const [saisie, setSaisie]                   = useState("");
  const [typeSaisie, setTypeSaisie]           = useState("V");
  const [showCalibration, setShowCalibration] = useState(false);
  const [tensionSaisie, setTensionSaisie]     = useState("");

  const tensionNominale = profile?.nominalVoltage || 48;
  const d = vdb(tensionNominale);
  const vStockage = d?.storage || (tensionNominale === 48 ? 46.8 : 35.1);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  
  let resultatCalibration = null;
  if (tensionSaisie !== "") {
    const v = parseFloat(tensionSaisie);
    const vMax = tensionNominale === 48 ? 54.6 : 42.0;
    const vMin = tensionNominale === 48 ? 39.0 : 30.0;
    if (v > vMax+1 || v < vMin-1) {
      resultatCalibration = { erreur:true, message:`${t("calibration_tension_hors_limites")} ${tensionNominale}V.` };
    } else {
      const pct = Math.max(0, Math.min(100, Math.round(((v-vMin)/(vMax-vMin))*100)));
      resultatCalibration = {
        erreur:false, pourcentage:pct,
        message: pct>=95
          ? `🔋 ${t("calibration_batterie_pleine")}`
          : pct<=15
            ? `🪫 ${t("calibration_seuil_critique")}`
            : `✅ ${t("calibration_batterie_stable")}`,
      };
    }
  }

  let diagnosticMessage = "", diagnosticColor = "rgba(148,197,240,0.5)";
  if (saisie !== "") {
    const v = parseFloat(saisie);
    if (typeSaisie === "V") {
      if (v > vStockage+0.5)      { diagnosticMessage=`🔋 ${t("hivernage_tension_trop_haute")} ${vStockage}V.`; diagnosticColor="#fb923c"; }
      else if (v < vStockage-0.5) { diagnosticMessage=`🪫 ${t("hivernage_tension_trop_basse")} ${vStockage}V.`; diagnosticColor="#facc15"; }
      else                         { diagnosticMessage=`🎯 ${t("hivernage_tension_parfaite")}`;                   diagnosticColor="#4ade80"; }
    } else {
      if (v > 50)      { diagnosticMessage=`🔋 ${t("hivernage_pct_trop_haut")}`; diagnosticColor="#fb923c"; }
      else if (v < 35) { diagnosticMessage=`🪫 ${t("hivernage_pct_trop_bas")}`;  diagnosticColor="#facc15"; }
      else             { diagnosticMessage=`🎯 ${t("hivernage_pct_parfait")}`;    diagnosticColor="#4ade80"; }
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm(t("confirmer_import_json"))) { e.target.value = ""; return; }
    try {
      await importBackupJson(file);
      showToast?.(`✅ ${t("restauration_reussie")}`);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      showToast?.(`❌ ${t("erreur_importation")}`);
    } finally {
      e.target.value = "";
    }
  };

  const handleResetClick = () => {
    if (!confirm(t("confirmer_reinit"))) return;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("bl_")) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    showToast?.(`🗑️ ${t("app_reinitialisee")}`);
    setTimeout(() => window.location.reload(), 1000);
  };

  function partager() {
    if (navigator.share)
      navigator.share({ title:"BatLife", text:t("partager_texte"), url:"https://batlife.app" }).catch(()=>{});
    else if (navigator.clipboard) {
      navigator.clipboard.writeText("https://batlife.app");
      showToast?.(t("lien_copie"));
    }
  }

  const outilsList = [
    { id:"entretien",   icon:"📋", titre:t("entretien"),     texte:t("entretien_texte"),     bouton:t("entretien_btn"),                                                            action:()=>setPage("entretien") },
    { id:"calibration", icon:"🎯", titre:t("calibration"),   texte:t("calibration_texte"),   bouton:showCalibration?t("masquer_calibration"):t("calibrer"),                        action:()=>{ setShowCalibration(!showCalibration); setShowHivernage(false); } },
    { id:"hivernage",   icon:"❄️", titre:t("hivernage"),     texte:t("hivernage_texte"),     bouton:showHivernage?t("masquer_diagnostic"):t("diagnostiquer"),                      action:()=>{ setShowHivernage(!showHivernage); setShowCalibration(false); } },
    { id:"export",      icon:"📤", titre:t("exporter"),      texte:t("exporter_texte"),      bouton:t("exporter_btn"),                                                             action:()=>{ exportBackupJson(); showToast?.(`✅ ${t("export_json_reussi")}`); } },
    { id:"import",      icon:"📥", titre:t("importer"),      texte:t("importer_texte"),      bouton:t("importer_btn"),                                                             action:()=>fileInputRef.current?.click() },
    { id:"reset",       icon:"🗑️", titre:t("reinitialiser"), texte:t("reinitialiser_texte"), bouton:t("reinitialiser_btn"),                                                        action:handleResetClick },
  ];

  const inputStyle = (rgb) => ({
    background:"rgba(0,0,0,0.25)", border:`0.5px solid rgba(${rgb},0.3)`,
    borderRadius:"12px", color:"white", padding:"10px 12px",
    fontSize:"14px", outline:"none", width:"100%",
  });

  return (
    <div className="space-y-4 pb-28 px-1">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        🔧 {t("outils_titre")}
      </h2>

      {/* ✅ MigrationCard correctement placée dans le JSX */}
      <MigrationCard t={t} />

      <div className="space-y-3">
        {outilsList.map((outil) => {
          const bs = btnStyles[outil.id];
          return (
            <div key={outil.id} className="space-y-2">
              <div style={g.card}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl shrink-0">{outil.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{outil.titre}</p>
                    <p className="text-sm mt-1 leading-snug" style={{ color:"rgba(148,197,240,0.5)" }}>{outil.texte}</p>
                  </div>
                </div>
                <button
                  onClick={outil.action}
                  className="w-full text-sm px-3 py-2.5 rounded-xl font-semibold transition-all"
                  style={{ background:bs.bg, border:`0.5px solid ${bs.border}`, color:bs.color, boxShadow:`0 0 16px ${bs.glow}` }}
                >
                  {outil.bouton}
                </button>
              </div>

              {/* Panel Calibration */}
              {outil.id === "calibration" && showCalibration && (
                <div style={{ ...g.inner, padding:"16px", border:"0.5px solid rgba(56,189,248,0.25)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.6),rgba(99,102,241,0.4),transparent)" }} />
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase" style={{ color:"#60a5fa" }}>🔋 {t("voltmetre_titre")} ({tensionNominale}V)</span>
                    <p className="text-xs" style={{ color:"rgba(148,197,240,0.45)" }}>⚠️ {t("voltmetre_repos")}</p>
                  </div>
                  <div className="relative">
                    <input type="number" step="0.1" placeholder={t("voltmetre_placeholder")}
                      value={tensionSaisie} onChange={(e) => setTensionSaisie(e.target.value)}
                      style={inputStyle("59,130,246")} />
                    <span className="absolute right-3 top-2.5 text-xs font-bold" style={{ color:"#60a5fa" }}>V</span>
                  </div>
                  {tensionSaisie !== "" && resultatCalibration && (
                    <div className="mt-3 p-3 text-center rounded-xl" style={{ background:"rgba(0,0,0,0.3)", border:"0.5px solid rgba(59,130,246,0.2)" }}>
                      {!resultatCalibration.erreur ? (
                        <>
                          <p className="text-xs mb-1" style={g.label}>{t("capacite_reelle")}</p>
                          <p className="text-3xl font-black" style={{ background:"linear-gradient(135deg,#4ade80,#38bdf8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                            {resultatCalibration.pourcentage}%
                          </p>
                          <p className="text-xs mt-1" style={g.label}>{resultatCalibration.message}</p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold" style={{ color:"#f87171" }}>{resultatCalibration.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Panel Hivernage */}
              {outil.id === "hivernage" && showHivernage && (
                <div style={{ ...g.inner, padding:"16px", border:"0.5px solid rgba(6,182,212,0.25)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(6,182,212,0.6),rgba(56,189,248,0.4),transparent)" }} />
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase" style={{ color:"#22d3ee" }}>❄️ {t("calculateur_hivernage")} ({tensionNominale}V)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color:"#22d3ee", background:"rgba(6,182,212,0.12)", border:"0.5px solid rgba(6,182,212,0.3)" }}>
                      🎯 {t("cible")} : {vStockage}V (~45%)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="number" step="0.1"
                        placeholder={typeSaisie === "V" ? t("voltmetre_placeholder") : t("pourcentage_placeholder")}
                        value={saisie} onChange={(e) => setSaisie(e.target.value)}
                        style={inputStyle("6,182,212")} />
                      <span className="absolute right-3 top-2.5 text-xs font-bold" style={{ color:"#22d3ee" }}>{typeSaisie}</span>
                    </div>
                    <button
                      onClick={() => { setTypeSaisie(typeSaisie === "V" ? "%" : "V"); setSaisie(""); }}
                      className="px-3 rounded-xl text-xs font-medium transition-all"
                      style={{ background:"rgba(255,255,255,0.05)", border:"0.5px solid rgba(255,255,255,0.1)", color:"rgba(148,197,240,0.7)" }}
                    >
                      {t("en_volts")}
                    </button>
                  </div>
                  {saisie !== "" && (
                    <div className="mt-3 p-3 text-center rounded-xl" style={{ background:"rgba(0,0,0,0.3)", border:"0.5px solid rgba(6,182,212,0.2)" }}>
                      <p className="text-xs font-semibold" style={{ color:diagnosticColor }}>{diagnosticMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

            {/* Soutenir BatLife */}
      <div className="p-6 space-y-4 mt-4" style={{
        background:"linear-gradient(135deg, rgba(234,179,8,0.1), rgba(251,146,60,0.08))",
        border:"0.5px solid rgba(234,179,8,0.35)",
        borderTop:"0.5px solid rgba(234,179,8,0.55)",
        borderRadius:"20px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(234,179,8,0.8),rgba(251,146,60,0.6),transparent)" }} />
        <div className="text-center">
          <div className="text-5xl mb-2">☕</div>
          <h3 className="text-xl font-black" style={{
            background:"linear-gradient(135deg,#facc15,#fb923c)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>{t("soutenir_batlife")}</h3>
        </div>
        <p className="text-sm leading-relaxed text-center" style={{ color:"rgba(255,255,255,0.65)" }}>{t("soutenir_texte")}</p>
        
        {!isStandalone && (
          <a href="https://buymeacoffee.com/batlife" target="_blank" rel="noopener noreferrer"
            className="block w-full font-bold py-3 rounded-full text-center transition-all"
            style={{ background:"linear-gradient(135deg,#facc15,#fb923c)", color:"#000", boxShadow:"0 0 20px rgba(250,204,21,0.2)" }}>
            ☕ {t("offrir_cafe")}
          </a>
        )}
        
        <button onClick={partager}
          className="block w-full font-semibold py-3 rounded-full transition-all"
          style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.15),rgba(99,102,241,0.12))", border:"0.5px solid rgba(56,189,248,0.3)", color:"#38bdf8" }}>
          📤 {t("partager_batlife")}
        </button>
      </div>
    </div>
  );
}

export default Outils;
