import { useState } from "react";
import { useApp } from "../context/AppContext";
import { vdb, v2p } from "../services/calculs";

const modes = [
  { key:"daily",   icon:"🟢", labelKey:"quotidien_80",      descKey:"charge_quotidienne", rgb:"34,197,94",  accent:"#4ade80",  grad:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.08))"  },
  { key:"course",  icon:"🔵", labelKey:"grande_course_100", descKey:"longues_sorties",    rgb:"56,189,248",  accent:"#38bdf8",  grad:"linear-gradient(135deg,rgba(56,189,248,0.15),rgba(99,102,241,0.1))"   },
  { key:"storage", icon:"❄️", labelKey:"hivernage_50",      descKey:"stockage_long",      rgb:"6,182,212",   accent:"#22d3ee",  grad:"linear-gradient(135deg,rgba(6,182,212,0.15),rgba(56,189,248,0.08))"   },
];

function Calibration({ t, onRetour }) {
  const { profile, calibration, setCalibration } = useApp();
  const d = vdb(profile.nominalVoltage);

  const [daily,   setDaily]   = useState(calibration.daily);
  const [course,  setCourse]  = useState(calibration.course);
  const [storage, setStorage] = useState(calibration.storage);

  const setters = { daily:setDaily, course:setCourse, storage:setStorage };
  const values  = { daily, course, storage };

  function enregistrer() {
    const dN=parseFloat(daily), cN=parseFloat(course), sN=parseFloat(storage);
    if (isNaN(dN)||isNaN(cN)||isNaN(sN)) { alert(t("valeurs_invalides")); return; }
    setCalibration({ daily:dN, course:cN, storage:sN });
    onRetour?.();
  }

  function reinitialiser() { setDaily(d.daily); setCourse(d.course); setStorage(d.storage); }

  return (
    <div className="space-y-4 pb-28">
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        🎯 {t("etalonnage")}
      </h2>

      {/* Info batterie */}
      <div style={{
        background:"linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.06))",
        border:"0.5px solid rgba(56,189,248,0.2)", borderTop:"0.5px solid rgba(56,189,248,0.35)",
        borderRadius:"16px", padding:"16px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.6),rgba(99,102,241,0.4),transparent)" }} />
        <p style={{ color:"rgba(148,197,240,0.55)", fontSize:"13px" }}>🔋 {t("batterie_actuelle")}</p>
        <p className="font-black mt-1" style={{
          background:"linear-gradient(135deg,#fff,#38bdf8,#818cf8)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", fontSize:"18px",
        }}>
          {profile.nominalVoltage}V • {profile.capacityAh}Ah
        </p>
        <p className="text-xs mt-2" style={{ color:"rgba(148,197,240,0.35)" }}>
          {t("plage")} : {d.min}V → {d.max}V
        </p>
      </div>

      {/* Cartes calibration */}
      {modes.map(({ key, icon, labelKey, descKey, rgb, accent, grad }) => {
        const val = values[key];
        const pct = v2p(parseFloat(val)||0, profile.nominalVoltage);
        return (
          <div key={key} style={{
            background:grad, border:`0.5px solid rgba(${rgb},0.25)`,
            borderLeft:`3px solid ${accent}`,
            borderRadius:"16px", padding:"16px",
            position:"relative", overflow:"hidden",
          }}>
            <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${rgb},0.6),transparent)` }} />
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-white">{icon} {t(labelKey)}</label>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{
                color:accent,
                background:`rgba(${rgb},0.15)`,
                border:`0.5px solid rgba(${rgb},0.3)`,
              }}>{pct}%</span>
            </div>
            <input type="number" step="0.1" value={val}
              onChange={e=>setters[key](e.target.value)}
              style={{
                background:"rgba(0,0,0,0.25)", border:`0.5px solid rgba(${rgb},0.35)`,
                borderRadius:"12px", color:"white", padding:"10px 14px",
                outline:"none", width:"100%", fontSize:"15px", fontWeight:700,
              }}
            />
            <p className="text-xs mt-2" style={{ color:"rgba(148,197,240,0.4)" }}>
              {t("recommande")} : <span style={{ color:accent }}>{d[key]}V</span> ({t(descKey)})
            </p>
          </div>
        );
      })}

      {/* Boutons */}
      <div className="flex gap-2">
        <button onClick={reinitialiser}
          className="flex-1 py-3 rounded-xl font-medium transition-all"
          style={{ background:"rgba(255,255,255,0.05)", border:"0.5px solid rgba(255,255,255,0.1)", color:"rgba(148,197,240,0.7)" }}>
          🔄 {t("recommande")}
        </button>
        <button onClick={enregistrer}
          className="flex-1 py-3 rounded-xl font-semibold transition-all"
          style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(99,102,241,0.2))", border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8", boxShadow:"0 0 20px rgba(56,189,248,0.12)" }}>
          💾 {t("enregistrer")}
        </button>
      </div>
    </div>
  );
}

export default Calibration;