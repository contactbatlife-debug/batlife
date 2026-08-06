import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Profil from "./Profil";
import Calibration from "./Calibration";

const g = {
  card: {
    background:"var(--bg-card)",
    border:"var(--border-card)",
    borderTop:"var(--border-top)",
    borderRadius:"16px", padding:"16px",
    boxShadow:"var(--shadow-card)",
  },
  input: {
    background:"var(--bg-input)",
    border:"var(--border-input)",
    borderRadius:"12px", color:"var(--text-primary)",
    padding:"10px 16px", outline:"none", width:"100%", fontSize:"14px",
  },
  label: { color:"var(--text-label)", fontSize:"13px" },
  muted: { color:"var(--text-muted)", fontSize:"11px" },
};

function NavBtn({ icon, title, desc, onClick, rgb }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-between transition-all"
      style={{
        background:`rgba(${rgb},0.06)`,
        border:`0.5px solid rgba(${rgb},0.2)`,
        borderTop:`0.5px solid rgba(${rgb},0.35)`,
        borderRadius:"16px", padding:"16px",
        position:"relative", overflow:"hidden",
        boxShadow:"var(--shadow-card)",
      }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px", background:`linear-gradient(90deg,transparent,rgba(${rgb},0.5),transparent)` }} />
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="text-left">
          <p className="font-semibold" style={{ color:"var(--text-primary)" }}>{title}</p>
          <p className="text-sm mt-0.5" style={g.label}>{desc}</p>
        </div>
      </div>
      <span style={{ color:`rgba(${rgb},0.7)`, fontSize:"20px" }}>›</span>
    </button>
  );
}

