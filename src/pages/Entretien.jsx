import React, { useState, useEffect } from "react";

const TYPES_ENTRETIEN = ["Pneus","Chaîne","Freins","Batterie","Autre"];

const typeConfig = {
  "Pneus":    { rgb:"56,189,248",  accent:"#38bdf8",  grad:"linear-gradient(135deg,rgba(56,189,248,0.15),rgba(99,102,241,0.1))"  },
  "Chaîne":   { rgb:"250,204,21",  accent:"#facc15",  grad:"linear-gradient(135deg,rgba(250,204,21,0.15),rgba(251,146,60,0.1))"  },
  "Freins":   { rgb:"239,68,68",   accent:"#f87171",  grad:"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.08))"   },
  "Batterie": { rgb:"34,197,94",   accent:"#4ade80",  grad:"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.08))"  },
  "Autre":    { rgb:"168,85,247",  accent:"#c084fc",  grad:"linear-gradient(135deg,rgba(168,85,247,0.15),rgba(99,102,241,0.1))"  },
};

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.16)",
    borderRadius:"16px", padding:"16px",
  },
  input: {
    background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.15)",
    borderRadius:"12px", color:"white", padding:"10px 14px",
    outline:"none", width:"100%", fontSize:"14px",
  },
  label: { color:"rgba(148,197,240,0.55)", fontSize:"13px" },
};

function Entretien({ t }) {
  const [log, setLog] = useState(()=>JSON.parse(localStorage.getItem("bl_entretien_log"))||[]);
  const [formData, setFormData] = useState({
    type:"Pneus", date:new Date().toISOString().split("T")[0], km:"", notes:"",
  });

  useEffect(()=>{ localStorage.setItem("bl_entretien_log", JSON.stringify(log)); }, [log]);

  const addEntry = () => {
    if (!formData.km) return;
    setLog([formData,...log]);
    setFormData({ ...formData, km:"", notes:"" });
  };

  const exportCSV = () => {
    const csv = [["Date","Type","KM","Notes"],...log.map(i=>[i.date,i.type,i.km,i.notes])]
      .map(r=>r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "entretien_batlife.csv"; a.click();
  };

  const currentType = typeConfig[formData.type]||typeConfig["Autre"];

  return (
    <div className="space-y-4 pb-28 px-1">
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        🔧 {t("entretien_journal_titre")}
      </h2>

      {/* Formulaire — teinte dynamique selon type sélectionné */}
      <div style={{
        background:currentType.grad,
        border:`0.5px solid rgba(${currentType.rgb},0.25)`,
        borderTop:`0.5px solid rgba(${currentType.rgb},0.4)`,
        borderRadius:"16px", padding:"16px",
        position:"relative", overflow:"hidden",
        transition:"all 0.3s ease",
      }}>
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${currentType.rgb},0.7),transparent)` }} />

        <div className="space-y-3">
          {/* Type */}
          <div>
            <label style={g.label}>{t("entretien_type")||"Type"}</label>
            <select value={formData.type} onChange={e=>setFormData({...formData,type:e.target.value})}
              style={{ ...g.input, marginTop:"6px", border:`0.5px solid rgba(${currentType.rgb},0.3)` }}>
              {TYPES_ENTRETIEN.map(type=>(
                <option key={type} value={type} style={{ background:"#0d1f3c" }}>
                  {t(`entretien_type_${type.toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={g.label}>{t("entretien_date")||"Date"}</label>
            <input type="date" value={formData.date} onChange={e=>setFormData({...formData,date:e.target.value})}
              style={{ ...g.input, marginTop:"6px", colorScheme:"dark", border:`0.5px solid rgba(${currentType.rgb},0.25)` }} />
          </div>

          {/* Km */}
          <div>
            <label style={g.label}>{t("entretien_kilometrage")}</label>
            <input type="number" placeholder="0" value={formData.km} onChange={e=>setFormData({...formData,km:e.target.value})}
              style={{ ...g.input, marginTop:"6px", border:`0.5px solid rgba(${currentType.rgb},0.25)` }} />
          </div>

          {/* Notes */}
          <div>
            <label style={g.label}>{t("entretien_notes")||"Notes"}</label>
            <input type="text" placeholder="..." value={formData.notes} onChange={e=>setFormData({...formData,notes:e.target.value})}
              style={{ ...g.input, marginTop:"6px", border:`0.5px solid rgba(${currentType.rgb},0.25)` }} />
          </div>

          <button onClick={addEntry}
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{
              background:`linear-gradient(135deg,rgba(${currentType.rgb},0.3),rgba(${currentType.rgb},0.15))`,
              border:`0.5px solid rgba(${currentType.rgb},0.5)`,
              color:currentType.accent,
              boxShadow:`0 0 20px rgba(${currentType.rgb},0.15)`,
            }}>
            ➕ {t("entretien_ajouter")}
          </button>
        </div>
      </div>

      {/* En-tête historique */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2" style={{ color:"rgba(148,197,240,0.6)", fontSize:"13px" }}>
          🕓 {t("entretien_historique")}
        </h3>
        <button onClick={exportCSV}
          className="text-xs px-3 py-1.5 rounded-full transition-all"
          style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.12),rgba(99,102,241,0.08))", border:"0.5px solid rgba(56,189,248,0.25)", color:"#38bdf8" }}>
          📥 {t("entretien_exporter_csv")}
        </button>
      </div>

      {/* Liste */}
      {log.length===0 ? (
        <p className="text-sm text-center py-6" style={{ color:"rgba(148,197,240,0.35)" }}>{t("entretien_vide")}</p>
      ) : (
        <div className="space-y-2">
          {log.map((item,i)=>{
            const c = typeConfig[item.type]||typeConfig["Autre"];
            return (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl"
                style={{
                  background:c.grad,
                  border:`0.5px solid rgba(${c.rgb},0.25)`,
                  borderLeft:`3px solid ${c.accent}`,
                  position:"relative", overflow:"hidden",
                }}>
                <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${c.rgb},0.5),transparent)` }} />
                <div>
                  <p className="font-bold text-white text-sm">{t(`entretien_type_${item.type.toLowerCase()}`)}</p>
                  <p className="text-xs mt-0.5" style={{ color:"rgba(148,197,240,0.45)" }}>{item.date}</p>
                  {item.notes && <p className="text-xs mt-0.5" style={{ color:"rgba(148,197,240,0.4)" }}>{item.notes}</p>}
                </div>
                <span className="font-black text-sm" style={{ color:c.accent }}>{item.km} km</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Entretien;