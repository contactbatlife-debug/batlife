import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { VEHICLE_DATABASE } from "../services/config";

const g = {
  card: {
    background:"rgba(255,255,255,0.04)",
    border:"0.5px solid rgba(255,255,255,0.1)",
    borderTop:"0.5px solid rgba(255,255,255,0.16)",
    borderRadius:"16px", padding:"16px",
  },
  select: {
    background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.15)",
    borderRadius:"12px", color:"white", padding:"10px 14px",
    outline:"none", width:"100%", fontSize:"14px", marginTop:"6px",
  },
  input: {
    background:"rgba(255,255,255,0.06)", border:"0.5px solid rgba(255,255,255,0.15)",
    borderRadius:"12px", color:"white", padding:"10px 14px",
    outline:"none", width:"100%", fontSize:"14px", marginTop:"6px",
  },
  label: { color:"rgba(148,197,240,0.55)", fontSize:"13px" },
};

function Profil({ t, onRetour }) {
  const { profile, updateProfile } = useApp();

  const [marqueSelectionnee, setMarqueSelectionnee] = useState(() => {
    const v = VEHICLE_DATABASE.find(v => v.id===profile.vehicle);
    return v ? v.brand : "";
  });
  const [modeleSelectionne, setModeleSelectionne] = useState(profile.vehicle||"");
  const [niveau, setNiveau] = useState(profile.level||"beginner");
  const [modeAjout, setModeAjout] = useState(false);
  const [customName, setCustomName] = useState(profile.customName||"");
  const [customVoltage, setCustomVoltage] = useState(profile.nominalVoltage||48);
  const [customCapacity, setCustomCapacity] = useState(profile.capacityAh||15);
  const [customCurrent, setCustomCurrent] = useState(profile.Idefault||2);
  const [sohInitial, setSohInitial] = useState(profile.sohInitial||100);

  const marques = useMemo(() => Array.from(new Set(VEHICLE_DATABASE.map(v=>v.brand))).sort(), []);
  const modeles = useMemo(() => VEHICLE_DATABASE.filter(v=>v.brand===marqueSelectionnee), [marqueSelectionnee]);
  const vehicleInfo = modeleSelectionne ? VEHICLE_DATABASE.find(v=>v.id===modeleSelectionne) : null;

  function enregistrer() {
    if (modeAjout) {
      if (!customName.trim()) { alert(t("erreur_nom_vehicule")); return; }
        updateProfile({ ...profile, vehicle:"custom", customName:customName.trim(), nominalVoltage:Number(customVoltage), capacityAh:Number(customCapacity), Idefault:Number(customCurrent), level:niveau, sohInitial:Number(sohInitial) });
    } else {
      if (!modeleSelectionne) { alert(t("erreur_choisir_modele")); return; }
      const v = VEHICLE_DATABASE.find(v=>v.id===modeleSelectionne);
      if (!v) return;
            updateProfile({ ...profile, vehicle:v.id, customName:"", nominalVoltage:v.voltage, capacityAh:v.capacity, Idefault:v.current, level:niveau, sohInitial:Number(sohInitial) });
    }
    onRetour?.();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"rgba(255,255,255,0.85)" }}>
        🚴 {t("mon_profil")}
      </h2>

      {/* Niveau */}
      <div style={g.card} className="space-y-3">
        <label style={g.label}>🎯 {t("niveau_utilisation")}</label>
        <div className="flex gap-2">
          {[
            { id:"beginner", label:`🟢 ${t("debutant_pct")}`, active:{ background:"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.12))", border:"0.5px solid rgba(34,197,94,0.4)", color:"#4ade80" } },
            { id:"expert",   label:`🔵 ${t("expert_v")}`,     active:{ background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(168,85,247,0.4)", color:"#c084fc" } },
          ].map(n => (
            <button key={n.id} onClick={()=>setNiveau(n.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={niveau===n.id ? n.active : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", color:"rgba(148,197,240,0.4)" }}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode liste / manuel */}
                  {/* ✅ État de la batterie à l'installation (SoH initial) */}
      <div style={g.card} className="space-y-3">
        <label style={g.label}>🔋 {t("profil_etat_titre")}</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val:100, label:t("profil_etat_neuve") },
            { val:90,  label:t("profil_etat_bonne") },
            { val:80,  label:t("profil_etat_usagee") },
            { val:70,  label:t("profil_etat_fatiguee") },
          ].map(s => (
            <button key={s.val} onClick={()=>setSohInitial(s.val)}
              className="py-2 rounded-xl text-sm font-semibold transition-all"
              style={Number(sohInitial)===s.val
                ? { background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8" }
                : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", color:"rgba(148,197,240,0.4)" }}>
              {s.label}
            </button>
          ))}
        </div>
        <p style={{ color:"rgba(148,197,240,0.45)", fontSize:"11px", lineHeight:1.6 }}>
          💡 {t("profil_etat_aide")}
        </p>
      </div>

      <div style={g.card} className="space-y-4">
        <div className="flex gap-2">
          {[
            { id:false, label:`📋 ${t("liste")}` },
            { id:true,  label:`➕ ${t("manuel")}` },
          ].map(m => (
            <button key={String(m.id)} onClick={()=>setModeAjout(m.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={modeAjout===m.id
                ? { background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8" }
                : { background:"rgba(255,255,255,0.04)", border:"0.5px solid rgba(255,255,255,0.08)", color:"rgba(148,197,240,0.4)" }}>
              {m.label}
            </button>
          ))}
        </div>

        {!modeAjout && (
          <div className="space-y-3">
            <div>
              <label style={g.label}>{t("marque")}</label>
              <select value={marqueSelectionnee} onChange={e=>{setMarqueSelectionnee(e.target.value);setModeleSelectionne("");}} style={g.select}>
                <option value="" style={{ background:"#0d1f3c" }}>{t("choisir_marque")}</option>
                {marques.map(m=><option key={m} value={m} style={{ background:"#0d1f3c" }}>{m}</option>)}
              </select>
            </div>
            {marqueSelectionnee && (
              <div>
                <label style={g.label}>{t("modele")}</label>
                <select value={modeleSelectionne} onChange={e=>setModeleSelectionne(e.target.value)} style={g.select}>
                  <option value="" style={{ background:"#0d1f3c" }}>{t("choisir_modele")}</option>
                  {modeles.map(v=><option key={v.id} value={v.id} style={{ background:"#0d1f3c" }}>{v.name}</option>)}
                </select>
              </div>
            )}
            {vehicleInfo && (
              <div className="rounded-xl p-3 space-y-1.5 text-sm" style={{
                background:"linear-gradient(135deg,rgba(56,189,248,0.08),rgba(99,102,241,0.06))",
                border:"0.5px solid rgba(56,189,248,0.2)",
              }}>
                {[
                  { label:`⚡ ${t("tension_v")}`, val:`${vehicleInfo.voltage}V`, color:"#38bdf8" },
                  { label:`🔋 ${t("capacite_ah")}`, val:`${vehicleInfo.capacity}Ah`, color:"#4ade80" },
                  { label:`🔌 ${t("courant_chargeur")}`, val:`${vehicleInfo.current}A`, color:"#c084fc" },
                ].map((row,i)=>(
                  <p key={i} style={{ color:"rgba(148,197,240,0.65)" }}>
                    {row.label} : <span style={{ color:row.color, fontWeight:700 }}>{row.val}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {modeAjout && (
          <div className="space-y-3">
            {[
              { label:t("nom_vehicule"), type:"text", value:customName, onChange:v=>setCustomName(v), placeholder:t("placeholder_nom_vehicule") },
              { label:t("capacite_ah"), type:"number", step:"0.1", value:customCapacity, onChange:v=>setCustomCapacity(v) },
              { label:t("courant_chargeur"), type:"number", step:"0.1", value:customCurrent, onChange:v=>setCustomCurrent(v) },
            ].map((f,i)=>(
              <div key={i}>
                <label style={g.label}>{f.label}</label>
                <input type={f.type} step={f.step} value={f.value} placeholder={f.placeholder}
                  onChange={e=>f.onChange(e.target.value)} style={g.input} />
              </div>
            ))}
            <div>
              <label style={g.label}>{t("tension_v")}</label>
              <select value={customVoltage} onChange={e=>setCustomVoltage(e.target.value)} style={g.select}>
                {[36,48,52,60,72].map(v=><option key={v} value={v} style={{ background:"#0d1f3c" }}>{v}V</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Enregistrer */}
      <button onClick={enregistrer}
        className="w-full py-3 rounded-xl font-semibold transition-all"
        style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(99,102,241,0.2))", border:"0.5px solid rgba(56,189,248,0.4)", color:"#38bdf8", boxShadow:"0 0 24px rgba(56,189,248,0.12)" }}>
        💾 {t("enregistrer_profil")}
      </button>
    </div>
  );
}

export default Profil;