function Reglages({ reglages, setReglages, t }) {
  const [pageActive, setPageActive] = useState("reglages");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBatteryName, setNewBatteryName] = useState("");
  const { batteries=[], activeBatteryId, switchBattery, addBattery, deleteBattery, profile } = useApp();

  useEffect(() => {
    if (profile?.customName && reglages.nomBatterie !== profile.customName)
      setReglages(prev => ({ ...prev, nomBatterie: profile.customName }));
  }, [activeBatteryId, profile]);

  const changerValeur = (cle, valeur) => setReglages({ ...reglages, [cle]: valeur });

  const handleAddBattery = () => {
    if (!newBatteryName.trim()) return;
    addBattery?.(newBatteryName.trim());
    setNewBatteryName("");
    setShowAddForm(false);
  };

  const handleDeleteBattery = (id, name, e) => {
    e.stopPropagation();
    if (batteries.length<=1) { alert(t("conserver_batterie")); return; }
    if (confirm(`${t("confirmer_suppression")} "${name}" ? ${t("donnees_perdues")}`)) deleteBattery?.(id);
  };

  if (pageActive==="profil") return (
    <div className="space-y-4 pb-28">
      <button onClick={()=>setPageActive("reglages")} className="flex items-center gap-1 text-sm" style={{ color:"var(--accent-cyan)" }}>
        ‹ {t("retour_reglages")}
      </button>
      <Profil t={t} onRetour={()=>setPageActive("reglages")} />
    </div>
  );

  if (pageActive==="calibration") return (
    <div className="space-y-4 pb-28">
      <button onClick={()=>setPageActive("reglages")} className="flex items-center gap-1 text-sm" style={{ color:"var(--accent-cyan)" }}>
        ‹ {t("retour_reglages")}
      </button>
      <Calibration t={t} onRetour={()=>setPageActive("reglages")} />
    </div>
  );

  return (
    <div className="space-y-4 pb-28 px-1">
      <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color:"var(--text-primary)" }}>
        ⚙️ {t("reglages_titre")}
      </h2>

      <NavBtn icon="🚴" title={t("mon_profil")}  desc={t("mon_profil_desc")}  onClick={()=>setPageActive("profil")}      rgb="56,189,248" />
      <NavBtn icon="🎯" title={t("etalonnage")}   desc={t("etalonnage_desc")}  onClick={()=>setPageActive("calibration")} rgb="168,85,247" />

      {/* Gestion flotte */}
      <div style={g.card}>
        <div className="flex justify-between items-center mb-3">
          <label style={g.label}>{t("gestion_flotte")} ({batteries.length})</label>
          <button onClick={() => { setShowAddForm(!showAddForm); setNewBatteryName(""); }}
            className="text-xs font-semibold px-3 py-1 rounded-lg transition-all"
            style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(56,189,248,0.35)", color:"var(--accent-cyan)" }}>
            {showAddForm ? "✕ Annuler" : `+ ${t("ajouter")}`}
          </button>
        </div>

        {showAddForm && (
          <div className="flex gap-2 mb-3">
            <input type="text" value={newBatteryName}
              onChange={e=>setNewBatteryName(e.target.value)}
              onKeyDown={e=>e.key==="Enter" && handleAddBattery()}
              placeholder={t("prompt_nom_vehicule")||"Nom de la batterie"}
              autoFocus
              style={{ ...g.input, flex:1, padding:"8px 12px", fontSize:"13px" }} />
            <button onClick={handleAddBattery}
              className="px-4 rounded-xl text-sm font-semibold transition-all"
              style={{ background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(99,102,241,0.2))", border:"0.5px solid rgba(56,189,248,0.4)", color:"var(--accent-cyan)", whiteSpace:"nowrap" }}>
              ✓ OK
            </button>
          </div>
        )}

        {batteries.length>0 ? (
          <div className="space-y-2">
            {batteries.map(b => {
              const isSelected = b.id===activeBatteryId;
              return (
                <div key={b.id} onClick={()=>switchBattery?.(b.id)}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background:isSelected?"linear-gradient(135deg,rgba(56,189,248,0.12),rgba(99,102,241,0.08))":"var(--bg-card-inner)",
                    border:isSelected?"0.5px solid rgba(56,189,248,0.4)":"var(--border-inner)",
                  }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{isSelected?"⚡":"🚲"}</span>
                    <span className="truncate text-sm" style={{ color:isSelected?"var(--text-primary)":"var(--text-secondary)", fontWeight:isSelected?600:400 }}>
                      {b.name||t("sans_nom")}
                    </span>
                  </div>
                  <button onClick={e=>handleDeleteBattery(b.id,b.name,e)} className="p-1 text-xs transition-all"
                    style={{ color:"var(--text-muted)" }}
                    onMouseEnter={e=>e.currentTarget.style.color="var(--accent-red)"}
                    onMouseLeave={e=>e.currentTarget.style.color="var(--text-muted)"}>
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs italic pt-1" style={g.muted}>{t("profil_defaut")}</p>
        )}
      </div>

      {/* Nom batterie */}
      <div style={g.card} className="space-y-2">
        <label style={g.label}>{t("nom_batterie")}</label>
        <input type="text" value={reglages.nomBatterie||""} onChange={e=>changerValeur("nomBatterie",e.target.value)} style={g.input} />
      </div>

      {/* Type véhicule */}
      <div style={g.card} className="space-y-2">
        <label style={g.label}>{t("type_vehicule")}</label>
        <div className="flex gap-2">
          {[
            { id:"vae", label:"🚴 VAE",         activeStyle:{ background:"linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(56,189,248,0.4)", color:"var(--accent-cyan)" } },
            { id:"tae", label:"🛴 Trottinette", activeStyle:{ background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(168,85,247,0.4)", color:"var(--accent-purple)" } },
          ].map(v => (
            <button key={v.id} onClick={()=>changerValeur("vehicule",v.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={reglages.vehicule===v.id ? v.activeStyle : { background:"var(--bg-card)", border:"var(--border-card)", color:"var(--text-muted)" }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode affichage */}
      <div style={g.card} className="space-y-2">
        <label style={g.label}>{t("mode_affichage")}</label>
        <div className="flex gap-2">
          {[
            { id:"debutant", label:"🟢 %", activeStyle:{ background:"linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.12))", border:"0.5px solid rgba(34,197,94,0.4)", color:"var(--accent-green)" } },
            { id:"expert",   label:"🔵 V", activeStyle:{ background:"linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.15))", border:"0.5px solid rgba(168,85,247,0.4)", color:"var(--accent-purple)" } },
          ].map(m => (
            <button key={m.id} onClick={()=>changerValeur("mode",m.id)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={reglages.mode===m.id ? m.activeStyle : { background:"var(--bg-card)", border:"var(--border-card)", color:"var(--text-muted)" }}>
              {m.label}
            </button>
          ))}
        </div>
        <p style={g.muted}>{reglages.mode==="debutant" ? t("debutant_desc") : t("expert_desc")}</p>
      </div>

      {/* À propos */}
      <div style={g.card} className="space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color:"var(--text-primary)" }}>
          ℹ️ {t("apropos_titre") || "À propos de BatLife"}
        </h3>

        <div className="space-y-3">
          {(t("apropos_texte") || "BatLife est une application indépendante créée par un passionné de mobilité électrique.")
            .split("\n\n")
            .map((para, i) => (
              <p key={i} className="text-xs leading-relaxed" style={{ color:"var(--text-label)" }}>
                {para}
              </p>
            ))
          }
        </div>

        {/* Contact */}
        <div className="p-3 rounded-xl" style={{ background:"rgba(56,189,248,0.06)", border:"0.5px solid rgba(56,189,248,0.2)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color:"var(--accent-cyan)" }}>
            📧 {t("apropos_contact") || "Contact"}
          </p>
          <a href="mailto:contact.batlife@gmail.com"
            className="text-xs"
            style={{ color:"var(--accent-cyan)", textDecoration:"underline" }}>
            contact.batlife@gmail.com
          </a>
        </div>

        {/* Confidentialité */}
        <div className="p-3 rounded-xl space-y-1.5" style={{ background:"rgba(74,222,128,0.05)", border:"0.5px solid rgba(74,222,128,0.15)" }}>
          <p className="text-xs font-semibold" style={{ color:"#4ade80" }}>
            🔒 {t("apropos_confidentialite") || "Confidentialité"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color:"var(--text-label)" }}>
            {t("apropos_confidentialite_texte") || "BatLife ne collecte aucune donnée personnelle. Toutes vos données sont stockées uniquement sur votre appareil."}
          </p>
        </div>

        {/* Mentions légales */}
        <div className="p-3 rounded-xl space-y-1" style={{ background:"rgba(255,255,255,0.03)", border:"0.5px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color:"var(--text-secondary)" }}>
            📋 {t("apropos_mentions") || "Mentions légales"}
          </p>
          {[
            { label: t("apropos_editeur") || "Éditeur",     val:"Marc P." },
            { label: t("apropos_pays")    || "Pays",         val:"France" },
            { label: t("apropos_contact") || "Contact",      val:"contact.batlife@gmail.com" },
            { label: t("apropos_hebergement") || "Hébergement", val:"Cloudflare Pages" },
          ].map((row,i) => (
            <div key={i} className="flex justify-between items-center text-xs py-0.5">
              <span style={{ color:"var(--text-muted)" }}>{row.label}</span>
              <span style={{ color:"var(--text-label)" }}>{row.val}</span>
            </div>
          ))}
          <p className="text-xs mt-2 leading-relaxed" style={{ color:"var(--text-muted)" }}>
            {t("apropos_disclaimer") || "BatLife est un outil indicatif. Il ne remplace pas les consignes du fabricant de votre batterie."}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 mb-6 flex flex-col items-center gap-1 text-center" style={{ opacity:.5 }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔋</span>
          <span className="text-lg font-bold" style={{
            background:"linear-gradient(135deg,#38bdf8,#818cf8)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>BatLife</span>
        </div>
        <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Version 2.0.0 React</p>
        <p className="text-xs" style={{ color:"var(--text-muted)" }}>© 2026 Marc P. — Tous droits réservés</p>
      </div>
    </div>
  );
}

export default Reglages;
